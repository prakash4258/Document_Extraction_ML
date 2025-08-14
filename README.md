# 📄 Document Processor & Extractor

A web-based tool to extract structured data (like invoice number, amount, vendor, etc.) from uploaded documents (PDF, PNG, JPG) using OCR and machine learning.

![UI Screenshot](017336ae-5fa3-408e-ab30-f6776a2bd9fd.png)

---

## 🚀 Features

- 📥 Drag & drop document upload (PDF, JPG, PNG)
- 🔍 Extracts structured information like:
  - Invoice Number
  - Total Amount
  - Vendor Name
- 📜 Displays processed documents with status
- 📁 View full document details
- 📊 Search among processed documents
- 🔁 Built with FastAPI (Backend) + React (Frontend)

---

## 🧰 Tech Stack

| Area       | Tech Used                 |
|------------|---------------------------|
| Frontend   | React.js, Tailwind CSS    |
| Backend    | FastAPI, Uvicorn          |
| OCR Engine | Tesseract / PaddleOCR     |
| Others     | Axios, Python, JavaScript |

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/document-processor-extractor.git
cd document-processor-extractor
2. Backend Setup (FastAPI)
bash
Copy
Edit
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
📌 Make sure poppler or tesseract is installed for OCR and in your PATH.

3. Frontend Setup (React)
bash
Copy
Edit
cd frontend
npm install
npm start
💡 Future Improvements
🧠 Improve OCR accuracy with better pre-processing

📄 Support scanned multi-page PDFs

💾 Database integration 

🧑‍💼 User authentication

🤝 Contributing
Feel free to fork the project, raise issues, and submit pull requests.

📃 License
This project is licensed under the MIT License.

👨‍💻 Developed by
Prakash B


Use the below link to view the Project
https://35p92cmg-3001.inc1.devtunnels.ms/

