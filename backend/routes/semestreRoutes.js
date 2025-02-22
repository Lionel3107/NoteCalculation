const express = require("express");
const Semestre = require("../models/Semestre");
const ModuleGlobal = require("../models/ModuleGlobal");

const router = express.Router();

// ➤ Ajouter un semestre avec des modules globaux
router.post("/", async (req, res) => {
  try {
    const { numero, description } = req.body;

    // Vérifier si le semestre existe déjà
    const existingSemestre = await Semestre.findOne({ numero });
    if (existingSemestre) return res.status(400).json({ message: "Ce semestre existe déjà." });

    // Création du semestre sans restriction de département et niveau
    const semestre = new Semestre({ numero, description });

    await semestre.save();
    res.status(201).json(semestre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 
router.put("/:semestreNumero/:departementCode/modules", async (req, res) => {
  try {
    const { semestreNumero, departementCode } = req.params;
    const { moduleCodes } = req.body;

    console.log(`📌 Ajout des modules au Semestre ${semestreNumero} pour le département ${departementCode}`);
    console.log(`📌 Données reçues :`, req.body);

    // Vérifier si le semestre existe
    const semestre = await Semestre.findOne({ numero: parseInt(semestreNumero) });
    if (!semestre) {
      return res.status(404).json({ message: "Semestre non trouvé" });
    }

    // Vérifier que les modules existent bien
    console.log(`📌 Recherche des modules avec codes :`, moduleCodes, "et departementCode :", departementCode);
    const modules = await ModuleGlobal.find({ code: { $in: moduleCodes }, departementCode: departementCode });

    console.log(`📌 Modules trouvés :`, modules);

    if (modules.length === 0) {
      return res.status(404).json({ message: "Aucun module global trouvé pour ce département" });
    }

    // Ajouter les modules au semestre
    semestre.modulesGlobales.push(...modules.map(m => m._id));
    await semestre.save();

    res.json({ message: "Modules ajoutés avec succès au semestre", semestre });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Récuperer les modules d'un département et d'un Semestre

router.get("/:semestreNumero/:departementCode/modules", async (req, res) => {
  try {
    const { semestreNumero, departementCode } = req.params;

    // Vérifier si le semestre existe
    const semestre = await Semestre.findOne({ numero: parseInt(semestreNumero) }).populate("modulesGlobales");
    if (!semestre) return res.status(404).json({ message: "Semestre non trouvé" });

    // Filtrer les modules spécifiques au département
    const modules = semestre.modulesGlobales.filter(m => m.departementCode === departementCode);

    if (modules.length === 0) return res.status(404).json({ message: "Aucun module trouvé pour ce département et semestre" });

    res.json({ semestre: semestreNumero, departement: departementCode, modules });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
