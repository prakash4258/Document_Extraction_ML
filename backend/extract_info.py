import re

def extract_fields(text):
    """
    Extracts specific fields (invoice number, date, total amount, vendor name)
    from a given text using regular expressions.
    
    Args:
        text (str): The input text from which to extract information.
        
    Returns:
        dict: A dictionary containing the extracted fields.
    """
    data = {}
    # Regex to find invoice number, case-insensitive
    data['invoice_number'] = re.findall(r'Invoice\s*Number[:\s]*([\w-]+)', text, re.IGNORECASE)
    # Regex to find date in various formats (MM/DD/YY, DD-MM-YYYY, etc.)
    data['date'] = re.findall(r'Date[:\s]*([\d/-]+)', text, re.IGNORECASE)
    # Regex to find total amount, handling commas and periods
    data['total_amount'] = re.findall(r'Total[:\s]*([\d,.]+)', text, re.IGNORECASE)
    # Regex to find vendor name, looking for common keywords
    data['vendor_name'] = re.findall(r'(?:From|Vendor|Supplier)[:\s]*(.+)', text, re.IGNORECASE)
    
    # Return the first match for each field, or None if no match is found
    return {k: v[0] if v else None for k, v in data.items()}