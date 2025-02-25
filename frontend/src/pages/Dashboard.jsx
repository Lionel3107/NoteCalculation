import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div>
      <h2>Bienvenue, {user.role}</h2>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
};

export default Dashboard;
