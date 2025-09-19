#!/bin/bash

# SmartEMR Document Analysis API Test Script
# Tests document upload, analysis, and Q&A functionality

echo "🏥 SmartEMR Document Analysis API Test Suite"
echo "============================================="

API_BASE="http://localhost:8001/api"
TEST_FILE="sample_lab_report.txt"

# Create a sample medical document for testing
echo "📄 Creating sample medical document..."
cat > $TEST_FILE << 'EOF'
PATIENT: John Smith
DOB: 1975-03-15
MRN: 12345678

LABORATORY RESULTS - Date: 2025-01-15

GLUCOSE PANEL:
- Fasting Glucose: 145 mg/dL (HIGH) [Normal: 70-100]
- HbA1c: 8.2% (HIGH) [Target: <7.0%]
- Random Glucose: 210 mg/dL (HIGH)

LIPID PANEL:
- Total Cholesterol: 220 mg/dL (BORDERLINE HIGH)
- LDL: 145 mg/dL (HIGH) [Target: <100]
- HDL: 35 mg/dL (LOW) [Target: >40]
- Triglycerides: 180 mg/dL (HIGH)

KIDNEY FUNCTION:
- Creatinine: 1.3 mg/dL (ELEVATED) [Normal: 0.7-1.2]
- BUN: 25 mg/dL (ELEVATED)
- Microalbumin: 45 mg/g (POSITIVE) [Normal: <30]

VITAL SIGNS:
- Blood Pressure: 150/90 mmHg (HYPERTENSIVE)
- Weight: 185 lbs
- BMI: 28.5 (OVERWEIGHT)

CLINICAL IMPRESSION:
Type 2 Diabetes Mellitus with poor glycemic control
Diabetic nephropathy (early stage)
Hypertension
Dyslipidemia

RECOMMENDATIONS:
1. Intensify diabetes management
2. Start ACE inhibitor for nephroprotection
3. Lifestyle modifications for weight loss
4. Follow-up in 3 months
EOF

echo "✅ Sample document created: $TEST_FILE"

# Test 1: Health Check
echo ""
echo "🔍 Test 1: Health Check"
echo "----------------------"
curl -s "$API_BASE/../health" | jq .

# Test 2: Document Upload
echo ""
echo "📤 Test 2: Document Upload"
echo "--------------------------"
UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/documents/upload" \
  -F "file=@$TEST_FILE" \
  -H "Content-Type: multipart/form-data")

echo $UPLOAD_RESPONSE | jq .

# Extract document ID for subsequent tests
DOCUMENT_ID=$(echo $UPLOAD_RESPONSE | jq -r '.document_id')
echo "📋 Document ID: $DOCUMENT_ID"

if [ "$DOCUMENT_ID" = "null" ]; then
    echo "❌ Upload failed, cannot continue with tests"
    exit 1
fi

# Test 3: Document Analysis
echo ""
echo "🧠 Test 3: AI Document Analysis"
echo "-------------------------------"
ANALYSIS_RESPONSE=$(curl -s -X POST "$API_BASE/documents/analyze" \
  -H "Content-Type: application/json" \
  -d "{\"document_id\":$DOCUMENT_ID,\"top_k\":6}")

echo $ANALYSIS_RESPONSE | jq .

# Test 4: Question & Answer
echo ""
echo "❓ Test 4: Document Q&A"
echo "----------------------"

# Test multiple questions
QUESTIONS=(
    "What is the patient's HbA1c level?"
    "What are the main clinical concerns?"
    "What medications are recommended?"
    "Is there evidence of kidney problems?"
)

for question in "${QUESTIONS[@]}"; do
    echo ""
    echo "Question: $question"
    echo "Answer:"
    curl -s -X POST "$API_BASE/documents/qa" \
      -H "Content-Type: application/json" \
      -d "{\"document_id\":$DOCUMENT_ID,\"question\":\"$question\",\"top_k\":4}" | jq .
done

# Test 5: Error Handling
echo ""
echo "🚨 Test 5: Error Handling"
echo "-------------------------"

echo "Testing invalid document ID:"
curl -s -X POST "$API_BASE/documents/analyze" \
  -H "Content-Type: application/json" \
  -d '{"document_id":99999,"top_k":6}' | jq .

echo ""
echo "Testing empty question:"
curl -s -X POST "$API_BASE/documents/qa" \
  -H "Content-Type: application/json" \
  -d "{\"document_id\":$DOCUMENT_ID,\"question\":\"\",\"top_k\":4}" | jq .

# Cleanup
echo ""
echo "🧹 Cleanup"
echo "----------"
rm -f $TEST_FILE
echo "✅ Test file removed"

echo ""
echo "🎉 Test Suite Complete!"
echo "======================="
echo "All tests executed. Check results above for any failures."
echo ""
echo "To run the backend server:"
echo "python scripts/document-analysis-backend.py"
echo ""
echo "To install dependencies:"
echo "pip install fastapi uvicorn openai PyPDF2 pillow pytesseract sqlmodel numpy"
