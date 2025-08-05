// Base URL for your backend API
const API_BASE_URL = 'http://localhost:8000';
 
// --- DOM Element References ---
// Get references to all necessary HTML elements by their IDs.
// This is done once when the script loads to improve performance.
const modalPortal = document.getElementById('modal-portal');
const loadingOverlay = document.getElementById('loading-overlay');
const mainContainer = document.getElementById('main-container');
const uploadSection = document.getElementById('upload-section');
const listSection = document.getElementById('list-section');
const detailSection = document.getElementById('detail-section');
const fileInput = document.getElementById('file-upload');
const documentTableBody = document.getElementById('document-list');
const searchInput = document.getElementById('search-input');
const backButton = document.getElementById('back-button');
const docFilename = document.getElementById('doc-filename');
const extractedDataBody = document.getElementById('extracted-data-body');
const lineItemsSection = document.getElementById('line-items-section');
const lineItemsBody = document.getElementById('line-items-body');
const rawTextSection = document.getElementById('raw-text-section');
const rawTextContent = document.getElementById('raw-text-content');
 
// --- Global State Variables ---
// `allDocuments` will store the fetched list of documents.
let allDocuments = [];
// `sortConfig` keeps track of the current sorting column and direction.
let sortConfig = { key: null, direction: 'ascending' };
 
// --- UI Utility Functions ---
 
/**
 * Toggles the visibility of the loading overlay.
 * @param {boolean} show - True to show the loading overlay, false to hide it.
 */
const showLoading = (show) => {
  loadingOverlay.classList.toggle('hidden', !show);
};
 
/**
 * Displays a modal message to the user.
 * This function creates all modal elements programmatically to avoid innerHTML.
 * @param {string} message - The message to display in the modal.
 * @param {string} type - The type of message ('success', 'error', 'info') to determine styling and icon.
 */
const showModal = (message, type) => {
  // If no message, clear any existing modal and return.
  if (!message) {
    modalPortal.replaceChildren(); // Clear all children from the modal portal
    return;
  }
 
  // Determine styling and content based on message type.
  const isError = type === 'error';
  const bgColor = isError ? 'bg-red-50' : 'bg-green-50';
  const textColor = isError ? 'text-red-700' : 'text-green-700';
  const titleText = isError ? 'Processing Failed' : 'Processing Successful';
 
  // Create the main modal overlay div.
  const modalOverlay = document.createElement('div');
  modalOverlay.className = "fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4";
 
  // Create the modal content box.
  const modalContent = document.createElement('div');
  modalContent.className = `bg-white rounded-xl shadow-2xl w-full max-w-md p-6 ${bgColor} transform transition-all scale-100 ease-in-out duration-300`;
 
  // Create the header div for icon and title.
  const header = document.createElement('div');
  header.className = "flex items-center space-x-4 mb-4";
  
  // Create the SVG icon using createElementNS for proper SVG creation.
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', `h-6 w-6 ${isError ? 'text-red-500' : 'text-green-500'}`);
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  
  // Add specific paths/shapes for CheckCircle or XCircle.
  if (isError) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'm15 9-6 6');
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'm9 9 6 6');
    icon.appendChild(circle);
    icon.appendChild(path1);
    icon.appendChild(path2);
  } else {
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M22 11.08V12a10 10 0 1 1-5.93-8.66');
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M3 11l4 4L19 7');
    icon.appendChild(path1);
    icon.appendChild(path2);
  }
 
  // Create the title element.
  const title = document.createElement('h3');
  title.className = `text-xl font-semibold ${textColor}`;
  title.textContent = titleText;
 
  // Append icon and title to the header.
  header.appendChild(icon);
  header.appendChild(title);
 
  // Create the message paragraph.
  const messageP = document.createElement('p');
  messageP.className = `text-sm ${textColor} mb-6`;
  messageP.textContent = message;
 
  // Create the close button.
  const closeButton = document.createElement('button');
  closeButton.id = "modal-close-button"; // Assign an ID for easy event listener attachment
  closeButton.className = `w-full px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    isError
      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
      : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  }`;
  closeButton.textContent = "Close";
 
  // Add event listener to the close button to hide the modal.
  closeButton.addEventListener('click', () => {
    modalPortal.replaceChildren(); // Clear children to hide the modal
  });
 
  // Assemble the modal structure.
  modalContent.appendChild(header);
  modalContent.appendChild(messageP);
  modalContent.appendChild(closeButton);
  modalOverlay.appendChild(modalContent);
  modalPortal.appendChild(modalOverlay); // Append the entire modal to the portal div
};
 
