const express = require("express");
const User = require("../models/User");
const { verifyToken, isChefDepartement } = require("../middlewares/authMiddleware");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const router = express.Router();

// ➤ Affecter un module à un Professeur (Réservé aux Chefs de Département)
router.put("/assign-sousmodule/:professeurId", verifyToken, isChefDepartement, async (req, res) => {
    try {
      const { professeurId } = req.params;
      const { sousModuleCode } = req.body;
  
      const professeur = await User.findById(professeurId);
      if (!professeur || professeur.role !== "Professeur") {
        return res.status(404).json({ message: "Professeur non trouvé." });
      }
  
      // Vérifier si le chef de département essaie d'affecter un sous-module en dehors de son département
      if (!req.user.departementCode || professeur.departementCode !== req.user.departementCode) {
        return res.status(403).json({ message: "Accès interdit. Vous ne pouvez assigner que des sous-modules de votre département." });
      }
  
      // Vérifier si le sous-module n'est pas déjà affecté
      if (professeur.sousModulesEnseignes.includes(sousModuleCode)) {
        return res.status(400).json({ message: "Ce sous-module est déjà assigné à ce professeur." });
      }
  
      professeur.sousModulesEnseignes.push(sousModuleCode);
      await professeur.save();
  
      res.json({ message: `Sous-module ${sousModuleCode} assigné avec succès à ${professeur.nom}.` });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// ➤ Ajouter un Professeur (Réservé aux Chefs de Département)
router.post("/add-professeur", verifyToken, isChefDepartement, async (req, res) => {
    try {
      const { nom, prenom, email, password, departementCode } = req.body;
  
      // Vérifier si l'email est déjà utilisé
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Cet email est déjà utilisé." });
  
      // Vérifier que le chef de département ne crée pas un professeur pour un autre département
      if (req.user.departementCode !== departementCode) {
        return res.status(403).json({ message: "Vous ne pouvez ajouter des professeurs que pour votre département." });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const professeur = new User({ nom, prenom, email, password: hashedPassword, role: "Professeur", departementCode });
  
      await professeur.save();
      res.status(201).json({ message: "Professeur ajouté avec succès." });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });



// Modifier un professeur
  router.put("/update-professeur/:professeurId", verifyToken, isChefDepartement, async (req, res) => {
    try {
      const { professeurId } = req.params;
      const { nom, prenom, email } = req.body;
  
      // Vérifier si l'ID est valide
      if (!mongoose.Types.ObjectId.isValid(professeurId)) {
        return res.status(400).json({ message: "ID du professeur invalide." });
      }
  
      const professeur = await User.findById(professeurId);
      if (!professeur || professeur.role !== "Professeur") {
        return res.status(404).json({ message: "Professeur non trouvé." });
      }
  
      // Vérifier que le professeur appartient bien au département du chef de département
      if (professeur.departementCode !== req.user.departementCode) {
        return res.status(403).json({ message: "Vous ne pouvez modifier que les professeurs de votre département." });
      }
  
      professeur.nom = nom || professeur.nom;
      professeur.prenom = prenom || professeur.prenom;
      professeur.email = email || professeur.email;
  
      await professeur.save();
      res.json({ message: "Professeur mis à jour avec succès." });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });  

  router.delete("/delete-professeur/:professeurId", verifyToken, isChefDepartement, async (req, res) => {
    try {
      const { professeurId } = req.params;
  
      const professeur = await User.findById(professeurId);
      if (!professeur || professeur.role !== "Professeur") {
        return res.status(404).json({ message: "Professeur non trouvé." });
      }
  
      // Vérifier que le professeur appartient bien au département du chef de département
      if (professeur.departementCode !== req.user.departementCode) {
        return res.status(403).json({ message: "Vous ne pouvez supprimer que les professeurs de votre département." });
      }
  
      await professeur.deleteOne();
      res.json({ message: "Professeur supprimé avec succès." });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });



module.exports = router;
