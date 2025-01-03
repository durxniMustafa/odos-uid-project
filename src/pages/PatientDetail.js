import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BrainViewer from "./BrainViewer";
import ConfirmationDialog from "../components/ConfirmationDialog";
import Notification from "../components/Notification";
import useWindowSize from "../hooks/useWindowSize";

import { FaShare, FaPrint, FaFileExport } from "react-icons/fa";
import { FiEdit, FiUpload, FiSearch } from "react-icons/fi";
import UploadSection from "../sections/UploadSection";
import BrainFilesSection from "../sections/BrainFileSection";
import NotesSection from "../sections/NoteSection";
import DiagnosisSection from "../sections/DiagnosisSection";

import "../styles/PatientDetails.css";

function PatientDetail({ patients, setPatients }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const patient = patients.find((p) => p.id === id);

    const [notification, setNotification] = useState(null);
    const [viewingBrainFile, setViewingBrainFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [notes, setNotes] = useState(patient ? patient.notes || "" : "");
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        message: "",
        onConfirm: () => { },
    });
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isFavorite, setIsFavorite] = useState(patient?.isFavorite || false);
    const [brainFileFilter, setBrainFileFilter] = useState("");
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [showDiagnosis, setShowDiagnosis] = useState(false);
    const [uploadStep, setUploadStep] = useState(0);
    const [currentFileId, setCurrentFileId] = useState(null);
    const [showReportButton, setShowReportButton] = useState(false);
    const [showRetrainingButton, setShowRetrainingButton] = useState(false);

    const dragCounter = useRef(0);
    const { width, height } = useWindowSize();
    const contentHeight = height - 100;

    const closeBrainImageModal = useCallback((e) => {
        if (e && e.type === "keydown" && e.key !== "Escape") return;
        setViewingBrainFile(null);
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                closeBrainImageModal(e);
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [closeBrainImageModal]);

    const showNotificationMessage = useCallback((message) => {
        setNotification(message);
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    }, []);

    const handleFileUpload = useCallback(
        (files) => {
            if (!files || files.length === 0) return;
            const file = files[0];
            const isValidExtension = file.name.toLowerCase().endsWith(".glb");

            if (!isValidExtension) {
                showNotificationMessage(`"${file.name}" is not a valid .glb file.`);
                return;
            }

            const fileURL = URL.createObjectURL(file);
            const fileId = file.name + "-" + Date.now();
            setCurrentFileId(fileId);

            // Remove old files and add new file
            setPatients((prev) =>
                prev.map((p) =>
                    p.id === id
                        ? { ...p, brainFiles: [{ id: fileId, url: fileURL, name: file.name }], uploadProgress: { [fileId]: 0 } }
                        : p
                )
            );

            startUploadSimulation();
        },
        [id, setPatients, showNotificationMessage]
    );

    const startUploadSimulation = useCallback(() => {
        let stepCount = 0;
        setUploadStep(1);
        setUploading(true);

        const stepsInterval = setInterval(() => {
            stepCount++;
            if (stepCount <= 3) {
                setUploadStep((prev) => prev + 1);
            } else {
                clearInterval(stepsInterval);
                setUploading(false);
                showNotificationMessage(`File uploaded and processed successfully!`);
                setShowDiagnosis(true);
                setShowReportButton(true);
            }
        }, 1500);
    }, [showNotificationMessage]);

    const handleSaveNotes = useCallback(() => {
        setPatients((prev) =>
            prev.map((p) => (p.id === id ? { ...p, notes: notes } : p))
        );
        setIsEditingNotes(false);
        showNotificationMessage("Notes updated successfully!");
    }, [id, notes, setPatients, showNotificationMessage]);

    const handleFavoriteToggle = useCallback(() => {
        setIsFavorite((prev) => !prev);
        setPatients((prev) =>
            prev.map((p) => (p.id === id ? { ...p, isFavorite: !isFavorite } : p))
        );
        showNotificationMessage(isFavorite ? "Removed from favorites." : "Added to favorites!");
    }, [id, isFavorite, setPatients, showNotificationMessage]);

    const handleExportNotes = useCallback(() => {
        const blob = new Blob([notes || ""], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${patient.name}-notes.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotificationMessage("Notes exported successfully!");
    }, [notes, patient, showNotificationMessage]);

    const handleShare = useCallback(async () => {
        const shareLink = `https://example.com/patient/${id}`;
        try {
            await navigator.clipboard.writeText(shareLink);
            showNotificationMessage("Share link copied to clipboard!");
        } catch {
            showNotificationMessage("Failed to copy share link.");
        }
    }, [id, showNotificationMessage]);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const handleFeedback = useCallback((type) => {
        if (type === 'dislike') {
            setShowRetrainingButton(true);
        }
    }, []);

    const handleGenerateReport = useCallback(() => {
        showNotificationMessage("AI Report generated (simulated)!");
    }, [showNotificationMessage]);

    const filteredBrainFiles = useMemo(() => {
        if (!patient || !patient.brainFiles) return [];
        return patient.brainFiles.filter((file) =>
            file.name.toLowerCase().includes(brainFileFilter.toLowerCase())
        );
    }, [patient, brainFileFilter]);

    // Drag & Drop Handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDraggingOver(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        setIsDraggingOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleInputFileChange = (e) => {
        handleFileUpload(e.target.files);
    };

    const handleAddSignature = useCallback(() => {
        setShowSignatureModal(true);
    }, []);

    const handleSignatureConfirm = useCallback(() => {
        setShowSignatureModal(false);
        showNotificationMessage("Signature added (simulated)!");
    }, [showNotificationMessage]);

    if (!patient) {
        return (
            <div className="no-patient-found">
                <Navbar />
                <div className="no-patient-content">
                    <h2>Patient not found</h2>
                    <button className="back-button" onClick={() => navigate("/")}>
                        &larr; Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="patient-detail-page" style={{ maxHeight: contentHeight, overflowY: "auto" }}>
            <Navbar />
            {notification && <Notification message={notification} />}
            {confirmDialog.isOpen && (
                <ConfirmationDialog
                    message={confirmDialog.message}
                    onConfirm={() => {
                        confirmDialog.onConfirm();
                        setConfirmDialog({ isOpen: false, message: "", onConfirm: () => { } });
                    }}
                    onCancel={() =>
                        setConfirmDialog({ isOpen: false, message: "", onConfirm: () => { } })
                    }
                />
            )}

            <div className="container">
                <button className="back-button" onClick={() => navigate(-1)}>
                    &larr; Back
                </button>

                <div className="header-section">
                    <h2 className="detail-header">
                        {patient.name}'s Detail Page
                    </h2>
                    <button className="favorite-button" onClick={handleFavoriteToggle} aria-label="Toggle favorite">
                        {isFavorite ? "★" : "☆"}
                    </button>
                </div>

                <div className="patient-info-card">
                    <img
                        src={patient.photo || "https://via.placeholder.com/150"}
                        alt={`${patient.name}'s portrait`}
                        className="patient-photo"
                    />
                    <div className="patient-details">
                        <p><strong>Email:</strong> {patient.email}</p>
                        <p><strong>Date of Birth:</strong> {patient.dob}</p>
                        <p><strong>Phone:</strong> {patient.phone}</p>
                        <p><strong>Address:</strong> {patient.address}</p>
                    </div>
                </div>

                <NotesSection
                    notes={notes}
                    setNotes={setNotes}
                    isEditingNotes={isEditingNotes}
                    setIsEditingNotes={setIsEditingNotes}
                    handleSaveNotes={handleSaveNotes}
                    handleExportNotes={handleExportNotes}
                    handlePrint={handlePrint}
                />

                {!showDiagnosis && (
                    <UploadSection
                        patientId={patient.id}
                        isDraggingOver={isDraggingOver}
                        handleDragEnter={handleDragEnter}
                        handleDragLeave={handleDragLeave}
                        handleDragOver={handleDragOver}
                        handleDrop={handleDrop}
                        handleInputFileChange={handleInputFileChange}
                    />
                )}

                {uploading && (
                    <div className="upload-steps">
                        <h3>Uploading & Processing Steps</h3>
                        <div className="steps-container">
                            <div className={`step ${uploadStep >= 1 ? 'completed' : ''}`}>Step 1: Uploading File</div>
                            <div className={`step ${uploadStep >= 2 ? 'completed' : ''}`}>Step 2: Data Preprocessing</div>
                            <div className={`step ${uploadStep >= 3 ? 'completed' : ''}`}>Step 3: AI Inference</div>
                            <div className={`step ${uploadStep >= 4 ? 'completed' : ''}`}>Step 4: Finalizing</div>
                        </div>
                    </div>
                )}

                {patient.brainFiles.length > 1 && (
                    <div className="brain-files-filter">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search brain files..."
                            value={brainFileFilter}
                            onChange={(e) => setBrainFileFilter(e.target.value)}
                            className="brain-file-search-input"
                        />
                    </div>
                )}

                {showDiagnosis && (
                    <BrainFilesSection
                        filteredBrainFiles={filteredBrainFiles}
                        showReportButton={showReportButton}
                        handleFeedback={handleFeedback}
                        handleGenerateReport={handleGenerateReport}
                    />
                )}

                {showRetrainingButton && (
                    <div className="retraining-section">
                        <button className="primary-button" onClick={() => showNotificationMessage("Retraining simulated!")}>
                            Simulate Retraining
                        </button>
                    </div>
                )}

                <div className="share-section">
                    <button className="share-button" onClick={handleShare} aria-label="Copy share link">
                        <FaShare /> Share Patient
                    </button>
                </div>

                {showDiagnosis && (
                    <DiagnosisSection
                        patient={patient}
                        handleAddSignature={handleAddSignature}
                    />
                )}
            </div>

            {viewingBrainFile && (
                <div className="modal-overlay" onClick={closeBrainImageModal} aria-modal="true" role="dialog">
                    <div
                        className="modal large-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="document"
                    >
                        <button
                            className="close-modal-button"
                            onClick={closeBrainImageModal}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                        <h2>{viewingBrainFile.name}</h2>
                        <div className="large-brain-viewer">
                            <BrainViewer file={viewingBrainFile.url} />
                        </div>
                        <div className="modal-actions">
                            <button onClick={closeBrainImageModal} className="cancel-button">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {showSignatureModal && (
                <div className="modal-overlay" onClick={() => setShowSignatureModal(false)} aria-modal="true">
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Add Signature</h2>
                        <p>Simulate adding a signature.</p>
                        <div className="modal-actions">
                            <button className="primary-button" onClick={handleSignatureConfirm}>Confirm</button>
                            <button className="cancel-button" onClick={() => setShowSignatureModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PatientDetail;