/**
 * Displays a custom confirmation modal.
 * @param {string} message - The message to display in the confirmation modal.
 * @param {function} onConfirm - Callback function to execute if the user confirms.
 */
const showConfirmModal = (message, onConfirm) => {
  // Create the main modal overlay div.
  const modalOverlay = document.createElement('div');
  modalOverlay.className = "fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4";
 
  // Create the modal content box.
  const modalContent = document.createElement('div');
  modalContent.className = `bg-white rounded-xl shadow-2xl w-full max-w-md p-6 bg-yellow-50 transform transition-all scale-100 ease-in-out duration-300`;
 
  const header = document.createElement('div');
  header.className = "flex items-center space-x-4 mb-4";
  
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'h-6 w-6 text-yellow-500');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  // Lucide icon for alert/warning (e.g., AlertTriangle)
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z');
  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line1.setAttribute('x1', '12'); line1.setAttribute('y1', '9'); line1.setAttribute('x2', '12'); line1.setAttribute('y2', '13');
  const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line2.setAttribute('x1', '12'); line2.setAttribute('y1', '17'); line2.setAttribute('x2', '12.01'); line2.setAttribute('y2', '17');
  icon.appendChild(path1);
  icon.appendChild(line1);
  icon.appendChild(line2);
 
  const title = document.createElement('h3');
  title.className = `text-xl font-semibold text-yellow-700`;
  title.textContent = 'Confirm Action';
 
  header.appendChild(icon);
  header.appendChild(title);
 
  const messageP = document.createElement('p');
  messageP.className = `text-sm text-yellow-700 mb-6`;
  messageP.textContent = message;
 
  const buttonContainer = document.createElement('div');
  buttonContainer.className = "flex justify-end space-x-3";
 
  const cancelButton = document.createElement('button');
  cancelButton.className = `px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500`;
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener('click', () => {
    modalPortal.replaceChildren(); // Close modal
  });
 
  const confirmButton = document.createElement('button');
  confirmButton.className = `px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
  confirmButton.textContent = "Confirm";
  confirmButton.addEventListener('click', () => {
    onConfirm(); // Execute the callback
    modalPortal.replaceChildren(); // Close modal
  });
 
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(confirmButton);
 
  modalContent.appendChild(header);
  modalContent.appendChild(messageP);
  modalContent.appendChild(buttonContainer);
  modalOverlay.appendChild(modalContent);
  modalPortal.appendChild(modalOverlay);
};
 
/**
 * Returns the appropriate Tailwind CSS classes for a given processing status.
 * @param {string} status - The processing status (e.g., 'processed', 'pending', 'failed').
 * @returns {string} Tailwind CSS classes for styling the status.
 */
const getStatusColor = (status) => {
  switch (status) {
    case 'processed': return 'bg-green-100 text-green-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    case 'failed': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};
 
/**
 * Creates and returns an SVG element for sort icons (ascending/descending).
 * @param {string} key - The key (column name) for which the sort icon is being rendered.
 * @returns {SVGElement} The SVG icon element, or an empty SVG if no sort is applied to this key.
 */
const renderSortIcon = (key) => {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'h-4 w-4 ml-1');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
 
  // Only render the specific sort icon if this key is currently sorted
  if (sortConfig.key === key) {
    if (sortConfig.direction === 'ascending') {
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'm7 6-3-3-3 3');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M4 18V3');
      const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path3.setAttribute('d', 'M17 21v-7');
      const path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path4.setAttribute('d', 'm14 17 3 3 3-3');
      icon.appendChild(path1);
      icon.appendChild(path2);
      icon.appendChild(path3);
      icon.appendChild(path4);
    } else { // descending
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'm7 18 3 3 3-3');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M10 12V3');
      const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path3.setAttribute('d', 'M17 21v-7');
      const path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path4.setAttribute('d', 'm14 17 3 3 3-3');
      icon.appendChild(path1);
      icon.appendChild(path2);
      icon.appendChild(path3);
      icon.appendChild(path4);
    }
  }
 
  return icon;
};
 
/**
 * Renders the list of documents into the table.
 * All elements are created using document.createElement and appended.
 * @param {Array<Object>} docs - An array of document objects to display.
 */
const renderDocuments = (docs) => {
  documentTableBody.replaceChildren(); // Clear existing rows from the table body
 
  // If no documents, display a message.
  if (docs.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.setAttribute('colspan', '5'); // Span across all 5 columns
    cell.className = 'px-6 py-4 text-center text-gray-500 italic';
    cell.textContent = 'No documents found.';
    row.appendChild(cell);
    documentTableBody.appendChild(row);
    return;
  }
 
  // Use a DocumentFragment for efficient DOM manipulation.
  // Appending to a fragment and then appending the fragment once to the DOM
  // is faster than appending each row individually.
  const fragment = document.createDocumentFragment();
 
  docs.forEach((doc) => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50 transition-colors duration-150 cursor-pointer';
    row.dataset.docId = doc.id; // Store document ID on the row for easy access
 
    // Create and append ID cell
    const idCell = document.createElement('td');
    idCell.className = 'px-4 py-4 whitespace-nowrap text-sm text-gray-900';
    idCell.textContent = doc.id;
    row.appendChild(idCell);
 
    // Create and append Filename cell
    const filenameCell = document.createElement('td');
    filenameCell.className = 'px-4 py-4 whitespace-nowrap text-sm font-medium text-indigo-600';
    filenameCell.textContent = doc.filename;
    row.appendChild(filenameCell);
 
    // Create and append Status cell with dynamic styling
    const statusCell = document.createElement('td');
    statusCell.className = 'px-4 py-4 whitespace-nowrap';
    const statusSpan = document.createElement('span');
    statusSpan.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.processing_status)}`;
    statusSpan.textContent = doc.processing_status;
    statusCell.appendChild(statusSpan);
    row.appendChild(statusCell);
 
    // Create and append Upload Date cell
    const dateCell = document.createElement('td');
    dateCell.className = 'px-4 py-4 whitespace-nowrap text-sm text-gray-500';
    dateCell.textContent = new Date(doc.upload_date).toLocaleString();
    row.appendChild(dateCell);
 
    // Create and append Actions cell with delete button
    const actionsCell = document.createElement('td');
    actionsCell.className = 'px-4 py-4 whitespace-nowrap text-center';
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button p-2 text-red-600 hover:text-red-800';
    deleteButton.setAttribute('title', 'Delete Document');
 
    // Create the SVG for the trash icon programmatically
    const deleteIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    deleteIcon.setAttribute('class', 'lucide lucide-trash-2 h-5 w-5');
    deleteIcon.setAttribute('width', '24');
    deleteIcon.setAttribute('height', '24');
    deleteIcon.setAttribute('viewBox', '0 0 24 24');
    deleteIcon.setAttribute('fill', 'none');
    deleteIcon.setAttribute('stroke', 'currentColor');
    deleteIcon.setAttribute('stroke-width', '2');
    deleteIcon.setAttribute('stroke-linecap', 'round');
    deleteIcon.setAttribute('stroke-linejoin', 'round');
 
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M3 6h18');
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6');
    const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path3.setAttribute('d', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2');
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '10'); line1.setAttribute('x2', '10'); line1.setAttribute('y1', '11'); line1.setAttribute('y2', '17');
    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '14'); line2.setAttribute('x2', '14'); line2.setAttribute('y1', '11'); line2.setAttribute('y2', '17');
 
    deleteIcon.appendChild(path1);
    deleteIcon.appendChild(path2);
    deleteIcon.appendChild(path3);
    deleteIcon.appendChild(line1);
    deleteIcon.appendChild(line2);
 
    deleteButton.appendChild(deleteIcon);
    actionsCell.appendChild(deleteButton);
    row.appendChild(actionsCell);
 
    // Add event listeners for row click (to view details) and delete button click
    row.addEventListener('click', (e) => {
      // Prevent row click from triggering if delete button was clicked
      if (!e.target.closest('.delete-button')) {
        handleDocumentClick(doc.id);
      }
    });
    deleteButton.addEventListener('click', (e) => handleDeleteDocument(doc.id, e));
 
    fragment.appendChild(row); // Add the constructed row to the document fragment
  });
 
  documentTableBody.appendChild(fragment); // Append the fragment (all rows) to the table body
 
  // Update sort icons in table headers
  document.querySelectorAll('[data-sort]').forEach((th) => {
    const key = th.dataset.sort;
    const iconSpan = th.querySelector('span'); // Get the span element where the icon should be
    if (iconSpan) {
      iconSpan.replaceChildren(); // Clear previous icon
      if (sortConfig.key === key) {
        iconSpan.appendChild(renderSortIcon(key)); // Append the new icon
      }
    }
  });
};
 
