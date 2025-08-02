from fastapi import FastAPI, UploadFile, File, HTTPException  #PROCESS DOCUMENTS USING OCR
from fastapi.middleware.cors import CORSMiddleware
import shutil #file handling
import os
import json 
import logging 
from typing import List, Dict, Union, Optional

# Import your utility and database scripts
import ocr_utils
import extract_info
import database

# --- NEW IMPORTS ---
import cv2 # Import OpenCV
import pytesseract # Import pytesseract for direct use in main.py
import pandas as pd # Import pandas for pd.notna

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI() #app created and connected to CORE Middleware

# --- CORS Configuration ---
# Allow frontend requests from http://localhost:3000
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000", "http://localhost:3004"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"], # Allows all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"], # Allows all headers
)

# --- Directory for Uploads ---
UPLOAD_DIR = "uploads" #store files temporarily
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Initialize Database on Startup ---
@app.on_event("startup")
async def startup_event():
    """Initializes the database when the FastAPI application starts."""
    logging.info("Initializing database...")
    database.init_db()
    logging.info("Database initialized successfully.")

# --- API Endpoints ---

@app.post("/upload/", summary="Upload and Process Document") #handles file upload 
async def upload_file(file: UploadFile = File(...)):
    """
    Handles document upload, performs OCR, extracts information, and saves to the database.
    Supports PDF, JPG, and PNG formats.
    """
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    processing_status = "pending"
    error_log = None
    extracted_fields = {}
    
    # --- Initialize variables to avoid UnboundLocalError ---
    raw_text = ""
    ocr_confidence = None
    line_items_data = [] 

    try:
        # 1. Save the uploaded file temporarily
        logging.info(f"Receiving file: {file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logging.info(f"File saved to {file_path}")

        # 2. Perform OCR and extract data
        
        # In a real scenario, you'd perform image preprocessing here before OCR
        # (e.g., rotation correction, noise reduction, contrast enhancement)
        
        # read the file image 
        img = cv2.imread(file_path)
        if img is None:
            raise ValueError(f"Could not read image file: {file.filename}. Check file corruption or format.")

        # Get raw text for header extraction (using PSM 3 for general text)
        raw_text = pytesseract.image_to_string(img, config=r'--psm 3')
        
        # Extract header fields
        extracted_fields = extract_info.extract_fields(raw_text)

        # Extract line items using cr_utils (which uses PSM 6 for table-like data)
        line_items_df = ocr_utils.process_document(file_path)
        
        if line_items_df is not None and not line_items_df.empty:
            for index, row in line_items_df.iterrows():
                try:
                    # Adjust column indices/names based on your actual table structure
                    # This is a generic attempt; you might need to refine based on your document types
                    description = row.iloc[0] if len(row) > 0 else None
                    quantity = float(row.iloc[1]) if len(row) > 1 and pd.notna(row.iloc[1]) else None
                    unit_price = float(row.iloc[2]) if len(row) > 2 and pd.notna(row.iloc[2]) else None
                    line_total = float(row.iloc[3]) if len(row) > 3 and pd.notna(row.iloc[3]) else None

                    # Basic line total calculation if not extracted
                    if quantity is not None and unit_price is not None and line_total is None:
                        line_total = quantity * unit_price

                    line_items_data.append({
                        "description": str(description) if description is not None else None,
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "line_total": line_total
                    })
                except Exception as e:
                    logging.warning(f"Error parsing line item row {index}: {row.to_dict()} - {e}")
                    # Continue processing other rows even if one fails
        
        # Placeholder for overall OCR confidence (pytesseract doesn't give a single overall score easily)
        # You might need to implement this based on character confidences or other metrics.
        ocr_confidence = 0.9 # Example placeholder for successful OCR

        processing_status = "processed"
        logging.info(f"Document {file.filename} processed successfully.")

    except Exception as e:
        logging.error(f"Error processing document {file.filename}: {e}", exc_info=True)
        processing_status = "failed"
        error_log = str(e)
        # Re-raise as HTTPException so frontend gets a proper error response
        raise HTTPException(status_code=500, detail=f"Failed to process document: {e}")
    finally:
        # 3. Save to database
        try:
            database.save_to_db(
                filename=file.filename,
                fields=extracted_fields,
                raw_text=raw_text,
                ocr_confidence=ocr_confidence,
                processing_status=processing_status,
                error_log=error_log,
                line_items=line_items_data # Pass the extracted line items
            )
            logging.info(f"Document {file.filename} data saved to DB.")
        except Exception as db_e:
            logging.error(f"Error saving document {file.filename} to database: {db_e}", exc_info=True)
            # If DB save fails, update status in DB if possible, or log prominently
            # This part is tricky if the DB connection itself failed earlier
            if processing_status != "failed": # Don't overwrite a previous failure reason
                processing_status = "failed_db_save"
                error_log = (error_log or "") + f" | DB Save Error: {db_e}"
            # Re-raise as HTTPException to signal error to frontend
            raise HTTPException(status_code=500, detail=f"Failed to save document data: {db_e}")
        finally:
            # 4. Clean up the temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
                logging.info(f"Cleaned up temporary file: {file_path}")

    return {"message": "Document uploaded and processed successfully!", "filename": file.filename}

@app.get("/documents", summary="Get All Processed Documents")
async def get_documents():
    """Retrieves a list of all processed documents from the database."""
    try:
        documents = database.get_documents()
        return documents
    except Exception as e:
        logging.error(f"Error fetching documents: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve documents: {e}")

@app.get("/documents/{document_id}", summary="Get Document Details by ID")
async def get_document_details(document_id: int):
    """
    Retrieves detailed information for a specific document, including its line items.
    
    Args:
        document_id (int): The ID of the document.
    """
    try:
        document = database.get_document_details(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except HTTPException as e:
        raise e # Re-raise HTTP exceptions
    except Exception as e:
        logging.error(f"Error fetching details for document ID {document_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve document details: {e}")


