const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("🔍 Header Authorization reçu :", authHeader); // 🔥 DEBUG

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ Aucun token fourni !");
    return res.status(403).json({ message: "🔴 Aucun token fourni." });
  }

  const token = authHeader.split(" ")[1]; // Extraction du token
  console.log("🟢 Token extrait :", token); // 🔥 DEBUG

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("❌ Erreur de vérification du token :", err.message);
      return res.status(401).json({ message: "🔴 Token invalide." });
    }
    req.user = decoded;
    console.log("✅ Utilisateur authentifié :", req.user); // 🔥 DEBUG
    next();
  });
};

// ➤ Vérification des rôles
exports.isDirecteur = (req, res, next) => {
  if (req.user.role !== "Directeur") return res.status(403).json({ message: "Accès interdit" });
  next();
};

exports.isChefDepartement = (req, res, next) => {
  if (req.user.role !== "ChefDepartement") return res.status(403).json({ message: "Accès interdit" });
  next();
};

exports.isProfesseur = (req, res, next) => {
  if (req.user.role !== "Professeur") return res.status(403).json({ message: "Accès interdit" });
  next();
};

exports.isSecretaire = (req, res, next) => {
  if (req.user.role !== "Secretaire") return res.status(403).json({ message: "Accès interdit" });
  next();
};

// Ceux qui peuvent voir les notes
exports.canViewNotes = (req, res, next) => {
  const rolesAutorisés = ["Directeur", "ChefDepartement", "Professeur", "Secretaire"];
  if (!rolesAutorisés.includes(req.user.role)) {
    return res.status(403).json({ message: "Accès interdit. Vous n'êtes pas autorisé à consulter les notes." });
  }
  next();
};

exports.canEnterNotes = async (req, res, next) => {
  try {
    console.log("🟢 Utilisateur authentifié :", req.user);

    if (req.user.role !== "Professeur" && req.user.role !== "ChefDepartement") {
      console.log("❌ Accès refusé : utilisateur non autorisé.");
      return res.status(403).json({ message: "Accès interdit. Seuls les professeurs et chefs de département peuvent saisir des notes." });
    }

    // Récupérer sousModuleCode depuis le body (pour POST /api/sous-modules ou /api/notes)
    const sousModuleCode = req.body.sousModuleCode || req.body.sousModuleCode; // Peut être dans req.body ou req.params selon la route
    console.log("✅ Vérification du sous-module :", sousModuleCode);

    if (!sousModuleCode) {
      console.log("❌ ERREUR : Aucun sous-module reçu dans la requête !");
      return res.status(400).json({ message: "Erreur : Aucun sous-module spécifié." });
    }

    // Vérifier si sousModulesEnseignes existe et est un tableau
    console.log("📌 Sous-modules assignés à l'utilisateur (avant vérification) :", req.user.sousModulesEnseignes);
    if (!req.user.sousModulesEnseignes || !Array.isArray(req.user.sousModulesEnseignes)) {
      console.log("❌ ERREUR : sousModulesEnseignes non défini ou invalide pour l'utilisateur.");
      return res.status(403).json({ message: "Accès interdit. Vos sous-modules assignés ne sont pas configurés correctement." });
    }

    console.log("📌 Sous-modules assignés à l'utilisateur :", req.user.sousModulesEnseignes);

    if (!req.user.sousModulesEnseignes.includes(sousModuleCode)) {
      console.log(`❌ Accès refusé : L'utilisateur n'enseigne pas le sous-module ${sousModuleCode}.`);
      return res.status(403).json({ message: "Accès interdit. Vous ne pouvez saisir des notes que pour vos matières assignés." });
    }

    console.log("✅ Accès accordé !");
    next();
  } catch (error) {
    console.log("❌ ERREUR INTERNE :", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Ajouter authenticateToken comme export explicite
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("🔍 Header Authorization reçu (authenticateToken) :", authHeader); // 🔥 DEBUG

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ Aucun token fourni (authenticateToken) !");
    return res.status(403).json({ message: "🔴 Aucun token fourni." });
  }

  const token = authHeader.split(" ")[1]; // Extraction du token
  console.log("🟢 Token extrait (authenticateToken) :", token); // 🔥 DEBUG

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("❌ Erreur de vérification du token (authenticateToken) :", err.message);
      return res.status(401).json({ message: "🔴 Token invalide." });
    }
    req.user = decoded;
    console.log("✅ Utilisateur authentifié (authenticateToken) :", req.user); // 🔥 DEBUG
    next();
  });
};