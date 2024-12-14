// src/pages/Login.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css"; // Import the CSS file for styling
import logo from "../assets/logo.png"; // Correct import of the logo

function Login() {
    const [klinikumId, setKlinikumId] = useState(""); // State for Klinikum ID
    const [password, setPassword] = useState(""); // State for password
    const [errorMessage, setErrorMessage] = useState(""); // State for error message

    const navigate = useNavigate(); // Hook for navigation

    // Handle input change and enforce alphanumeric only for Klinikum ID
    const handleKlinikumIdChange = (e) => {
        const value = e.target.value;
        if (/^[a-zA-Z0-9]*$/.test(value)) {
            setKlinikumId(value);
            setErrorMessage(""); // Clear error message
        } else {
            setErrorMessage("Only alphanumeric characters are allowed!");
        }
    };

    // Handle password input change
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

        // Simulate login validation (can be replaced with API call)
        console.log("Login successful:", { klinikumId, password });

        // Clear the fields after submission
        setKlinikumId("");
        setPassword("");
        setErrorMessage(""); // Clear any error messages

        // Redirect to Dashboard
        navigate("/dashboard");
    };

    return (
        <div className="login-container">
            {/* Left section with an image */}
            <div className="login-image">
                <img src={logo} alt="Login visual" />
            </div>

            {/* Right section with the form */}
            <div className="login-form">
                <h1>Access to ODOS MED</h1>
                <form onSubmit={handleSubmit}>
                    {/* Klinikum ID Field */}
                    <label htmlFor="klinikumId">Klinikum ID</label>
                    <input
                        type="text"
                        id="klinikumId"
                        placeholder="Type Klinikum ID"
                        value={klinikumId}
                        onChange={handleKlinikumIdChange}
                    />
                    {errorMessage && klinikumId === "" && (
                        <p className="error-message">{errorMessage}</p>
                    )}

                    {/* Password Field */}
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        placeholder="Your password"
                        value={password}
                        onChange={handlePasswordChange}
                    />
                    {errorMessage && password === "" && (
                        <p className="error-message">{errorMessage}</p>
                    )}

                    {/* Forgot Password */}
                    <div className="login-links">
                        <a href="#">Forgot password?</a>
                    </div>

                    {/* Login Button */}
                    <button type="submit" className="login-button">
                        Login
                    </button>
                </form>

                {/* Create Account Link */}
                <div className="signup-link">
                    New to ODOS MED? <a href="#">Create an account</a>
                </div>
            </div>
        </div>
    );
}

export default Login;
