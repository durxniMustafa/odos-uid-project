import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";
import Notification from "../components/Notification";
import useWindowSize from "../hooks/useWindowSize";
import { FaRegUserCircle } from "react-icons/fa";
import { TiUserAddOutline } from "react-icons/ti";


// Modern icon replacements (example using Ant Design icons)
import {
    AiOutlineUserAdd,
    AiOutlineSearch,
    AiOutlineLineChart,
    AiOutlineFilter,
    AiOutlineMail,
    AiOutlinePhone,
    AiOutlineEnvironment,
    AiOutlineCalendar
} from "react-icons/ai";

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
                    name: "Mustafa Durani@outlook.de",
                    email: "M.Durani",
                    dob: "2020-12-10",
                    phone: "+91 9788399999",
                    address:
                        "Kisan Vihar Ext, Nr Daharkar Wadi Bunder Pakhadi Rd, Kandivli, Alwar",
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
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPatient, setNewPatient] = useState({
        name: "",
        email: "",
        dob: "",
        phone: "",
        address: "",
    });
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

    const addPatient = () => {
        if (
            !newPatient.name ||
            !newPatient.email ||
            !newPatient.dob ||
            !newPatient.phone ||
            !newPatient.address
        ) {
            showNotificationMessage("Please fill in all fields.");
            return;
        }

        setPatients((prev) => [
            ...prev,
            {
                ...newPatient,
                id: uuidv4(),
                brainFiles: [],
                uploadProgress: {},
                notes: "",
                isFavorite: false,
            },
        ]);
        setNewPatient({
            name: "",
            email: "",
            dob: "",
            phone: "",
            address: "",
        });
        setShowAddModal(false);
        showNotificationMessage("Patient added!");
    };

    const generateInsights = () => {
        showNotificationMessage("Patient insights generated (simulated)!");
    };

    const dismissPilot = () => {
        setShowPilotBanner(false);
        localStorage.setItem("dismissedPilotBanner", "true");
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

                    <button onClick={() => setShowAddModal(true)} className="primary-button">
                        <TiUserAddOutline /> Add Patient
                    </button>
                    <button onClick={generateInsights} className="secondary-button">
                        <AiOutlineLineChart /> Generate Insights
                    </button>
                    <button onClick={() => setFocusMode((prev) => !prev)} className="secondary-button">
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
                                <Link to={`/patient/${patient.id}`} className="details-button">
                                    Details
                                </Link>
                            </div>
                        ))
                    ) : (
                        <p>No patients found.</p>
                    )}
                </div>
            </div>

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Add New Patient</h2>
                        <div className="modal-content">
                            <label>
                                Name:
                                <input
                                    type="text"
                                    value={newPatient.name}
                                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                                />
                            </label>
                            <label>
                                Email:
                                <input
                                    type="email"
                                    value={newPatient.email}
                                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                                />
                            </label>
                            <label>
                                Date of Birth:
                                <input
                                    type="date"
                                    value={newPatient.dob}
                                    onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })}
                                />
                            </label>
                            <label>
                                Phone:
                                <input
                                    type="tel"
                                    value={newPatient.phone}
                                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                                />
                            </label>
                            <label>
                                Address:
                                <textarea
                                    value={newPatient.address}
                                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                                ></textarea>
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button onClick={addPatient} className="primary-button">
                                Add
                            </button>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="secondary-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
