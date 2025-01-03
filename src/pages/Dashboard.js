import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";
import Notification from "../components/Notification";
import useWindowSize from "../hooks/useWindowSize";

// Icons
import {
    AiOutlineSearch,
    AiOutlineLineChart,
    AiOutlineFilter,
    AiOutlineMail,
    AiOutlinePhone,
    AiOutlineEnvironment,
    AiOutlineCalendar,
} from "react-icons/ai";
import { TiUserAddOutline } from "react-icons/ti";
import jsPDF from "jspdf";

// Multi-step wizard imports
// (You can keep these in the same file or separate, for brevity we keep them here)
function MultiStepAddPatient({ onClose, onAdd, showNotification }) {
    const [step, setStep] = useState(1);
    const [basicInfo, setBasicInfo] = useState({ name: "", dob: "" });
    const [contactInfo, setContactInfo] = useState({
        email: "",
        phone: "",
        address: "",
    });

    const nextStep = () => {
        if (step === 1) {
            if (!basicInfo.name || !basicInfo.dob) {
                showNotification("Please fill in name and DOB.");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!contactInfo.email || !contactInfo.phone || !contactInfo.address) {
                showNotification("Please fill in contact info.");
                return;
            }
            setStep(3);
        } else if (step === 3) {
            handleSubmit();
        }
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = () => {
        const newPatient = {
            id: uuidv4(),
            name: basicInfo.name,
            dob: basicInfo.dob,
            email: contactInfo.email,
            phone: contactInfo.phone,
            address: contactInfo.address,
            photo: "https://via.placeholder.com/100",
            brainFiles: [],
            uploadProgress: {},
            notes: "",
            isFavorite: false,
        };
        onAdd(newPatient);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal multi-step-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Add New Patient</h2>

                {step === 1 && (
                    <div className="modal-content">
                        <label>
                            Name:
                            <input
                                type="text"
                                value={basicInfo.name}
                                onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                            />
                        </label>
                        <label>
                            Date of Birth:
                            <input
                                type="date"
                                value={basicInfo.dob}
                                onChange={(e) => setBasicInfo({ ...basicInfo, dob: e.target.value })}
                            />
                        </label>
                    </div>
                )}

                {step === 2 && (
                    <div className="modal-content">
                        <label>
                            Email:
                            <input
                                type="email"
                                value={contactInfo.email}
                                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                            />
                        </label>
                        <label>
                            Phone:
                            <input
                                type="tel"
                                value={contactInfo.phone}
                                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                            />
                        </label>
                        <label>
                            Address:
                            <textarea
                                value={contactInfo.address}
                                onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                            />
                        </label>
                    </div>
                )}

                {step === 3 && (
                    <div className="modal-content">
                        <p>Please confirm all information:</p>
                        <p>
                            <strong>Name:</strong> {basicInfo.name}
                        </p>
                        <p>
                            <strong>Date of Birth:</strong> {basicInfo.dob}
                        </p>
                        <p>
                            <strong>Email:</strong> {contactInfo.email}
                        </p>
                        <p>
                            <strong>Phone:</strong> {contactInfo.phone}
                        </p>
                        <p>
                            <strong>Address:</strong> {contactInfo.address}
                        </p>
                    </div>
                )}

                <div className="modal-actions">
                    {step > 1 && (
                        <button onClick={prevStep} className="secondary-button">
                            Back
                        </button>
                    )}
                    {step < 3 && (
                        <button onClick={nextStep} className="primary-button">
                            Next
                        </button>
                    )}
                    {step === 3 && (
                        <button onClick={handleSubmit} className="primary-button">
                            Confirm
                        </button>
                    )}
                    <button onClick={onClose} className="secondary-button">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function PilotBanner({ onDismiss }) {
    return (
        <div className="pilot-banner">
            <p>
                <strong>Try our free pilot program!</strong> Experience AI-assisted MRI analysis,
                detect anomalies earlier, and improve patient outcomes.
            </p>
            <button onClick={onDismiss} className="dismiss-button">
                Dismiss
            </button>
        </div>
    );
}

function Dashboard() {
    const [patients, setPatients] = useState(() => {
        const saved = localStorage.getItem("patients");
        return saved
            ? JSON.parse(saved)
            : [
                {
                    id: uuidv4(),
                    name: "Mustafa Durani",
                    email: "M.Durani@outlook.de",
                    dob: "2020-12-10",
                    phone: "+91 9788399999",
                    address: "Kisan Vihar Ext, Nr Daharkar Wadi, Pakhadi Rd, Kandivli, Alwar",
                    photo: "https://via.placeholder.com/100",
                    brainFiles: [],
                    uploadProgress: {},
                    notes: "",
                    isFavorite: false,
                },
            ];
    });

    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name");

    // Show multi-step wizard?
    const [showAddWizard, setShowAddWizard] = useState(false);

    const [focusMode, setFocusMode] = useState(false);
    const [showPilotBanner, setShowPilotBanner] = useState(() => {
        return localStorage.getItem("dismissedPilotBanner") !== "true";
    });

    const { width, height } = useWindowSize();

    const showNotificationMessage = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        localStorage.setItem("patients", JSON.stringify(patients));
    }, [patients]);

    // Filter + Sort
    const filteredPatients = patients
        .filter((p) => {
            const q = searchQuery.toLowerCase();
            return (
                p.name.toLowerCase().includes(q) ||
                p.email.toLowerCase().includes(q) ||
                p.dob.toLowerCase().includes(q) ||
                p.phone.toLowerCase().includes(q) ||
                p.address.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            if (sortBy === "name") {
                return a.name.localeCompare(b.name);
            } else if (sortBy === "dob") {
                return new Date(a.dob) - new Date(b.dob);
            }
            return 0;
        });

    // (A) Handler for adding a new patient
    const handleAddPatient = (newPatient) => {
        setPatients((prev) => [...prev, newPatient]);
        showNotificationMessage("Patient added via wizard!");
    };

    // (B) Generate insights
    const generateInsights = () => {
        showNotificationMessage("Patient insights generated (simulated)!");
    };

    // Dismiss pilot
    const dismissPilot = () => {
        setShowPilotBanner(false);
        localStorage.setItem("dismissedPilotBanner", "true");
    };

    // (C) Inline editing logic
    const [editingPatientId, setEditingPatientId] = useState(null);
    const [editingField, setEditingField] = useState("");
    const [tempValue, setTempValue] = useState("");

    const startInlineEdit = (patientId, fieldName, currentValue) => {
        setEditingPatientId(patientId);
        setEditingField(fieldName);
        setTempValue(currentValue);
    };

    const finishInlineEdit = () => {
        if (editingPatientId && editingField) {
            setPatients((prev) =>
                prev.map((p) =>
                    p.id === editingPatientId ? { ...p, [editingField]: tempValue } : p
                )
            );
            showNotificationMessage(`Updated ${editingField}!`);
        }
        setEditingPatientId(null);
        setEditingField("");
        setTempValue("");
    };

    // (D) Delete functionality
    const handleDeletePatient = (patientId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this patient?");
        if (confirmDelete) {
            setPatients((prev) => prev.filter((p) => p.id !== patientId));
            showNotificationMessage("Patient deleted!");
        }
    };

    return (
        <div className="dashboard-fullscreen">
            <Navbar />

            {notification && <Notification message={notification} />}
            {showPilotBanner && <PilotBanner onDismiss={dismissPilot} />}

            <div className="dashboard-content">
                <div className="top-bar">
                    <div className="search-bar-wrapper">
                        <AiOutlineSearch className="icon" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="dob">Sort by Date of Birth</option>
                    </select>

                    <button onClick={() => setShowAddWizard(true)} className="primary-button">
                        <TiUserAddOutline /> Add Patient
                    </button>
                    <button onClick={generateInsights} className="secondary-button">
                        <AiOutlineLineChart /> Generate Insights
                    </button>
                    <button
                        onClick={() => setFocusMode((prev) => !prev)}
                        className="secondary-button"
                    >
                        <AiOutlineFilter /> {focusMode ? "Exit Focus" : "Focus Mode"}
                    </button>
                    <Link to="/metrics" className="secondary-button">
                        View Metrics
                    </Link>
                </div>

                <div className="patients-list">
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                            <div key={patient.id} className="patient-card">
                                <img
                                    src={patient.photo || "https://via.placeholder.com/100"}
                                    alt={patient.name}
                                    className="patient-photo"
                                />
                                {!focusMode && (
                                    <div className="patient-info">
                                        {/* Inline editable name */}
                                        {editingPatientId === patient.id && editingField === "name" ? (
                                            <input
                                                style={{ fontSize: "16px", fontWeight: "600" }}
                                                value={tempValue}
                                                onChange={(e) => setTempValue(e.target.value)}
                                                onBlur={finishInlineEdit}
                                                autoFocus
                                            />
                                        ) : (
                                            <p
                                                className="patient-name"
                                                onDoubleClick={() => startInlineEdit(patient.id, "name", patient.name)}
                                                title="Double-click to edit name"
                                            >
                                                <strong>{patient.name}</strong>
                                            </p>
                                        )}

                                        <p className="patient-detail">
                                            <AiOutlineMail className="detail-icon" /> {patient.email}
                                        </p>
                                        <p className="patient-detail">
                                            <AiOutlineCalendar className="detail-icon" /> {patient.dob}
                                        </p>

                                        {/* Inline editable phone */}
                                        {editingPatientId === patient.id && editingField === "phone" ? (
                                            <input
                                                style={{ fontSize: "14px" }}
                                                value={tempValue}
                                                onChange={(e) => setTempValue(e.target.value)}
                                                onBlur={finishInlineEdit}
                                                autoFocus
                                            />
                                        ) : (
                                            <p
                                                className="patient-detail"
                                                onDoubleClick={() => startInlineEdit(patient.id, "phone", patient.phone)}
                                                title="Double-click to edit phone"
                                            >
                                                <AiOutlinePhone className="detail-icon" /> {patient.phone}
                                            </p>
                                        )}

                                        <p className="patient-detail">
                                            <AiOutlineEnvironment className="detail-icon" /> {patient.address}
                                        </p>
                                    </div>
                                )}
                                {focusMode && (
                                    <div className="patient-info">
                                        <p className="patient-name">
                                            <strong>{patient.name}</strong>
                                        </p>
                                    </div>
                                )}

                                {/* (D) Delete button */}
                                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                    <Link to={`/patient/${patient.id}`} className="details-button">
                                        Details
                                    </Link>
                                    <button
                                        className="secondary-button"
                                        style={{ color: "#fff", background: "#e53935" }}
                                        onClick={() => handleDeletePatient(patient.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No patients found.</p>
                    )}
                </div>
            </div>

            {showAddWizard && (
                <MultiStepAddPatient
                    onClose={() => setShowAddWizard(false)}
                    onAdd={handleAddPatient}
                    showNotification={showNotificationMessage}
                />
            )}
        </div>
    );
}

export default Dashboard;
