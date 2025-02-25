const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "Accès refusé" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide" });
  }
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
