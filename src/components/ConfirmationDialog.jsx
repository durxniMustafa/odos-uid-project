
import React, { useCallback, useEffect } from 'react';

const ConfirmationDialog = (props) => {
    const handleConfirm = useCallback(() => {
        // confirmation logic
    }, []);

    const handleCancel = useCallback(() => {
        // cancellation logic
    }, []);

    useEffect(() => {
        // effect logic
    }, []);

    return (
        <div className="confirmation-dialog-overlay">
            <div className="confirmation-dialog">
                <p>{props.message}</p>
                <div className="dialog-actions">
                    <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                    <button className="save-button" onClick={handleConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;