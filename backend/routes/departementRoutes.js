const express = require("express");
const Departement = require("../models/Departement");
const Semestre = require("../models/Semestre");
const Student = require("../models/Student"); // ✅ Vérifie bien cette ligne !
const ModuleGlobal = require("../models/ModuleGlobal");


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
    
    const departement = await Departement.findOne({ code })
      .populate({
        path: "students",
        match: { niveau }
      });

    if (!departement) {
      return res.status(404).json({ message: "Département non trouvé" });
    }

    res.json(departement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer les étudiants d’un département, d’un niveau et d’un semestre
router.get("/:code/:niveau/semestre/:semestreNumero/etudiants", async (req, res) => {
  try {
    const { code, niveau, semestreNumero } = req.params;

    console.log(`📌 Vérification du semestre : Département: ${code}, Niveau: ${niveau}, Semestre: ${semestreNumero}`);

    // Vérifier si le semestre existe
    const semestre = await Semestre.findOne({ numero: parseInt(semestreNumero) });

    if (!semestre) {
      console.log("❌ Semestre introuvable !");
      return res.status(404).json({ message: "Semestre non trouvé" });
    }

    // Trouver les étudiants du département et du niveau donné
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

//Récupération des modules globaux liés au département et au semestre demandé.
router.get("/:code/:niveau/semestre/:semestreNumero/modules", async (req, res) => {
  try {
    const { code, niveau, semestreNumero } = req.params;

    console.log(`📌 Récupération des étudiants et leurs modules pour Département: ${code}, Niveau: ${niveau}, Semestre: ${semestreNumero}`);

    // Vérifier si le semestre existe
    const semestre = await Semestre.findOne({ numero: parseInt(semestreNumero) });
    if (!semestre) {
      console.log("❌ Semestre introuvable !");
      return res.status(404).json({ message: "Semestre non trouvé" });
    }

    // Trouver les étudiants du département et du niveau donné
    const students = await Student.find({ departementCode: code, niveau });

    if (students.length === 0) {
      console.log("❌ Aucun étudiant trouvé !");
      return res.status(404).json({ message: "Aucun étudiant trouvé pour ce département et ce niveau" });
    }

    // Trouver les modules globaux liés à ce département et semestre
    const modules = await ModuleGlobal.find({ departementCode: code, semestre: semestreNumero });

    if (modules.length === 0) {
      console.log("❌ Aucun module trouvé !");
      return res.status(404).json({ message: "Aucun module trouvé pour ce département et ce semestre" });
    }

    res.json({ departement: code, niveau, semestreNumero, students, modules });
  } catch (error) {
    console.error("❌ Erreur :", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
