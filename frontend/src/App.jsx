// src/App.js
import React from "react";
import AppRoutes from "./routes/AppRoutes.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
// Supprimer l'import de ModuleGlobalForm s'il n'est pas utilisé
import "./styles/global.css";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;