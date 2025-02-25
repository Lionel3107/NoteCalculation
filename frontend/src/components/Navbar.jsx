import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/navbar.css"; // ✅ Importation du fichier CSS

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="navbar">
      <h1>Gestion des Notes</h1>
      {user && <button onClick={logout}>Déconnexion</button>}
    </div>
  );
};

export default Navbar;
