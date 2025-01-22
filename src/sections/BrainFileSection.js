import React, { useState } from "react";
import BrainViewer from "../pages/BrainViewer";
import "../styles/BrainFilesSection.css"; // Adjust if needed

// Example bounding box data
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

// Additional context for the AI prompt (like patient data)
const patientContext = {
    age: 55,
    gender: "Male",
    symptoms: ["headaches", "mild memory loss"],
    previousScanComparison: "Slight growth in lesion over past 3 months",
};

export default function BrainFilesSection({
    filteredBrainFiles,
    showReportButton,
    handleFeedback,
    handleGenerateReport,
}) {
    // Keep local state for each file
    const [fileStates, setFileStates] = useState(() =>
        filteredBrainFiles.map((bf) => ({
            fileId: bf.id,
            confidence: null,
            regionData: JSON.parse(JSON.stringify(defaultRegions)),
            annotationPoints: [],
            openAiResult: null,
            isLoadingAi: false,
            aiStatus: "",
            aiError: null,
            aiFeedback: null, // "like" or "dislike"
            showConfidencePopup: false, // toggles the "explanation" popup
        }))
    );

    if (filteredBrainFiles.length === 0) {
        return <p>No brain files found.</p>;
    }

    // Helpers
    const getFileState = (fileId) =>
        fileStates.find((s) => s.fileId === fileId) || null;

    const updateFileState = (fileId, newData) => {
        setFileStates((prev) =>
            prev.map((f) => (f.fileId === fileId ? { ...f, ...newData } : f))
        );
    };

    /** 1) Analyze MRI => random 60-100 confidence + region data */
    const handleAnalyzeMRI = (fileId) => {
        const st = getFileState(fileId);
        if (!st) return;

        const randomOverall = Math.floor(Math.random() * 41) + 60; // 60-100
        const updatedRegions = st.regionData.map((r) => {
            const regionConf = Math.floor(Math.random() * 41) + 60;
            const isCritical = regionConf > 90;
            return {
                ...r,
                confidence: `${regionConf}%`,
                critical: isCritical,
            };
        });

        updateFileState(fileId, {
            confidence: randomOverall,
            regionData: updatedRegions,
        });
    };

    /** 2) Ask AI => structured response */
    const handleAskAI = async (fileId) => {
        const st = getFileState(fileId);
        if (!st) return;

        updateFileState(fileId, {
            isLoadingAi: true,
            openAiResult: null,
            aiStatus: "Connecting to OpenAI...",
            aiError: null,
        });

        const regionInfo = st.regionData
            .map((r) => `${r.name} => ${r.confidence}`)
            .join(", ");

        const prompt = `
You are an AI summarizing MRI findings. The patient is ${patientContext.age} years old, ${patientContext.gender}, 
with symptoms: ${patientContext.symptoms.join(", ")}.
Comparison to previous scan: ${patientContext.previousScanComparison}.

Current MRI details:
- Overall AI Confidence: ${st.confidence}%
- Regions: ${regionInfo}

Please provide a structured summary with:
1) Key Findings,
2) Recommendations,
3) Further Evaluations needed.

(Disclaimer: This is a demo, not real medical advice.)
    `.trim();

        try {
            updateFileState(fileId, { aiStatus: "Generating response..." });
            const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 200,
                }),
            });

            if (!response.ok) {
                let errorMsg = "Network Error or Invalid API Key.";
                if (response.status === 401) {
                    errorMsg = "Unauthorized (check your OpenAI API key).";
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            const aiText = data.choices?.[0]?.message?.content || "No response";
            const structured = parseStructuredAi(aiText);

            updateFileState(fileId, {
                isLoadingAi: false,
                openAiResult: structured,
                aiStatus: "Response Ready",
            });
        } catch (err) {
            console.error("OpenAI error:", err);
            updateFileState(fileId, {
                isLoadingAi: false,
                openAiResult: null,
                aiError: err.message || "Error calling OpenAI.",
                aiStatus: "Error",
            });
        }
    };

    // Parse GPT output for (1) findings, (2) recs, (3) further eval
    const parseStructuredAi = (rawText) => {
        const findingsMatch = rawText.match(/1\)([\s\S]*?)(?=\n2\)|$)/);
        const recsMatch = rawText.match(/2\)([\s\S]*?)(?=\n3\)|$)/);
        const furtherMatch = rawText.match(/3\)([\s\S]*?$)/);

        return {
            raw: rawText.trim(),
            findings: findingsMatch ? findingsMatch[1].trim() : null,
            recommendations: recsMatch ? recsMatch[1].trim() : null,
            furtherEvaluations: furtherMatch ? furtherMatch[1].trim() : null,
        };
    };

    /** 3) AI Feedback => like/dislike */
    const handleAiFeedback = (fileId, feedback) => {
        updateFileState(fileId, { aiFeedback: feedback });
        console.log(`Feedback on file ${fileId}: ${feedback}`);
    };

    /** Confidence Explanation popup toggler */
    const toggleConfidenceExplanation = (fileId) => {
        const st = getFileState(fileId);
        if (!st) return;
        updateFileState(fileId, {
            showConfidencePopup: !st.showConfidencePopup,
        });
    };

    return (
        <div className="brain-files-section">
            {filteredBrainFiles.map((bf) => {
                const st = getFileState(bf.id);
                if (!st) return null;

                const isCriticalOverall = st.confidence && Number(st.confidence) > 90;

                return (
                    <div
                        key={bf.id}
                        className={`brain-file-card ${isCriticalOverall ? "critical-card" : ""}`}
                    >
                        {/* Left: BrainViewer with pseudo heatmaps & annotations */}
                        <div className="brain-file-card-left">
                            <div className="brain-viewer-wrapper">
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
                        </div>

                        {/* Right: Confidence + AI info */}
                        <div className="brain-file-card-right">
                            <h4 className="brain-file-name">File: {bf.name}</h4>

                            {st.confidence === null ? (
                                <p className="confidence-hint">
                                    Click <strong>Analyze MRI</strong> to get a confidence score.
                                </p>
                            ) : (
                                <p className="confidence-score">
                                    <strong>AI Confidence:</strong> {st.confidence}%
                                    {isCriticalOverall && <span className="critical-flag"> CRITICAL</span>}
                                </p>
                            )}

                            <button className="analyze-btn" onClick={() => handleAnalyzeMRI(bf.id)}>
                                Analyze MRI
                            </button>

                            {/* Region details + mini graph bars */}
                            {st.regionData.some((r) => r.confidence) && (
                                <div className="detected-regions">
                                    <h5>Detected Regions</h5>
                                    <ul>
                                        {st.regionData.map((r) => {
                                            const regionConf = parseInt(r.confidence, 10);
                                            return (
                                                <li key={r.id}>
                                                    {r.name}: {r.confidence || "??"}
                                                    {r.critical && <span className="region-critical"> (Critical)</span>}
                                                    <div className="region-confidence-bar">
                                                        <div
                                                            className="region-confidence-fill"
                                                            style={{ width: `${regionConf || 0}%` }}
                                                        />
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {/* Confidence Explanation Button */}
                            {st.confidence !== null && (
                                <button
                                    className="explanation-btn"
                                    onClick={() => toggleConfidenceExplanation(bf.id)}
                                >
                                    Confidence Explanation
                                </button>
                            )}
                            {/* Popup for explanation */}
                            {st.showConfidencePopup && (
                                <div className="explanation-popup">
                                    <div className="explanation-popup-content">
                                        <h4>Confidence Score Explanation</h4>
                                        <p>
                                            The AI confidence score is based on comparing detected
                                            abnormalities to a large dataset of known cases, factoring in lesion
                                            shape, intensity, and location. Higher percentages indicate a stronger
                                            likelihood of abnormal findings.
                                        </p>
                                        <p>
                                            Any score above <strong>90%</strong> is flagged as “critical”
                                            and may warrant urgent medical review.
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

                            {/* AI Section */}
                            <div className="ask-ai-container">
                                <button className="ask-ai-btn" onClick={() => handleAskAI(bf.id)}>
                                    Ask AI
                                </button>
                                {st.aiStatus && <p className="ai-status">{st.aiStatus}</p>}
                                {st.isLoadingAi && <p className="ask-ai-status">Loading...</p>}
                                {st.aiError && (
                                    <div className="ai-error">
                                        <strong>Error: </strong>
                                        {st.aiError}
                                    </div>
                                )}

                                {st.openAiResult && (
                                    <div className="ask-ai-result">
                                        <strong>AI Summary:</strong>
                                        {st.openAiResult.findings && (
                                            <p>
                                                <strong>Key Findings:</strong> {st.openAiResult.findings}
                                            </p>
                                        )}
                                        {st.openAiResult.recommendations && (
                                            <p>
                                                <strong>Recommendations:</strong> {st.openAiResult.recommendations}
                                            </p>
                                        )}
                                        {st.openAiResult.furtherEvaluations && (
                                            <p>
                                                <strong>Further Evaluations:</strong>{" "}
                                                {st.openAiResult.furtherEvaluations}
                                            </p>
                                        )}
                                        {!st.openAiResult.findings &&
                                            !st.openAiResult.recommendations &&
                                            !st.openAiResult.furtherEvaluations && (
                                                <p>{st.openAiResult.raw}</p>
                                            )}

                                        {/* AI Feedback */}
                                        {!st.aiFeedback ? (
                                            <div className="ai-feedback-buttons">
                                                <button onClick={() => handleAiFeedback(bf.id, "like")}>👍 Like</button>
                                                <button onClick={() => handleAiFeedback(bf.id, "dislike")}>
                                                    👎 Dislike
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="ai-feedback-confirm">
                                                You marked this AI response as: <strong>{st.aiFeedback}</strong>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
