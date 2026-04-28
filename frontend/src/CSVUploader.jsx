import React, { useState, useRef } from 'react';
import './CSVUploader.css';

const CSVUploader = () => {
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState(null);
  const [isError, setIsError] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    // Check if the file is a CSV
    if (selectedFile.type === "text/csv" || selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setResponseMsg(null); // Reset messages on new file
      setIsError(false);
    } else {
      setFile(null);
      setIsError(true);
      setResponseMsg("Please select a valid CSV file.");
    }
  };

  const removeFile = () => {
    setFile(null);
    setResponseMsg(null);
    setIsError(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setResponseMsg(null);
    setIsError(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setResponseMsg(data.message || "File uploaded successfully!");
        setFile(null); // Clear file after successful upload
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      } else {
        throw new Error(data.error || data.message || "Upload failed.");
      }
    } catch (error) {
      setIsError(true);
      setResponseMsg(error.message || "An error occurred during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="uploader-container">
      <div className="uploader-card">
        <div className="card-header">
          <h2>Inventory Importer</h2>
          <p>Upload your CSV data to sync with the database</p>
        </div>

        <div 
          className={`drop-zone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleChange}
            className="file-input-hidden"
          />
          
          {!file ? (
            <div className="drop-content">
              <div className="icon-container">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <h3>Drag & Drop</h3>
              <p>or click to browse for CSV files</p>
            </div>
          ) : (
            <div className="selected-file-content" onClick={(e) => e.stopPropagation()}>
              <div className="file-icon">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                   <polyline points="14 2 14 8 20 8"></polyline>
                   <line x1="16" y1="13" x2="8" y2="13"></line>
                   <line x1="16" y1="17" x2="8" y2="17"></line>
                   <polyline points="10 9 9 9 8 9"></polyline>
                 </svg>
              </div>
              <div className="file-details">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
              </div>
              <button className="remove-btn" onClick={removeFile} aria-label="Remove file">
                &times;
              </button>
            </div>
          )}
        </div>

        {responseMsg && (
          <div className={`status-message ${isError ? 'error' : 'success'}`}>
             <div className="status-icon">
               {isError ? '!' : '✓'}
             </div>
             <span>{responseMsg}</span>
          </div>
        )}

        <div className="card-footer">
          <button 
            className={`upload-btn ${isLoading ? 'loading' : ''}`}
            onClick={handleUpload}
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
               <>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <polyline points="16 16 12 12 8 16"></polyline>
                   <line x1="12" y1="12" x2="12" y2="21"></line>
                   <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                   <polyline points="16 16 12 12 8 16"></polyline>
                 </svg>
                 Upload to Inventory
               </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CSVUploader;
