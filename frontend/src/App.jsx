import React from "react";
import AppRoutes from "./routes/AppRoutes.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles/global.css";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>

  );
}

export default App;
