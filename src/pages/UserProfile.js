// src/components/UserProfile.js

import React, { useState } from "react";
import "../styles/Dashboard.css"; // Reuse existing styles

function UserProfile({ patient, onClose, onSave }) {
    const [editedPatient, setEditedPatient] = useState({ ...patient });
    const [formErrors, setFormErrors] = useState({});

    // Data for dropdowns
    const weightOptions = ["<50 kg", "50-60 kg", "60-70 kg", "70-80 kg", ">80 kg"];
    const heightOptions = ["<150 cm", "150-160 cm", "160-170 cm", "170-180 cm", ">180 cm"];
    const symptomsOptions = [
        "Headache",
        "Dizziness",
        "Nausea",
        "Blurred Vision",
        "Seizures",
    ];
    const nationalityOptions = [
        "Indian",
        "American",
        "British",
        "Canadian",
        "Australian",
        "Other",
    ];
    const preExistingConditionsOptions = [
        "Diabetes",
        "Hypertension",
        "Asthma",
        "Heart Disease",
        "None",
    ];

    // Email validation function
    const validateEmail = (email) => {
        const atSymbol = email.includes("@");
        const endsWithOl = email.endsWith(".ol");
        return atSymbol && endsWithOl;
    };

    // Form validation function
    const validateForm = () => {
        const errors = {};

        if (!editedPatient.name.trim()) {
            errors.name = "Name is required.";
        }

        if (!editedPatient.email.trim()) {
            errors.email = "Email is required.";
        } else if (!validateEmail(editedPatient.email.trim())) {
            errors.email = "Email must contain '@' and end with '.ol'.";
        }

        // Additional validations for other fields...

        setFormErrors(errors);

        return Object.keys(errors).length === 0;
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedPatient((prev) => ({ ...prev, [name]: value }));
    };

    // Handle profile photo upload
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditedPatient((prev) => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a valid image file.");
        }
    };

    // Handle multi-select for symptoms
    const handleSymptomsChange = (e) => {
        const options = e.target.options;
        const selectedSymptoms = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedSymptoms.push(options[i].value);
            }
        }
        setEditedPatient((prev) => ({ ...prev, symptoms: selectedSymptoms }));
    };

    // Handle saving edited patient
    const handleSave = () => {
        if (!validateForm()) {
            return;
        }

        onSave(editedPatient);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Patient</h2>
                <div className="modal-content">
                    {/* Name Field */}
                    <label htmlFor="edit-name">
                        Name:
                        <input
                            type="text"
                            id="edit-name"
                            name="name"
                            value={editedPatient.name}
                            onChange={handleInputChange}
                        />
                        {formErrors.name && (
                            <span className="error-text">{formErrors.name}</span>
                        )}
                    </label>

                    {/* Email Field */}
                    <label htmlFor="edit-email">
                        Email:
                        <input
                            type="email"
                            id="edit-email"
                            name="email"
                            value={editedPatient.email}
                            onChange={handleInputChange}
                        />
                        {formErrors.email && (
                            <span className="error-text">{formErrors.email}</span>
                        )}
                    </label>

                    {/* Date of Birth Field */}
                    <label htmlFor="edit-dob">
                        Date of Birth:
                        <input
                            type="date"
                            id="edit-dob"
                            name="dob"
                            value={editedPatient.dob}
                            onChange={handleInputChange}
                        />
                        {formErrors.dob && (
                            <span className="error-text">{formErrors.dob}</span>
                        )}
                    </label>

                    {/* Phone Field */}
                    <label htmlFor="edit-phone">
                        Phone:
                        <input
                            type="tel"
                            id="edit-phone"
                            name="phone"
                            value={editedPatient.phone}
                            onChange={handleInputChange}
                        />
                        {formErrors.phone && (
                            <span className="error-text">{formErrors.phone}</span>
                        )}
                    </label>

                    {/* Address Field */}
                    <label htmlFor="edit-address">
                        Address:
                        <textarea
                            id="edit-address"
                            name="address"
                            value={editedPatient.address}
                            onChange={handleInputChange}
                        ></textarea>
                        {formErrors.address && (
                            <span className="error-text">{formErrors.address}</span>
                        )}
                    </label>

                    {/* Profile Photo Upload */}
                    <label htmlFor="edit-photo" className="file-upload-label">
                        Upload Profile Photo:
                    </label>
                    <input
                        type="file"
                        id="edit-photo"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="file-upload-input"
                    />

                    {/* Weight Dropdown */}
                    <label htmlFor="edit-weight">
                        Weight:
                        <select
                            id="edit-weight"
                            name="weight"
                            value={editedPatient.weight}
                            onChange={handleInputChange}
                        >
                            <option value="">Select Weight</option>
                            {weightOptions.map((weight) => (
                                <option key={weight} value={weight}>
                                    {weight}
                                </option>
                            ))}
                        </select>
                        {formErrors.weight && (
                            <span className="error-text">{formErrors.weight}</span>
                        )}
                    </label>

                    {/* Height Dropdown */}
                    <label htmlFor="edit-height">
                        Height:
                        <select
                            id="edit-height"
                            name="height"
                            value={editedPatient.height}
                            onChange={handleInputChange}
                        >
                            <option value="">Select Height</option>
                            {heightOptions.map((height) => (
                                <option key={height} value={height}>
                                    {height}
                                </option>
                            ))}
                        </select>
                        {formErrors.height && (
                            <span className="error-text">{formErrors.height}</span>
                        )}
                    </label>

                    {/* Symptoms Multi-Select */}
                    <label htmlFor="edit-symptoms">
                        Symptoms:
                        <select
                            id="edit-symptoms"
                            name="symptoms"
                            multiple
                            value={editedPatient.symptoms}
                            onChange={handleSymptomsChange}
                        >
                            {symptomsOptions.map((symptom) => (
                                <option key={symptom} value={symptom}>
                                    {symptom}
                                </option>
                            ))}
                        </select>
                        {formErrors.symptoms && (
                            <span className="error-text">{formErrors.symptoms}</span>
                        )}
                    </label>

                    {/* Nationality Dropdown */}
                    <label htmlFor="edit-nationality">
                        Nationality:
                        <select
                            id="edit-nationality"
                            name="nationality"
                            value={editedPatient.nationality}
                            onChange={handleInputChange}
                        >
                            <option value="">Select Nationality</option>
                            {nationalityOptions.map((nationality) => (
                                <option key={nationality} value={nationality}>
                                    {nationality}
                                </option>
                            ))}
                        </select>
                        {formErrors.nationality && (
                            <span className="error-text">{formErrors.nationality}</span>
                        )}
                    </label>

                    {/* Pre-Existing Conditions Dropdown */}
                    <label htmlFor="edit-preExistingConditions">
                        Pre-Existing Conditions (Vorerkrankungen):
                        <select
                            id="edit-preExistingConditions"
                            name="preExistingConditions"
                            value={editedPatient.preExistingConditions}
                            onChange={handleInputChange}
                        >
                            <option value="">Select Pre-Existing Condition</option>
                            {preExistingConditionsOptions.map((condition) => (
                                <option key={condition} value={condition}>
                                    {condition}
                                </option>
                            ))}
                        </select>
                        {formErrors.preExistingConditions && (
                            <span className="error-text">{formErrors.preExistingConditions}</span>
                        )}
                    </label>
                </div>
                <div className="modal-actions">
                    <button onClick={handleSave} className="save-button">
                        Save
                    </button>
                    <button onClick={onClose} className="cancel-button">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserProfile;
