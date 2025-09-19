import pytest
import os
import tempfile
from fastapi.testclient import TestClient
from smartemr_backend import app

# Override auth for testing
os.environ["USE_AUTH"] = "false"

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_register_user():
    response = client.post("/auth/register", json={
        "name": "Dr. Test",
        "role": "doctor"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_create_patient():
    # First register as doctor
    client.post("/auth/register", json={"name": "Dr. Test", "role": "doctor"})
    
    # Create patient
    response = client.post("/doctor/patients/create", json={
        "name": "Test Patient",
        "dob": "1990-01-01",
        "gender": "M"
    })
    assert response.status_code == 200
    assert response.json()["name"] == "Test Patient"

def test_upload_and_analyze_document():
    # Register doctor and create patient
    client.post("/auth/register", json={"name": "Dr. Test", "role": "doctor"})
    patient_response = client.post("/doctor/patients/create", json={
        "name": "Test Patient",
        "dob": "1990-01-01",
        "gender": "M"
    })
    patient_id = patient_response.json()["patient_id"]
    
    # Create a test file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write("Patient Test Patient\nBlood Pressure: 120/80 mmHg\nHeart Rate: 72 bpm\nTemperature: 98.6°F")
        temp_file = f.name
    
    try:
        # Upload report
        with open(temp_file, 'rb') as f:
            response = client.post(
                f"/doctor/patients/{patient_id}/upload_report",
                files={"file": ("test_report.txt", f, "text/plain")}
            )
        
        assert response.status_code == 200
        result = response.json()
        assert "report_id" in result
        assert "document_id" in result
        
        # Test document analysis
        analyze_response = client.post("/documents/analyze", json={
            "document_id": result["document_id"],
            "top_k": 3
        })
        assert analyze_response.status_code == 200
        analysis = analyze_response.json()
        assert "patient_summary" in analysis
        
        # Test Q&A
        qa_response = client.post("/documents/qa", json={
            "document_id": result["document_id"],
            "question": "What is the blood pressure reading?"
        })
        assert qa_response.status_code == 200
        qa_result = qa_response.json()
        assert "answer" in qa_result
        
    finally:
        os.unlink(temp_file)

def test_patient_search_report():
    # Register doctor and create patient
    client.post("/auth/register", json={"name": "Dr. Test", "role": "doctor"})
    patient_response = client.post("/doctor/patients/create", json={
        "name": "Test Patient"
    })
    patient_id = patient_response.json()["patient_id"]
    
    # Create and upload a test report
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write("Test medical report content")
        temp_file = f.name
    
    try:
        with open(temp_file, 'rb') as f:
            upload_response = client.post(
                f"/doctor/patients/{patient_id}/upload_report",
                files={"file": ("test_report.txt", f, "text/plain")}
            )
        
        report_id = upload_response.json()["report_id"]
        
        # Search for report as patient
        search_response = client.get(f"/patient/reports/search/{report_id}")
        assert search_response.status_code == 200
        search_result = search_response.json()
        assert search_result["report_id"] == report_id
        assert "preview" in search_result
        
    finally:
        os.unlink(temp_file)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