/**
 * Displays the detailed view of a single document.
 * All elements are created using document.createElement and appended.
 * @param {Object} doc - The document object to display details for.
 */
const showDetails = (doc) => {
  // Hide list and upload sections, show detail section
  listSection.classList.add('hidden');
  uploadSection.classList.add('hidden');
  detailSection.classList.remove('hidden');
 
  // Set the filename in the detail header
  docFilename.textContent = doc.filename;
 
  // Clear previous data from detail tables
  extractedDataBody.replaceChildren();
  lineItemsBody.replaceChildren();
 
  // Render extracted key-value pairs
  const extractedEntries = Object.entries(doc.extracted_data);
  if (extractedEntries.length > 0) {
    extractedEntries.forEach(([key, value]) => {
      const row = document.createElement('tr');
      const keyCell = document.createElement('td');
      keyCell.className = 'px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900';
      keyCell.textContent = key;
      const valueCell = document.createElement('td');
      valueCell.className = 'px-4 py-3 whitespace-pre-wrap text-sm text-gray-500';
      valueCell.textContent = value;
      row.appendChild(keyCell);
      row.appendChild(valueCell);
      extractedDataBody.appendChild(row);
    });
  } else {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.setAttribute('colspan', '2');
    cell.className = 'px-4 py-3 text-center text-gray-500 italic';
    cell.textContent = 'No key-value pairs were extracted.';
    row.appendChild(cell);
    extractedDataBody.appendChild(row);
  }
 
  // Render line items if available
  if (doc.line_items && doc.line_items.length > 0) {
    lineItemsSection.classList.remove('hidden');
    doc.line_items.forEach((item) => {
      const row = document.createElement('tr');
      const descriptionCell = document.createElement('td');
      descriptionCell.className = 'px-4 py-3 whitespace-normal text-sm font-medium text-gray-900';
      descriptionCell.textContent = item.description;
      const quantityCell = document.createElement('td');
      quantityCell.className = 'px-4 py-3 whitespace-nowrap text-sm text-gray-500';
      quantityCell.textContent = item.quantity;
      const unitPriceCell = document.createElement('td');
      unitPriceCell.className = 'px-4 py-3 whitespace-nowrap text-sm text-gray-500';
      unitPriceCell.textContent = `$${item.unit_price?.toFixed(2) || 'N/A'}`;
      const lineTotalCell = document.createElement('td');
      lineTotalCell.className = 'px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900';
      lineTotalCell.textContent = `$${item.line_total?.toFixed(2) || 'N/A'}`;
      row.appendChild(descriptionCell);
      row.appendChild(quantityCell);
      row.appendChild(unitPriceCell);
      row.appendChild(lineTotalCell);
      lineItemsBody.appendChild(row);
    });
  } else {
    lineItemsSection.classList.add('hidden');
  }
 
  // Render raw OCR text if available
  if (doc.raw_text) {
    rawTextSection.classList.remove('hidden');
    rawTextContent.textContent = doc.raw_text;
  } else {
    rawTextSection.classList.add('hidden');
  }
};
 
