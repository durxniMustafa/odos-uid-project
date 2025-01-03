import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import "../styles/Dashboard.css";

function MetricsDashboard() {
    const [feedback, setFeedback] = useState([]);
    const [flaggedCount, setFlaggedCount] = useState(0);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        const storedFeedback = JSON.parse(localStorage.getItem("feedback") || "[]");
        setFeedback(storedFeedback);
        const flagged = storedFeedback.filter(f => f.flagged).length;
        setFlaggedCount(flagged);
        if (storedFeedback.length > 0) {
            const avg = storedFeedback.reduce((acc, cur) => acc + cur.rating, 0) / storedFeedback.length;
            setAverageRating(avg.toFixed(1));
        }
    }, []);

    return (
        <div className="dashboard-fullscreen">
            <Navbar />
            <div className="dashboard-content">
                <h2 style={{ color: "#6a1b9a", marginBottom: "20px" }}>Metrics Dashboard</h2>
                <div className="metrics-cards">
                    <div className="metric-card">
                        <h3>Flagged Predictions</h3>
                        <p>{flaggedCount}</p>
                    </div>
                    <div className="metric-card">
                        <h3>Average Rating</h3>
                        <p>{feedback.length > 0 ? averageRating : "N/A"}</p>
                    </div>
                    <div className="metric-card">
                        <h3>Total Feedback Entries</h3>
                        <p>{feedback.length}</p>
                    </div>
                </div>

                <div style={{ marginTop:"40px" }}>
                    <h3>Feedback Details</h3>
                    {feedback.length === 0 && <p>No feedback available.</p>}
                    {feedback.length > 0 && (
                        <table className="metrics-table">
                            <thead>
                                <tr>
                                    <th>Patient ID</th>
                                    <th>File ID</th>
                                    <th>Rating</th>
                                    <th>Flagged</th>
                                    <th>Comment</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feedback.map((f, i) => (
                                    <tr key={i}>
                                        <td>{f.patientId}</td>
                                        <td>{f.fileId}</td>
                                        <td>{f.rating}</td>
                                        <td>{f.flagged ? "Yes" : "No"}</td>
                                        <td>{f.comment || "N/A"}</td>
                                        <td>{new Date(f.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MetricsDashboard;
