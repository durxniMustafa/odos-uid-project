import React, { useState } from "react";
import "../styles/NotesSection.css";

export default function NotesSection({
  notes,
  setNotes,
  isEditingNotes,
  setIsEditingNotes,
  handleSaveNotes,
  handleExportNotes,
}) {
  // Local state to toggle collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update a single subfield in the notes object
  const handleFieldChange = (fieldName, value) => {
    setNotes((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  return (
    <section
      className={`notes-card ${isCollapsed ? "collapsed" : ""}`}
      aria-labelledby="notes-section-heading"
    >
      <header className="notes-header">
        <h3 id="notes-section-heading">Patient Notes</h3>
        <div className="header-actions">
          <button
            type="button"
            className={`notes-toggle ${isCollapsed ? "collapsed" : ""}`}
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label="Toggle notes section"
          >
            ▼
          </button>
          <div className="notes-actions-bar">
            {!isEditingNotes && (
              <button
                type="button"
                onClick={() => setIsEditingNotes(true)}
                aria-label="Edit Patient Notes"
              >
                Edit Notes
              </button>
            )}
            <button
              type="button"
              onClick={handleExportNotes}
              aria-label="Export Patient Notes"
            >
              Export Notes
            </button>
          </div>
        </div>
      </header>

      {/* Wrap the view/edit content in a container for collapse/expand */}
      <div className="notes-content">
        {/* Read-Only View */}
        {!isEditingNotes && (
          <div className="view-notes">
            <p>
              <strong>Medical History:</strong> {notes.medicalHistory}
            </p>
            <p>
              <strong>Current Medications:</strong> {notes.currentMedications}
            </p>
            <p>
              <strong>Immunizations:</strong> {notes.immunizations}
            </p>
            <p>
              <strong>Lab Results:</strong> {notes.labResults}
            </p>
            <p>
              <strong>Lifestyle Notes:</strong> {notes.lifestyleNotes}
            </p>
            <p>
              <strong>Last Visit History:</strong> {notes.lastVisitHistory}
            </p>
          </div>
        )}

        {/* Editing Mode */}
        {isEditingNotes && (
          <form
            className="edit-notes"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveNotes();
            }}
            aria-label="Edit Patient Notes Form"
          >
            <label>
              Medical History:
              <textarea
                value={notes.medicalHistory}
                onChange={(e) =>
                  handleFieldChange("medicalHistory", e.target.value)
                }
              />
            </label>
            <label>
              Current Medications:
              <textarea
                value={notes.currentMedications}
                onChange={(e) =>
                  handleFieldChange("currentMedications", e.target.value)
                }
              />
            </label>
            <label>
              Immunizations:
              <textarea
                value={notes.immunizations}
                onChange={(e) =>
                  handleFieldChange("immunizations", e.target.value)
                }
              />
            </label>
            <label>
              Lab Results:
              <textarea
                value={notes.labResults}
                onChange={(e) =>
                  handleFieldChange("labResults", e.target.value)
                }
              />
            </label>
            <label>
              Lifestyle Notes:
              <textarea
                value={notes.lifestyleNotes}
                onChange={(e) =>
                  handleFieldChange("lifestyleNotes", e.target.value)
                }
              />
            </label>
            <label>
              Last Visit History:
              <textarea
                value={notes.lastVisitHistory}
                onChange={(e) =>
                  handleFieldChange("lastVisitHistory", e.target.value)
                }
              />
            </label>

            <div className="notes-actions">
              <button
                type="button"
                className="save-button"
                onClick={handleSaveNotes}
                aria-label="Save Patient Notes"
              >
                Save
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setIsEditingNotes(false)}
                aria-label="Cancel Editing"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
