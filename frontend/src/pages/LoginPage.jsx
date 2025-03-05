import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css"; // Importation du CSS
import Logo from "../assets/logo.jpg";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (email === "admin@example.com" && password === "password123") {
      navigate("/upload"); // Redirection après connexion réussie
    } else {
      setError("Identifiants incorrects !");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <img src={Logo} alt="Logo" className="login-logo" />

        <h3 className="login-title">Login</h3>

        {/* Message d'erreur */}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email Address"
            />
          </div>

          {/* Mot de passe */}
          <div className="mb-3">
            <a className="forgot-password" href="#">Forgot password?</a>
            <label className="form-label">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"} // Accessibility
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Bouton de connexion */}
          <button type="submit" className="login-btn w-100">
            Log in
          </button>
        </form>

        {/* Lien vers l'inscription */}
        <p className="login-link">
          Don't have an account? <a href="/register">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;