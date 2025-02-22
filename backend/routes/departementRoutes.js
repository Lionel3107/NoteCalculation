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
// =================================================================
router.get("/:code/:niveau", async (req, res) => {
  try {
    const { code, niveau } = req.params;

    // Récupérer les étudiants du département et du niveau donné
    const students = await Student.find({ departementCode: code, niveau });

    res.json({ departement: code, niveau, students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer les étudiants d’un département, d’un niveau et d’un semestre
router.get("/:code/:niveau/semestre/:semestreNumero/etudiants", async (req, res) => {
  try {
    const { code, niveau, semestreNumero } = req.params;

    console.log(`📌 Vérification du semestre : ${code}, ${niveau}, Semestre ${semestreNumero}`);

    // Convertir semestreNumero en Number pour éviter les erreurs de type
    const semestre = await Semestre.findOne({ 
      numero: parseInt(semestreNumero), 
      departementCode: code, 
      niveau 
    });

    if (!semestre) {
      console.log("❌ Semestre introuvable !");
      return res.status(404).json({ message: "Semestre non trouvé pour ce département et niveau" });
    }

    // Récupérer les étudiants du département et du niveau donné
    const students = await Student.find({ departementCode: code, niveau });

    if (students.length === 0) {
      console.log("❌ Aucun étudiant trouvé !");
      return res.status(404).json({ message: "Aucun étudiant trouvé pour ce département et ce niveau" });
    }

    console.log(`✅ ${students.length} étudiants trouvés`);
    res.json({ departement: code, niveau, semestreNumero, students });
  } catch (error) {
    console.error("❌ Erreur :", error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
