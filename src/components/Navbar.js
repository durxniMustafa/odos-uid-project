// src/components/Navbar.js

import React from "react";
import "../styles/Navbar.css"; // Reference the CSS file
import logo from "../assets/logo.png"; // Import the default logo

function Navbar() {
    return (
        <nav className="navbar">
            {/* Left section with logo */}
            <div className="navbar-logo">
                <img src={logo} alt="ODOS Logo" className="navbar-logo-image" />
                <h1 className="navbar-brand">ODOS</h1>
            </div>

            {/* Center section with navbar links */}
            <ul className="navbar-links">
                <li>Patients</li>
                <li>Results</li>
                <li>Current Processes</li>
                <li>Issues</li>
            </ul>

            {/* Right section with profile icon */}
            <div className="navbar-actions">
                <span className="navbar-profile">👤</span>
            </div>
        </nav>
    );
}

export default Navbar;
