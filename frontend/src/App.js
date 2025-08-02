import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Lucide React Icons (replace with actual imports if using a build system)
// For this self-contained example, we'll use a simple SVG placeholder or text for icons.
// In a real project, you'd install and import like:
// import { Upload, Search, SortAsc, SortDesc, FileText, XCircle } from 'lucide-react';

// Mock Icons for self-contained example (replace with actual Lucide React components in a real setup)
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const SortAscIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down-up"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>;
const SortDescIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-down"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>;
const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-8.5"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;


// Base URL for your FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      // More specific message for fetch errors
      setUploadMessage(`Failed to load documents: ${error.message || 'Network error'}. Is the backend running?`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) {
      setUploadMessage('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setUploadMessage('Uploading and processing document...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Check if the response indicates success explicitly, though 2xx status is usually enough
      if (response.status >= 200 && response.status < 300) {
        setUploadMessage(`Document processed successfully: ${response.data.message || ''}`);
        fetchDocuments(); // Refresh the list of documents
      } else {
        // Handle unexpected successful status codes (e.g., 204 No Content)
        console.error('Unexpected successful response status:', response.status, response.data);
        setUploadMessage(`Upload completed with unexpected status: ${response.status}. Check console for details.`);
      }
    } catch (error) {
      // --- ENHANCED ERROR LOGGING ---
      console.error('Upload failed:', error);
      if (axios.isAxiosError(error)) { // Check if it's an Axios error
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          console.error('Error response headers:', error.response.headers);
          setUploadMessage(`Upload failed: ${error.response.data.detail || error.response.statusText || `Server Error ${error.response.status}`}`);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.error('Error request:', error.request);
          setUploadMessage(`Network error: No response from server. Is the backend running at ${API_BASE_URL}?`);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error message:', error.message);
          setUploadMessage(`Upload failed: ${error.message}`);
        }
      } else {
        // Non-Axios error
        console.error('Non-Axios error:', error);
        setUploadMessage(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
      }
      // --- END ENHANCED ERROR LOGGING ---

    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFileUpload(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDocumentClick = async (docId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/documents/${docId}`);
      setSelectedDocument(response.data);
    } catch (error) {
      console.error('Error fetching document details:', error);
      setUploadMessage('Failed to load document details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedDocument(null);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

  const filteredDocuments = sortedDocuments.filter(doc =>
    Object.values(doc).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-sans antialiased text-gray-800">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; }
        `}
      </style>
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-indigo-700 mb-8">
          Document Processor & Extractor
        </h1>

        {loading && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <p className="text-lg text-gray-700">Loading...</p>
            </div>
          </div>
        )}

        {uploadMessage && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${uploadMessage.includes('failed') || uploadMessage.includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {uploadMessage}
          </div>
        )}

        {!selectedDocument ? (
          <>
            {/* Document Upload Section */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center mb-8 hover:border-indigo-500 transition-colors duration-200 cursor-pointer"
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload" className="block cursor-pointer">
                <UploadIcon className="mx-auto h-12 w-12 text-indigo-500 mb-3" />
                <p className="text-lg text-gray-700 font-medium">Drag & Drop your document here</p>
                <p className="text-sm text-gray-500">or click to browse (PDF, JPG, PNG)</p>
              </label>
            </div>

            {/* Document List Section */}
            <h2 className="text-2xl font-semibold text-indigo-600 mb-5">Processed Documents</h2>
            <div className="mb-4 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative w-full sm:w-1/2">
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-50">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('filename')}
                    >
                      Filename
                      {sortConfig.key === 'filename' && (sortConfig.direction === 'ascending' ? <SortAscIcon className="inline-block ml-1 h-4 w-4" /> : <SortDescIcon className="inline-block ml-1 h-4 w-4" />)}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('upload_date')}
                    >
                      Upload Date
                      {sortConfig.key === 'upload_date' && (sortConfig.direction === 'ascending' ? <SortAscIcon className="inline-block ml-1 h-4 w-4" /> : <SortDescIcon className="inline-block ml-1 h-4 w-4" />)}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('processing_status')}
                    >
                      Status
                      {sortConfig.key === 'processing_status' && (sortConfig.direction === 'ascending' ? <SortAscIcon className="inline-block ml-1 h-4 w-4" /> : <SortDescIcon className="inline-block ml-1 h-4 w-4" />)}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{doc.filename}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(doc.upload_date).toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            doc.processing_status === 'processed' ? 'bg-green-100 text-green-800' :
                            doc.processing_status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.processing_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{doc.invoice_number || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{doc.total_amount ? `${doc.currency || ''} ${doc.total_amount}` : '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{doc.vendor_name || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDocumentClick(doc.id)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                          >
                            <FileTextIcon className="h-4 w-4" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                        {loading ? 'Loading documents...' : 'No documents found. Upload one to get started!'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Document Detail View */
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <button
              onClick={handleBackToList}
              className="mb-6 flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              <span>Back to Documents</span>
            </button>

            <h2 className="text-2xl font-semibold text-indigo-600 mb-4 flex items-center space-x-2">
              <FileTextIcon className="h-6 w-6" />
              <span>Document Details: {selectedDocument.filename}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-indigo-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-indigo-700 mb-3">Invoice Details</h3>
                <p><strong className="font-medium">Invoice Number:</strong> {selectedDocument.invoice_number || '-'}</p>
                <p><strong className="font-medium">Date:</strong> {selectedDocument.date || '-'}</p>
                <p><strong className="font-medium">Due Date:</strong> {selectedDocument.due_date || '-'}</p>
                <p><strong className="font-medium">Total Amount:</strong> {selectedDocument.total_amount ? `${selectedDocument.currency || ''} ${selectedDocument.total_amount}` : '-'}</p>
                <p><strong className="font-medium">Subtotal:</strong> {selectedDocument.subtotal || '-'}</p>
                <p><strong className="font-medium">Tax Amount:</strong> {selectedDocument.tax_amount || '-'}</p>
                <p><strong className="font-medium">Currency:</strong> {selectedDocument.currency || '-'}</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-indigo-700 mb-3">Vendor Information</h3>
                <p><strong className="font-medium">Vendor Name:</strong> {selectedDocument.vendor_name || '-'}</p>
                <p><strong className="font-medium">Address:</strong> {selectedDocument.vendor_address || '-'}</p>
                <p><strong className="font-medium">Phone:</strong> {selectedDocument.vendor_phone || '-'}</p>
                <p><strong className="font-medium">Email:</strong> {selectedDocument.vendor_email || '-'}</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg shadow-sm col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold text-indigo-700 mb-3">Additional Information</h3>
                <p><strong className="font-medium">Payment Terms:</strong> {selectedDocument.payment_terms || '-'}</p>
                <p><strong className="font-medium">PO Number:</strong> {selectedDocument.po_number || '-'}</p>
                <p><strong className="font-medium">Processing Status:</strong> {selectedDocument.processing_status}</p>
                <p><strong className="font-medium">OCR Confidence:</strong> {selectedDocument.ocr_confidence !== null ? `${(selectedDocument.ocr_confidence * 100).toFixed(2)}%` : '-'}</p>
                {selectedDocument.error_log && (
                  <p className="text-red-600"><strong className="font-medium">Error Log:</strong> {selectedDocument.error_log}</p>
                )}
              </div>
            </div>

            {selectedDocument.line_items && selectedDocument.line_items.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-indigo-600 mb-4">Line Items</h3>
                <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-indigo-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDocument.line_items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.description || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.quantity || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.unit_price || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.line_total || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-8 bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-indigo-600 mb-3">Raw Extracted Text</h3>
              <pre className="whitespace-pre-wrap break-words text-sm text-gray-700 bg-white p-4 rounded-md border border-gray-200 max-h-96 overflow-auto">
                {selectedDocument.raw_text || 'No raw text available.'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;


