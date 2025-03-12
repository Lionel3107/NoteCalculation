// backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SousModule = require('../models/SousModule'); // Ajout pour valider sousModulesEnseignes
const { verifyToken, isDirecteur } = require('../middlewares/authMiddleware');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'secret_key';

// ➤ Inscription d’un utilisateur (réservée aux Directeurs)
router.post('/register', verifyToken, isDirecteur, async (req, res) => {
  try {
    const { nom, prenom, email, password, role, departementCode, sousModulesEnseignes } = req.body;

    // Validation des champs
    if (!nom || !prenom || !email || !password || !role || !departementCode) {
      return res.status(400).json({ message: 'Tous les champs (nom, prenom, email, password, role, departementCode) sont requis.' });
    }

    if (!['INFO', 'MECA', 'ELEC'].includes(departementCode)) {
      return res.status(400).json({ message: 'Code de département invalide. Valeurs possibles : INFO, MECA, ELEC.' });
    }

    if (!['Professeur', 'ChefDepartement', 'Directeur', 'Etudiant'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide. Valeurs possibles : Professeur, ChefDepartement, Directeur, Etudiant.' });
    }

    // Vérifier si l'email est déjà utilisé
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Vérifier que les sous-modules assignés existent (si fournis)
    if (sousModulesEnseignes && sousModulesEnseignes.length > 0) {
      const sousModules = await SousModule.find({ code: { $in: sousModulesEnseignes } });
      if (sousModules.length !== sousModulesEnseignes.length) {
        return res.status(400).json({ message: 'Certains sous-modules spécifiés n’existent pas.' });
      }

      // Vérifier que les sous-modules appartiennent au département de l'utilisateur
      const invalidSousModules = sousModules.filter((sm) => sm.departementCode !== departementCode);
      if (invalidSousModules.length > 0) {
        return res.status(400).json({
          message: 'Certains sous-modules n’appartiennent pas au département spécifié.',
          invalidSousModules: invalidSousModules.map((sm) => sm.code),
        });
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = new User({
      nom,
      prenom,
      email,
      password: hashedPassword,
      role,
      departementCode,
      sousModulesEnseignes: sousModulesEnseignes || [],
    });

    await user.save();
    res.status(201).json({ message: 'Utilisateur créé avec succès', user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    console.log('❌ Erreur lors de l’inscription :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Connexion d’un utilisateur
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        departementCode: user.departementCode,
        sousModulesEnseignes: user.sousModulesEnseignes || [],
      },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie.',
      token,
      user: { id: user._id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role },
    });
  } catch (error) {
    console.log('❌ Erreur lors de la connexion :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer les informations de l’utilisateur connecté
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.json(user);
  } catch (error) {
    console.log('❌ Erreur lors de la récupération de l’utilisateur :', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;