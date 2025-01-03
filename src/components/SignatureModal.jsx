import React, { useRef, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";

import "../styles/SignatureModal.css";

function SignatureModal({ onClose, onConfirm }) {
  const sigCanvasRef = useRef(null);

  const handleClear = useCallback(() => {
    sigCanvasRef.current.clear();
  }, []);

  const handleConfirm = useCallback(() => {
    if (!sigCanvasRef.current.isEmpty()) {
      const signatureDataURL = sigCanvasRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");
      onConfirm(signatureDataURL);
    } else {
      onConfirm(null); // or show a notification that signature was not provided
    }
  }, [onConfirm]);

  return (
    <div
      className="modal-overlay signature-overlay"
      onClick={() => onClose()}
      aria-modal="true"
    >
      <div
        className="modal signature-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Sign Below</h2>
        <div className="signature-canvas-wrapper">
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="#6a1b9a"
            canvasProps={{
              width: 600,
              height: 200,
              className: "sigCanvas",
            }}
          />
        </div>

        <div className="signature-actions">
          <button className="clear-button" onClick={handleClear}>
            Clear
          </button>
          <button className="cancel-button" onClick={() => onClose()}>
            Cancel
          </button>
          <button className="primary-button" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignatureModal;
