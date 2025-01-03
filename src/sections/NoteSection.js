import React from "react";
import { FiEdit } from "react-icons/fi";
import { FaFileExport, FaPrint } from "react-icons/fa";

const NotesSection = ({
    notes,
    setNotes,
    isEditingNotes,
    setIsEditingNotes,
    handleSaveNotes,
    handleExportNotes,
    handlePrint,
}) => (
    <div className="notes-card">
        <div className="notes-header">
            <h3>Notes</h3>
            {!isEditingNotes && (
                <div className="notes-actions-bar">
                    <button className="edit-notes-button" onClick={() => setIsEditingNotes(true)}>
                        <FiEdit /> Edit
                    </button>
                    <button className="export-notes-button" onClick={handleExportNotes} title="Export Notes">
                        <FaFileExport /> Export
                    </button>
                    <button className="print-button" onClick={handlePrint} title="Print Page">
                        <FaPrint /> Print
                    </button>
                </div>
            )}
        </div>
        {isEditingNotes ? (
            <div className="edit-notes">
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes here..."
                    aria-label="Patient notes input"
                ></textarea>
                <div className="notes-actions">
                    <button className="save-button" onClick={handleSaveNotes}>Save</button>
                    <button className="cancel-button" onClick={() => setIsEditingNotes(false)}>Cancel</button>
                </div>
            </div>
        ) : (
            <div className="view-notes">
                <p>{notes || "No notes added yet."}</p>
            </div>
        )}
    </div>
);

export default NotesSection;
