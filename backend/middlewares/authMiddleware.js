const jwt = require("jsonwebtoken");


exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Récupérer le token

  console.log("🟢 Token reçu par le backend :", token); // 🔥 DEBUG

  if (!token) {
    return res.status(403).json({ message: "🔴 Aucun token fourni." });
  }

  if (!process.env.JWT_SECRET) {
    console.log("❌ ERREUR : JWT_SECRET n'est pas défini !");
    return res.status(500).json({ message: "🔴 Erreur serveur : JWT_SECRET non défini." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ Erreur de vérification du token :", err.message); // 🔥 DEBUG
      return res.status(401).json({ message: "🔴 Token invalide." });
    }
    req.user = user;
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
    if (req.user.role !== "Professeur") {
      return res.status(403).json({ message: "Accès interdit. Seuls les professeurs peuvent saisir des notes." });
    }

    // Vérifier si le professeur enseigne bien le sous-module
    const { sousModuleCode } = req.body;

    console.log("✅ Vérification du sous-module :", sousModuleCode);
    console.log("📌 Sous-modules assignés au professeur :", req.user.sousModulesEnseignes);

    if (!req.user.sousModulesEnseignes || !req.user.sousModulesEnseignes.includes(sousModuleCode)) {
      return res.status(403).json({ message: "Accès interdit. Vous ne pouvez saisir des notes que pour vos sous-modules assignés." });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
