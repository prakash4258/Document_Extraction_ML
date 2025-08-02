import sqlite3
from datetime import datetime
import json # Import json to store complex data like line items

def init_db():
    """
    Initializes the SQLite database and creates the 'documents' and 'line_items'
    tables if they do not already exist.
    """
    conn = sqlite3.connect("processed_data.db")
    c = conn.cursor()

    # Create the documents table with all required fields
    c.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            upload_date TEXT NOT NULL,
            processing_status TEXT DEFAULT 'pending', -- e.g., 'pending', 'processed', 'failed'
            ocr_confidence REAL, -- Overall OCR confidence score for the document
            raw_text TEXT, -- Full raw text extracted by OCR
            error_log TEXT, -- For storing any processing errors

            -- Invoice Details
            invoice_number TEXT,
            date TEXT,
            due_date TEXT,

            -- Vendor Information
            vendor_name TEXT,
            vendor_address TEXT,
            vendor_phone TEXT,
            vendor_email TEXT,

            -- Financial Data
            subtotal REAL,
            tax_amount REAL,
            total_amount REAL,
            currency TEXT,

            -- Additional Fields
            payment_terms TEXT,
            po_number TEXT
        )
    ''')

    # Create the line_items table for detailed product/service information
    # FIXED: Changed 'PRIMARY PRIMARY KEY' to 'PRIMARY KEY'
    c.execute('''
        CREATE TABLE IF NOT EXISTS line_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            description TEXT,
            quantity INTEGER,
            unit_price REAL,
            line_total REAL, -- Calculated as quantity * unit_price
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()

def save_to_db(filename, fields, raw_text, ocr_confidence=None, processing_status='processed', error_log=None, line_items=None):
    """
    Saves extracted document information into the 'documents' and 'line_items' tables.
    
    Args:
        filename (str): The name of the processed file.
        fields (dict): A dictionary of extracted header fields.
        raw_text (str): The full raw text extracted from the document.
        ocr_confidence (float, optional): Overall OCR confidence score. Defaults to None.
        processing_status (str, optional): Status of document processing. Defaults to 'processed'.
        error_log (str, optional): Any error messages during processing. Defaults to None.
        line_items (list, optional): A list of dictionaries, each representing a line item.
                                     Each dict should have 'description', 'quantity', 'unit_price'.
                                     Defaults to None.
    """
    conn = sqlite3.connect("processed_data.db")
    c = conn.cursor()

    # Insert into documents table
    c.execute('''
        INSERT INTO documents (
            filename, upload_date, processing_status, ocr_confidence, raw_text, error_log,
            invoice_number, date, due_date,
            vendor_name, vendor_address, vendor_phone, vendor_email,
            subtotal, tax_amount, total_amount, currency,
            payment_terms, po_number
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        filename,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        processing_status,
        ocr_confidence,
        raw_text,
        error_log,
        fields.get("invoice_number"),
        fields.get("date"),
        fields.get("due_date"),
        fields.get("vendor_name"),
        fields.get("vendor_address"),
        fields.get("vendor_phone"),
        fields.get("vendor_email"),
        fields.get("subtotal"),
        fields.get("tax_amount"),
        fields.get("total_amount"),
        fields.get("currency"),
        fields.get("payment_terms"),
        fields.get("po_number")
    ))
    
    document_id = c.lastrowid # Get the ID of the newly inserted document

    # Insert line items if provided
    if line_items:
        for item in line_items:
            description = item.get("description")
            quantity = item.get("quantity")
            unit_price = item.get("unit_price")
            line_total = item.get("line_total") # Can be pre-calculated or calculated here

            # Basic calculation if line_total is not provided
            if line_total is None and quantity is not None and unit_price is not None:
                try:
                    line_total = float(quantity) * float(unit_price)
                except (ValueError, TypeError):
                    line_total = None # Handle cases where conversion fails

            c.execute('''
                INSERT INTO line_items (document_id, description, quantity, unit_price, line_total)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                document_id,
                description,
                quantity,
                unit_price,
                line_total
            ))

    conn.commit()
    conn.close()

def get_documents():
    """
    Retrieves all documents from the database.
    
    Returns:
        list: A list of dictionaries, each representing a document.
    """
    conn = sqlite3.connect("processed_data.db")
    conn.row_factory = sqlite3.Row # Allows accessing columns by name
    c = conn.cursor()
    c.execute("SELECT * FROM documents ORDER BY upload_date DESC")
    documents = [dict(row) for row in c.fetchall()]
    conn.close()
    return documents

def get_document_details(document_id):
    """
    Retrieves details for a specific document, including its line items.
    
    Args:
        document_id (int): The ID of the document to retrieve.
        
    Returns:
        dict or None: A dictionary containing document details and a list of line items,
                      or None if the document is not found.
    """
    conn = sqlite3.connect("processed_data.db")
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT * FROM documents WHERE id = ?", (document_id,))
    document = c.fetchone()

    if document:
        doc_dict = dict(document)
        c.execute("SELECT * FROM line_items WHERE document_id = ?", (document_id,))
        line_items = [dict(row) for row in c.fetchall()]
        doc_dict['line_items'] = line_items
        conn.close()
        return doc_dict
    
    conn.close()
    return None
