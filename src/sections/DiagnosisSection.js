import React from "react";
import "../styles/DiagnosisSection.css";
const DiagnosisSection = ({ patient, handleAddSignature }) => {
    return (
        <>
            <div className="mri-session-details" style={{ marginBottom: '40px' }}>
                <div className="mri-data">
                    <h4>MRI Data Details</h4>
                    <p><strong>Modality:</strong> DTI</p>
                    <p><strong>Resolution:</strong> 1x1x1 mm</p>
                    <p><strong>Orientation:</strong> Axial</p>
                    <p><strong>Acquisition Time:</strong> 15 minutes</p>
                    <p><strong>Patient Name:</strong> {patient.name}</p>
                    <p><strong>Patient ID:</strong> {patient.id}</p>
                    <p><strong>Scan Date:</strong> 2024-11-25</p>
                </div>
                <div className="session-metadata">
                    <h4>Session Metadata</h4>
                    <p><strong>Session ID:</strong> MRI20241125001</p>
                    <p><strong>Date and Time:</strong> 2024-11-25 10:45 AM</p>
                    <p><strong>MRI Device:</strong></p>
                    <ul>
                        <li>Manufacturer: Siemens</li>
                        <li>Model: Magnetom Prisma</li>
                        <li>Field Strength: 3T</li>
                    </ul>
                    <p><strong>Technician:</strong> Dr. Emily Carter</p>
                </div>
            </div>

            <div className="diagnosis-charts-container">
                <h4>Diagnostic Metrics</h4>
                <div className="charts-row">
                    <div className="chart-card">
                        <h5>Brain Region Volumes</h5>
                        <div className="bar-chart">
                            <div className="bar" style={{ height: '80%' }} title="Frontal Lobe: 80% of norm"></div>
                            <div className="bar" style={{ height: '90%' }} title="Temporal Lobe: 90% of norm"></div>
                            <div className="bar" style={{ height: '70%' }} title="Parietal Lobe: 70% of norm"></div>
                            <div className="bar" style={{ height: '60%' }} title="Occipital Lobe: 60% of norm"></div>
                        </div>
                    </div>
                    <div className="chart-card">
                        <h5>Signal Intensity Over Time</h5>
                        <div className="line-chart">
                            <div className="line"></div>
                        </div>
                    </div>
                    <div className="chart-card">
                        <h5>Lesion Segmentation Confidence</h5>
                        <div className="donut-chart">
                            <div className="donut-fill"></div>
                            <div className="donut-center-text">85%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="results-row">
                <div className="results-column">
                    <h4>Imaging Results</h4>
                    <p><strong>Description:</strong> Heterogeneously enhanced mass with irregular borders.</p>
                    <p><strong>Scan Type:</strong> DTI with contrast.</p>
                    <p><strong>Prognosis:</strong> Poor (12-15 months survival est.)</p>
                </div>
                <div className="results-column">
                    <h4>Clinical Notes</h4>
                    <p><strong>Symptoms:</strong> Headaches, nausea, mild memory loss.</p>
                    <p><strong>Action:</strong> Surgical resection + radiation & chemotherapy.</p>
                </div>
            </div>

            <div className="results-row">
                <div className="results-column">
                    <h4>Diagnosis Details</h4>
                    <p><strong>Condition:</strong> Glioblastoma Multiforme (GBM)</p>
                    <p><strong>Grade:</strong> IV (High-grade)</p>
                    <p><strong>Location:</strong> Left Temporal Lobe</p>
                    <p><strong>Size:</strong> 3.5 cm</p>
                </div>
            </div>

            <div className="signature-section">
                <button className="primary-button" onClick={handleAddSignature}>
                    Add Signature
                </button>
            </div>
        </>
    );
};

export default DiagnosisSection;
