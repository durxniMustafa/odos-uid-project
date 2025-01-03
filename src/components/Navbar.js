import React, { useState } from "react";
import "../styles/Navbar.css";
import logo from "../assets/logo.png"; // Ensure the correct path to your logo
import { FaRegUserCircle } from "react-icons/fa";
import { IoIosNotifications } from "react-icons/io";

function Navbar() {
    const [isMoreOpen, setMoreOpen] = useState(false);
    const [isProfileOpen, setProfileOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="navbar-logo-section">
                <img src={logo} alt="ODOS Logo" className="navbar-logo-image" />
                <h1 className="navbar-brand">ODOS</h1>
            </div>

            <ul className="navbar-links">
                <li>
                    <span title="View Patients">Patients</span>
                </li>
                <li>
                    <span title="View Results">Results</span>
                </li>
                <li>
                    <span title="Current Processes">Current Processes</span>
                </li>
                <li>
                    <span title="View Issues">Issues</span>
                </li>
                <li
                    className="navbar-dropdown"
                    onMouseEnter={() => setMoreOpen(true)}
                    onMouseLeave={() => setMoreOpen(false)}
                >
                    <span title="More Options">More ▾</span>
                    {isMoreOpen && (
                        <ul className="dropdown-menu">
                            <li>Settings</li>
                            <li>Help</li>
                            <li>Logout</li>
                        </ul>
                    )}
                </li>
            </ul>

            <div className="navbar-actions">
                <div className="navbar-actions-left">
                    <input type="text" className="navbar-search" placeholder="Search..." />
                    <span className="navbar-bell" title="Notifications">
                        <IoIosNotifications />
                        <span className="bell-count">3</span>
                    </span>
                </div>
                <div
                    className="navbar-profile-section"
                    onMouseEnter={() => setProfileOpen(true)}
                    onMouseLeave={() => setProfileOpen(false)}
                >
                    <span className="navbar-profile" title="User Profile">
                        <FaRegUserCircle />
                    </span>
                    {isProfileOpen && (
                        <ul className="profile-menu">
                            <li>My Profile</li>
                            <li>Accessibility</li>
                            <li>Logout</li>
                        </ul>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
