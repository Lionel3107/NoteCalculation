// backend/routes/semestreRoutes.js
const express = require('express');
const router = express.Router();
const Semestre = require('../models/Semestre');
const Module = require('../models/Module'); // Remplacer ModuleGlobal par Module
const SousModule = require('../models/SousModule'); // Ajouter SousModule pour référence

// ➤ Ajouter un semestre
router.post('/', async (req, res) => {
  try {
    const { numero, description } = req.body;

    // Vérifier si le semestre existe déjà
    const existingSemestre = await Semestre.findOne({ numero: parseInt(numero) });
    if (existingSemestre) {
      return res.status(400).json({ message: 'Ce semestre existe déjà.' });
    }

    // Validation du numéro de semestre
    if (![1, 2, 3, 4, 5, 6].includes(parseInt(numero))) {
      return res.status(400).json({ message: 'Numéro de semestre invalide. Valeurs possibles : 1, 2, 3, 4, 5, 6.' });
    }

    // Création du semestre
    const semestre = new Semestre({ numero: parseInt(numero), description });
    await semestre.save();
    res.status(201).json(semestre);
  } catch (error) {
    console.log('❌ Erreur lors de l’ajout du semestre :', error.message);
    res.status(400).json({ message: error.message });
  }
});

// ➤ Ajouter des modules globaux à un semestre pour un département
router.put('/:semestreNumero/:departementCode/modules', async (req, res) => {
  try {
    const { semestreNumero, departementCode } = req.params;
    const { moduleCodes } = req.body;

    console.log(`📌 Ajout des modules au Semestre ${semestreNumero} pour le département ${departementCode}`);
    console.log(`📌 Données reçues :`, req.body);

    // Vérifier si le semestre existe
    const semestre = await Semestre.findOne({ numero: parseInt(semestreNumero) });
    if (!semestre) {
      return res.status(404).json({ message: 'Semestre non trouvé.' });
    }

    // Validation du département
    if (!['INFO', 'MECA', 'ELEC'].includes(departementCode)) {
      return res.status(400).json({ message: 'Code de département invalide. Valeurs possibles : INFO, MECA, ELEC.' });
    }

    // Vérifier que les modules existent et correspondent au département et au semestre
    const semestreFormat = `S${semestreNumero}`;
    const modules = await Module.find({
      code: { $in: moduleCodes },
      departementCode,
      semestre: semestreFormat,
    });

    console.log(`📌 Modules trouvés :`, modules);

    if (modules.length === 0) {
      return res.status(404).json({ message: 'Aucun module global trouvé pour ce département et semestre.' });
    }

    if (modules.length !== moduleCodes.length) {
      return res.status(400).json({ message: 'Certains codes de modules sont invalides ou ne correspondent pas au département/semestre.' });
    }

    // Ajouter les modules au semestre (éviter les doublons)
    const newModuleIds = modules.map((m) => m._id);
    semestre.modulesGlobales = [...new Set([...semestre.modulesGlobales, ...newModuleIds])];
    await semestre.save();

    res.json({ message: 'Modules ajoutés avec succès au semestre', semestre });
  } catch (error) {
    console.log('❌ Erreur lors de l’ajout des modules :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer les modules d’un semestre pour un département
router.get('/:semestreNumero/:departementCode/modules', async (req, res) => {
  try {
    const { semestreNumero, departementCode } = req.params;

    // Vérifier si le semestre existe
    const semestre = await Semestre.findOne({ numero: parseInt(semestreNumero) }).populate('modulesGlobales');
    if (!semestre) {
      return res.status(404).json({ message: 'Semestre non trouvé.' });
    }

    // Validation du département
    if (!['INFO', 'MECA', 'ELEC'].includes(departementCode)) {
      return res.status(400).json({ message: 'Code de département invalide. Valeurs possibles : INFO, MECA, ELEC.' });
    }

    // Filtrer les modules spécifiques au département
    const modules = semestre.modulesGlobales.filter((m) => m.departementCode === departementCode);

    if (modules.length === 0) {
      return res.status(404).json({ message: 'Aucun module trouvé pour ce département et semestre.' });
    }

    // Récupérer les sous-modules associés
    const moduleIds = modules.map((m) => m._id);
    const sousModules = await SousModule.find({
      moduleId: { $in: moduleIds },
      departementCode,
    });

    const modulesWithSousModules = modules.map((module) => ({
      ...module._doc,
      sousModules: sousModules.filter((sm) => sm.moduleId.toString() === module._id.toString()),
    }));

    res.json({
      semestre: `S${semestreNumero}`,
      departement: departementCode,
      modules: modulesWithSousModules,
    });
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des modules :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer tous les semestres
router.get('/', async (req, res) => {
  try {
    const semestres = await Semestre.find().populate('modulesGlobales');
    res.json(semestres);
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des semestres :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer un semestre par numéro
router.get('/:numero', async (req, res) => {
  try {
    const semestre = await Semestre.findOne({ numero: parseInt(req.params.numero) }).populate('modulesGlobales');
    if (!semestre) {
      return res.status(404).json({ message: 'Semestre non trouvé.' });
    }
    res.json(semestre);
  } catch (error) {
    console.log('❌ Erreur lors de la récupération du semestre :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Mettre à jour un semestre
router.put('/:numero', async (req, res) => {
  try {
    const semestre = await Semestre.findOneAndUpdate(
      { numero: parseInt(req.params.numero) },
      req.body,
      { new: true }
    );
    if (!semestre) {
      return res.status(404).json({ message: 'Semestre non trouvé.' });
    }
    res.json(semestre);
  } catch (error) {
    console.log('❌ Erreur lors de la mise à jour du semestre :', error.message);
    res.status(400).json({ message: error.message });
  }
});

// ➤ Supprimer un semestre
router.delete('/:numero', async (req, res) => {
  try {
    const semestre = await Semestre.findOneAndDelete({ numero: parseInt(req.params.numero) });
    if (!semestre) {
      return res.status(404).json({ message: 'Semestre non trouvé.' });
    }
    res.json({ message: 'Semestre supprimé avec succès.' });
  } catch (error) {
    console.log('❌ Erreur lors de la suppression du semestre :', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;