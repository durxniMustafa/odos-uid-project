// src/pages/Dashboard.js

import React, { useState, useEffect } from "react";
import "../styles/Dashboard.css";
import BrainViewer from "./BrainViewer"
import Navbar from "../components/Navbar";
import UserProfile from "./UserProfile";// Import UserProfile
import { v4 as uuidv4 } from "uuid";
import { FaUpload, FaCheckCircle } from 'react-icons/fa';
import { Link } from "react-router-dom"; // Add this import

function Dashboard() {
    const [patients, setPatients] = useState(() => {
        // Retrieve patients from localStorage if available
        const savedPatients = localStorage.getItem("patients");
        return savedPatients
            ? JSON.parse(savedPatients)
            : [
                {
                    id: uuidv4(),
                    name: "Yamini Gowda",
                    email: "yamini_gowda@home.com",
                    dob: "2020-12-10",
                    phone: "+91 9788399999",
                    address:
                        "Kisan Vihar Ext, Nr Daharkar Wadi Bunder Pakhadi Rd, Kandivli, Alwar",
                    photo: "https://via.placeholder.com/100",
                    brainFiles: [], // Changed to array for multiple files
                    uploadProgress: {},
                },
            ];
    });

    const [showAddModal, setShowAddModal] = useState(false);
    const [newPatient, setNewPatient] = useState({
        name: "",
        email: "",
        dob: "",
        phone: "",
        address: "",
        photo: "", // Changed to empty string to allow upload
        brainFiles: [], // Initialize as empty array
    });

    const [editingPatient, setEditingPatient] = useState(null); // State for editing

    const [searchQuery, setSearchQuery] = useState(""); // State for search

    const [currentPage, setCurrentPage] = useState(1);
    const patientsPerPage = 5;

    // Notification state
    const [notification, setNotification] = useState(null);

    // Modal state for viewing larger brain image
    const [viewingBrainFile, setViewingBrainFile] = useState(null);

    // AI Magic Upload Popup state
    const [showAIMagicPopup, setShowAIMagicPopup] = useState(false);

    // Persist patients to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("patients", JSON.stringify(patients));
    }, [patients]);

    // Determine if any upload is in progress
    const isUploading = patients.some(patient =>
        Object.values(patient.uploadProgress).some(progress => progress < 100)
    );

    // Show AI Magic Popup when uploading starts
    useEffect(() => {
        if (isUploading) {
            setShowAIMagicPopup(true);
        } else {
            setShowAIMagicPopup(false);
        }
    }, [isUploading]);

    // Handle input changes for adding a new patient
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPatient((prev) => ({ ...prev, [name]: value }));
    };

    // Handle profile photo upload
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPatient((prev) => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a valid image file.");
        }
    };

    // Add a new patient with validation
    const handleAddPatient = () => {
        // Simple validation
        if (
            !newPatient.name ||
            !newPatient.email ||
            !newPatient.dob ||
            !newPatient.phone ||
            !newPatient.address
        ) {
            alert("Please fill in all required fields.");
            return;
        }

        const newPatientData = {
            ...newPatient,
            id: uuidv4(),
            brainFiles: [],
            uploadProgress: {},
        };

        setPatients((prev) => [...prev, newPatientData]);
        setShowAddModal(false);
        setNewPatient({
            name: "",
            email: "",
            dob: "",
            phone: "",
            address: "",
            photo: "",
            brainFiles: [],
        });
        showNotification("Patient added successfully!");
    };

    // Remove a patient with confirmation
    const handleRemovePatient = (id) => {
        const confirmRemove = window.confirm(
            "Are you sure you want to remove this patient?"
        );
        if (confirmRemove) {
            const patientToRemove = patients.find((p) => p.id === id);
            // Revoke blob URLs
            patientToRemove.brainFiles.forEach((file) => {
                URL.revokeObjectURL(file.url);
            });
            const updatedPatients = patients.filter((patient) => patient.id !== id);
            setPatients(updatedPatients);
            showNotification("Patient removed successfully!");
        }
    };

    // Handle bulk file upload for a specific patient
    const handleFileUpload = (id, files) => {
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            const validMimeTypes = ["model/gltf-binary", "application/octet-stream"];
            const isValidMimeType = validMimeTypes.includes(file.type);
            const isValidExtension = file.name.toLowerCase().endsWith(".glb");

            if (!isValidMimeType && !isValidExtension) {
                alert(`File ${file.name} is not a valid .glb file.`);
                return;
            }

            const fileURL = URL.createObjectURL(file);
            const fileId = uuidv4(); // Unique identifier for each file

            setPatients((prev) =>
                prev.map((patient) =>
                    patient.id === id
                        ? {
                            ...patient,
                            brainFiles: [
                                ...patient.brainFiles,
                                { id: fileId, url: fileURL, name: file.name },
                            ],
                            uploadProgress: {
                                ...patient.uploadProgress,
                                [fileId]: 0,
                            },
                        }
                        : patient
                )
            );

            // Simulate upload progress
            let progress = 0;
            const interval = setInterval(() => {
                if (progress < 100) {
                    progress += 10;
                    setPatients((prev) =>
                        prev.map((patient) =>
                            patient.id === id
                                ? {
                                    ...patient,
                                    uploadProgress: {
                                        ...patient.uploadProgress,
                                        [fileId]: progress,
                                    },
                                }
                                : patient
                        )
                    );
                } else {
                    clearInterval(interval);
                    showNotification(`File ${file.name} uploaded successfully!`);
                }
            }, 300);
        });
    };

    // Function to remove individual brain file uploads
    const handleRemoveBrainFile = (patientId, fileId) => {
        const confirmRemove = window.confirm(
            "Are you sure you want to remove this brain file?"
        );
        if (confirmRemove) {
            setPatients((prev) =>
                prev.map((patient) => {
                    if (patient.id === patientId) {
                        const updatedBrainFiles = patient.brainFiles.filter(
                            (file) => file.id !== fileId
                        );
                        // Revoke blob URL
                        const removedFile = patient.brainFiles.find((file) => file.id === fileId);
                        if (removedFile) {
                            URL.revokeObjectURL(removedFile.url);
                        }
                        const updatedUploadProgress = { ...patient.uploadProgress };
                        delete updatedUploadProgress[fileId];
                        return {
                            ...patient,
                            brainFiles: updatedBrainFiles,
                            uploadProgress: updatedUploadProgress,
                        };
                    }
                    return patient;
                })
            );
            showNotification("Brain file removed successfully!");
        }
    };

    // Handle editing a patient
    const handleEditPatient = (patient) => {
        setEditingPatient(patient);
    };

    // Handle saving edited patient
    const handleSaveEditedPatient = (editedPatient) => {
        setPatients((prev) =>
            prev.map((patient) =>
                patient.id === editedPatient.id ? editedPatient : patient
            )
        );
        setEditingPatient(null);
        showNotification("Patient details updated successfully!");
    };

    // Handle search input
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };

    // Filter patients based on search query
    const filteredPatients = patients.filter((patient) => {
        const query = searchQuery.toLowerCase();
        return (
            patient.name.toLowerCase().includes(query) ||
            patient.email.toLowerCase().includes(query) ||
            patient.dob.toLowerCase().includes(query) ||
            patient.phone.toLowerCase().includes(query) ||
            patient.address.toLowerCase().includes(query)
        );
    });

    // Pagination calculations
    const indexOfLastPatient = currentPage * patientsPerPage;
    const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
    const currentPatients = filteredPatients.slice(
        indexOfFirstPatient,
        indexOfLastPatient
    );
    const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Export patients data as CSV
    const exportToCSV = () => {
        const headers = ["ID", "Name", "Email", "Date of Birth", "Phone", "Address"];
        const rows = patients.map((patient) => [
            patient.id,
            patient.name,
            patient.email,
            patient.dob,
            patient.phone,
            patient.address,
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
        rows.forEach((rowArray) => {
            let row = rowArray.join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "patients_data.csv");
        document.body.appendChild(link); // Required for FF

        link.click();
        document.body.removeChild(link);
    };

    // Notification handler
    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    // Handle viewing brain image in larger size
    const handleViewBrainImage = (brainFile) => {
        setViewingBrainFile(brainFile);
    };

    // Close the brain image modal
    const closeBrainImageModal = () => {
        setViewingBrainFile(null);
    };

    return (
        <div className="dashboard-container">
            {/* Navbar Component */}
            <Navbar />

            {/* Notification */}
            {notification && (
                <div className="notification">
                    <p>{notification}</p>
                </div>
            )}

            {/* AI Magic Upload Popup */}
            {showAIMagicPopup && (
                <div className="ai-magic-popup">
                    <div className="ai-magic-content">
                        <div className="ai-spinner"></div>
                        <p>Uploading with AI Magic...</p>
                    </div>
                </div>
            )}

            {/* Search and Add Section */}
            <div className="search-add-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search for patient (e.g., name, email)"
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
                <div className="add-export-buttons">
                    <button
                        className="add-patient-button"
                        onClick={() => setShowAddModal(true)}
                    >
                        + Add Patient
                    </button>
                    <button className="export-button" onClick={exportToCSV}>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Patients List with Pagination */}
            <div className="patients-list">
                {currentPatients.length > 0 ? (
                    currentPatients.map((patient) => (
                        <div key={patient.id} className="patient-card">
                            {/* Patient Details on Left */}
                            <div className="patient-details">
                                <img
                                    src={
                                        patient.photo || "https://via.placeholder.com/100"
                                    }
                                    alt="Patient"
                                    className="patient-photo"
                                />
                                <div className="patient-info">
                                    <p>
                                        <strong>Name:</strong> {patient.name}
                                    </p>
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
                                </div>
                                {/* Action Buttons */}
                                <div className="patient-actions">
                                    <Link to={`/patient/${patient.id}`} className="view-details-button">
                                        View Details
                                    </Link>
                                    <button
                                        className="remove-patient-button"
                                        onClick={() => handleRemovePatient(patient.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No patients found.</p>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="pagination">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                        (number) => (
                            <button
                                key={number}
                                onClick={() => paginate(number)}
                                className={`page-button ${currentPage === number ? "active" : ""}`}
                            >
                                {number}
                            </button>
                        )
                    )}
                </div>
            )}

            {/* Add Patient Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Add New Patient</h2>
                        <div className="modal-content">
                            {/* Existing form fields */}
                            <label htmlFor="add-name">
                                Name:
                                <input
                                    type="text"
                                    id="add-name"
                                    name="name"
                                    value={newPatient.name}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label htmlFor="add-email">
                                Email:
                                <input
                                    type="email"
                                    id="add-email"
                                    name="email"
                                    value={newPatient.email}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label htmlFor="add-dob">
                                Date of Birth:
                                <input
                                    type="date"
                                    id="add-dob"
                                    name="dob"
                                    value={newPatient.dob}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label htmlFor="add-phone">
                                Phone:
                                <input
                                    type="tel"
                                    id="add-phone"
                                    name="phone"
                                    value={newPatient.phone}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label htmlFor="add-address">
                                Address:
                                <textarea
                                    id="add-address"
                                    name="address"
                                    value={newPatient.address}
                                    onChange={handleInputChange}
                                ></textarea>
                            </label>
                            <label htmlFor="add-photo" className="file-upload-label">
                                Upload Profile Photo:
                            </label>
                            <input
                                type="file"
                                id="add-photo"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="file-upload-input"
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleAddPatient} className="save-button">
                                Add Patient
                            </button>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="cancel-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Patient Modal */}
            {editingPatient && (
                <UserProfile
                    patient={editingPatient}
                    onClose={() => setEditingPatient(null)}
                    onSave={handleSaveEditedPatient}
                />
            )}

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
    );
}

export default Dashboard;