// backend/routes/moduleRoutes.js
const express = require('express');
const router = express.Router();
const Module = require('../models/Module');
const SousModule = require('../models/SousModule');
const { isChefDepartement, restrictToOwnDepartement } = require('../middlewares/authMiddleware');
const verifyToken = require('../middlewares/authMiddleware').verifyToken;

// Ajouter un module global (réservé aux chefs de département)
router.post('/modules', verifyToken, isChefDepartement, restrictToOwnDepartement, async (req, res) => {
  try {
    const { nom, code, description, departementCode, niveauEtudes, semestre } = req.body;

    // Validation des champs
    if (!['L1', 'L2', 'L3'].includes(niveauEtudes)) {
      return res.status(400).json({ message: 'Niveau d’études invalide. Valeurs possibles : L1, L2, L3.' });
    }
    if (!['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(semestre)) {
      return res.status(400).json({ message: 'Semestre invalide. Valeurs possibles : S1, S2, S3, S4, S5, S6.' });
    }

    const module = new Module({ nom, code, description, departementCode, niveauEtudes, semestre });
    await module.save();
    res.status(201).json({ message: 'Module global ajouté avec succès', data: module });
  } catch (error) {
    console.log('❌ Erreur lors de l’ajout du module :', error.message);
    res.status(500).json({ message: 'Erreur lors de l’ajout du module.' });
  }
});

// Ajouter un sous-module (réservé aux chefs de département)
router.post('/sous-modules', verifyToken, isChefDepartement, restrictToOwnDepartement, async (req, res) => {
  try {
    const { nom, code, moduleId, description, departementCode, niveauEtudes, semestre } = req.body;

    // Validation des champs
    if (!['L1', 'L2', 'L3'].includes(niveauEtudes)) {
      return res.status(400).json({ message: 'Niveau d’études invalide. Valeurs possibles : L1, L2, L3.' });
    }
    if (!['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(semestre)) {
      return res.status(400).json({ message: 'Semestre invalide. Valeurs possibles : S1, S2, S3, S4, S5, S6.' });
    }

    // Vérifier que le module global existe et appartient au même département, niveau, et semestre
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module global non trouvé.' });
    }
    if (module.departementCode !== departementCode) {
      return res.status(403).json({ message: 'Le module global n’appartient pas à votre département.' });
    }
    if (module.niveauEtudes !== niveauEtudes || module.semestre !== semestre) {
      return res.status(400).json({ message: 'Le sous-module doit appartenir au même niveau et semestre que son module global.' });
    }

    const sousModule = new SousModule({ nom, code, moduleId, description, departementCode, niveauEtudes, semestre });
    await sousModule.save();
    res.status(201).json({ message: 'Sous-module ajouté avec succès', data: sousModule });
  } catch (error) {
    console.log('❌ Erreur lors de l’ajout du sous-module :', error.message);
    res.status(500).json({ message: 'Erreur lors de l’ajout du sous-module.' });
  }
});

// Récupérer les modules globaux d’un département (filtrer par niveau et semestre si spécifié)
router.get('/modules/:departementCode', verifyToken, async (req, res) => {
  try {
    const { departementCode } = req.params;
    const { niveauEtudes, semestre } = req.query; // Filtres optionnels via query params
    const query = { departementCode };
    if (niveauEtudes) query.niveauEtudes = niveauEtudes;
    if (semestre) query.semestre = semestre;

    const modules = await Module.find(query);
    res.status(200).json({ data: modules });
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des modules :', error.message);
    res.status(500).json({ message: 'Erreur lors de la récupération des modules.' });
  }
});

module.exports = router;