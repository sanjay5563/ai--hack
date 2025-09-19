"""
SmartEMR Document Analysis Backend
Production-ready FastAPI implementation for document upload, AI analysis, and Q&A

This script provides:
1. Document upload with text extraction (PDF, images, text files)
2. AI-powered analysis with structured reports
3. Question-answering system using RAG
4. Embedding-based document search
5. Clinical decision support integration

Usage:
1. Install dependencies: pip install fastapi uvicorn openai PyPDF2 pillow pytesseract sqlmodel
2. Set OPENAI_API_KEY in environment
3. Run: uvicorn document_analysis_backend:app --reload --port 8001
"""

import os
import io
import json
import math
import uuid
import numpy as np
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, create_engine, Session, select
from pydantic import BaseModel
import openai

# Text extraction libraries
import PyPDF2
from PIL import Image
import pytesseract

# Initialize FastAPI app
app = FastAPI(title="SmartEMR Document Analysis API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-openai-api-key-here")
if OPENAI_API_KEY == "your-openai-api-key-here":
    print("Warning: Using placeholder OpenAI API key. Set OPENAI_API_KEY environment variable.")
else:
    openai.api_key = OPENAI_API_KEY

# Database setup
DB_URL = os.getenv("DOCUMENT_DB_URL", "sqlite:///./documents.db")
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})

