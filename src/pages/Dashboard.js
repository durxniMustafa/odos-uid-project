import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";

function Dashboard() {
    const [patients, setPatients] = useState(() => {
        const saved = localStorage.getItem("patients");
        return saved ? JSON.parse(saved) : [
            {
                id: uuidv4(),
                name: "Yamini Gowda",
                email: "yamini_gowda@home.com",
                dob: "2020-12-10",
                phone: "+91 9788399999",
                address: "Kisan Vihar Ext, Nr Daharkar Wadi Bunder Pakhadi Rd, Kandivli, Alwar",
                photo: "https://via.placeholder.com/100",
                brainFiles: [],
                uploadProgress: {},
                status: "Stable",
            },
        ];
    });

    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPatient, setNewPatient] = useState({ name: "", email: "", dob: "", phone: "", address: "" });
    const [focusMode, setFocusMode] = useState(false);

    const showNotification = (message) => {
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
        // Simple validation
        if (!newPatient.name || !newPatient.email || !newPatient.dob || !newPatient.phone || !newPatient.address) {
            showNotification("Please fill in all fields.");
            return;
        }

        setPatients((prev) => [...prev, { ...newPatient, id: uuidv4(), brainFiles: [], uploadProgress: {}, status: "Stable" }]);
        setNewPatient({ name: "", email: "", dob: "", phone: "", address: "" });
        setShowAddModal(false);
        showNotification("Patient added!");
    };

    const generateInsights = () => {
        // Simulate generating a report
        showNotification("Patient insights generated (simulated)!");
    };

    return (
        <div className="dashboard-fullscreen">
            <Navbar />

            {notification && <div className="notification">{notification}</div>}

            <div className="dashboard-content">
                <div className="top-bar">
                    <input
                        type="text"
                        placeholder="Search patients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />

                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                        <option value="name">Sort by Name</option>
                        <option value="dob">Sort by Date of Birth</option>
                    </select>

                    <button onClick={() => setShowAddModal(true)} className="primary-button">
                        Add Patient
                    </button>
                    <button onClick={generateInsights} className="secondary-button">
                        Generate Insights
                    </button>
                    <button onClick={() => setFocusMode((prev) => !prev)} className="secondary-button">
                        {focusMode ? "Exit Focus Mode" : "Focus Mode"}
                    </button>
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
                                        <p><strong>{patient.name}</strong></p>
                                        <p>{patient.email}</p>
                                        <p>DOB: {patient.dob}</p>
                                        <p>{patient.phone}</p>
                                        <p>{patient.address}</p>
                                        <span className="status-badge">{patient.status}</span>
                                    </div>
                                )}
                                {focusMode && (
                                    <div className="patient-info">
                                        <p><strong>{patient.name}</strong></p>
                                    </div>
                                )}
                                <Link to={`/patient/${patient.id}`} className="details-button">
                                    View Details
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
                            <button onClick={addPatient} className="primary-button">Add</button>
                            <button onClick={() => setShowAddModal(false)} className="secondary-button">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
