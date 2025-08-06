import React, { useState,useEffect } from 'react';
import '../App.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Make sure this CSS import is here too!
import UserDetails from './UserDetails';
import axiosInstance from '../api/axiosInstance'; // adjust path as needed
import Loader from "react-js-loader";

function RightPanel({
  setSelectedDocument,
  selectedDocument,
  fetchFolderAndFileData,
  apiBaseUrl,
  currentFilePath,
  isMobile,
  allVersionsOfSelectedDocument,
  handleDocumentClick,
  archivedBoolean,
  setArchivedBoolean
}) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUpdateFile, setSelectedUpdateFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleDownload = async () => {
  try {
    const response = await axiosInstance.get(
      `/files/download-pdf/${selectedDocument.id}`,
      { responseType: 'blob' }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'document.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download file.');
  }
};



const handleView = async () => {
  try {
    const response = await axiosInstance.get(
      `/files/view-pdf/${selectedDocument.id}`,
      { responseType: 'blob' }
    );

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    setPdfUrl(url);
  } catch (error) {
    console.error('View error:', error);
    toast.error('Failed to load PDF.');
  }
};

useEffect(() => {
  if (selectedDocument) {
    handleView();
  } else {
    setPdfUrl(null); // clear iframe when no doc selected or archived
  }
}, [selectedDocument, archivedBoolean]);



  return (
    <div className="right-panel">
<div className="top-bar-container">
  {!isMobile && (
    <div className="Archive-button">
      <button
        className="Archive-btn"
        onClick={async (e) => {
          e.stopPropagation();
          setArchivedBoolean(!archivedBoolean);
          setSelectedDocument(null);
          fetchFolderAndFileData();
        }}
      >
        {archivedBoolean ? <>Un-Archived</> : <>Archived</>}
      </button>
    </div>
  )}

  <UserDetails/>
</div>

       
 

    {selectedDocument ? (
  <div className="document-viewer-content">
    {currentFilePath && (
      <div className="breadcrumb-path">
       {selectedDocument.frontendFilePath.split('\\').map((part, index, arr) => (
      <React.Fragment key={index}>
        <span className="breadcrumb-segment">{part.trim()}</span>
        {index < arr.length - 1 && (
          <span className="breadcrumb-arrow">›</span>
        )}
      </React.Fragment>
    ))}

<span className="version-buttons-container">
  {allVersionsOfSelectedDocument
    .slice()
    .sort((a, b) => b.version - a.version)
    .map((versionDoc, index, arr) => {
      const latestVersion = Math.max(...arr.map(v => v.version));
      const isLatest = versionDoc.version === latestVersion;
      const isLastButton = index === arr.length - 1;

      return (
        <div key={versionDoc.id} className="version-button-wrapper">
          {isLatest && (
            <div className="latest-badge">
              Latest
            </div>
          )}
        <button
          className={`version-button ${selectedDocument.id === versionDoc.id ? 'active-version' : ''} ${isLastButton ? 'tooltip-right-edge' : ''}`}
          data-tooltip={`Uploaded by ${versionDoc.uploadedBy || versionDoc.updatedBy}`}
          onClick={() => {
            handleDocumentClick(versionDoc, currentFilePath.split(' > ').slice(0, -1));
            console.log(`Viewing version ${versionDoc.version}`);
          }}
        >
          {`v${versionDoc.version}`}
      </button>


        </div>
      );
    })}
</span>

      </div>
    )}

    {/* {archivedBoolean && (
      <div className="archived-file-info" style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
        <div><strong>Version:</strong> {selectedDocument.version}</div>
        <div><strong>Path:</strong> {selectedDocument.frontendFilePath}</div>
      </div>
    )} */}

    {/* ✅ Show action buttons only if NOT archived */}
    {!archivedBoolean && (
      <div className="action-buttons">
        <button
          className="Update-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowUpdateModal(true);
          }}
        >
          Update version
        </button>

        <button
          className="delete-btn"
          onClick={async (e) => {
            e.stopPropagation();
            if (window.confirm('Are you sure you want to delete this file?')) {
              try {
                await axiosInstance.delete(`${apiBaseUrl}/files/delete/${selectedDocument.id}`);
                toast.success('File deleted successfully!');
                fetchFolderAndFileData();
                setSelectedDocument(null);
              } catch (error) {
                console.error('Error deleting file:', error);
                toast.error('Failed to delete file. Try again.');
              }
            }
          }}
        >
          Delete
        </button>

          <button
            className="download-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
          >
            Download
          </button>
      </div>
    )}

 {pdfUrl ? (
  <iframe
    title="document-frame"
    src={`${pdfUrl}#toolbar=0`}
    className="pdf-iframe"
  />
) : (
 <Loader type="spinner-default" bgColor="#3498db" color="#3498db" size={100} />
)}

  </div>
) : (
  <div className='pdf-viewer-placeholder'>
    <div className='pdf-icon'>📄 </div>
    <i> Click on a document to preview it here.</i>
  </div>
)}


      {/* ✅ MODAL FOR UPDATING FILE */}
      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Update File: {selectedDocument?.fileName}</h2>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setSelectedUpdateFile(e.target.files[0])}
            />
            <div className="modal-buttons">
            <button
            onClick={async () => {
              if (!selectedUpdateFile) {
                toast.warn('Please select a file first.');
                return;
              }

              // ✅ Compare names before uploading
                if (selectedUpdateFile.name !== selectedDocument.fileName) {
                    toast.error('Selected file name does not match the existing file name.');
                    return;
                }    

              const formData = new FormData();
              formData.append('file', selectedUpdateFile);

              try {
                await axiosInstance.patch(
                  `${apiBaseUrl}/files/update/${selectedDocument.code}`,
                  formData,
                  {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  }
                );
                toast.success('File updated successfully!');
                fetchFolderAndFileData();
                setSelectedDocument(null);
                setShowUpdateModal(false);
                setSelectedUpdateFile(null);
              } catch (error) {
                console.error('Error updating file:', error);
                toast.error('Failed to update file. Try again.');
              }
            }}
          >
            Submit
          </button>

              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedUpdateFile(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RightPanel;