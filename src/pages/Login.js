// src/pages/Login.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import logo from "../assets/logo.png"; // Updated import of the logo

function Login() {
    const [klinikumId, setKlinikumId] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    // Enforce alphanumeric input for Klinikum ID
    const handleKlinikumIdChange = (e) => {
        const value = e.target.value;
        if (/^[a-zA-Z0-9]*$/.test(value)) {
            setKlinikumId(value);
            setErrorMessage("");
        } else {
            setErrorMessage("Only alphanumeric characters are allowed!");
        }
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!klinikumId) {
            setErrorMessage("Klinikum ID is required!");
            return;
        }
        if (!password) {
            setErrorMessage("Password is required!");
            return;
        }

        // Simulate successful login
        console.log("Login successful:", { klinikumId, password });

        // Clear fields and errors
        setKlinikumId("");
        setPassword("");
        setErrorMessage("");

        // Redirect to Dashboard
        navigate("/dashboard");
    };

    return (
        <div className="login-container">
            {/* Left Section with white background and logo */}
            <div className="login-image">
                <img src={logo} alt="Login visual" />
            </div>

            {/* Right Section with the Login Form */}
            <div className="login-form">
                <h1>Access to ODOS MED</h1>
                <form onSubmit={handleSubmit}>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}

                    <label htmlFor="klinikumId">Klinikum ID</label>
                    <input
                        type="text"
                        id="klinikumId"
                        placeholder="Type Klinikum ID"
                        value={klinikumId}
                        onChange={handleKlinikumIdChange}
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        placeholder="Your password"
                        value={password}
                        onChange={handlePasswordChange}
                    />

                    <div className="login-links">
                        <a href="#">Forgot password?</a>
                    </div>

                    <button type="submit" className="login-button">
                        Login
                    </button>
                </form>

                <div className="signup-link">
                    New to ODOS MED? <a href="#">Create an account</a>
                </div>
            </div>
        </div>
    );
}

export default Login;
