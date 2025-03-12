// backend/routes/departementRoutes.js
const express = require('express');
const router = express.Router();
const Departement = require('../models/Departement');
const Semestre = require('../models/Semestre');
const Student = require('../models/Student');
const Module = require('../models/Module'); // Remplacer ModuleGlobal par Module
const SousModule = require('../models/SousModule'); // Ajouter SousModule

// ➤ Ajouter un département
router.post('/', async (req, res) => {
  try {
    const { nom, code } = req.body;

    // Validation du code du département
    if (!['INFO', 'MECA', 'ELEC'].includes(code)) {
      return res.status(400).json({ message: 'Code de département invalide. Valeurs possibles : INFO, MECA, ELEC.' });
    }

    const departement = new Departement({ nom, code });
    await departement.save();
    res.status(201).json(departement);
  } catch (error) {
    console.log('❌ Erreur lors de l’ajout du département :', error.message);
    res.status(400).json({ message: error.message });
  }
});

// ➤ Récupérer tous les départements
router.get('/', async (req, res) => {
  try {
    const departements = await Departement.find().populate('semestres students');
    res.json(departements);
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des départements :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer un département avec les étudiants d’un niveau spécifique
router.get('/:code/:niveau', async (req, res) => {
  try {
    const { code, niveau } = req.params;

    // Validation des paramètres
    if (!['INFO', 'MECA', 'ELEC'].includes(code)) {
      return res.status(400).json({ message: 'Code de département invalide. Valeurs possibles : INFO, MECA, ELEC.' });
    }
    if (!['L1', 'L2', 'L3'].includes(niveau)) {
      return res.status(400).json({ message: 'Niveau invalide. Valeurs possibles : L1, L2, L3.' });
    }

    const departement = await Departement.findOne({ code }).populate({
      path: 'students',
      match: { niveau },
    });

    if (!departement) {
      return res.status(404).json({ message: 'Département non trouvé.' });
    }

    res.json(departement);
  } catch (error) {
    console.log('❌ Erreur lors de la récupération du département :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer les étudiants d’un département, d’un niveau et d’un semestre
router.get('/:code/:niveau/semestre/:semestreNumero/etudiants', async (req, res) => {
  try {
    const { code, niveau, semestreNumero } = req.params;

    console.log(`📌 Vérification du semestre : Département: ${code}, Niveau: ${niveau}, Semestre: ${semestreNumero}`);

    // Validation des paramètres
    if (!['INFO', 'MECA', 'ELEC'].includes(code)) {
      return res.status(400).json({ message: 'Code de département invalide. Valeurs possibles : INFO, MECA, ELEC.' });
    }
    if (!['L1', 'L2', 'L3'].includes(niveau)) {
      return res.status(400).json({ message: 'Niveau invalide. Valeurs possibles : L1, L2, L3.' });
    }
    const semestreNum = parseInt(semestreNumero);
    if (![1, 2, 3, 4, 5, 6].includes(semestreNum)) {
      return res.status(400).json({ message: 'Numéro de semestre invalide. Valeurs possibles : 1, 2, 3, 4, 5, 6.' });
    }

    // Vérifier si le semestre existe
    const semestre = await Semestre.findOne({ numero: semestreNum });
    if (!semestre) {
      console.log('❌ Semestre introuvable !');
      return res.status(404).json({ message: 'Semestre non trouvé.' });
    }

    // Trouver les étudiants du département et du niveau donné
    const students = await Student.find({ departementCode: code, niveau });

    if (students.length === 0) {
      console.log('❌ Aucun étudiant trouvé !');
      return res.status(404).json({ message: 'Aucun étudiant trouvé pour ce département et ce niveau.' });
    }

    console.log(`✅ ${students.length} étudiants trouvés`);
    res.json({ departement: code, niveau, semestreNumero, students });
  } catch (error) {
    console.error('❌ Erreur :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer les modules globaux et sous-modules liés au département, niveau, et semestre
router.get('/:code/:niveau/semestre/:semestreNumero/modules', async (req, res) => {
  try {
    const { code, niveau, semestreNumero } = req.params;

    console.log(`📌 Récupération des modules pour Département: ${code}, Niveau: ${niveau}, Semestre: ${semestreNumero}`);

    // Validation des paramètres
    if (!['INFO', 'MECA', 'ELEC'].includes(code)) {
      return res.status(400).json({ message: 'Code de département invalide. Valeurs possibles : INFO, MECA, ELEC.' });
    }
    if (!['L1', 'L2', 'L3'].includes(niveau)) {
      return res.status(400).json({ message: 'Niveau invalide. Valeurs possibles : L1, L2, L3.' });
    }
    const semestreNum = parseInt(semestreNumero);
    if (![1, 2, 3, 4, 5, 6].includes(semestreNum)) {
      return res.status(400).json({ message: 'Numéro de semestre invalide. Valeurs possibles : 1, 2, 3, 4, 5, 6.' });
    }

    // Vérifier si le semestre existe
    const semestre = await Semestre.findOne({ numero: semestreNum });
    if (!semestre) {
      console.log('❌ Semestre introuvable !');
      return res.status(404).json({ message: 'Semestre non trouvé.' });
    }

    // Trouver les étudiants du département et du niveau donné
    const students = await Student.find({ departementCode: code, niveau });

    if (students.length === 0) {
      console.log('❌ Aucun étudiant trouvé !');
      return res.status(404).json({ message: 'Aucun étudiant trouvé pour ce département et ce niveau.' });
    }

    // Convertir semestreNumero (ex. "1") en format "S1"
    const semestreFormat = `S${semestreNum}`;

    // Trouver les modules globaux liés à ce département, niveau, et semestre
    const modules = await Module.find({
      departementCode: code,
      niveauEtudes: niveau,
      semestre: semestreFormat,
    });

    if (modules.length === 0) {
      console.log('❌ Aucun module global trouvé !');
      return res.status(404).json({ message: 'Aucun module global trouvé pour ce département, niveau, et semestre.' });
    }

    // Trouver les sous-modules associés à ces modules globaux
    const moduleIds = modules.map((module) => module._id);
    const sousModules = await SousModule.find({
      moduleId: { $in: moduleIds },
      departementCode: code,
      niveauEtudes: niveau,
      semestre: semestreFormat,
    });

    // Associer les sous-modules à leurs modules globaux dans la réponse
    const modulesWithSousModules = modules.map((module) => ({
      ...module._doc,
      sousModules: sousModules.filter((sm) => sm.moduleId.toString() === module._id.toString()),
    }));

    res.json({
      departement: code,
      niveau,
      semestre: semestreFormat,
      students,
      modules: modulesWithSousModules,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des modules :', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;