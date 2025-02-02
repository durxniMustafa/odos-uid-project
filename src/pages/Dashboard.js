import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";
import Notification from "../components/Notification";
import dayjs from "dayjs";
import {
    AiOutlineSearch,
    AiOutlineMail,
    AiOutlinePhone,
    AiFillStar,
    AiOutlineStar,
} from "react-icons/ai";
import { TiUserAddOutline } from "react-icons/ti";

// -----------------------------------------------------------------------------
// Default profile pictures to choose from
// -----------------------------------------------------------------------------
const defaultProfilePictures = [
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZfCKBi-3GZULvA9eCg89H4zmP4QT-ENoKNCeWyEigWhPqj80xuYKvys1W7d6CRbZjKgG4L25wl1iuLEyZZjoEDQ",
    "https://randomuser.me/api/portraits/women/1.jpg",
    "https://randomuser.me/api/portraits/men/2.jpg",
    "https://randomuser.me/api/portraits/women/2.jpg",
    "https://randomuser.me/api/portraits/men/3.jpg",
    "https://randomuser.me/api/portraits/women/3.jpg",
];

// -----------------------------------------------------------------------------
// Multi-step wizard for adding new patients with accessibility improvements
// -----------------------------------------------------------------------------
function MultiStepAddPatient({ onClose, onAdd, showNotification }) {
    const [step, setStep] = useState(1);
    const [basicInfo, setBasicInfo] = useState({ name: "", dob: "" });
    const [contactInfo, setContactInfo] = useState({
        email: "",
        phone: "",
        address: "",
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const nextStep = () => {
        if (step === 1) {
            if (!basicInfo.name || !basicInfo.dob) {
                showNotification("Please fill in name and Date of Birth.");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!contactInfo.email || !contactInfo.phone || !contactInfo.address) {
                showNotification("Please fill in all contact information.");
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
        const riskLevelArray = ["low", "medium", "high"];
        const randomRisk =
            riskLevelArray[Math.floor(Math.random() * riskLevelArray.length)];

        const newPatient = {
            id: uuidv4(),
            name: basicInfo.name,
            dob: dayjs(basicInfo.dob).format("YYYY-MM-DD"),
            email: contactInfo.email,
            phone: contactInfo.phone,
            address: contactInfo.address,
            // Use a random default profile picture
            photo:
                defaultProfilePictures[
                Math.floor(Math.random() * defaultProfilePictures.length)
                ],
            notes: {
                medicalHistory: "No history yet...",
                currentMedications: "No current medications yet...",
                immunizations: "No immunizations listed...",
                labResults: "No lab results available yet...",
                lifestyleNotes: "No lifestyle notes...",
                lastVisitHistory: "No past visit history...",
            },
            riskLevel: randomRisk,
            isFavorite: false,
            createdAt: new Date().toISOString(),
        };
        onAdd(newPatient);
        onClose();
    };

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            aria-label="Close Add Patient Modal"
        >
            <div
                className="modal multi-step-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <button className="modal-close" onClick={onClose} aria-label="Close Modal">
                    &times;
                </button>
                <h2 id="modal-title">Add New Patient</h2>

                {step === 1 && (
                    <div className="modal-content">
                        <label htmlFor="patient-name">
                            Name:
                            <input
                                id="patient-name"
                                type="text"
                                value={basicInfo.name}
                                onChange={(e) =>
                                    setBasicInfo({ ...basicInfo, name: e.target.value })
                                }
                            />
                        </label>
                        <label htmlFor="patient-dob">
                            Date of Birth:
                            <input
                                id="patient-dob"
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
                        <label htmlFor="patient-email">
                            Email:
                            <input
                                id="patient-email"
                                type="email"
                                value={contactInfo.email}
                                onChange={(e) =>
                                    setContactInfo({ ...contactInfo, email: e.target.value })
                                }
                            />
                        </label>
                        <label htmlFor="patient-phone">
                            Phone:
                            <input
                                id="patient-phone"
                                type="tel"
                                value={contactInfo.phone}
                                onChange={(e) =>
                                    setContactInfo({ ...contactInfo, phone: e.target.value })
                                }
                            />
                        </label>
                        <label htmlFor="patient-address">
                            Address:
                            <textarea
                                id="patient-address"
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
                            <strong>Date of Birth:</strong> {dayjs(basicInfo.dob).format("YYYY-MM-DD")}
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

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------
function formatPhoneNumber(phone) {
    if (!phone) return "";
    const cleaned = ("" + phone).replace(/\D/g, "");
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    return phone;
}

function calculateAge(dob) {
    return dayjs().diff(dayjs(dob), "year");
}

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
}

function getGreetingMessage() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning, Dr. Max Mustermann!";
    if (hour < 18) return "Good afternoon, Dr. Max Mustermann!";
    return "Good evening, Dr. Max Mustermann!";
}

// -----------------------------------------------------------------------------
// Main Dashboard Component
// -----------------------------------------------------------------------------
function Dashboard() {
    const [patients, setPatients] = useState(() => {
        const saved = localStorage.getItem("patients");
        return saved ? JSON.parse(saved) : [];
    });
    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [filterBy, setFilterBy] = useState("all");
    const [showAddWizard, setShowAddWizard] = useState(false);
    const navigate = useNavigate();

    const greetingMessage = getGreetingMessage();

    const showNotificationMessage = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        localStorage.setItem("patients", JSON.stringify(patients));
    }, [patients]);

    const handleAddRandomPatient = async () => {
        try {
            const response = await fetch("https://randomuser.me/api/");
            const data = await response.json();
            const result = data.results[0];

            const riskLevelArray = ["low", "medium", "high"];
            const randomRisk =
                riskLevelArray[Math.floor(Math.random() * riskLevelArray.length)];

            const newRandomPatient = {
                id: uuidv4(),
                name: `${result.name.first} ${result.name.last}`,
                dob: dayjs(result.dob.date).format("YYYY-MM-DD"),
                email: result.email,
                phone: formatPhoneNumber(result.phone),
                address: `${result.location.street.name}, ${result.location.city}, ${result.location.country}`,
                // Use the API-provided picture if available; otherwise, choose a random default
                photo:
                    result.picture.large ||
                    defaultProfilePictures[
                    Math.floor(Math.random() * defaultProfilePictures.length)
                    ],
                notes: {
                    medicalHistory: "Auto-generated patient. No prior medical records.",
                    currentMedications: "None reported.",
                    immunizations: "Up-to-date according to random data.",
                    labResults: "No lab results available yet.",
                    lifestyleNotes: "Generated randomly. Possibly active.",
                    lastVisitHistory: "No prior visits in system.",
                },
                riskLevel: randomRisk,
                isFavorite: false,
                createdAt: new Date().toISOString(),
            };

            setPatients((prev) => [...prev, newRandomPatient]);
            showNotificationMessage("Random patient added!");
        } catch (error) {
            console.error("Error fetching random user:", error);
            showNotificationMessage("Failed to fetch random user. Please try again.");
        }
    };

    function filteredPatients() {
        return patients
            .filter((p) => {
                const q = searchQuery.toLowerCase();
                const matchesQuery =
                    p.name.toLowerCase().includes(q) ||
                    p.email.toLowerCase().includes(q) ||
                    (p.phone && p.phone.toLowerCase().includes(q)) ||
                    p.address.toLowerCase().includes(q);
                const matchesFilter =
                    filterBy === "all" ||
                    (filterBy === "highRisk" && p.riskLevel === "high") ||
                    (filterBy === "favorites" && p.isFavorite);
                return matchesQuery && matchesFilter;
            })
            .sort((a, b) => {
                if (sortBy === "name") {
                    return a.name.localeCompare(b.name);
                } else if (sortBy === "dob") {
                    return new Date(a.dob) - new Date(b.dob);
                }
                return 0;
            });
    }

    const criticalPatients = patients.filter((p) => p.riskLevel === "high");

    const toggleFavorite = (patientId) => {
        setPatients((prev) =>
            prev.map((p) => {
                if (p.id === patientId) {
                    return { ...p, isFavorite: !p.isFavorite };
                }
                return p;
            })
        );
    };

    return (
        <div className="dashboard-fullscreen">
            <Navbar />

            {notification && <Notification message={notification} role="alert" />}

            <div className="hello-doctor-banner">
                <h1>{greetingMessage}</h1>
                <p>Welcome back to your patient dashboard.</p>
            </div>

            <div className="dashboard-content">
                <div className="top-bar">
                    <div className="search-bar-wrapper">
                        <AiOutlineSearch className="icon" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="result-count">
                        {filteredPatients().length} result
                        {filteredPatients().length !== 1 ? "s" : ""} found
                    </div>

                    <select
                        aria-label="Sort patients by"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="dob">Sort by Date of Birth</option>
                    </select>

                    <select
                        aria-label="Filter patients"
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Patients</option>
                        <option value="highRisk">High Risk</option>
                        <option value="favorites">Favorites</option>
                    </select>

                    <button
                        onClick={() => setShowAddWizard(true)}
                        className="patient-add"
                        aria-label="Add Patient"
                    >
                        Add Patient
                    </button>

                    <button
                        onClick={handleAddRandomPatient}
                        className="secondary-button"
                        aria-label="Generate Sample Patient"
                    >
                        Generate Sample Patient
                    </button>
                </div>

                {/* Insight Section */}
                <div className="dashboard-insights">
                    <div className="insight-card">
                        <h3>See What You Have Missed</h3>
                        <p>
                            You have 2 new lab results, 1 updated appointment, and 1 message from a patient.
                        </p>
                    </div>
                    <div className="insight-card">
                        <h3>Critical Warnings</h3>
                        {criticalPatients.length ? (
                            <ul>
                                {criticalPatients.slice(0, 3).map((patient) => (
                                    <li key={patient.id}>{patient.name} - High Risk</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No critical warnings at the moment.</p>
                        )}
                    </div>
                    <div className="insight-card">
                        <h3>Your Insights</h3>
                        <p>Total Patients: {patients.length}</p>
                        <p>Favorite Patients: {patients.filter((p) => p.isFavorite).length}</p>
                        <p>High Risk Patients: {criticalPatients.length}</p>
                    </div>
                </div>

                {/* Patients List */}
                <div className="patients-list">
                    {filteredPatients().length > 0 ? (
                        filteredPatients().map((patient) => {
                            const photoUrl = patient.photo
                                ? patient.photo
                                : "https://via.placeholder.com/80?text=No+Photo";
                            return (
                                <div
                                    key={patient.id}
                                    className={`patient-card ${patient.riskLevel === "high" ? "high-risk" : ""
                                        }`}
                                    onClick={() => navigate(`/patient/${patient.id}`)}
                                >
                                    {/* Favorite Toggle */}
                                    <button
                                        className="favorite-toggle"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(patient.id);
                                        }}
                                        title={patient.isFavorite ? "Unfavorite" : "Mark as Favorite"}
                                        aria-pressed={patient.isFavorite}
                                    >
                                        {patient.isFavorite ? <AiFillStar /> : <AiOutlineStar />}
                                    </button>

                                    {/* Patient Photo */}
                                    <img
                                        src={photoUrl}
                                        alt={patient.name}
                                        className="patient-photo"
                                        onError={(e) => {
                                            e.target.src =
                                                "https://images.unsplash.com/photo-1507146426996-ef05306b995a?fm=jpg&q=60&w=3000";
                                        }}
                                    />

                                    {/* Patient Details */}
                                    <div className="patient-info">
                                        <div className="patient-basic-info">
                                            <h2
                                                className="patient-name"
                                                dangerouslySetInnerHTML={{
                                                    __html: highlightText(patient.name, searchQuery),
                                                }}
                                            />
                                            <div className={`risk-badge ${patient.riskLevel}`}>
                                                {patient.riskLevel === "low" && "Good to Go"}
                                                {patient.riskLevel === "medium" && "Danger"}
                                                {patient.riskLevel === "high" && "Needs Check"}
                                            </div>
                                        </div>
                                        <div className="patient-additional-info">
                                            <p>
                                                <AiOutlineMail className="detail-icon" /> {patient.email}
                                            </p>
                                            <p>
                                                <AiOutlinePhone className="detail-icon" />{" "}
                                                {formatPhoneNumber(patient.phone)}
                                            </p>
                                            <p>Age: {calculateAge(patient.dob)}</p>
                                        </div>
                                    </div>

                                    {/* Details Button */}
                                    <div className="patient-actions">
                                        <button
                                            className="details-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/patient/${patient.id}`);
                                            }}
                                        >
                                            Details
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p>No patients found.</p>
                    )}
                </div>
            </div>

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