/**
 * Switches the view back to the document list.
 */
const showList = () => {
  listSection.classList.remove('hidden');
  uploadSection.classList.remove('hidden');
  detailSection.classList.add('hidden');
};
 
// --- API Interaction Functions ---
 
/**
 * Fetches the list of all documents from the backend API.
 */
const fetchDocuments = async () => {
  showLoading(true); // Show loading indicator
  try {
    const response = await fetch(`${API_BASE_URL}/documents`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allDocuments = await response.json(); // Store fetched documents
    renderDocuments(getFilteredAndSortedDocs()); // Render them
  } catch (error) {
    console.error('Error fetching documents:', error);
    showModal(
      `Failed to load documents: ${
        error.message || 'Network error'
      }. Is the backend running?`,
      'error'
    );
  } finally {
    showLoading(false); // Hide loading indicator
  }
};
 
/**
 * Handles the file upload process to the backend.
 * @param {File} file - The file object to upload.
 */
const handleFileUpload = async (file) => {
  if (!file) {
    showModal('Please select a file to upload.', 'error');
    return;
  }
 
  showLoading(true);
  showModal('Uploading and processing document...', 'info');
 
  const formData = new FormData();
  formData.append('file', file);
 
  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
 
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail ||
          `Upload failed with status: ${response.status}`
      );
    }
 
    const data = await response.json();
    showModal(
      `Document processed successfully: ${data.message || ''}`,
      'success'
    );
    fetchDocuments(); // Refresh the document list after successful upload
  } catch (error) {
    console.error('Error uploading file:', error);
    showModal(`Upload failed: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
};
 
/**
 * Fetches and displays the detailed information for a single document.
 * @param {string} docId - The ID of the document to fetch details for.
 */
const handleDocumentClick = async (docId) => {
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${docId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const doc = await response.json();
    showDetails(doc); // Display the fetched document details
  } catch (error) {
    console.error('Error fetching document details:', error);
    showModal('Failed to load document details.', 'error');
  } finally {
    showLoading(false);
  }
};
 
/**
 * Handles the deletion of a document.
 * @param {string} docId - The ID of the document to delete.
 * @param {Event} event - The click event object to stop propagation.
 */
const handleDeleteDocument = async (docId, event) => {
  event.stopPropagation(); // Prevent the row click event from firing
 
  // Use the custom confirmation modal instead of window.confirm()
  showConfirmModal(`Are you sure you want to delete document ID ${docId}?`, async () => {
    showLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${docId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      showModal(`Document ${docId} deleted successfully.`, 'success');
      fetchDocuments(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting document:', error);
      showModal('Failed to delete document.', 'error');
    } finally {
      showLoading(false);
    }
  });
};
 
/**
 * Filters and sorts the `allDocuments` array based on current search term and sort configuration.
 * @returns {Array<Object>} The filtered and sorted array of documents.
 */
const getFilteredAndSortedDocs = () => {
  const searchTerm = searchInput.value.toLowerCase();
  let docs = [...allDocuments]; // Create a shallow copy to avoid modifying original array
 
  // Filter documents based on search term
  const filteredDocs = docs.filter((doc) =>
    Object.values(doc).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    )
  );
 
  // Sort documents if a sort key is configured
  if (sortConfig.key) {
    filteredDocs.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
 
      // Handle null/undefined values for sorting
      if (aValue === null || aValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
 
      // Perform comparison based on sort direction
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0; // Values are equal
    });
  }
 
  return filteredDocs;
};
 
// --- Event Listeners ---
 
// Ensure the DOM is fully loaded before attaching event listeners and fetching data.
document.addEventListener('DOMContentLoaded', () => {
  fetchDocuments(); // Initial fetch of documents when the page loads
 
  // Event listeners for the upload section
  uploadSection.addEventListener('click', () => fileInput.click()); // Trigger hidden file input on section click
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    handleFileUpload(file);
    fileInput.value = ''; // Clear the file input after selection
  });
  uploadSection.addEventListener('dragover', (e) => e.preventDefault()); // Allow drop
  uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  });
 
  // Event listener for the search input
  searchInput.addEventListener('input', () => {
    renderDocuments(getFilteredAndSortedDocs()); // Re-render documents on search input change
  });
 
  // Event listeners for table header sorting
  document.querySelectorAll('[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort; // Get the sort key from data-sort attribute
      if (sortConfig.key === key) {
        // If already sorting by this key, toggle direction
        sortConfig.direction =
          sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
      } else {
        // If sorting by a new key, set it to ascending
        sortConfig.key = key;
        sortConfig.direction = 'ascending';
      }
      renderDocuments(getFilteredAndSortedDocs()); // Re-render with new sort order
    });
  });
 
  // Event listener for the back button in the detail view
  backButton.addEventListener('click', showList);
});



 <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document Processor & Extractor</title>
    <!-- Link to your custom stylesheet -->
    <link rel="stylesheet" href="style.css" />
    <!-- Tailwind CSS CDN for utility classes -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts for Inter font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body class="bg-gray-100 p-4 sm:p-6 font-sans antialiased text-gray-800">
    <div class="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-6 sm:p-8">
      <h1 class="text-3xl sm:text-4xl font-bold text-center text-indigo-700 mb-8">
        Document Processor & Extractor
      </h1>
 
      <!-- This div will be used as a portal for the modal, allowing it to overlay content -->
      <div id="modal-portal"></div>
 
      <!-- Loading Overlay - hidden by default, shown by JavaScript during async operations -->
      <div
        id="loading-overlay"
        class="hidden fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50"
      >
        <div class="bg-white p-6 rounded-lg shadow-xl flex items-center space-x-3">
          <!-- SVG for loading spinner -->
          <svg
            class="animate-spin h-8 w-8 text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p class="text-lg text-gray-700">Loading...</p>
        </div>
      </div>
 
      <!-- Main content container for the application views -->
      <div id="main-container">
        <!-- Document Upload Section -->
        <div
          id="upload-section"
          class="border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center mb-8 hover:border-indigo-500 transition-colors duration-200 cursor-pointer"
        >
          <!-- Hidden file input, triggered by the label -->
          <input
            type="file"
            id="file-upload"
            class="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <label for="file-upload" class="block cursor-pointer">
            <!-- SVG for upload icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-upload mx-auto h-12 w-12 text-indigo-500 mb-3"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <p class="text-lg text-gray-700 font-medium">
              Drag & Drop your document here
            </p>
            <p class="text-sm text-gray-500">
              or click to browse (PDF, JPG, PNG)
            </p>
          </label>
        </div>
 
        <!-- Document List Section -->
        <div id="list-section">
          <div
            class="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0"
          >
            <h2 class="text-2xl font-semibold text-gray-700">
              Processed Documents
            </h2>
            <div class="relative w-full sm:w-auto">
              <!-- SVG for search icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-search absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                id="search-input"
                placeholder="Search documents..."
                class="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
 
          <div
            class="overflow-x-auto rounded-lg shadow-sm border border-gray-200"
          >
            <table id="document-table" class="w-full table-auto">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    data-sort="id"
                    class="cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg"
                  >
                    <div class="flex items-center">
                      ID
                      <!-- Placeholder for sort icon, populated by JS -->
                      <span id="sort-icon-id"></span>
                    </div>
                  </th>
                  <th
                    data-sort="filename"
                    class="cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div class="flex items-center">
                      Filename
                      <!-- Placeholder for sort icon, populated by JS -->
                      <span id="sort-icon-filename"></span>
                    </div>
                  </th>
                  <th
                    data-sort="processing_status"
                    class="cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div class="flex items-center">
                      Status
                      <!-- Placeholder for sort icon, populated by JS -->
                      <span id="sort-icon-processing_status"></span>
                    </div>
                  </th>
                  <th
                    data-sort="upload_date"
                    class="cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div class="flex items-center">
                      Uploaded At
                      <!-- Placeholder for sort icon, populated by JS -->
                      <span id="sort-icon-upload_date"></span>
                    </div>
                  </th>
                  <th
                    class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <!-- Document rows will be inserted here by JavaScript -->
              <tbody id="document-list" class="bg-white divide-y divide-gray-200">
              </tbody>
            </table>
          </div>
        </div>
 
        <!-- Document Detail View - hidden by default, shown by JavaScript -->
        <div id="detail-section" class="hidden space-y-6">
          <div class="flex items-center space-x-4 mb-4">
            <button
              id="back-button"
              class="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
              title="Back to list"
            >
              <!-- SVG for back arrow icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-arrow-left h-5 w-5"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </button>
            <h2 class="text-2xl font-bold text-gray-800">
              Details for: <span id="doc-filename" class="text-indigo-600"></span>
            </h2>
          </div>
 
          <!-- Extracted Key-Value Pairs Section -->
          <div
            id="extracted-data"
            class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 class="text-xl font-semibold mb-3">Extracted Key-Value Pairs</h3>
            <div
              class="overflow-x-auto rounded-lg border border-gray-200"
            >
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-100">
                  <tr>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Key
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Value
                    </th>
                  </tr>
                </thead>
                <!-- Extracted data rows will be inserted here by JavaScript -->
                <tbody id="extracted-data-body" class="bg-white divide-y divide-gray-200">
                </tbody>
              </table>
            </div>
          </div>
 
          <!-- Line Items Section - hidden by default, shown if data exists -->
          <div
            id="line-items-section"
            class="hidden bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 class="text-xl font-semibold mb-3">Line Items</h3>
            <div
              class="overflow-x-auto rounded-lg border border-gray-200"
            >
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-100">
                  <tr>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Quantity
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Unit Price
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Line Total
                    </th>
                  </tr>
                </thead>
                <!-- Line items will be inserted here by JavaScript -->
                <tbody id="line-items-body" class="bg-white divide-y divide-gray-200">
                </tbody>
              </table>
            </div>
          </div>
 
          <!-- Raw OCR Text Section - hidden by default, shown if data exists -->
          <div
            id="raw-text-section"
            class="hidden bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 class="text-xl font-semibold mb-3">Raw OCR Text</h3>
            <pre
              id="raw-text-content"
              class="whitespace-pre-wrap text-sm text-gray-700 bg-gray-100 p-4 rounded-md overflow-x-auto"
            ></pre>
          </div>
        </div>
      </div>
    </div>
    <!-- Link to your JavaScript file -->
    <script src="script.js"></script>
  </body>
</html>






