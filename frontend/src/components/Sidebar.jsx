import React from "react";
import { NavLink } from "react-router-dom"; // Pour la navigation React
import { Home, Users, User, BookOpen, FileText, Calendar, BarChart, Settings } from 'lucide-react'; // Icônes
import "../styles/sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")} end>
        <Home size={18} /> Tableau de bord
      </NavLink>
      <NavLink to="/etudiants" className={({ isActive }) => (isActive ? "active" : "")}>
        <Users size={18} /> Étudiants
      </NavLink>
      <NavLink to="/professeurs" className={({ isActive }) => (isActive ? "active" : "")}>
        <User size={18} /> Professeurs
      </NavLink>
      <NavLink to="/courses" className={({ isActive }) => (isActive ? "active" : "")}>
        <BookOpen size={18} /> Cours
      </NavLink>
      <NavLink to="/notes" className={({ isActive }) => (isActive ? "active" : "")}>
        <FileText size={18} /> Notes
      </NavLink>
      <NavLink to="/presence" className={({ isActive }) => (isActive ? "active" : "")}>
        <Calendar size={18} /> Présence
      </NavLink>
      <NavLink to="/rapports" className={({ isActive }) => (isActive ? "active" : "")}>
        <BarChart size={18} /> Rapports
      </NavLink>
      <NavLink to="/parametres" className={({ isActive }) => (isActive ? "active" : "")}>
        <Settings size={18} /> Paramètres
      </NavLink>
    </div>
  );
};

export default Sidebar;