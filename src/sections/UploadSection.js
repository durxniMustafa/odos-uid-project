import React from "react";
import { FiUpload } from "react-icons/fi";

const UploadSection = ({
    patientId,
    isDraggingOver,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleInputFileChange,
}) => (
    <div
        className={`file-upload-section ${isDraggingOver ? "drag-over" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
        <label className="file-upload-label" htmlFor={`upload-${patientId}`}>
            Drag & Drop or Click to Upload a Brain File (.glb)
        </label>
        <input
            type="file"
            id={`upload-${patientId}`}
            accept=".glb"
            onChange={handleInputFileChange}
            className="file-upload-input"
        />
        <label htmlFor={`upload-${patientId}`} className="upload-button">
            <FiUpload className="file-upload-icon" /> Choose File
        </label>
        {isDraggingOver && <div className="drag-overlay">Drop file here</div>}
    </div>
);

export default UploadSection;
