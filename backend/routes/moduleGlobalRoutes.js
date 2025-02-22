const express = require("express");
const ModuleGlobal = require("../models/ModuleGlobal");

const router = express.Router();

// ➤ Ajouter un module global avec sous-modules et département
router.post("/", async (req, res) => {
  try {
    const { nom, code, departementCode, niveau, sousModules, coefficientTotal, semestre } = req.body;

    console.log("📌 Requête reçue :", req.body);

    // Vérifier que tous les champs requis sont bien présents
    if (!nom || !code || !departementCode || !niveau || !sousModules || !coefficientTotal || !semestre) {
      return res.status(400).json({ message: "Données manquantes dans la requête. Assurez-vous de fournir tous les champs requis." });
    }

    // Vérifier que `sousModules` est bien un tableau et non vide
    if (!Array.isArray(sousModules) || sousModules.length === 0) {
      return res.status(400).json({ message: "Le champ `sousModules` est requis et doit contenir au moins un sous-module." });
    }

    const moduleGlobal = new ModuleGlobal({ nom, code, departementCode, niveau, sousModules, coefficientTotal, semestre });
    await moduleGlobal.save();
    res.status(201).json(moduleGlobal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// ➤ Récupérer tous les modules globaux
router.get("/", async (req, res) => {
  try {
    const modulesGlobales = await ModuleGlobal.find();
    res.json(modulesGlobales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer les modules globaux d'un département et d'un niveau
router.get("/:departement/:niveau", async (req, res) => {
  try {
    const { departement, niveau } = req.params;
    const modules = await ModuleGlobal.find({ departement, niveau });
    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer un module global par code dans un département et un niveau spécifique
router.get("/:departement/:niveau/:code", async (req, res) => {
  try {
    const { departement, niveau, code } = req.params;
    const module = await ModuleGlobal.findOne({ departement, niveau, code });
    if (!module) return res.status(404).json({ message: "Module global non trouvé" });
    res.json(module);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Mettre à jour un module global
router.put("/:code", async (req, res) => {
  try {
    const { sousModules, coefficientTotal } = req.body;

    const totalCoefficients = sousModules.reduce((sum, mod) => sum + mod.coefficient, 0);
    if (totalCoefficients !== coefficientTotal) {
      return res.status(400).json({ message: "Les coefficients des sous-modules ne correspondent pas au coefficient total." });
    }

    const moduleGlobal = await ModuleGlobal.findOneAndUpdate(
      { code: req.params.code },
      req.body,
      { new: true }
    );
    if (!moduleGlobal) return res.status(404).json({ message: "Module global non trouvé" });
    res.json(moduleGlobal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ➤ Supprimer un module global
router.delete("/:code", async (req, res) => {
  try {
    const moduleGlobal = await ModuleGlobal.findOneAndDelete({ code: req.params.code });
    if (!moduleGlobal) return res.status(404).json({ message: "Module global non trouvé" });
    res.json({ message: "Module global supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
