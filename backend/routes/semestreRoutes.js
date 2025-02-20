const express = require("express");
const Semestre = require("../models/Semestre");

const router = express.Router();

// ➤ Ajouter un semestre avec des modules globaux
router.post("/", async (req, res) => {
  try {
    const semestre = new Semestre(req.body);
    await semestre.save();
    res.status(201).json(semestre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ➤ Récupérer tous les semestres
router.get("/", async (req, res) => {
  try {
    const semestres = await Semestre.find().populate("modulesGlobales");
    res.json(semestres);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer un semestre par numéro
router.get("/:numero", async (req, res) => {
  try {
    const semestre = await Semestre.findOne({ numero: req.params.numero }).populate("modulesGlobales");
    if (!semestre) return res.status(404).json({ message: "Semestre non trouvé" });
    res.json(semestre);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Mettre à jour un semestre
router.put("/:numero", async (req, res) => {
  try {
    const semestre = await Semestre.findOneAndUpdate(
      { numero: req.params.numero },
      req.body,
      { new: true }
    );
    if (!semestre) return res.status(404).json({ message: "Semestre non trouvé" });
    res.json(semestre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ➤ Supprimer un semestre
router.delete("/:numero", async (req, res) => {
  try {
    const semestre = await Semestre.findOneAndDelete({ numero: req.params.numero });
    if (!semestre) return res.status(404).json({ message: "Semestre non trouvé" });
    res.json({ message: "Semestre supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
