import React from "react";
import BrainViewer from "../pages/BrainViewer";
const BrainFilesSection = ({
    filteredBrainFiles,
    showReportButton,
    handleFeedback,
    handleGenerateReport,
}) => {
    if (filteredBrainFiles.length === 0) {
        return <p>No brain files found.</p>;
    }

    return (
        <div className="brain-viewer-section">
            {filteredBrainFiles.map((brainFile) => (
                <div key={brainFile.id} className="brain-viewer-wrapper">
                    <div className="brain-viewer-container">
                        <BrainViewer
                            file={brainFile.url}
                            onFeedback={handleFeedback}
                            showReportButton={showReportButton}
                            onGenerateReport={handleGenerateReport}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BrainFilesSection;
