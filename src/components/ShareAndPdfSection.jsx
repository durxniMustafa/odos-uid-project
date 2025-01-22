import React, { useState } from "react";
import { generatePDFWithRedaction } from "../utils/pdfHelpers";

function ShareAndPdfSection({ patient, notesHtml, signatureData }) {
  const [redactDob, setRedactDob] = useState(false);
  const [redactAddress, setRedactAddress] = useState(false);
  const [password, setPassword] = useState("");

  // Simple share link copy
  const handleShareLink = async () => {
    const shareLink = `https://example.com/patient/${patient.id}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      alert("Share link copied to clipboard!");
    } catch {
      alert("Failed to copy share link.");
    }
  };

  const handleGeneratePdf = async () => {
    const pdfBytes = await generatePDFWithRedaction({
      patient,
      notesHtml,
      signatureData,
      redactFields: [
        ...(redactDob ? ["dob"] : []),
        ...(redactAddress ? ["address"] : [])
      ],
      password: password || null
    });

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${patient.name}-report.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="share-section">
      <button onClick={handleShareLink} className="share-button" aria-label="Share Link">
        Share Patient
      </button>

      <div style={{ marginTop: "10px" }}>
        <label>
          <input
            type="checkbox"
            checked={redactDob}
            onChange={() => setRedactDob(!redactDob)}
          />
          Redact DOB
        </label>
        <label style={{ marginLeft: "20px" }}>
          <input
            type="checkbox"
            checked={redactAddress}
            onChange={() => setRedactAddress(!redactAddress)}
          />
          Redact Address
        </label>
      </div>

      <div style={{ marginTop: "10px" }}>
        <label>
          Password (optional):{" "}
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter PDF password"
          />
        </label>
      </div>

      <button
        className="primary-button"
        onClick={handleGeneratePdf}
        style={{ marginTop: "10px" }}
      >
        Generate PDF
      </button>
    </div>
  );
}

export default ShareAndPdfSection;
