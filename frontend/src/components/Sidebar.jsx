import React from "react";
import "../styles/sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <a href="/dashboard">Dashboard</a>
      <a href="/etudiants">Étudiants</a>
      <a href="/courses">Cours</a>
      <a href="/notes">Notes</a>
    </div>
  );
};

export default Sidebar;
