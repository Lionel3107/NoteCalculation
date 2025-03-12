// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SousModule = require('../models/SousModule'); // Ajout pour valider les sous-modules
const { verifyToken, isChefDepartement } = require('../middlewares/authMiddleware');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// ➤ Affecter un sous-module à un Professeur (Réservé aux Chefs de Département)
router.put('/assign-sousmodule/:professeurId', verifyToken, isChefDepartement, async (req, res) => {
  try {
    const { professeurId } = req.params;
    const { sousModuleCode } = req.body;

    // Vérifier si les champs sont fournis
    if (!sousModuleCode) {
      return res.status(400).json({ message: 'Le code du sous-module est requis.' });
    }

    const professeur = await User.findById(professeurId);
    if (!professeur || professeur.role !== 'Professeur') {
      return res.status(404).json({ message: 'Professeur non trouvé.' });
    }

    // Vérifier que le professeur appartient au département du chef
    if (professeur.departementCode !== req.user.departementCode) {
      return res.status(403).json({ message: 'Accès interdit. Vous ne pouvez assigner que des professeurs de votre département.' });
    }

    // Vérifier si le sous-module existe et appartient au département du chef
    const sousModule = await SousModule.findOne({ code: sousModuleCode });
    if (!sousModule) {
      return res.status(404).json({ message: 'Sous-module non trouvé.' });
    }
    if (sousModule.departementCode !== req.user.departementCode) {
      return res.status(403).json({ message: 'Accès interdit. Ce sous-module n’appartient pas à votre département.' });
    }

    // Vérifier si le sous-module n’est pas déjà affecté
    if (professeur.sousModulesEnseignes.includes(sousModuleCode)) {
      return res.status(400).json({ message: 'Ce sous-module est déjà assigné à ce professeur.' });
    }

    professeur.sousModulesEnseignes.push(sousModuleCode);
    await professeur.save();

    res.json({ message: `Sous-module ${sousModuleCode} assigné avec succès à ${professeur.nom} ${professeur.prenom}.` });
  } catch (error) {
    console.log('❌ Erreur lors de l’affectation du sous-module :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Mettre à jour tous les sous-modules d’un Professeur (Réservé aux Chefs de Département)
router.put('/update-sousmodules/:professeurId', verifyToken, isChefDepartement, async (req, res) => {
  try {
    const { professeurId } = req.params;
    const { sousModulesEnseignes } = req.body;

    // Vérifier si les champs sont fournis
    if (!sousModulesEnseignes || !Array.isArray(sousModulesEnseignes)) {
      return res.status(400).json({ message: 'Les sous-modules doivent être fournis sous forme de tableau.' });
    }

    // Vérifier si l’ID est valide
    if (!mongoose.Types.ObjectId.isValid(professeurId)) {
      return res.status(400).json({ message: 'ID du professeur invalide.' });
    }

    const professeur = await User.findById(professeurId);
    if (!professeur || professeur.role !== 'Professeur') {
      return res.status(404).json({ message: 'Professeur non trouvé.' });
    }

    // Vérifier que le professeur appartient au département du chef
    if (professeur.departementCode !== req.user.departementCode) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que les professeurs de votre département.' });
    }

    console.log(`📌 Mise à jour des sous-modules du Professeur ${professeur.nom} ${professeur.prenom} (${professeurId})`);
    console.log(`📌 Nouveaux sous-modules :`, sousModulesEnseignes);

    // Vérifier que tous les sous-modules existent et appartiennent au département
    const sousModules = await SousModule.find({ code: { $in: sousModulesEnseignes } });
    if (sousModules.length !== sousModulesEnseignes.length) {
      return res.status(400).json({ message: 'Certains sous-modules spécifiés n’existent pas.' });
    }
    const invalidSousModules = sousModules.filter((sm) => sm.departementCode !== req.user.departementCode);
    if (invalidSousModules.length > 0) {
      return res.status(403).json({
        message: 'Certains sous-modules n’appartiennent pas à votre département.',
        invalidSousModules: invalidSousModules.map((sm) => sm.code),
      });
    }

    professeur.sousModulesEnseignes = sousModulesEnseignes;
    await professeur.save();

    res.json({ message: 'Sous-modules mis à jour avec succès.', professeur });
  } catch (error) {
    console.log('❌ Erreur lors de la mise à jour des sous-modules :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Ajouter un Professeur (Réservé aux Chefs de Département)
router.post('/add-professeur', verifyToken, isChefDepartement, async (req, res) => {
  try {
    const { nom, prenom, email, password, departementCode } = req.body;

    // Vérifier si les champs sont fournis
    if (!nom || !prenom || !email || !password || !departementCode) {
      return res.status(400).json({ message: 'Tous les champs (nom, prenom, email, password, departementCode) sont requis.' });
    }

    // Vérifier si l’email est déjà utilisé
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Vérifier que le chef de département ne crée pas un professeur pour un autre département
    if (req.user.departementCode !== departementCode) {
      return res.status(403).json({ message: 'Vous ne pouvez ajouter des professeurs que pour votre département.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const professeur = new User({ nom, prenom, email, password: hashedPassword, role: 'Professeur', departementCode });

    await professeur.save();
    res.status(201).json({ message: 'Professeur ajouté avec succès.', professeur: { id: professeur._id, email: professeur.email } });
  } catch (error) {
    console.log('❌ Erreur lors de l’ajout du professeur :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Modifier un professeur
router.put('/update-professeur/:professeurId', verifyToken, isChefDepartement, async (req, res) => {
  try {
    const { professeurId } = req.params;
    const { nom, prenom, email } = req.body;

    // Vérifier si l’ID est valide
    if (!mongoose.Types.ObjectId.isValid(professeurId)) {
      return res.status(400).json({ message: 'ID du professeur invalide.' });
    }

    const professeur = await User.findById(professeurId);
    if (!professeur || professeur.role !== 'Professeur') {
      return res.status(404).json({ message: 'Professeur non trouvé.' });
    }

    // Vérifier que le professeur appartient au département du chef
    if (professeur.departementCode !== req.user.departementCode) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que les professeurs de votre département.' });
    }

    // Mettre à jour les champs fournis
    professeur.nom = nom || professeur.nom;
    professeur.prenom = prenom || professeur.prenom;
    if (email && email !== professeur.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
      }
      professeur.email = email;
    }

    await professeur.save();
    res.json({ message: 'Professeur mis à jour avec succès.', professeur });
  } catch (error) {
    console.log('❌ Erreur lors de la mise à jour du professeur :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Supprimer un professeur
router.delete('/delete-professeur/:professeurId', verifyToken, isChefDepartement, async (req, res) => {
  try {
    const { professeurId } = req.params;

    const professeur = await User.findById(professeurId);
    if (!professeur || professeur.role !== 'Professeur') {
      return res.status(404).json({ message: 'Professeur non trouvé.' });
    }

    // Vérifier que le professeur appartient au département du chef
    if (professeur.departementCode !== req.user.departementCode) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que les professeurs de votre département.' });
    }

    await professeur.deleteOne();
    res.json({ message: 'Professeur supprimé avec succès.' });
  } catch (error) {
    console.log('❌ Erreur lors de la suppression du professeur :', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;