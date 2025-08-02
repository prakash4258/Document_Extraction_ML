import pytesseract
import cv2
import pandas as pd
import io
import os # Added for file existence check in example

# Set the path to your Tesseract executable
# Make sure this path is correct for your system
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def process_document(image_path):#reads an image using cv2
    """
    Performs OCR on an image and attempts to extract table-like data.
    
    Args:
        image_path (str): The path to the input image file.
        
    Returns:
        pd.DataFrame or None: A pandas DataFrame containing the extracted
                              table data, or None if an error occurs or no
                              meaningful table data is found.
    """
    try:
        # Read the image using OpenCV
        img = cv2.imread(image_path)
        if img is None:
            print(f"Error: Could not read image from {image_path}")
            return None

        # Tesseract Page Segmentation Mode (PSM) 6: Assume a single uniform block of text.
        # This is generally good for documents that might contain tables,
        # allowing Tesseract to output the text in a block that pandas can then parse.
        custom_config = r'--psm 6'
        
        # Perform OCR to get the raw text from the image
        raw_text = pytesseract.image_to_string(img, config=custom_config)
        
        # Use pandas to read the raw text into a DataFrame.
        # io.StringIO treats the string as a file-like object.
        # sep=r'\s+' tells pandas to use one or more whitespace characters as the delimiter.
        # The 'r' prefix makes it a raw string, preventing the SyntaxWarning.
        # This is crucial for handling variable spacing in OCR'd tables.
        # header=None tells pandas not to assume the first row is a header.
        # engine='python' is used for more complex regex separators like '\s+'.
        df = pd.read_csv(io.StringIO(raw_text), sep=r'\s+', header=None, engine='python')
        
        # Basic cleaning: Remove rows that might be empty or contain only a few words
        # that don't look like table data. This is a heuristic and might need tuning.
        df = df.dropna(how='all') # Drop rows where all values are NaN
        if not df.empty:
            # Optionally, you might want to remove columns that are entirely empty
            df = df.dropna(axis=1, how='all')
        
        return df

    except pd.errors.EmptyDataError:
        print("No data to parse by pandas (might be empty or malformed text).")
        return pd.DataFrame() # Return an empty DataFrame
    except Exception as e:
        print(f"An error occurred during OCR or table parsing: {e}")
        return None

if __name__ == "__main__":
    print("Testing OCR function...")

    # IMPORTANT: Replace this with the actual path to your sample image.
    # Ensure this image contains some tabular data for best testing.
    file_path = r'C:\Users\Lenovo\ml-doc-processor\backend\uploads\sample.png'

    # Check if the file exists before processing
    if not os.path.exists(file_path):
        print(f"Error: The file '{file_path}' does not exist. Please provide a valid path to a sample image.")
    else:
        result_df = process_document(file_path)
        
        if result_df is not None and not result_df.empty:
            print("\n--- Extracted Table Data (Pandas DataFrame) ---")
            print(result_df)
            
            print("\n--- Extracted Table Data (Markdown Format) ---")
            # Convert the DataFrame to a Markdown table string for easy display in text environments
            print(result_df.to_markdown(index=False)) # index=False prevents writing the DataFrame index
            
            print("\n--- Extracted Table Data (HTML Table String) ---")
            # Convert the DataFrame to an HTML table string, useful for web frontends
            print(result_df.to_html(index=False))
        elif result_df is not None and result_df.empty:
            print("No table data was extracted (DataFrame is empty).")
        else:
            print("Failed to process the document for table data.")
