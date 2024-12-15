import React from "react";
import "../styles/Notification.css";

function Notification({ message }) {
    return (
        <div className="notification">
            <p>{message}</p>
        </div>
    );
}

export default Notification;
