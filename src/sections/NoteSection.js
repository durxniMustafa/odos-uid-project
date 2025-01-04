// src/sections/NoteSection.jsx
import React from "react";

/**
 * We assume `notes` is an object with keys:
 *   medicalHistory
 *   currentMedications
 *   immunizations
 *   labResults
 *   lifestyleNotes
 *   lastVisitHistory
 *
 * isEditingNotes toggles between read-only and editing mode.
 */
export default function NotesSection({
    notes,
    setNotes,
    isEditingNotes,
    setIsEditingNotes,
    handleSaveNotes,
    handleExportNotes,
}) {
    // Update a single subfield
    const handleFieldChange = (fieldName, value) => {
        setNotes((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    return (
        <div className="notes-card">
            <div className="notes-header">
                <h3>Patient Notes</h3>
                <div className="notes-actions-bar">
                    {!isEditingNotes && (
                        <button onClick={() => setIsEditingNotes(true)}>Edit Notes</button>
                    )}
                    <button onClick={handleExportNotes}>Export Notes</button>
                </div>
            </div>

            {/* Read-Only View */}
            {!isEditingNotes && (
                <div className="view-notes">
                    <p><strong>Medical History:</strong> {notes.medicalHistory}</p>
                    <p><strong>Current Medications:</strong> {notes.currentMedications}</p>
                    <p><strong>Immunizations:</strong> {notes.immunizations}</p>
                    <p><strong>Lab Results:</strong> {notes.labResults}</p>
                    <p><strong>Lifestyle Notes:</strong> {notes.lifestyleNotes}</p>
                    <p><strong>Last Visit History:</strong> {notes.lastVisitHistory}</p>
                </div>
            )}

            {/* Editing Mode */}
            {isEditingNotes && (
                <div className="edit-notes">
                    <label>
                        Medical History:
                        <textarea
                            value={notes.medicalHistory}
                            onChange={(e) => handleFieldChange("medicalHistory", e.target.value)}
                        />
                    </label>
                    <label>
                        Current Medications:
                        <textarea
                            value={notes.currentMedications}
                            onChange={(e) => handleFieldChange("currentMedications", e.target.value)}
                        />
                    </label>
                    <label>
                        Immunizations:
                        <textarea
                            value={notes.immunizations}
                            onChange={(e) => handleFieldChange("immunizations", e.target.value)}
                        />
                    </label>
                    <label>
                        Lab Results:
                        <textarea
                            value={notes.labResults}
                            onChange={(e) => handleFieldChange("labResults", e.target.value)}
                        />
                    </label>
                    <label>
                        Lifestyle Notes:
                        <textarea
                            value={notes.lifestyleNotes}
                            onChange={(e) => handleFieldChange("lifestyleNotes", e.target.value)}
                        />
                    </label>
                    <label>
                        Last Visit History:
                        <textarea
                            value={notes.lastVisitHistory}
                            onChange={(e) => handleFieldChange("lastVisitHistory", e.target.value)}
                        />
                    </label>

                    <div className="notes-actions">
                        <button className="save-button" onClick={handleSaveNotes}>
                            Save
                        </button>
                        <button
                            className="cancel-button"
                            onClick={() => setIsEditingNotes(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
