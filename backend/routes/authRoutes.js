const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "secret_key";

// ➤ Inscription d’un utilisateur (ADMIN UNIQUEMENT)
router.post("/register", async (req, res) => {
  try {
    const { nom, prenom, email, password, role, departementCode, matieresEnseignees } = req.body;

    // Vérifier si l'email est déjà utilisé
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Cet email est déjà utilisé." });

    // Hasher le mot de passe avant de le stocker
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ nom, prenom, email, password: hashedPassword, role, departementCode, matieresEnseignees });

    await user.save();
    res.status(201).json({ message: "Utilisateur créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Connexion d’un utilisateur
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // Vérifier si le mot de passe correspond
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect" });

    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, departementCode: user.departementCode },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
