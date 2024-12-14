
import React, { useState } from "react";
import "../styles/Navbar.css"; // Reference the CSS file
import logo from "../assets/logo.png"; // Import the default logo

function Navbar() {
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setDropdownOpen(!isDropdownOpen);
    };

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
                <li className="navbar-dropdown" onClick={toggleDropdown}>
                    More
                    {isDropdownOpen && (
                        <ul className="dropdown-menu">
                            <li>Settings</li>
                            <li>Help</li>
                            <li>Logout</li>
                        </ul>
                    )}
                </li>
            </ul>

            {/* Right section with search bar and profile icon */}
            <div className="navbar-actions">
                <input type="text" className="navbar-search" placeholder="Search..." />
                <span className="navbar-profile">👤</span>
            </div>
        </nav>
    );
}

export default Navbar;