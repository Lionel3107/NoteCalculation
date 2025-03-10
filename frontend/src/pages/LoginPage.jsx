import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/login.css"; // Utilisation du CSS existant
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Pour la visibilité du mot de passe
import Logo from "../assets/logo.jpg"; // Ajuste le chemin selon ton projet (par ex. "../assets/bit-logo.png")

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Réinitialiser l'erreur avant la tentative de connexion

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      setError("Échec de connexion. Vérifiez vos identifiants ou essayez à nouveau.");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo (remplace par ton logo "bit" ou ajuste le chemin) */}
        <img 
          src={Logo} // Ajuste le chemin selon ton projet (par ex. "../assets/bit-logo.png")
          alt="bit Logo" 
          className="login-logo" 
        />

        <h3 className="login-title">Login</h3>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="mb-3">
            <div className="form-label-group">
              <label className="form-label">Email Address</label>
            </div>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your Email Address" 
              required 
            />
          </div>

          <div className="mb-3">
            <div className="password-group">
              <label className="form-label">Password</label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password" 
                required 
              />
              <button 
                type="button" 
                className="password-toggle-btn" 
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"} // Accessibilité
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn">Log in</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;