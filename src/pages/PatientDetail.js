import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BrainViewer from "./BrainViewer"; // adjust path as needed
import ConfirmationDialog from "../components/ConfirmationDialog";
import Notification from "../components/Notification";
import jsPDF from "jspdf";

// Icons
import { FaShare } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { AiFillBilibili } from "react-icons/ai";

// Sections
import UploadSection from "../sections/UploadSection";
import BrainFilesSection from "../sections/BrainFileSection";
import NotesSection from "../sections/NoteSection";
import DiagnosisSection from "../sections/DiagnosisSection";

// Signature Modal
import SignatureModal from "../components/SignatureModal";

import "../styles/PatientDetails.css";

function PatientDetail({ patients, setPatients }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1) Find the patient by id.
  const patient = patients.find((p) => p.id === id);

  // 2) Declare hooks unconditionally:
  const [notification, setNotification] = useState(null);
  const [viewingBrainFile, setViewingBrainFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentFileId, setCurrentFileId] = useState(null);

  const [notes, setNotes] = useState(() => {
    if (!patient) return {};
    if (patient.notes && typeof patient.notes === "object") {
      return {
        medicalHistory: patient.notes.medicalHistory || "No history yet...",
        currentMedications:
          patient.notes.currentMedications || "No medications yet...",
        immunizations: patient.notes.immunizations || "No immunizations yet...",
        labResults: patient.notes.labResults || "No lab results yet...",
        lifestyleNotes: patient.notes.lifestyleNotes || "No lifestyle notes yet...",
        lastVisitHistory:
          patient.notes.lastVisitHistory || "No past visit history...",
      };
    }
    return {
      medicalHistory: "No history yet...",
      currentMedications: "No medications yet...",
      immunizations: "No immunizations yet...",
      labResults: "No lab results yet...",
      lifestyleNotes: "No lifestyle notes...",
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
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [showReportButton, setShowReportButton] = useState(false);
  const [showRetrainingButton, setShowRetrainingButton] = useState(false);
  const [isExtendedViewer, setIsExtendedViewer] = useState(false);
  const dragCounter = useRef(0);
  const [showAiExplanation, setShowAiExplanation] = useState(false);

  // Toggle AI explanation popup
  const handleToggleAiExplanation = useCallback(() => {
    setShowAiExplanation((prev) => !prev);
  }, []);

  // Close Brain Image Modal (with keyboard support)
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

  // Notification helper with ARIA-friendly timeout
  const showNotificationMessage = useCallback((message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // =========================
  // FILE UPLOAD SIMULATION
  // =========================
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
    [id, setPatients, showNotificationMessage, startUploadSimulation]
  );

  // ====================
  // SAVING NOTES
  // ====================
  const handleSaveNotes = useCallback(() => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, notes: { ...notes } } : p))
    );
    setIsEditingNotes(false);
    showNotificationMessage("Notes updated successfully!");
  }, [id, notes, setPatients, showNotificationMessage]);

  // ====================
  // TOGGLE FAVORITE
  // ====================
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

  // ========================
  // EXPORT NOTES (TXT)
  // ========================
  const handleExportNotes = useCallback(() => {
    if (!patient) return;
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

  // ==================
  // EMAIL FILE
  // ==================
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

  // ====================
  // SHARE FUNCTION
  // ====================
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

  // =======================
  // GENERATE PDF (jsPDF)
  // =======================
  const handleGeneratePDF = useCallback(() => {
    if (!patient) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Patient: ${patient.name}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`Email: ${patient.email}`, 10, 30);
    doc.text(`DOB: ${patient.dob}`, 10, 40);
    doc.text(`Phone: ${patient.phone}`, 10, 50);
    doc.text(`Address: ${patient.address}`, 10, 60);

    doc.text("Notes:", 10, 80);

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

  // ===================
  // FEEDBACK BUTTON
  // ===================
  const handleFeedback = useCallback((type) => {
    if (type === "dislike") {
      setShowRetrainingButton(true);
    }
  }, []);

  // ===================
  // REPORT BUTTON
  // ===================
  const handleGenerateReport = useCallback(() => {
    showNotificationMessage("AI Report generated (simulated)!");
  }, [showNotificationMessage]);

  // =========================
  // DRAG & DROP HANDLERS
  // =========================
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

  // ======================
  // SIGNATURE MODAL HANDLERS
  // ======================
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

  // ======================
  // FILTER BRAIN FILES
  // ======================
  const filteredBrainFiles = useMemo(() => {
    if (!patient || !patient.brainFiles) return [];
    return patient.brainFiles.filter((file) =>
      file.name.toLowerCase().includes(brainFileFilter.toLowerCase())
    );
  }, [patient, brainFileFilter]);

  // 3) Early return if patient is not found.
  if (!patient) {
    return (
      <div className="no-patient-found" role="alert">
        <Navbar />
        <div className="no-patient-content">
          <h2>Patient not found</h2>
          <button
            className="back-button"
            onClick={() => navigate("/")}
            aria-label="Back to Dashboard"
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==================
  // MAIN RETURN
  // ==================
  return (
    <div className="patient-detail-page">
      <Navbar />

      {/* Notification and Confirmation Dialog */}
      {notification && <Notification message={notification} role="status" />}
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
        <button
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
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

        {/* Notes Section */}
        <NotesSection
          notes={notes}
          setNotes={setNotes}
          isEditingNotes={isEditingNotes}
          setIsEditingNotes={setIsEditingNotes}
          handleSaveNotes={handleSaveNotes}
          handleExportNotes={handleExportNotes}
        />

        {/* Upload Section is hidden when final diagnosis is shown */}
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

        {/* Display upload progress steps when uploading */}
        {uploading && (
          <div className="upload-steps" aria-live="polite">
            <h3>Uploading & Processing Steps</h3>
            <div className="steps-container">
              <div className={`step ${uploadStep >= 1 ? "completed" : ""}`}>
                Step 1: Uploading File
              </div>
              <div className={`step ${uploadStep >= 2 ? "completed" : ""}`}>
                Step 2: Data Preprocessing
              </div>
              <div className={`step ${uploadStep >= 3 ? "completed" : ""}`}>
                Step 3: AI Inference
                <span
                  onClick={handleToggleAiExplanation}
                  style={{ cursor: "pointer", marginLeft: "8px" }}
                  title="How does the AI work?"
                  tabIndex={0}
                  role="button"
                  aria-label="Explain AI process"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleToggleAiExplanation();
                  }}
                >
                  <AiFillBilibili size={18} />
                </span>
                {showAiExplanation && (
                  <div className="ai-explanation-container">
                    <p>
                      <strong>How does the AI work?</strong>
                      <br />
                      Our AI model analyzes 3D MRI scans to detect patterns that
                      may indicate tumors or lesions. It compares your MRI against a large set
                      of annotated scans to flag potential abnormalities for further
                      review by medical experts.
                    </p>
                  </div>
                )}
              </div>
              <div className={`step ${uploadStep >= 4 ? "completed" : ""}`}>
                Step 4: Finalizing
              </div>
            </div>
          </div>
        )}

        {/* Brain Files Filter */}
        {patient.brainFiles.length > 1 && (
          <div className="brain-files-filter">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search brain files..."
              value={brainFileFilter}
              onChange={(e) => setBrainFileFilter(e.target.value)}
              className="brain-file-search-input"
              aria-label="Search brain files"
            />
          </div>
        )}

        {/* Render Brain Files Section once diagnosis is available */}
        {showDiagnosis && (
          <BrainFilesSection
            filteredBrainFiles={filteredBrainFiles}
            showReportButton={showReportButton}
            handleFeedback={handleFeedback}
            handleGenerateReport={handleGenerateReport}
          />
        )}

        {/* If user disliked the result, show retraining simulation */}
        {showRetrainingButton && (
          <div className="retraining-section">
            <button
              className="primary-button"
              onClick={() =>
                showNotificationMessage("Retraining simulated!")
              }
              aria-label="Simulate retraining"
            >
              Simulate Retraining
            </button>
          </div>
        )}

        {/* Sharing and PDF generation */}
        <div className="share-section">
          <button
            className="share-button"
            onClick={handleShare}
            aria-label="Share patient"
          >
            <FaShare /> Share Patient
          </button>
          <button
            className="primary-button"
            onClick={handleGeneratePDF}
            aria-label="Generate PDF report"
          >
            Generate PDF
          </button>
        </div>

        {/* Diagnosis Section */}
        {showDiagnosis && (
          <DiagnosisSection
            patient={patient}
            handleAddSignature={handleAddSignature}
          />
        )}
      </div>

      {/* BrainViewer Modal */}
      {viewingBrainFile && (
        <div
          className="modal-overlay"
          onClick={closeBrainImageModal}
          aria-modal="true"
          role="dialog"
          aria-labelledby="brain-modal-title"
        >
          <div
            className={`modal large-modal ${isExtendedViewer ? "viewer-extended" : ""}`}
            onClick={(e) => e.stopPropagation()}
            role="document"
            tabIndex={-1}
          >
            <button
              className="close-modal-button"
              onClick={closeBrainImageModal}
              aria-label="Close modal"
            >
              &times;
            </button>
            <h2 id="brain-modal-title">{viewingBrainFile.name}</h2>
            <div className="large-brain-viewer">
              <BrainViewer file={viewingBrainFile.url} />
            </div>
            <div className="modal-actions">
              <button
                onClick={closeBrainImageModal}
                className="cancel-button"
                aria-label="Close viewer"
              >
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
