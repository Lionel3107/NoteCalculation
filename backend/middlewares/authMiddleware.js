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
  