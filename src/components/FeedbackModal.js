import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";

function FeedbackModal({ open, onClose, patientId, fileId }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");
    const [flag, setFlag] = useState(false);

    useEffect(() => {
        if (!open) {
            // Reset when closed
            setRating(0);
            setHover(0);
            setComment("");
            setFlag(false);
        }
    }, [open]);

    const submitFeedback = () => {
        const feedbackData = {
            patientId,
            fileId,
            rating,
            comment,
            flagged: flag,
            timestamp: new Date().toISOString()
        };
        const savedFeedback = JSON.parse(localStorage.getItem("feedback") || "[]");
        savedFeedback.push(feedbackData);
        localStorage.setItem("feedback", JSON.stringify(savedFeedback));
        onClose(true);
    };

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={() => onClose(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Provide Feedback</h2>
                <p>Please rate and optionally comment on the prediction.</p>
                <div className="rating-section">
                    {[...Array(5)].map((_, i) => {
                        const ratingValue = i + 1;
                        return (
                            <label key={ratingValue}>
                                <input
                                    type="radio"
                                    style={{ display: 'none' }}
                                    name="rating"
                                    value={ratingValue}
                                    onClick={() => setRating(ratingValue)}
                                />
                                <FaStar
                                    size={24}
                                    color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                                    onMouseEnter={() => setHover(ratingValue)}
                                    onMouseLeave={() => setHover(0)}
                                    style={{ cursor: "pointer", marginRight: 5 }}
                                />
                            </label>
                        );
                    })}
                </div>
                <textarea
                    placeholder="Leave a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ width: "100%", minHeight: "80px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #ccc", padding: "10px" }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                    <input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} />
                    Flag this prediction for retraining
                </label>
                <div className="modal-actions">
                    <button className="primary-button" onClick={submitFeedback}>Submit</button>
                    <button className="secondary-button" onClick={() => onClose(false)}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default FeedbackModal;
