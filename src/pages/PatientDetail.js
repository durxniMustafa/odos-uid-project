// src/pages/PatientDetail.jsx
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BrainViewer from "./BrainViewer"; // or wherever your BrainViewer is
import ConfirmationDialog from "../components/ConfirmationDialog";
import Notification from "../components/Notification";
import useWindowSize from "../hooks/useWindowSize";
import jsPDF from "jspdf";

// Icons
import { FaShare } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";

// Sections
import UploadSection from "../sections/UploadSection";
import BrainFilesSection from "../sections/BrainFileSection";
import NotesSection from "../sections/NoteSection";  // <-- our new subfield notes
import DiagnosisSection from "../sections/DiagnosisSection";

// Signature Modal
import SignatureModal from "../components/SignatureModal";

import "../styles/PatientDetails.css";

function PatientDetail({ patients, setPatients }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const patient = patients.find((p) => p.id === id);

    const [notification, setNotification] = useState(null);
    const [viewingBrainFile, setViewingBrainFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Instead of a single `notes` string, we store subfields in an object:
    // If patient doesn't have `notes`, or it's empty, let's provide placeholders
    const [notes, setNotes] = useState(() => {
        if (!patient) return {};
        if (patient.notes && typeof patient.notes === "object") {
            return {
                medicalHistory: patient.notes.medicalHistory || "No history yet...",
                currentMedications: patient.notes.currentMedications || "No medications yet...",
                immunizations: patient.notes.immunizations || "No immunizations yet...",
                labResults: patient.notes.labResults || "No lab results yet...",
                lifestyleNotes: patient.notes.lifestyleNotes || "No lifestyle notes yet...",
                lastVisitHistory: patient.notes.lastVisitHistory || "No past visit history...",
            };
        }
        // fallback if patient.notes doesn't exist
        return {
            medicalHistory: "No history yet...",
            currentMedications: "No medications yet...",
            immunizations: "No immunizations yet...",
            labResults: "No lab results yet...",
            lifestyleNotes: "No lifestyle notes yet...",
            lastVisitHistory: "No past visit history...",
        };
    });

    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        message: "",
        onConfirm: () => { },
    });
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isFavorite, setIsFavorite] = useState(patient?.isFavorite || false);
    const [brainFileFilter, setBrainFileFilter] = useState("");

    // SIGNATURE MODAL
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signatureData, setSignatureData] = useState(null);

    // DIAGNOSIS
    const [showDiagnosis, setShowDiagnosis] = useState(false);

    const [uploadStep, setUploadStep] = useState(0);
    const [currentFileId, setCurrentFileId] = useState(null);

    // Retraining / Reporting
    const [showReportButton, setShowReportButton] = useState(false);
    const [showRetrainingButton, setShowRetrainingButton] = useState(false);

    // Extended viewer after upload
    const [isExtendedViewer, setIsExtendedViewer] = useState(false);

    const dragCounter = useRef(0);
    const { width, height } = useWindowSize();

    // Filter brain files
    const filteredBrainFiles = useMemo(() => {
        if (!patient || !patient.brainFiles) return [];
        return patient.brainFiles.filter((file) =>
            file.name.toLowerCase().includes(brainFileFilter.toLowerCase())
        );
    }, [patient, brainFileFilter]);

    const closeBrainImageModal = useCallback((e) => {
        if (e && e.type === "keydown" && e.key !== "Escape") return;
        setViewingBrainFile(null);
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") closeBrainImageModal(e);
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [closeBrainImageModal]);

    const showNotificationMessage = useCallback((message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    }, []);

    // File upload
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

            setPatients((prev) =>
                prev.map((p) =>
                    p.id === id
                        ? {
                            ...p,
                            brainFiles: [{ id: fileId, url: fileURL, name: file.name }],
                            uploadProgress: { [fileId]: 0 },
                        }
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
                showNotificationMessage("File uploaded and processed successfully!");
                setShowDiagnosis(true);
                setShowReportButton(true);
                setIsExtendedViewer(true);
            }
        }, 1500);
    }, [showNotificationMessage]);

    // Save notes (we store subfields back into the patient's record)
    const handleSaveNotes = useCallback(() => {
        setPatients((prev) =>
            prev.map((p) =>
                p.id === id ? { ...p, notes: { ...notes } } : p
            )
        );
        setIsEditingNotes(false);
        showNotificationMessage("Notes updated successfully!");
    }, [id, notes, setPatients, showNotificationMessage]);

    // Favorite toggle
    const handleFavoriteToggle = useCallback(() => {
        setIsFavorite((prev) => !prev);
        setPatients((prev) =>
            prev.map((p) =>
                p.id === id ? { ...p, isFavorite: !isFavorite } : p
            )
        );
        showNotificationMessage(
            isFavorite ? "Removed from favorites." : "Added to favorites!"
        );
    }, [id, isFavorite, setPatients, showNotificationMessage]);

    // Export notes (combine subfields into a single text file)
    const handleExportNotes = useCallback(() => {
        const combined = `
Medical History:
${notes.medicalHistory}

Current Medications:
${notes.currentMedications}

Immunizations:
${notes.immunizations}

Lab Results:
${notes.labResults}

Lifestyle Notes:
${notes.lifestyleNotes}

Last Visit History:
${notes.lastVisitHistory}
`;
        const blob = new Blob([combined], { type: "text/plain;charset=utf-8" });
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

    // Email file
    const handleEmailFile = useCallback(() => {
        if (!patient?.brainFiles || patient.brainFiles.length === 0) {
            showNotificationMessage("No file to send via email.");
            return;
        }
        const fileName = patient.brainFiles[0].name || "brain-model.glb";
        const mailBody = encodeURIComponent(
            `Hello,\n\nI am sharing the brain file "${fileName}".\n\nBest regards,\n[Your Name]`
        );
        const mailLink = `mailto:?subject=Brain File&body=${mailBody}`;
        window.location.href = mailLink;
        showNotificationMessage("Email client opened to send file.");
    }, [patient, showNotificationMessage]);

    // Share
    const handleShare = useCallback(async () => {
        try {
            const shareLink = `https://example.com/patient/${id}`;
            await navigator.clipboard.writeText(shareLink);
            showNotificationMessage("Share link copied to clipboard!");
        } catch {
            showNotificationMessage("Failed to copy share link.");
        }
        handleEmailFile();
    }, [id, handleEmailFile, showNotificationMessage]);

    // Generate a PDF (instead of printing)
    const handleGeneratePDF = useCallback(() => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Patient: ${patient.name}`, 10, 20);
        doc.setFontSize(12);
        doc.text(`Email: ${patient.email}`, 10, 30);
        doc.text(`DOB: ${patient.dob}`, 10, 40);
        doc.text(`Phone: ${patient.phone}`, 10, 50);
        doc.text(`Address: ${patient.address}`, 10, 60);

        doc.text("Notes:", 10, 80);

        // Combine subfields
        const notesText = `
Medical History: ${notes.medicalHistory}
Current Medications: ${notes.currentMedications}
Immunizations: ${notes.immunizations}
Lab Results: ${notes.labResults}
Lifestyle Notes: ${notes.lifestyleNotes}
Last Visit History: ${notes.lastVisitHistory}
`;

        const splittedNotes = doc.splitTextToSize(notesText, 180);
        doc.text(splittedNotes, 10, 90);

        if (signatureData) {
            doc.text("Signature:", 10, 130);
            doc.addImage(signatureData, "PNG", 10, 140, 40, 20);
        }

        doc.save(`${patient.name}-report.pdf`);
        showNotificationMessage("PDF Report generated and downloaded!");
    }, [patient, notes, signatureData, showNotificationMessage]);

    const handleFeedback = useCallback((type) => {
        if (type === "dislike") {
            setShowRetrainingButton(true);
        }
    }, []);

    const handleGenerateReport = useCallback(() => {
        showNotificationMessage("AI Report generated (simulated)!");
    }, [showNotificationMessage]);

    // Drag & Drop
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
        if (dragCounter.current === 0) setIsDraggingOver(false);
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
        if (e.dataTransfer.files?.length) {
            handleFileUpload(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleInputFileChange = useCallback(
        (e) => {
            handleFileUpload(e.target.files);
        },
        [handleFileUpload]
    );

    // Signature
    const handleAddSignature = useCallback(() => {
        setShowSignatureModal(true);
    }, []);

    const handleSignatureConfirm = useCallback(
        (signatureDataURL) => {
            setShowSignatureModal(false);
            if (signatureDataURL) {
                setSignatureData(signatureDataURL);
                showNotificationMessage("Signature saved!");
            } else {
                showNotificationMessage("Signature canceled.");
            }
        },
        [showNotificationMessage]
    );

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
        <div className="patient-detail-page">
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
                        {patient.name}&apos;s Detail Page
                    </h2>
                    <button
                        className="favorite-button"
                        onClick={handleFavoriteToggle}
                        aria-label="Toggle favorite"
                    >
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

                        {signatureData && (
                            <div className="signature-preview">
                                <strong>Signature:</strong>
                                <div className="signature-wrapper">
                                    <img src={signatureData} alt="Patient Signature" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Our new subfields notes section */}
                <NotesSection
                    notes={notes}
                    setNotes={setNotes}
                    isEditingNotes={isEditingNotes}
                    setIsEditingNotes={setIsEditingNotes}
                    handleSaveNotes={handleSaveNotes}
                    handleExportNotes={handleExportNotes}
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
                        <h3>Uploading &amp; Processing Steps</h3>
                        <div className="steps-container">
                            <div className={`step ${uploadStep >= 1 ? "completed" : ""}`}>
                                Step 1: Uploading File
                            </div>
                            <div className={`step ${uploadStep >= 2 ? "completed" : ""}`}>
                                Step 2: Data Preprocessing
                            </div>
                            <div className={`step ${uploadStep >= 3 ? "completed" : ""}`}>
                                Step 3: AI Inference
                            </div>
                            <div className={`step ${uploadStep >= 4 ? "completed" : ""}`}>
                                Step 4: Finalizing
                            </div>
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
                        <button
                            className="primary-button"
                            onClick={() => showNotificationMessage("Retraining simulated!")}
                        >
                            Simulate Retraining
                        </button>
                    </div>
                )}

                <div className="share-section">
                    <button
                        className="share-button"
                        onClick={handleShare}
                        aria-label="Copy share link"
                    >
                        <FaShare /> Share Patient
                    </button>
                    <button className="primary-button" onClick={handleGeneratePDF}>
                        Generate PDF
                    </button>
                </div>

                {showDiagnosis && (
                    <DiagnosisSection
                        patient={patient}
                        handleAddSignature={handleAddSignature}
                    />
                )}
            </div>

            {/* Brain file viewer modal (if user clicks to view a .glb) */}
            {viewingBrainFile && (
                <div
                    className="modal-overlay"
                    onClick={closeBrainImageModal}
                    aria-modal="true"
                    role="dialog"
                >
                    <div
                        className={`modal large-modal ${isExtendedViewer ? "viewer-extended" : ""}`}
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
                            <button onClick={closeBrainImageModal} className="cancel-button">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Signature Modal */}
            {showSignatureModal && (
                <SignatureModal
                    onClose={() => setShowSignatureModal(false)}
                    onConfirm={handleSignatureConfirm}
                />
            )}
        </div>
    );
}

export default PatientDetail;
