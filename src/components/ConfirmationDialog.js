import React from 'react';
import "../styles/ConfirmationDialog.css";

function ConfirmationDialog({ message, onConfirm, onCancel }) {
    return (
        <div className="confirmation-dialog-overlay">
            <div className="confirmation-dialog">
                <p>{message}</p>
                <div className="dialog-actions">
                    <button className="cancel-button" onClick={onCancel}>Cancel</button>
                    <button className="save-button" onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationDialog;