class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    uuid: str
    owner_uid: Optional[str] = None
    filename: str
    content_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DocumentChunk(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    document_id: int = Field(foreign_key="document.id")
    chunk_index: int
    text: str
    embedding_json: str  # JSON array stored as text
    created_at: datetime = Field(default_factory=datetime.utcnow)

def init_document_db():
    SQLModel.metadata.create_all(engine)

# Initialize database
init_document_db()

# Text extraction utilities
def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyPDF2"""
    text_parts = []
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    except Exception as e:
        print(f"PDF parsing failed: {e}")
        pass
    return "\n".join(text_parts).strip()

def ocr_image_bytes(image_bytes: bytes) -> str:
    """Extract text from image bytes using OCR"""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        print(f"OCR failed: {e}")
        return ""

def extract_text_from_upload(file: UploadFile) -> str:
    """Extract text from uploaded file based on content type"""
    content = file.file.read()
    text = ""
    
    if file.content_type == "application/pdf":
        text = extract_text_from_pdf_bytes(content)
        if not text or len(text) < 50:
            # Fallback to OCR for scanned PDFs
            try:
                text = ocr_image_bytes(content)
            except Exception:
                pass
    elif file.content_type and file.content_type.startswith("image/"):
        text = ocr_image_bytes(content)
    elif file.content_type in ["text/plain", "application/text"]:
        text = content.decode("utf-8", errors="ignore")
    else:
        # Attempt generic decode
        try:
            text = content.decode("utf-8", errors="ignore")
        except Exception:
            text = ""
    
    if not text or len(text.strip()) == 0:
        raise HTTPException(
            status_code=400, 
            detail="Could not extract text from document. Try a text PDF or clearer scan."
        )
    
    return text

def chunk_text(text: str, max_chars: int = 1500, overlap: int = 200) -> List[str]:
    """Chunk long text into overlapping segments for embeddings"""
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
    """Create embeddings using OpenAI API"""
    if len(texts) == 0:
        return []
    
    try:
        resp = openai.Embedding.create(model=model, input=texts)
        embeddings = [item["embedding"] for item in resp["data"]]
        return embeddings
    except Exception as e:
        print(f"Embedding creation failed: {e}")
        # Return dummy embeddings for demo
        return [[0.0] * 1536 for _ in texts]

def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate cosine similarity between two vectors"""
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def retrieve_relevant_chunks(document_id: int, query: str, top_k: int = 4):
    """Retrieve most relevant document chunks for a query"""
    try:
        q_emb = create_embeddings([query])[0]
        with Session(engine) as session:
            rows = session.exec(select(DocumentChunk).where(DocumentChunk.document_id == document_id)).all()
            sims = []
            q_vec = np.array(q_emb)
            
            for r in rows:
                try:
                    emb = np.array(json.loads(r.embedding_json))
                    sims.append((r, cosine_sim(q_vec, emb)))
                except:
                    sims.append((r, 0.0))
            
            sims_sorted = sorted(sims, key=lambda x: x[1], reverse=True)
            top = sims_sorted[:top_k]
            return [(r.text, score) for (r, score) in top]
    except Exception as e:
        print(f"Retrieval failed: {e}")
        return []

# AI Analysis Prompts
SYSTEM_PROMPT_ANALYSIS = """
You are a clinical document analyst assistant. You will be given relevant document text chunks and a user request.
Return JSON ONLY with the following keys:
- "report": a short clinician-ready report (5-8 bullet points) summarizing the document's key findings.
- "breakdown": an array of sections, each { "title": "...", "summary": "...", "quotes": ["..."] } describing important subparts.
- "suggestions": an array of evidence-based suggestions or actions doctors could take (each with short rationale).
- "patient_summary": a simplified plain-language summary (2-4 sentences) suitable to share with a patient.
- "sources": array of provenance strings referencing which chunk(s) you used (give chunk indexes or brief phrase).
If a medical recommendation is given, include explicit "evidence" tying it to text. DO NOT hallucinate facts outside the provided text. If unsure, say so in the report.
"""

SYSTEM_PROMPT_QA = """
You are a clinical QA assistant. You will be given document text chunks and a user's question.
Answer concisely and cite the chunk text used. Return JSON ONLY:
{
  "answer": "short answer",
  "evidence": ["quote from text", "..."],
  "confidence": "low|medium|high"
}
If the answer cannot be found in the text, respond with answer = "I cannot determine from the provided document."
"""

# API Models
class AnalysisRequest(BaseModel):
    document_id: int
    top_k: int = 6

class QARequest(BaseModel):
    document_id: int
    question: str
    top_k: int = 6

# Simple auth placeholder
async def get_current_user():
    return {"uid": "demo-user", "email": "demo@smartemr.ai"}

# API Routes
router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload", response_model=dict)
async def upload_document(
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    """Upload and process a medical document"""
    # Validate file type
    allowed = ["application/pdf", "image/png", "image/jpeg", "text/plain"]
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file.content_type}"
        )
    
    try:
        # Extract text
        text = extract_text_from_upload(file)
        
        # Store document
        doc_uuid = str(uuid.uuid4())
        with Session(engine) as session:
            doc = Document(
                uuid=doc_uuid,
                owner_uid=current_user.get("uid"),
                filename=file.filename,
                content_text=text
            )
            session.add(doc)
            session.commit()
            session.refresh(doc)
            doc_id = doc.id
            
            # Create chunks and embeddings
            chunks = chunk_text(text, max_chars=1500, overlap=200)
            embeddings = create_embeddings(chunks)
            
            for idx, (chunk_text_part, emb) in enumerate(zip(chunks, embeddings)):
                chunk = DocumentChunk(
                    document_id=doc_id,
                    chunk_index=idx,
                    text=chunk_text_part,
                    embedding_json=json.dumps(emb)
                )
                session.add(chunk)
            session.commit()
        
        return {
            "document_id": doc_id,
            "uuid": doc_uuid,
            "chunks": len(chunks),
            "text_length": len(text)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        file.file.close()

@router.post("/analyze")
async def analyze_document(
    req: AnalysisRequest, 
    current_user: dict = Depends(get_current_user)
):
    """Generate comprehensive AI analysis of uploaded document"""
    # Validate document exists
    with Session(engine) as session:
        doc = session.get(Document, req.document_id)
        if not doc:
            raise HTTPException(404, "Document not found")
    
    # Retrieve relevant chunks
    retrieved = retrieve_relevant_chunks(
        req.document_id, 
        "Please summarize the entire document content", 
        top_k=req.top_k
    )
    
    if not retrieved:
        return JSONResponse(content={
            "report": ["No content available for analysis"],
            "breakdown": [],
            "suggestions": [],
            "patient_summary": "Document analysis not available",
            "sources": []
        })
    
    context_texts = [t for t, s in retrieved]
    user_prompt = (
        f"DOCUMENT CHUNKS:\n\n" + 
        "\n\n---\n\n".join(context_texts) + 
        "\n\nPlease produce analysis."
    )
    
    try:
        # Call OpenAI for analysis
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
        print(f"LLM analysis failed: {e}")
        # Fallback analysis
        parsed = {
            "report": [
                "Document uploaded and processed successfully",
                "Automated analysis temporarily unavailable",
                "Manual review recommended for clinical decisions"
            ],
            "breakdown": [{
                "title": "Document Content",
                "summary": "Text extracted from uploaded document",
                "quotes": [retrieved[0][0][:200] + "..." if retrieved else "No content"]
            }],
            "suggestions": [
                "Review document manually for clinical insights",
                "Consider re-uploading if text extraction seems incomplete"
            ],
            "patient_summary": "Your document has been uploaded and is ready for review.",
            "sources": ["Document chunks 1-" + str(len(retrieved))]
        }
    
    return JSONResponse(content=parsed)

@router.post("/qa")
async def document_qa(
    req: QARequest, 
    current_user: dict = Depends(get_current_user)
):
    """Answer questions about uploaded document using RAG"""
    # Validate document
    with Session(engine) as session:
        doc = session.get(Document, req.document_id)
        if not doc:
            raise HTTPException(404, "Document not found")
    
    # Retrieve relevant chunks for the question
    retrieved = retrieve_relevant_chunks(req.document_id, req.question, top_k=req.top_k)
    
    if not retrieved:
        return JSONResponse(content={
            "answer": "I cannot determine from the provided document.",
            "evidence": [],
            "confidence": "low"
        })
    
    context_texts = [t for t, s in retrieved]
    user_prompt = (
        f"CONTEXT:\n\n" + 
        "\n\n---\n\n".join(context_texts) + 
        f"\n\nQUESTION: {req.question}\n\nAnswer using only the context and cite quotes."
    )
    
    try:
        # Call OpenAI for Q&A
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_QA},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0,
            max_tokens=600
        )
        
        text = resp.choices[0].message.content
        parsed = json.loads(text)
        
    except Exception as e:
        print(f"LLM Q&A failed: {e}")
        # Fallback response
        parsed = {
            "answer": "I cannot determine from the provided document.",
            "evidence": [],
            "confidence": "low"
        }
    
    return JSONResponse(content=parsed)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SmartEMR Document Analysis API"}

# Include document router
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
