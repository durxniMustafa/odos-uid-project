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
    AiOutlineEdit,
} from "react-icons/ai";
import { TiUserAddOutline } from "react-icons/ti";

// Multi-step wizard for adding new patients
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
            notes: {
                medicalHistory: "No history yet...",
                currentMedications: "No current medications yet...",
                immunizations: "No immunizations listed...",
                labResults: "No recent lab results yet...",
                lifestyleNotes: "No lifestyle notes...",
                lastVisitHistory: "No past visit history...",
            },
            isFavorite: false,
        };
        onAdd(newPatient);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal multi-step-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Add New Patient</h2>

                {/* Step Content */}
                {step === 1 && (
                    <div className="modal-content">
                        <label>
                            Name:
                            <input
                                type="text"
                                value={basicInfo.name}
                                onChange={(e) =>
                                    setBasicInfo({ ...basicInfo, name: e.target.value })
                                }
                            />
                        </label>
                        <label>
                            Date of Birth:
                            <input
                                type="date"
                                value={basicInfo.dob}
                                onChange={(e) =>
                                    setBasicInfo({ ...basicInfo, dob: e.target.value })
                                }
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
                                onChange={(e) =>
                                    setContactInfo({ ...contactInfo, email: e.target.value })
                                }
                            />
                        </label>
                        <label>
                            Phone:
                            <input
                                type="tel"
                                value={contactInfo.phone}
                                onChange={(e) =>
                                    setContactInfo({ ...contactInfo, phone: e.target.value })
                                }
                            />
                        </label>
                        <label>
                            Address:
                            <textarea
                                value={contactInfo.address}
                                onChange={(e) =>
                                    setContactInfo({ ...contactInfo, address: e.target.value })
                                }
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

                {/* Wizard Actions */}
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

// ---------------- Main Dashboard Component ----------------
function Dashboard() {
    const [patients, setPatients] = useState(() => {
        const saved = localStorage.getItem("patients");
        return saved ? JSON.parse(saved) : [];
    });

    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [showAddWizard, setShowAddWizard] = useState(false);

    const showNotificationMessage = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        localStorage.setItem("patients", JSON.stringify(patients));
    }, [patients]);

    // -------------- RANDOM USER.ME INTEGRATION --------------
    const handleAddRandomPatient = async () => {
        try {
            const response = await fetch("https://randomuser.me/api/");
            const data = await response.json();
            const result = data.results[0];

            const newRandomPatient = {
                id: uuidv4(),
                name: `${result.name.first} ${result.name.last}`,
                dob: result.dob.date.split("T")[0], // e.g. "1980-05-20"
                email: result.email,
                phone: result.phone,
                address: `${result.location.street.name}, ${result.location.city}, ${result.location.country}`,
                photo: result.picture.large || "https://via.placeholder.com/100",
                notes: {
                    medicalHistory: "Auto-generated patient. No prior medical records.",
                    currentMedications: "None reported.",
                    immunizations: "Up-to-date according to random data.",
                    labResults: "No lab results available yet.",
                    lifestyleNotes: "Generated randomly. Possibly active.",
                    lastVisitHistory: "No prior visits in system.",
                },
                isFavorite: false,
            };

            setPatients((prev) => [...prev, newRandomPatient]);
            showNotificationMessage("Random patient added!");
        } catch (error) {
            console.error("Error fetching random user:", error);
            showNotificationMessage("Failed to fetch random user. Please try again.");
        }
    };

    // Filter + Sort
    const filteredPatients = patients
        .filter((p) => {
            const q = searchQuery.toLowerCase();
            return (
                p.name.toLowerCase().includes(q) ||
                p.email.toLowerCase().includes(q) ||
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

    return (
        <div className="dashboard-fullscreen">
            <Navbar />

            {notification && <Notification message={notification} />}

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

                    {/* NEW: "Add Random Patient" button */}
                    <button onClick={handleAddRandomPatient} className="secondary-button">
                        Generate Sample Patient
                    </button>
                </div>

                <div className="patients-list">
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                            <div key={patient.id} className="patient-card">
                                <img
                                    src={patient.photo}
                                    alt={patient.name}
                                    className="patient-photo"
                                />
                                <div className="patient-info">
                                    <p className="patient-name">
                                        <strong>{patient.name}</strong>
                                    </p>
                                    <p className="patient-detail">
                                        <AiOutlineMail className="detail-icon" /> {patient.email}
                                    </p>
                                    <p className="patient-detail">
                                        <AiOutlineCalendar className="detail-icon" /> {patient.dob}
                                    </p>
                                    <p className="patient-detail">
                                        <AiOutlinePhone className="detail-icon" /> {patient.phone}
                                    </p>
                                    <p className="patient-detail">
                                        <AiOutlineEnvironment className="detail-icon" />{" "}
                                        {patient.address}
                                    </p>
                                </div>
                                <div className="patient-actions">
                                    <Link to={`/patient/${patient.id}`} className="details-button">
                                        Details
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No patients found.</p>
                    )}
                </div>
            </div>

            {/* Multi-step wizard for adding a new patient */}
            {showAddWizard && (
                <MultiStepAddPatient
                    onClose={() => setShowAddWizard(false)}
                    onAdd={(newPatient) => {
                        setPatients((prev) => [...prev, newPatient]);
                        showNotificationMessage("Patient added successfully!");
                    }}
                    showNotification={showNotificationMessage}
                />
            )}
        </div>
    );
}

export default Dashboard;
