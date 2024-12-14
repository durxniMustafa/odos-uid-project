import React, { useState } from "react";
import { useParams } from "react-router-dom";
import BrainViewer from "./BrainViewer";
import "../styles/PatientDetail.css"; // Create appropriate styles

function PatientDetail({ patients, setPatients }) {
    const { id } = useParams();
    const patient = patients.find((p) => p.id === id);

    // State for notifications and viewing brain files
    const [notification, setNotification] = useState(null);
    const [viewingBrainFile, setViewingBrainFile] = useState(null);

    // Handle file upload for the patient
    const handleFileUpload = (files) => {
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            const validMimeTypes = ["model/gltf-binary", "application/octet-stream"];
            const isValidMimeType = validMimeTypes.includes(file.type);
            const isValidExtension = file.name.toLowerCase().endsWith(".glb");

            if (!isValidMimeType && !isValidExtension) {
                alert(`File ${file.name} is not a valid .glb file.`);
                return;
            }

            const fileURL = URL.createObjectURL(file);
            const fileId = uuidv4();

            setPatients((prev) =>
                prev.map((p) =>
                    p.id === id
                        ? {
                            ...p,
                            brainFiles: [
                                ...p.brainFiles,
                                { id: fileId, url: fileURL, name: file.name },
                            ],
                            uploadProgress: {
                                ...p.uploadProgress,
                                [fileId]: 0,
                            },
                        }
                        : p
                )
            );

            // Simulate upload progress
            let progress = 0;
            const interval = setInterval(() => {
                if (progress < 100) {
                    progress += 10;
                    setPatients((prev) =>
                        prev.map((p) =>
                            p.id === id
                                ? {
                                    ...p,
                                    uploadProgress: {
                                        ...p.uploadProgress,
                                        [fileId]: progress,
                                    },
                                }
                                : p
                        )
                    );
                } else {
                    clearInterval(interval);
                    showNotification(`File ${file.name} uploaded successfully!`);
                }
            }, 300);
        });
    };

    // Remove a brain file
    const handleRemoveBrainFile = (fileId) => {
        const confirmRemove = window.confirm(
            "Are you sure you want to remove this brain file?"
        );
        if (confirmRemove) {
            setPatients((prev) =>
                prev.map((p) => {
                    if (p.id === id) {
                        const updatedBrainFiles = p.brainFiles.filter(
                            (file) => file.id !== fileId
                        );
                        const updatedUploadProgress = { ...p.uploadProgress };
                        delete updatedUploadProgress[fileId];
                        return {
                            ...p,
                            brainFiles: updatedBrainFiles,
                            uploadProgress: updatedUploadProgress,
                        };
                    }
                    return p;
                })
            );
            showNotification("Brain file removed successfully!");
        }
    };

    // View a brain image in larger size
    const handleViewBrainImage = (brainFile) => {
        setViewingBrainFile(brainFile);
    };

    // Close the brain image modal
    const closeBrainImageModal = () => {
        setViewingBrainFile(null);
    };

    // Notification handler
    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    if (!patient) {
        return <p>Patient not found.</p>;
    }

    return (
        <div className="patient-detail-container">
            {/* Notification */}
            {notification && (
                <div className="notification">
                    <p>{notification}</p>
                </div>
            )}

            <h2>{patient.name}'s Detail Page</h2>

            {/* Patient Information */}
            <div className="patient-info">
                <img
                    src={patient.photo || "https://via.placeholder.com/100"}
                    alt="Patient"
                    className="patient-photo"
                />
                <div className="patient-details">
                    <p>
                        <strong>Email:</strong> {patient.email}
                    </p>
                    <p>
                        <strong>Date of Birth:</strong> {patient.dob}
                    </p>
                    <p>
                        <strong>Phone:</strong> {patient.phone}
                    </p>
                    <p>
                        <strong>Address:</strong> {patient.address}
                    </p>
                </div>
            </div>

            {/* File Upload */}
            <label className="file-upload-label" htmlFor={`upload-${patient.id}`}>
                Upload Brain Files:
            </label>
            <input
                type="file"
                id={`upload-${patient.id}`}
                accept=".glb"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="file-upload-input"
            />

            {/* Upload Status */}
            {Object.keys(patient.uploadProgress).length > 0 && (
                <div className="upload-status">
                    {Object.entries(patient.uploadProgress).map(
                        ([fileId, progress]) => (
                            <div key={fileId} className="upload-progress">
                                <div className="spinner"></div>
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Brain Viewer */}
            <div className="brain-viewer-section">
                {patient.brainFiles.length > 0 ? (
                    patient.brainFiles.map((brainFile) => (
                        <div key={brainFile.id} className="brain-viewer-wrapper">
                            <BrainViewer file={brainFile.url} />
                            <div className="brain-file-info">
                                <p className="brain-file-name">{brainFile.name}</p>
                                <div className="brain-file-actions">
                                    <button
                                        className="view-brain-file-button"
                                        onClick={() => handleViewBrainImage(brainFile)}
                                    >
                                        View Larger
                                    </button>
                                    <button
                                        className="remove-brain-file-button"
                                        onClick={() =>
                                            handleRemoveBrainFile(brainFile.id)
                                        }
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No brain image uploaded</p>
                )}
            </div>

            {/* View Brain Image Modal */}
            {viewingBrainFile && (
                <div className="modal-overlay" onClick={closeBrainImageModal}>
                    <div
                        className="modal large-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>{viewingBrainFile.name}</h2>
                        <div className="large-brain-viewer">
                            <BrainViewer file={viewingBrainFile.url} />
                        </div>
                        <div className="modal-actions">
                            <button onClick={closeBrainImageModal} className="cancel-button">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PatientDetail;