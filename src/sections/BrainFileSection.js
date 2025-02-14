import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import BrainViewer from "../pages/BrainViewer";
import "../styles/BrainFilesSection.css"; // Ensure this file includes the CSS enhancements
// Example bounding box data for regions:
const defaultRegions = [
  {
    id: 1,
    name: "Frontal Lobe Lesion",
    confidence: null,
    position: { x: 0.3, y: 0.5, z: 0 },
    size: { x: 0.2, y: 0.2, z: 0.2 },
  },
  {
    id: 2,
    name: "Occipital Lobe Abnormality",
    confidence: null,
    position: { x: -0.2, y: 0.4, z: 0.1 },
    size: { x: 0.15, y: 0.15, z: 0.15 },
  },
];

// Patient context for the AI system prompt
const patientContext = {
  age: 55,
  gender: "Male",
  symptoms: ["headaches", "mild memory loss"],
  prevScanNote: "Slight growth in lesion over past 3 months",
};

export default function BrainFilesSection({
  filteredBrainFiles,
  showReportButton,
  handleFeedback,
  handleGenerateReport,
}) {
  // Initialize file states based on filtered brain files.
  const [fileStates, setFileStates] = useState(() =>
    filteredBrainFiles.map((bf) => ({
      fileId: bf.id,
      confidence: null,
      regionData: JSON.parse(JSON.stringify(defaultRegions)),
      annotationPoints: [],
      showConfidenceExplanation: false,
      detailedReport: "",
      differentialDiagnosis: "",
      treatmentSuggestions: "",
      // AI-related states
      isLoadingAi: false,
      aiStatus: "",
      aiError: null,
      aiFeedback: null, // "like" or "dislike"
      conversation: [],
      followUpQuestion: "",
    }))
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentReportFileId, setCurrentReportFileId] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Helper: get file state by id.
  const getFileState = (fileId) =>
    fileStates.find((s) => s.fileId === fileId) || null;

  // Helper: update file state by id.
  const updateFileState = (fileId, newData) => {
    setFileStates((prev) =>
      prev.map((f) => (f.fileId === fileId ? { ...f, ...newData } : f))
    );
  };

  /* 1) AI-based Pre-Analysis */
  const handleAiPreAnalysis = (fileId) => {
    const st = getFileState(fileId);
    if (!st) return;
    // Generate overall confidence randomly between 60 and 100.
    const randomOverall = Math.floor(Math.random() * 41) + 60;
    const updatedRegions = st.regionData.map((r) => {
      const regionConf = Math.floor(Math.random() * 41) + 60;
      return {
        ...r,
        confidence: `${regionConf}%`,
        critical: regionConf > 90,
      };
    });
    updateFileState(fileId, {
      confidence: randomOverall,
      regionData: updatedRegions,
      aiError: null,
    });
  };

  /* 2) AI Consultation (simulate a consultation request) */
  const handleAiConsultation = async (fileId) => {
    const st = getFileState(fileId);
    if (!st) return;
    if (st.confidence === null) {
      updateFileState(fileId, {
        aiError: "Please run the 'Preliminary Intelligent Analysis' first.",
      });
      return;
    }
    updateFileState(fileId, {
      isLoadingAi: true,
      aiStatus: "Requesting AI Consultation...",
      aiError: null,
      conversation: [],
      followUpQuestion: "",
    });
    const regionText = st.regionData
      .map((r) => `${r.name} (${r.confidence || "?"})`)
      .join(", ");
    const systemPrompt = {
      role: "system",
      content: `You are an AI Assistant summarizing MRI findings. Data:
Age: ${patientContext.age}, Gender: ${patientContext.gender}.
Symptoms: ${patientContext.symptoms.join(", ")}.
Previous note: ${patientContext.prevScanNote}.
AI Confidence: ${st.confidence}%.
Regions: ${regionText}.
Provide a concise clinical summary, recommendations, and next steps.
(This is a demo; not real medical advice.)`,
    };
    const userPrompt = {
      role: "user",
      content: "Please provide a clinical summary based on the data.",
    };
    const conversation = [systemPrompt, userPrompt];
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: conversation,
          max_tokens: 250,
        }),
      });
      if (!response.ok) {
        let errorMsg = "Network Error or Invalid API Key.";
        if (response.status === 401) errorMsg = "Unauthorized (check your API key).";
        throw new Error(errorMsg);
      }
      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || "No response";
      updateFileState(fileId, {
        isLoadingAi: false,
        aiStatus: "AI Consultation Complete",
        conversation: [...conversation, { role: "assistant", content: aiText }],
      });
    } catch (err) {
      updateFileState(fileId, {
        isLoadingAi: false,
        aiError: err.message || "Error contacting OpenAI",
        aiStatus: "Error",
      });
    }
  };

  /* 3) Follow-up Question */
  const handleFollowUp = async (fileId) => {
    const st = getFileState(fileId);
    if (!st) return;
    const userQuestion = st.followUpQuestion.trim();
    if (!userQuestion) return;
    updateFileState(fileId, {
      isLoadingAi: true,
      aiError: null,
      aiStatus: "Continuing AI Consultation...",
    });
    const updatedConversation = [
      ...st.conversation,
      { role: "user", content: userQuestion },
    ];
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: updatedConversation,
          max_tokens: 200,
        }),
      });
      if (!response.ok) {
        let errorMsg = "Network Error or Invalid API Key.";
        if (response.status === 401) errorMsg = "Unauthorized (check your API key).";
        throw new Error(errorMsg);
      }
      const data = await response.json();
      const aiReply = data.choices?.[0]?.message?.content || "No follow-up response";
      updateFileState(fileId, {
        isLoadingAi: false,
        aiStatus: "Follow-up Complete",
        conversation: [...updatedConversation, { role: "assistant", content: aiReply }],
        followUpQuestion: "",
      });
    } catch (err) {
      updateFileState(fileId, {
        isLoadingAi: false,
        aiError: err.message || "Error contacting OpenAI",
        aiStatus: "Error",
      });
    }
  };

  /* 4) Generate Detailed Radiology Report */
  const handleGenerateDetailedReport = async (fileId) => {
    const st = getFileState(fileId);
    if (!st) return;
    if (st.confidence === null) {
      updateFileState(fileId, {
        aiError: "Please run the Preliminary Intelligent Analysis first.",
      });
      return;
    }
    updateFileState(fileId, {
      isLoadingAi: true,
      aiStatus: "Generating Detailed Report...",
      aiError: null,
    });
    const regionText = st.regionData
      .map((r) => `${r.name} (${r.confidence || "?"})`)
      .join(", ");
    const systemPrompt = {
      role: "system",
      content: `You are an AI Radiology Assistant. Based on the MRI data provided, generate a detailed radiology report that includes:
- A detailed description of findings.
- Differential diagnoses.
- Recommendations for further tests or follow-up.
Patient Data:
Age: ${patientContext.age}
Gender: ${patientContext.gender}
Symptoms: ${patientContext.symptoms.join(", ")}
Previous scan notes: ${patientContext.prevScanNote}
AI Analysis:
Overall Confidence: ${st.confidence}%
Regions: ${regionText}
Provide the report in a clear, structured format.
(This is a demo; do not use as real medical advice.)`,
    };
    const userPrompt = {
      role: "user",
      content: "Please generate the detailed report.",
    };
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [systemPrompt, userPrompt],
          max_tokens: 500,
        }),
      });
      if (!response.ok) {
        let errorMsg = "Network Error or Invalid API Key.";
        if (response.status === 401) errorMsg = "Unauthorized (check your API key).";
        throw new Error(errorMsg);
      }
      const data = await response.json();
      const detailedReport = data.choices?.[0]?.message?.content || "No detailed report generated.";
      updateFileState(fileId, {
        isLoadingAi: false,
        aiStatus: "Detailed Report Generated",
        detailedReport,
      });
      setCurrentReportFileId(fileId);
      setShowReportModal(true);
    } catch (err) {
      updateFileState(fileId, {
        isLoadingAi: false,
        aiError: err.message || "Error contacting OpenAI",
        aiStatus: "Error",
      });
    }
  };

  /* 5) Explain Region (Show Explanation for a Region) */
  const handleExplainRegion = async (fileId, regionId) => {
    const st = getFileState(fileId);
    if (!st) return;
    const region = st.regionData.find((r) => r.id === regionId);
    if (!region) return;
    updateFileState(fileId, { isLoadingAi: true, aiStatus: "Explaining Region...", aiError: null });
    const systemPrompt = {
      role: "system",
      content: `You are an AI Radiology Assistant. Explain in simple language the clinical significance of the following region: "${region.name}". Consider its confidence score (${region.confidence || "unknown"}) and provide a concise explanation understandable to a patient.`,
    };
    const userPrompt = { role: "user", content: "Please provide the explanation." };
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [systemPrompt, userPrompt],
          max_tokens: 150,
        }),
      });
      if (!response.ok) {
        let errorMsg = "Network Error or Invalid API Key.";
        if (response.status === 401) errorMsg = "Unauthorized (check your API key).";
        throw new Error(errorMsg);
      }
      const data = await response.json();
      const regionExplanation = data.choices?.[0]?.message?.content || "No explanation generated.";
      alert(`Explanation for ${region.name}:\n\n${regionExplanation}`);
      updateFileState(fileId, { isLoadingAi: false, aiStatus: "Region Explanation Generated" });
    } catch (err) {
      updateFileState(fileId, {
        isLoadingAi: false,
        aiError: err.message || "Error contacting OpenAI",
        aiStatus: "Error",
      });
    }
  };

  /* 6) Generate Differential Diagnosis */
  const handleGenerateDifferentialDiagnosis = async (fileId) => {
    const st = getFileState(fileId);
    if (!st) return;
    if (st.confidence === null) {
      updateFileState(fileId, { aiError: "Please run Pre-Analysis first." });
      return;
    }
    updateFileState(fileId, {
      isLoadingAi: true,
      aiStatus: "Generating Differential Diagnosis...",
      aiError: null,
    });
    const regionText = st.regionData
      .map((r) => `${r.name} (${r.confidence || "?"})`)
      .join(", ");
    const systemPrompt = {
      role: "system",
      content: `You are an AI Radiology Assistant. Based on the MRI scan data below, generate a differential diagnosis in bullet point format.
Patient Data:
Age: ${patientContext.age}, Gender: ${patientContext.gender}
Symptoms: ${patientContext.symptoms.join(", ")}
Previous note: ${patientContext.prevScanNote}
AI Analysis:
Overall Confidence: ${st.confidence}%
Regions: ${regionText}
Please list 3-5 possible diagnoses with brief explanations.
(This is a demo only.)`,
    };
    const userPrompt = { role: "user", content: "Generate the differential diagnosis." };
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [systemPrompt, userPrompt],
          max_tokens: 200,
        }),
      });
      if (!response.ok) {
        let errorMsg = "Network Error or Invalid API Key.";
        if (response.status === 401) errorMsg = "Unauthorized (check your API key).";
        throw new Error(errorMsg);
      }
      const data = await response.json();
      const differentialDiagnosis = data.choices?.[0]?.message?.content || "No differential diagnosis generated.";
      updateFileState(fileId, {
        isLoadingAi: false,
        aiStatus: "Differential Diagnosis Generated",
        differentialDiagnosis,
      });
      alert(`Differential Diagnosis:\n\n${differentialDiagnosis}`);
    } catch (err) {
      updateFileState(fileId, {
        isLoadingAi: false,
        aiError: err.message || "Error contacting OpenAI",
        aiStatus: "Error",
      });
    }
  };

  /* 7) Suggest Treatment Options */
  const handleSuggestTreatment = async (fileId) => {
    const st = getFileState(fileId);
    if (!st) return;
    if (st.confidence === null) {
      updateFileState(fileId, { aiError: "Please run Pre-Analysis first." });
      return;
    }
    updateFileState(fileId, {
      isLoadingAi: true,
      aiStatus: "Generating Treatment Suggestions...",
      aiError: null,
    });
    const regionText = st.regionData
      .map((r) => `${r.name} (${r.confidence || "?"})`)
      .join(", ");
    const systemPrompt = {
      role: "system",
      content: `You are an AI Radiology Assistant. Based on the MRI findings provided, suggest a list of potential treatment options or next steps.
Patient Data:
Age: ${patientContext.age}, Gender: ${patientContext.gender}
Symptoms: ${patientContext.symptoms.join(", ")}
Previous scan note: ${patientContext.prevScanNote}
AI Analysis:
Overall Confidence: ${st.confidence}%
Regions: ${regionText}
Please provide 3-5 treatment suggestions in a bullet list format.
(This is a demo only; do not use as real medical advice.)`,
    };
    const userPrompt = { role: "user", content: "Suggest treatment options." };
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [systemPrompt, userPrompt],
          max_tokens: 200,
        }),
      });
      if (!response.ok) {
        let errorMsg = "Network Error or Invalid API Key.";
        if (response.status === 401) errorMsg = "Unauthorized (check your API key).";
        throw new Error(errorMsg);
      }
      const data = await response.json();
      const treatmentSuggestions = data.choices?.[0]?.message?.content || "No treatment suggestions generated.";
      updateFileState(fileId, {
        isLoadingAi: false,
        aiStatus: "Treatment Suggestions Generated",
        treatmentSuggestions,
      });
      alert(`Treatment Suggestions:\n\n${treatmentSuggestions}`);
    } catch (err) {
      updateFileState(fileId, {
        isLoadingAi: false,
        aiError: err.message || "Error contacting OpenAI",
        aiStatus: "Error",
      });
    }
  };

  /* 8) Print Report */
  const handlePrintReport = () => {
    window.print();
  };

  /* 9) AI Feedback (like/dislike) */
  const handleAiFeedback = (fileId, feedback) => {
    updateFileState(fileId, { aiFeedback: feedback });
  };

  /* 10) Toggle Confidence Explanation Popup */
  const toggleConfidenceExplanation = (fileId) => {
    const st = getFileState(fileId);
    if (!st) return;
    updateFileState(fileId, {
      showConfidenceExplanation: !st.showConfidenceExplanation,
    });
  };

  if (filteredBrainFiles.length === 0) {
    return <p>No brain files found.</p>;
  }

  return (
    <div className="brain-files-section">
      {/* Introductory Guidelines */}
      <div className="intro-box">
        <h3>Clear Roles & Guidelines</h3>
        <ul>
          <li>
            <strong>Doctor’s Role:</strong> Final clinical judgment, treatment decisions, and patient communication.
          </li>
          <li>
            <strong>AI’s Role:</strong> Provide data-driven insights (pre-analysis, consultation, detailed reports, differential diagnosis, and treatment suggestions) to assist your diagnosis.
          </li>
          <li>
            <strong>Confidence Threshold:</strong> Scores above 90% indicate potential urgency.
          </li>
          <li>
            <strong>AI Reusability:</strong> Historical data can be compared on future scans or used to improve the model. Contact ODOS specialists for more information.
          </li>
        </ul>
      </div>

      {filteredBrainFiles.map((bf) => {
        const st = getFileState(bf.id);
        if (!st) return null;
        // Determine if overall confidence is critical (>90%)
        const isCriticalOverall = st.confidence !== null && Number(st.confidence) > 90;
        return (
          <div
            key={bf.id}
            className={`brain-file-card ${isCriticalOverall ? "critical-card" : ""}`}
          >
            {/* LEFT: BrainViewer or MRI image */}
            <div className="brain-file-card-left">
              <BrainViewer
                file={bf.url}
                onFeedback={handleFeedback}
                showReportButton={showReportButton}
                onGenerateReport={handleGenerateReport}
                regionData={st.regionData}
                showAIHighlights={true}
                annotationPoints={st.annotationPoints}
                setAnnotationPoints={(pts) =>
                  updateFileState(bf.id, { annotationPoints: pts || [] })
                }
              />
            </div>

            {/* RIGHT: Info & Actions */}
            <div className="brain-file-card-right">
              <h4 className="brain-file-name">File: {bf.name}</h4>

              {/* Doctor's Manual Notes */}
              <div className="doctor-section">
                <p>
                  <strong>Doctor’s Observations:</strong>
                </p>
                <textarea
                  rows={3}
                  placeholder="(Optional) Enter your notes here..."
                  style={{ width: "100%" }}
                />
              </div>

              {/* AI Pre-Analysis */}
              {st.confidence === null ? (
                <p>
                  <i>No AI pre-analysis has been run yet.</i>
                </p>
              ) : (
                <div className="ai-confidence">
                  <strong>
                    ODOS Med Confidence: {st.confidence}%{" "}
                    {isCriticalOverall && (
                      <span className="critical-flag">CRITICAL</span>
                    )}
                  </strong>
                  <button
                    className="info-link"
                    onClick={() => toggleConfidenceExplanation(bf.id)}
                  >
                    (What does this mean?)
                  </button>
                  {isCriticalOverall && (
                    <div className="ai-confidence critical">
                      {st.confidence}% Critical
                    </div>
                  )}
                </div>
              )}

              {/* Confidence Explanation Popup */}
              {st.showConfidenceExplanation && (
                <div
                  className="explanation-popup"
                  onClick={() => toggleConfidenceExplanation(bf.id)}
                >
                  <div className="explanation-popup-content" onClick={(e) => e.stopPropagation()}>
                    <h4>Confidence Score Explanation</h4>
                    <p>
                      This score is based on an automated analysis of lesion shape, intensity, and location relative to large MRI datasets.
                    </p>
                    <p>
                      Scores above <strong>90%</strong> indicate potential urgency.
                    </p>
                    <button
                      className="close-popup-btn"
                      onClick={() => toggleConfidenceExplanation(bf.id)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* AI Pre-Analysis & Detailed Report Buttons */}
              <button
                className="pre-analysis-btn"
                onClick={() => handleAiPreAnalysis(bf.id)}
              >
                Preliminary Intelligent Analysis
              </button>
              <button
                className="pre-analysis-btn"
                onClick={() => handleGenerateDetailedReport(bf.id)}
              >
                Generate Detailed Radiology Report
              </button>

              {/* Differential Diagnosis Button */}
              <button
                className="consultation-btn"
                onClick={() => handleGenerateDifferentialDiagnosis(bf.id)}
              >
                Generate Differential Diagnosis
              </button>

              {/* Treatment Suggestions Button */}
              <button
                className="consultation-btn"
                onClick={() => handleSuggestTreatment(bf.id)}
              >
                Suggest Treatment Options
              </button>

              {/* Region details if analysis done */}
              {st.regionData.some((r) => r.confidence !== null) && (
                <div className="region-details">
                  <h5>Identified Regions (AI-Based)</h5>
                  <ul>
                    {st.regionData.map((r) => {
                      const conf = parseInt(r.confidence, 10) || 0;
                      return (
                        <li key={r.id}>
                          {r.name}: {r.confidence || "??"}
                          {r.critical && (
                            <span className="critical-flag"> (Critical)</span>
                          )}
                          <div className="region-confidence-bar">
                            <div
                              className={`region-confidence-fill ${conf < 70
                                  ? "low"
                                  : conf < 90
                                    ? "medium"
                                    : "high"
                                }`}
                              style={{ width: `${conf}%` }}
                            />
                          </div>
                          <button
                            className="info-link"
                            onClick={() => handleExplainRegion(bf.id, r.id)}
                          >
                            Explain Region
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* AI Consultation Section */}
              <div className="ai-consultation-section">
                <button
                  className="consultation-btn"
                  onClick={() => handleAiConsultation(bf.id)}
                >
                  ODOS Med Consultation
                </button>
                {st.aiStatus && (
                  <p
                    className={`ai-status ${st.aiStatus === "AI Consultation Complete"
                        ? "completed"
                        : ""
                      }`}
                  >
                    Status: {st.aiStatus}
                  </p>
                )}
                {st.isLoadingAi && <p className="loading-indicator">Loading AI...</p>}
                {st.aiError && (
                  <div className="ai-error">
                    <strong>Error:</strong> {st.aiError}
                  </div>
                )}
                {st.conversation.length > 0 && (
                  <div className="ai-conversation">
                    <h5>ODOS Med Consultation</h5>
                    {st.conversation
                      .filter((msg) => msg.role !== "system")
                      .map((msg, idx) => (
                        <div
                          key={idx}
                          className={`chat-message ${msg.role === "assistant" ? "assistant" : "user"
                            }`}
                        >
                          <strong>{msg.role === "assistant" ? "AI" : "You"}:</strong>{" "}
                          <span>{msg.content}</span>
                        </div>
                      ))}
                    {st.conversation[st.conversation.length - 1]?.role === "assistant" &&
                      !st.aiFeedback && (
                        <div className="feedback-buttons">
                          <button onClick={() => handleAiFeedback(bf.id, "like")}>👍 Like</button>
                          <button onClick={() => handleAiFeedback(bf.id, "dislike")}>👎 Dislike</button>
                        </div>
                      )}
                    {st.aiFeedback && (
                      <p className="ai-feedback-confirm">
                        <em>You marked this AI response as: {st.aiFeedback}</em>
                      </p>
                    )}
                    <div className="follow-up-box">
                      <label>Continue Conversation:</label>
                      <input
                        type="text"
                        placeholder="Ask follow-up..."
                        value={st.followUpQuestion}
                        onChange={(e) =>
                          updateFileState(bf.id, { followUpQuestion: e.target.value })
                        }
                      />
                      <button
                        className="follow-up-button"
                        onClick={() => handleFollowUp(bf.id)}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Disclaimer Section */}
      <div className="disclaimer-section">
        <h4>Important Notes & Next Steps</h4>
        <ul>
          <li>
            <strong>Actionable Follow-Up:</strong> Urgency is required when lesions are flagged as 'critical'.
          </li>
          <li>
            <strong>Ongoing Monitoring:</strong> Schedule periodic scans to monitor changes over time.
          </li>
          <li>
            <strong>Disclaimer:</strong> This AI tool is for informational purposes only. Final decisions must be made by a licensed professional.
          </li>
          <li>
            <strong>Guidelines:</strong> Always follow clinical guidelines and local regulations when interpreting AI outputs.
          </li>
        </ul>
      </div>

      {/* Detailed Report Modal */}
      {showReportModal && currentReportFileId !== null && (() => {
        const currentFileState = fileStates.find((f) => f.fileId === currentReportFileId);
        return (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowReportModal(false);
              setCurrentReportFileId(null);
            }}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detailed Radiology Report</h2>
                <button className="print-report-link" onClick={handlePrintReport}>
                  Print
                </button>
              </div>
              <div style={{ textAlign: "left", maxHeight: "600px", overflowY: "auto" }}>
                <textarea
                  value={currentFileState?.detailedReport || ""}
                  onChange={(e) =>
                    updateFileState(currentReportFileId, { detailedReport: e.target.value })
                  }
                  style={{
                    width: "100%",
                    height: "500px",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    fontSize: "16px",
                    lineHeight: 1.5,
                  }}
                />
              </div>
              <div className="modal-actions">
                <button
                  className="close-modal-button"
                  onClick={() => {
                    setShowReportModal(false);
                    setCurrentReportFileId(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
