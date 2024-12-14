// src/pages/PatientDetail.js

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import BrainViewer from "./BrainViewer";
import "../styles/PatientDetail.css";
import Navbar from "../components/Navbar"; // Ensure Navbar is correctly imported
import { FaUpload, FaShareAlt, FaCheckCircle, FaEdit, FaTrash } from 'react-icons/fa';

function PatientDetail({ patients, setPatients }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const patient = patients.find((p) => p.id === id);

    // State for notifications and viewing brain files
    const [notification, setNotification] = useState(null);
    const [viewingBrainFile, setViewingBrainFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [notes, setNotes] = useState(patient.notes || ""); // Initialize with existing notes
    const [isEditingNotes, setIsEditingNotes] = useState(false);

    // Handle file upload for the patient
    const handleFileUpload = (files) => {
        if (!files || files.length === 0) return;

        const file = files[0]; // Only take the first file

        const validMimeTypes = ["model/gltf-binary", "application/octet-stream"];
        const isValidMimeType = validMimeTypes.includes(file.type);
        const isValidExtension = file.name.toLowerCase().endsWith(".glb");

        if (!isValidMimeType && !isValidExtension) {
            alert(`File ${file.name} is not a valid .glb file.`);
            return;
        }

        setUploading(true);

        const fileURL = URL.createObjectURL(file);
        const fileId = uuidv4();

        // Replace existing brain files with the new one
        setPatients((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        brainFiles: [
                            { id: fileId, url: fileURL, name: file.name },
                        ],
                        uploadProgress: {
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
                                    [fileId]: progress,
                                },
                            }
                            : p
                    )
                );
            } else {
                clearInterval(interval);
                showNotification(`File ${file.name} uploaded successfully!`);
                setUploading(false);
            }
        }, 300);
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
                        // Revoke blob URL to free memory
                        const removedFile = p.brainFiles.find((file) => file.id === fileId);
                        if (removedFile) {
                            URL.revokeObjectURL(removedFile.url);
                        }
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

    // Handle notes editing
    const handleEditNotes = () => {
        setIsEditingNotes(true);
    };

    const handleSaveNotes = () => {
        setPatients((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        notes: notes,
                    }
                    : p
            )
        );
        setIsEditingNotes(false);
        showNotification("Notes updated successfully!");
    };

    // Handle sharing (Placeholder functionality)
    const handleShare = () => {
        // Implement sharing functionality as needed
        showNotification("Share functionality is not yet implemented.");
    };

    if (!patient) {
        return <p>Patient not found.</p>;
    }

    return (
        <div className="patient-detail-container">
            {/* Navbar */}
            <Navbar />

            {/* Notification */}
            {notification && (
                <div className="notification">
                    <p>{notification}</p>
                </div>
            )}

            {/* Back Button */}
            <button className="back-button" onClick={() => navigate(-1)}>
                &larr; Back to Dashboard
            </button>

            {/* Header */}
            <h2 className="detail-header">{patient.name}'s Detail Page</h2>

            {/* Patient Information */}
            <div className="patient-info">
                <img
                    src={patient.photo || "https://via.placeholder.com/150"}
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
                    {/* Add Notes Section */}
                    <div className="notes-section">
                        <h3>Notes</h3>
                        {isEditingNotes ? (
                            <div className="edit-notes">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter notes here..."
                                ></textarea>
                                <div className="notes-actions">
                                    <button className="save-button" onClick={handleSaveNotes}>
                                        Save
                                    </button>
                                    <button
                                        className="cancel-button"
                                        onClick={() => setIsEditingNotes(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="view-notes">
                                <p>{notes || "No notes added yet."}</p>
                                <button className="edit-notes-button" onClick={handleEditNotes}>
                                    <FaEdit /> Edit Notes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* File Upload Section */}
            <div className="file-upload-section">
                <label className="file-upload-label" htmlFor={`upload-${patient.id}`}>
                    Upload Brain File:
                </label>
                <input
                    type="file"
                    id={`upload-${patient.id}`}
                    accept=".glb"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="file-upload-input"
                />
                <label htmlFor={`upload-${patient.id}`} className="upload-button">
                    <FaUpload className="file-upload-icon" /> Choose File
                </label>
            </div>

            {/* AI Magic Progress Bar */}
            {uploading && (
                <div className="ai-magic-progress">
                    <div className="ai-magic-content">
                        <div className="ai-spinner"></div>
                        <p>AI Magic Happens Here...</p>
                        <div className="progress-bar-container">
                            <div className="progress-bar"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Brain Viewer Section */}
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
                                        <FaCheckCircle /> View Larger
                                    </button>
                                    <button
                                        className="remove-brain-file-button"
                                        onClick={() => handleRemoveBrainFile(brainFile.id)}
                                    >
                                        <FaTrash /> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-upload-message">No brain image uploaded.</p>
                )}
            </div>

            {/* Share Button */}
            <div className="share-section">
                <button className="share-button" onClick={handleShare}>
                    <FaShareAlt /> Share Patient
                </button>
            </div>

            {/* View Brain Image Modal */}
            {viewingBrainFile && (
                <div className="modal-overlay" onClick={closeBrainImageModal}>
                    <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
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
    )}

export default PatientDetail;