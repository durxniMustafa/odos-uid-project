// src/App.js

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PatientDetail from "./pages/PatientDetail"; // Import PatientDetail
// ...existing code...
import { v4 as uuidv4 } from 'uuid';
// ...existing code...
function App() {
  const [patients, setPatients] = useState(() => {
    // Retrieve patients from localStorage if available
    const savedPatients = localStorage.getItem("patients");
    return savedPatients
      ? JSON.parse(savedPatients)
      : [
          {
            id: uuidv4(),
            name: "Yamini Gowda",
            email: "yamini_gowda@home.com",
            dob: "2020-12-10",
            phone: "+91 9788399999",
            address:
              "Kisan Vihar Ext, Nr Daharkar Wadi Bunder Pakhadi Rd, Kandivli, Alwar",
            photo: "https://via.placeholder.com/100",
            brainFiles: [],
            uploadProgress: {},
          },
        ];
  });

  // Persist patients to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("patients", JSON.stringify(patients));
  }, [patients]);

  return (
    <Router>
      <Routes>
        {/* Redirect root to /dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard Route */}
        <Route
          path="/dashboard"
          element={<Dashboard patients={patients} setPatients={setPatients} />}
        />

        {/* Patient Detail Route */}
        <Route
          path="/patient/:id"
          element={<PatientDetail patients={patients} setPatients={setPatients} />}
        />

        {/* Fallback Route for Undefined Paths */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
