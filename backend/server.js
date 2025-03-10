require("./models/Student"); // ✅ Charge le modèle Student
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Middlewares personnalisés (si nécessaire)
const authMiddleware = require("./middlewares/authMiddleware");

// Connexion à la base de données
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ➤ Appliquer les middlewares avant les routes
app.use(express.json({ limit: '10kb' })); // Limiter la taille des corps de requête
app.use(express.urlencoded({ extended: true })); // Permet de lire les données de formulaire
app.use(cors({
  origin: 'http://localhost:5173', // Port de ton frontend Vite (ajuste si différent)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Endpoint de test
app.get("/", (_req, res) => {
  res.send("✅ API de Gestion des Notes - Serveur en marche 🚀");
});

// ➤ Importation des routes
const studentRoutes = require("./routes/studentRoutes");
const semestreRoutes = require("./routes/semestreRoutes");
const departementRoutes = require("./routes/departementRoutes");
const noteRoutes = require("./routes/noteRoutes");
const statsRoutes = require("./routes/statsRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

// ➤ Enregistrement des routes
app.use("/api/students", studentRoutes);
app.use('/api/modules', require('./routes/moduleRoutes'));
app.use("/api/semestres", semestreRoutes);
app.use("/api/departements", departementRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Middleware global pour gérer les erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} non trouvée` });
});

// ➤ Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});