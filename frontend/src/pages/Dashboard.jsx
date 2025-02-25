import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    navigate("/");
    return null;
  }
  <Sidebar />

  return (
    <div className="dashboard-container">
      <h2>Bienvenue, {user.role} 🎉</h2>
      <p>Gérez vos étudiants, cours et notes facilement.</p>
      <button className="logout-btn" onClick={logout}>Déconnexion</button>
    </div>
  );
};

export default Dashboard;
