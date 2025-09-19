# backend/app/main.py
import os
import io
import json
import uuid
import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import SQLModel, Field, create_engine, Session, select
import uvicorn

# text extraction
import PyPDF2
from PIL import Image
import pytesseract

# OpenAI
import openai
from dotenv import load_dotenv
import numpy as np

# Firebase Admin
import firebase_admin
from firebase_admin import credentials, auth

load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY in your .env")
openai.api_key = OPENAI_API_KEY

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smartemr.db")
USE_AUTH = os.getenv("USE_AUTH", "true").lower() == "true"
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

# Initialize Firebase Admin (only if USE_AUTH is true)
if USE_AUTH:
    SERVICE_ACCOUNT = os.getenv("FIREBASE_SERVICE_ACCOUNT", "./firebase_service_account.json")
    try:
        cred = credentials.Certificate(SERVICE_ACCOUNT)
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        USE_AUTH = False

# Database setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

# ---------------- Models ----------------
class User(SQLModel, table=True):
    uid: str = Field(primary_key=True)  # Firebase uid
    email: str
    name: Optional[str] = None
    role: str  # 'doctor' or 'patient'
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    owner_doctor_uid: Optional[str] = None  # which doctor created record
    patient_uid: Optional[str] = None  # Firebase uid of patient user
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class Visit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int
    doctor_uid: Optional[str] = None
    visit_date: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.utcnow)
    notes: Optional[str] = None

class Vital(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    visit_id: int
    name: str
    value: float
    unit: Optional[str] = None
    recorded_at: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.utcnow)

