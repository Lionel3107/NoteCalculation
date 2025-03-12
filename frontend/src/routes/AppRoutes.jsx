import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import Dashboard from "../pages/Dashboard";
import Etudiants from "../pages/Etudiants";
import Notes from "../pages/Notes";



const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/etudiants" element={<Etudiants />} />
        <Route path="/notes" element={<Notes />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
