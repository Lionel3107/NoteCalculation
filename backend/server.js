require("./models/Student"); // ✅ Charge le modèle Student
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Connexion à la base de données
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ➤ Appliquer les middlewares avant les routes
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Permet de lire les données de formulaire
app.use(cors());

app.get("/", (_req, res) => {
  res.send("✅ API de Gestion des Notes - Serveur en marche 🚀");
});

// ➤ Importation des routes
const studentRoutes = require("./routes/studentRoutes");
const moduleGlobalRoutes = require("./routes/moduleGlobalRoutes");
const semestreRoutes = require("./routes/semestreRoutes");
const departementRoutes = require("./routes/departementRoutes");
const noteRoutes = require("./routes/noteRoutes");


// ➤ Enregistrement des routes
app.use("/api/students", studentRoutes);
app.use("/api/modules-globales", moduleGlobalRoutes);
app.use("/api/semestres", semestreRoutes);
app.use("/api/departements", departementRoutes);
app.use("/api/notes", noteRoutes);

// ➤ Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