class Report(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: str  # REP-YYYYMMDD-XXXXXX
    patient_id: int
    doctor_uid: str
    filename: str
    file_path: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    uuid: str
    owner_uid: Optional[str] = None
    filename: str
    content_text: Optional[str] = None
    report_id: Optional[str] = None
    patient_id: Optional[int] = None  # Link to patient
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class DocumentChunk(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    document_id: int
    chunk_index: int
    text: str
    embedding_json: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

# Create tables
SQLModel.metadata.create_all(engine)

# ---------------- Auth Dependencies ----------------
async def verify_token(request: Request):
    """FastAPI dependency: expects Authorization: Bearer <ID_TOKEN>"""
    if not USE_AUTH:
        # Dev mode - return dummy user
        return {"uid": "dev-user", "email": "dev@example.com", "role": "doctor"}
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    id_token = auth_header.split(" ", 1)[1].strip()
    try:
        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

def get_session():
    with Session(engine) as session:
        yield session

# ---------------- Helper Functions ----------------
def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    text_parts = []
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    except Exception:
        pass
    return "\n".join(text_parts).strip()

def ocr_image_bytes(image_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text
    except Exception:
        return ""

def extract_text_from_upload(file: UploadFile) -> str:
    content = file.file.read()
    text = ""
    if file.content_type == "application/pdf":
        text = extract_text_from_pdf_bytes(content)
        if not text or len(text) < 50:
            try:
                text = ocr_image_bytes(content)
            except Exception:
                pass
    elif file.content_type and file.content_type.startswith("image/"):
        text = ocr_image_bytes(content)
    elif file.content_type in ["text/plain", "application/text"]:
        text = content.decode("utf-8", errors="ignore")
    else:
        try:
            text = content.decode("utf-8", errors="ignore")
        except Exception:
            text = ""
    
    file.file.seek(0)  # Reset file pointer
    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Could not extract text from document.")
    return text

def chunk_text(text: str, max_chars: int = 1200, overlap: int = 200) -> List[str]:
    text = text.replace("\r\n", "\n")
    chunks = []
    start = 0
    L = len(text)
    while start < L:
        end = min(L, start + max_chars)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= L:
            break
        start = end - overlap
    return chunks

def create_embeddings(texts: List[str], model: str = "text-embedding-3-small") -> List[List[float]]:
    if not texts:
        return []
    try:
        resp = openai.Embedding.create(model=model, input=texts)
        return [item["embedding"] for item in resp["data"]]
    except Exception as e:
        print(f"Embedding creation failed: {e}")
        return [[0.0] * 1536 for _ in texts]  # Return dummy embeddings

def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def retrieve_relevant_chunks(document_id: int, query: str, top_k: int = 4):
    try:
        q_emb = create_embeddings([query])[0]
        q_vec = np.array(q_emb)
        with Session(engine) as session:
            rows = session.exec(select(DocumentChunk).where(DocumentChunk.document_id == document_id)).all()
            sims = []
            for r in rows:
                try:
                    emb = np.array(json.loads(r.embedding_json))
                    sims.append((r, cosine_sim(q_vec, emb)))
                except:
                    sims.append((r, 0.0))
            sims_sorted = sorted(sims, key=lambda x: x[1], reverse=True)
            top = sims_sorted[:top_k]
            return [(r.text, float(score)) for (r, score) in top]
    except Exception as e:
        print(f"Chunk retrieval failed: {e}")
        return []

# ---------------- Prompts ----------------
SYSTEM_PROMPT_ANALYSIS = """
You are a clinical document analyst. Given document chunks produce JSON ONLY:
{
  "report": ["bullet 1", "bullet 2", ...],
  "breakdown": [{"title":"...","summary":"...","quotes":["..."]}, ...],
  "suggestions": [{"text":"...","evidence":"..."}],
  "patient_summary":"short plain-language summary",
  "sources":["chunk index or short phrase"]
}
Cite evidence for recommendations and do NOT hallucinate.
"""

SYSTEM_PROMPT_QA = """
You are a clinical QA assistant. Given document chunks and a question return JSON ONLY:
{"answer":"...","evidence":["quote1","quote2"],"confidence":"low|medium|high"}
Answer only from provided text; if not found respond: "I cannot determine from the provided document."
"""

# ---------------- FastAPI App ----------------
app = FastAPI(title="SmartEMR AI Backend")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Request/Response Models ----------------
class RegisterRequest(BaseModel):
    name: str
    role: str

class PatientCreateRequest(BaseModel):
    name: str
    dob: Optional[str] = None
    gender: Optional[str] = None

class AnalyzeRequest(BaseModel):
    document_id: int
    top_k: int = 6

class QARequest(BaseModel):
    document_id: int
    question: str
    top_k: int = 6

# ---------------- Routes ----------------

@app.get("/health")
def health():
    return {"status": "ok", "auth_enabled": USE_AUTH}

# Auth routes
@app.post("/auth/register")
async def register_user(
    request: RegisterRequest, 
    decoded = Depends(verify_token), 
    session: Session = Depends(get_session)
):
    uid = decoded.get("uid")
    email = decoded.get("email")
    if not uid or not email:
        raise HTTPException(status_code=400, detail="Invalid token payload")
    
    if request.role not in ("doctor", "patient"):
        raise HTTPException(status_code=400, detail="role must be 'doctor' or 'patient'")
    
    existing = session.exec(select(User).where(User.uid == uid)).first()
    if existing:
        return {"status": "ok", "message": "already registered", "user": existing}
    
    user = User(uid=uid, email=email, name=request.name, role=request.role)
    session.add(user)
    session.commit()
    return {"status": "ok", "uid": uid, "user": user}

@app.get("/auth/me")
async def get_current_user(
    decoded = Depends(verify_token), 
    session: Session = Depends(get_session)
):
    uid = decoded.get("uid")
    user = session.exec(select(User).where(User.uid == uid)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not registered")
    return user

# Doctor routes
@app.post("/doctor/patients/create")
async def create_patient(
    request: PatientCreateRequest,
    decoded = Depends(verify_token), 
    session: Session = Depends(get_session)
):
    uid = decoded.get("uid")
    user = session.exec(select(User).where(User.uid == uid)).first()
    if not user or user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create patients")
    
    if not request.name or len(request.name.strip()) == 0:
        raise HTTPException(status_code=400, detail="Name required")
    
    patient = Patient(
        name=request.name, 
        dob=request.dob, 
        gender=request.gender, 
        owner_doctor_uid=uid
    )
    session.add(patient)
    session.commit()
    session.refresh(patient)
    return {"patient_id": patient.id, "name": patient.name}

@app.get("/doctor/patients")
async def get_doctor_patients(
    decoded = Depends(verify_token), 
    session: Session = Depends(get_session)
):
    uid = decoded.get("uid")
    user = session.exec(select(User).where(User.uid == uid)).first()
    if not user or user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view patients")
    
    patients = session.exec(select(Patient).where(Patient.owner_doctor_uid == uid)).all()
    return {"patients": patients}

@app.post("/doctor/patients/{patient_id}/upload_report")
async def upload_report(
    patient_id: int,
    file: UploadFile = File(...),
    decoded = Depends(verify_token), 
    session: Session = Depends(get_session)
):
    uid = decoded.get("uid")
    user = session.exec(select(User).where(User.uid == uid)).first()
    if not user or user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can upload reports")
    
    # Check patient exists and belongs to this doctor
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if patient.owner_doctor_uid != uid:
        raise HTTPException(status_code=403, detail="Not authorized for this patient")

    # Save file
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Generate report ID
    report_id = "REP-" + datetime.datetime.utcnow().strftime("%Y%m%d") + "-" + uuid.uuid4().hex[:6].upper()

    # Store Report record
    report = Report(
        report_id=report_id, 
        patient_id=patient_id, 
        doctor_uid=uid, 
        filename=file.filename, 
        file_path=file_path
    )
    session.add(report)
    session.commit()
    session.refresh(report)

    # Process document for AI analysis
    try:
        # Create a new UploadFile-like object for text extraction
        file.file = io.BytesIO(content)
        text = extract_text_from_upload(file)
    except Exception as e:
        text = f"Text extraction failed: {str(e)}"

    # Create document entry
    doc = Document(
        uuid=str(uuid.uuid4()), 
        owner_uid=uid, 
        filename=file.filename, 
        content_text=text, 
        report_id=report_id,
        patient_id=patient_id
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)

    # Create chunks & embeddings
    chunks = chunk_text(text)
    if chunks:
        embeddings = create_embeddings(chunks)
        for idx, (ch_text, emb) in enumerate(zip(chunks, embeddings)):
            chunk = DocumentChunk(
                document_id=doc.id, 
                chunk_index=idx, 
                text=ch_text, 
                embedding_json=json.dumps(emb)
            )
            session.add(chunk)
        session.commit()

    return {
        "status": "ok", 
        "report_id": report_id, 
        "document_id": doc.id,
        "chunks": len(chunks)
    }

# Patient routes
@app.get("/patient/reports/search/{report_id}")
async def search_report(
    report_id: str,
    decoded = Depends(verify_token), 
    session: Session = Depends(get_session)
):
    uid = decoded.get("uid")
    user = session.exec(select(User).where(User.uid == uid)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not registered")
    
    report = session.exec(select(Report).where(Report.report_id == report_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Get document content preview
    doc = session.exec(select(Document).where(Document.report_id == report_id)).first()
    preview = doc.content_text[:500] if doc and doc.content_text else ""
    
    # Get patient info
    patient = session.exec(select(Patient).where(Patient.id == report.patient_id)).first()
    
    return {
        "report_id": report.report_id,
        "patient_id": report.patient_id,
        "patient_name": patient.name if patient else "Unknown",
        "doctor_uid": report.doctor_uid,
        "filename": report.filename,
        "created_at": report.created_at.isoformat(),
        "preview": preview,
        "document_id": doc.id if doc else None
    }

# Document AI routes
@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...), 
    decoded = Depends(verify_token),
    session: Session = Depends(get_session)
):
    allowed = ["application/pdf", "image/png", "image/jpeg", "text/plain"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    try:
        text = extract_text_from_upload(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    doc_uuid = str(uuid.uuid4())
    report_id = "REP-" + datetime.datetime.utcnow().strftime("%Y%m%d") + "-" + uuid.uuid4().hex[:6].upper()

    doc = Document(
        uuid=doc_uuid,
        owner_uid=decoded.get("uid"),
        filename=file.filename,
        content_text=text,
        report_id=report_id
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)

    chunks = chunk_text(text)
    embeddings = create_embeddings(chunks)
    for idx, (chunk_text_part, emb) in enumerate(zip(chunks, embeddings)):
        ch = DocumentChunk(
            document_id=doc.id, 
            chunk_index=idx, 
            text=chunk_text_part, 
            embedding_json=json.dumps(emb)
        )
        session.add(ch)
    session.commit()

    return {
        "document_id": doc.id, 
        "uuid": doc_uuid, 
        "report_id": report_id, 
        "chunks": len(chunks)
    }

@app.post("/documents/analyze")
async def analyze_document(
    request: AnalyzeRequest,
    decoded = Depends(verify_token),
    session: Session = Depends(get_session)
):
    doc = session.get(Document, request.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    retrieved = retrieve_relevant_chunks(request.document_id, "Please summarize the document", top_k=request.top_k)
    context_texts = [t for t, s in retrieved]
    
    if not context_texts:
        return JSONResponse(content={
            "report": ["No content available for analysis"],
            "breakdown": [],
            "suggestions": [],
            "patient_summary": "Document analysis unavailable",
            "sources": []
        })
    
    user_prompt = "DOCUMENT CHUNKS:\n\n" + "\n\n---\n\n".join(context_texts) + "\n\nPlease produce the structured analysis."

    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_ANALYSIS},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0,
            max_tokens=900
        )
        text = resp.choices[0].message.content
        parsed = json.loads(text)
    except Exception as e:
        parsed = {
            "report": [f"Analysis failed: {str(e)}"],
            "breakdown": [{"title": "Excerpt", "summary": context_texts[0][:200], "quotes": [context_texts[0][:200]]}],
            "suggestions": [],
            "patient_summary": "Analysis unavailable due to processing error",
            "sources": []
        }

    return JSONResponse(content=parsed)

@app.post("/documents/qa")
async def document_qa(
    request: QARequest,
    decoded = Depends(verify_token),
    session: Session = Depends(get_session)
):
    doc = session.get(Document, request.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    retrieved = retrieve_relevant_chunks(request.document_id, request.question, top_k=request.top_k)
    context_texts = [t for t, s in retrieved]
    
    if not context_texts:
        return JSONResponse(content={
            "answer": "I cannot determine from the provided document.", 
            "evidence": [], 
            "confidence": "low"
        })
    
    user_prompt = "CONTEXT:\n\n" + "\n\n---\n\n".join(context_texts) + f"\n\nQUESTION: {request.question}\nAnswer using only the context and cite quotes."

    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_QA},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0,
            max_tokens=600
        )
        parsed = json.loads(resp.choices[0].message.content)
    except Exception:
        parsed = {
            "answer": "I cannot determine from the provided document.", 
            "evidence": [], 
            "confidence": "low"
        }

    return JSONResponse(content=parsed)

if __name__ == "__main__":
    uvicorn.run("smartemr-backend:app", host="0.0.0.0", port=8001, reload=True)
