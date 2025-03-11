import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import Dashboard from "../pages/Dashboard";
import Etudiants from "../pages/Etudiants";
import Notes from "../pages/Notes";
import Teachers from "../pages/Teachers";


const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/etudiants" element={<Etudiants />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/teachers" element={< Teachers/>} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
