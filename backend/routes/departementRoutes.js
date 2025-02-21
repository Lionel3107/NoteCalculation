const express = require("express");
const Departement = require("../models/Departement");
const Semestre = require("../models/Semestre");
const Student = require("../models/Student"); // ✅ Vérifie bien cette ligne !

const router = express.Router();


// ➤ Ajouter un département
router.post("/", async (req, res) => {
  try {
    const departement = new Departement(req.body);
    await departement.save();
    res.status(201).json(departement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ➤ Récupérer tous les départements
router.get("/", async (req, res) => {
  try {
    const departements = await Departement.find().populate("semestres students");
    res.json(departements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer un département spécifique avec ses semestres et étudiants par niveau d'études
router.get("/:code/:niveau", async (req, res) => {
  try {
    const { code, niveau } = req.params;

    // Trouver le département
    const departement = await Departement.findOne({ code });
    if (!departement) return res.status(404).json({ message: "Département non trouvé" });

    // Récupérer les étudiants du département et du niveau spécifié
    const students = await Student.find({ departement: departement._id, niveau });

    res.json({ departement, students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
