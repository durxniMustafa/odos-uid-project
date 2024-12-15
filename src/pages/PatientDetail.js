import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import BrainViewer from "./BrainViewer";
import Navbar from "../components/Navbar";
import {
    FaUpload,
    FaShareAlt,
    FaEdit,
    FaTrash,
    FaTimes,
    FaDownload,
    FaExpand,
    FaStar,
    FaRegStar,
    FaPrint,
    FaFileExport,
    FaSearch
} from "react-icons/fa";
import "../styles/PatientDetails.css";
import ConfirmationDialog from "../components/ConfirmationDialog";
import Notification from "../components/Notification";

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

    const dragCounter = useRef(0);

    // New states for diagnosis and signature
    const [showDiagnosis, setShowDiagnosis] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);

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

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    const handleFileUpload = (files) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        const validMimeTypes = ["model/gltf-binary", "application/octet-stream"];
        const isValidMimeType = validMimeTypes.includes(file.type);
        const isValidExtension = file.name.toLowerCase().endsWith(".glb");

        if (!isValidMimeType && !isValidExtension) {
            showNotification(`"${file.name}" is not a valid .glb file.`);
            return;
        }

        setUploading(true);

        const fileURL = URL.createObjectURL(file);
        const fileId = uuidv4();

        // Reupload logic: remove old files
        setPatients((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    const updatedBrainFiles = [];
                    const updatedUploadProgress = {};
                    return { ...p, brainFiles: updatedBrainFiles, uploadProgress: updatedUploadProgress };
                }
                return p;
            })
        );

        // Add new file
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

        let progress = 0;
        const interval = setInterval(() => {
            if (progress < 100) {
                progress += 20;
                setPatients((prev) =>
                    prev.map((p) =>
                        p.id === id
                            ? { ...p, uploadProgress: { [fileId]: progress } }
                            : p
                    )
                );
            } else {
                clearInterval(interval);
                showNotification(`File "${file.name}" uploaded successfully!`);
                setUploading(false);
                // After AI completes for the new file, show new diagnosis
                setShowDiagnosis(true);
            }
        }, 200);
    };

    const handleRemoveBrainFile = (fileId) => {
        setConfirmDialog({
            isOpen: true,
            message: "Are you sure you want to remove this brain file?",
            onConfirm: () => {
                setPatients((prev) =>
                    prev.map((p) => {
                        if (p.id === id) {
                            const updatedBrainFiles = p.brainFiles.filter((file) => file.id !== fileId);
                            const removedFile = p.brainFiles.find((file) => file.id === fileId);
                            if (removedFile) {
                                URL.revokeObjectURL(removedFile.url);
                            }
                            const updatedUploadProgress = { ...p.uploadProgress };
                            delete updatedUploadProgress[fileId];
                            return { ...p, brainFiles: updatedBrainFiles, uploadProgress: updatedUploadProgress };
                        }
                        return p;
                    })
                );
                showDiagnosis(false); // No files now, so no diagnosis
                showNotification("Brain file removed successfully!");
            },
        });
    };

    const handleViewBrainImage = (brainFile) => {
        setViewingBrainFile(brainFile);
    };

    const handleEditNotes = () => {
        setIsEditingNotes(true);
    };

    const handleSaveNotes = () => {
        setPatients((prev) =>
            prev.map((p) =>
                p.id === id ? { ...p, notes: notes } : p
            )
        );
        setIsEditingNotes(false);
        showNotification("Notes updated successfully!");
    };

    const handleShare = async () => {
        const shareLink = `https://example.com/patient/${id}`;
        try {
            await navigator.clipboard.writeText(shareLink);
            showNotification("Share link copied to clipboard!");
        } catch {
            showNotification("Failed to copy share link.");
        }
    };

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

    const handleFavoriteToggle = () => {
        setIsFavorite((prev) => !prev);
        setPatients((prev) =>
            prev.map((p) =>
                p.id === id ? { ...p, isFavorite: !isFavorite } : p
            )
        );
        showNotification(isFavorite ? "Removed from favorites." : "Added to favorites!");
    };

    const handleExportNotes = () => {
        const blob = new Blob([notes || ""], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${patient.name}-notes.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification("Notes exported successfully!");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleAddSignature = () => {
        setShowSignatureModal(true);
    };

    const handleSignatureConfirm = () => {
        setShowSignatureModal(false);
        showNotification("Signature added (simulated)!");
    };

    const filteredBrainFiles = patient.brainFiles.filter((file) =>
        file.name.toLowerCase().includes(brainFileFilter.toLowerCase())
    );

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
                        {patient.name}'s Detail Page
                    </h2>
                    <button className="favorite-button" onClick={handleFavoriteToggle} aria-label="Toggle favorite">
                        {isFavorite ? <FaStar /> : <FaRegStar />}
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

                <div className="notes-card">
                    <div className="notes-header">
                        <h3>Notes</h3>
                        <div className="notes-actions-bar">
                            {!isEditingNotes && (
                                <>
                                    <button className="edit-notes-button" onClick={handleEditNotes}><FaEdit /> Edit</button>
                                    <button className="export-notes-button" onClick={handleExportNotes} title="Export Notes"><FaFileExport /> Export</button>
                                    <button className="print-button" onClick={handlePrint} title="Print Page"><FaPrint /> Print</button>
                                </>
                            )}
                        </div>
                    </div>
                    {isEditingNotes ? (
                        <div className="edit-notes">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Enter notes here..."
                                aria-label="Patient notes input"
                            ></textarea>
                            <div className="notes-actions">
                                <button className="save-button" onClick={handleSaveNotes}>Save</button>
                                <button className="cancel-button" onClick={() => setIsEditingNotes(false)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className="view-notes">
                            <p>{notes || "No notes added yet."}</p>
                        </div>
                    )}
                </div>

                <div
                    className={`file-upload-section ${isDraggingOver ? "drag-over" : ""}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <label className="file-upload-label" htmlFor={`upload-${patient.id}`}>
                        Drag & Drop or Click to Upload a Brain File:
                    </label>
                    <input
                        type="file"
                        id={`upload-${patient.id}`}
                        accept=".glb"
                        onChange={handleInputFileChange}
                        className="file-upload-input"
                    />
                    <label htmlFor={`upload-${patient.id}`} className="upload-button">
                        <FaUpload className="file-upload-icon" /> Choose File
                    </label>
                    {isDraggingOver && <div className="drag-overlay">Drop file here</div>}
                </div>

                {uploading && (
                    <div className="ai-magic-progress">
                        <div className="ai-magic-content">
                            <div className="ai-spinner"></div>
                            <p>AI Magic Happens Here...</p>
                            <div className="progress-bar-container">
                                {/* For demonstration, let's say partial progress */}
                                <div className="progress-bar" style={{ width: "50%" }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {patient.brainFiles.length > 1 && (
                    <div className="brain-files-filter">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search brain files..."
                            value={brainFileFilter}
                            onChange={(e) => setBrainFileFilter(e.target.value)}
                            className="brain-file-search-input"
                        />
                    </div>
                )}

                <div className="brain-viewer-section">
                    {filteredBrainFiles.length > 0 ? (
                        filteredBrainFiles.map((brainFile) => (
                            <div key={brainFile.id} className="brain-viewer-wrapper">
                                <div className="brain-viewer-container">
                                    <BrainViewer file={brainFile.url} />
                                </div>
                                <div className="brain-file-info">
                                    <p className="brain-file-name">{brainFile.name}</p>
                                    <div className="brain-file-actions">
                                        <button className="view-brain-file-button" onClick={() => handleViewBrainImage(brainFile)}><FaExpand /> View</button>
                                        <a className="download-brain-file-button" href={brainFile.url} download={brainFile.name}><FaDownload /> Download</a>
                                        <button className="remove-brain-file-button" onClick={() => handleRemoveBrainFile(brainFile.id)}><FaTrash /> Remove</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-upload-message">No brain image uploaded or no files match your search.</p>
                    )}
                </div>

                <div className="share-section">
                    <button className="share-button" onClick={handleShare} aria-label="Copy share link">
                        <FaShareAlt /> Share Patient
                    </button>
                </div>

                {/* After upload and AI done, show diagnosis */}
                {showDiagnosis && (
                    <>
                        <div className="stages-section">
                            <h3 className="section-title">Processing Stages</h3>
                            <div className="stages-container">
                                <div className="stage-item completed">Stage 1</div>
                                <div className="stage-item completed">Stage 2</div>
                                <div className="stage-item completed">Stage 3</div>
                                <div className="stage-item completed">Stage 4</div>
                                <div className="stage-item current">Stage 5</div>
                            </div>
                            <button className="primary-button" style={{ marginTop: '20px' }}>View Report</button>
                        </div>

                        <div className="mri-session-details">
                            <div className="mri-data">
                                <h4>MRI Data Details</h4>
                                <p><strong>Modality:</strong> DTI</p>
                                <p><strong>Resolution:</strong> 1x1x1 mm</p>
                                <p><strong>Orientation:</strong> Axial</p>
                                <p><strong>Acquisition Time:</strong> 15 minutes</p>
                                <p><strong>Patient Name:</strong> {patient.name}</p>
                                <p><strong>Patient ID:</strong> {patient.id}</p>
                                <p><strong>Scan Date:</strong> 2024-11-25</p>
                            </div>
                            <div className="session-metadata">
                                <h4>Session Metadata</h4>
                                <p><strong>Session ID:</strong> MRI20241125001</p>
                                <p><strong>Date and Time:</strong> 2024-11-25 10:45 AM</p>
                                <p><strong>MRI Device:</strong></p>
                                <ul>
                                    <li>Manufacturer: Siemens</li>
                                    <li>Model: Magnetom Prisma</li>
                                    <li>Field Strength: 3T</li>
                                </ul>
                                <p><strong>Technician:</strong> Dr. Emily Carter</p>
                            </div>
                        </div>

                        <div className="results-row">
                            <div className="results-column">
                                <h4>Imaging Results</h4>
                                <p><strong>Description:</strong> Heterogeneously enhanced mass with irregular borders.</p>
                                <p><strong>Scan Type:</strong> DTI with contrast.</p>
                                <p><strong>Prognosis:</strong> Poor (12-15 months survival est.)</p>
                            </div>
                            <div className="results-column">
                                <h4>Clinical Notes</h4>
                                <p><strong>Symptoms:</strong> Headaches, nausea, mild memory loss.</p>
                                <p><strong>Action:</strong> Surgical resection + radiation & chemotherapy.</p>
                            </div>
                        </div>

                        <div className="results-row">
                            <div className="results-column">
                                <h4>Diagnosis Details</h4>
                                <p><strong>Condition:</strong> Glioblastoma Multiforme (GBM)</p>
                                <p><strong>Grade:</strong> IV (High-grade)</p>
                                <p><strong>Location:</strong> Left Temporal Lobe</p>
                                <p><strong>Size:</strong> 3.5 cm</p>
                            </div>
                        </div>

                        <div className="signature-section">
                            <button className="primary-button" onClick={handleAddSignature}>
                                Add Signature
                            </button>
                        </div>
                    </>
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
                            <FaTimes />
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
