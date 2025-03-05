import React from "react";
import AppRoutes from "./routes/AppRoutes.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ModuleGlobalForm from './components/ModuleGlobalForm';
import "./styles/global.css";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>

  );
}

export default App;
