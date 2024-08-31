import React from 'react';

function FileUpload({ file, setFile, handleFileUpload }) {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <h2 className="card-title">File Sharing</h2>
        <input
          type="file"
          className="form-control mb-2"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button className="btn btn-primary w-100" onClick={handleFileUpload}>Upload File</button>
      </div>
    </div>
  );
}

export default FileUpload;