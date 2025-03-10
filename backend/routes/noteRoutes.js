// backend/routes/notesRoutes.js
const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Module = require('../models/Module'); // Remplacer ModuleGlobal par Module
const SousModule = require('../models/SousModule'); // Ajouter SousModule
const Student = require('../models/Student'); // Ajouter Student pour les vérifications
const {
  verifyToken,
  isChefDepartement,
  isProfesseur,
  isDirecteur,
  canViewNotes,
  canEnterNotes,
  authenticateToken,
} = require('../middlewares/authMiddleware');

// Fonction utilitaire pour calculer la moyenne (basée sur ta logique existante)
const calculateMoyenneSousModule = (notes, ponderations, noteParticipation, notePresence) => {
  const totalPonderation = ponderations.reduce((acc, p) => acc + p, 0);
  if (totalPonderation !== 85) {
    throw new Error('La somme des pondérations des notes doit être égale à 85%.');
  }

  const weightedSum =
    notes.reduce((acc, note, i) => acc + note * (ponderations[i] / 100), 0) +
    (notePresence * 0.1) +
    (noteParticipation * 0.05);
  return Math.min(20, Math.max(0, weightedSum)); // Limiter entre 0 et 20
};

// ➤ Ajouter une note pour un sous-module (POST /api/notes/sous-modules)
router.post('/sous-modules', authenticateToken, canEnterNotes, isProfesseur, isChefDepartement, async (req, res) => {
  try {
    const { etudiantMatricule, sousModuleCode, notes, ponderations, noteParticipation, notePresence } = req.body;

    // Vérifier si l'étudiant existe
    const student = await Student.findOne({ matricule: etudiantMatricule });
    if (!student) {
      return res.status(404).json({ message: 'Étudiant non trouvé.' });
    }

    // Vérifier si le sous-module existe
    const sousModule = await SousModule.findOne({ code: sousModuleCode });
    if (!sousModule) {
      return res.status(404).json({ message: 'Sous-module non trouvé.' });
    }

    // Vérifier que le sous-module appartient au département de l'utilisateur
    if (sousModule.departementCode !== req.user.departementCode) {
      return res.status(403).json({ message: 'Accès interdit. Ce sous-module n’appartient pas à votre département.' });
    }

    // Vérifier que l'étudiant appartient au bon département et niveau
    if (student.departementCode !== sousModule.departementCode || student.niveau !== sousModule.niveauEtudes) {
      return res.status(400).json({ message: 'L’étudiant n’appartient pas au département ou au niveau correspondant à ce sous-module.' });
    }

    // Vérifier que le professeur est assigné à ce sous-module
    if (!req.user.sousModulesEnseignes.includes(sousModuleCode)) {
      return res.status(403).json({ message: 'Accès interdit. Vous n’êtes pas assigné à ce sous-module.' });
    }

    // Vérifier si le nombre de notes correspond au nombre de pondérations
    if (notes.length !== ponderations.length || notes.length === 0) {
      return res.status(400).json({ message: 'Le nombre de notes doit correspondre au nombre de pondérations.' });
    }

    // Vérifier que les pondérations totalisent 85% (présence 10%, participation 5%)
    const totalPonderation = ponderations.reduce((acc, p) => acc + p, 0);
    if (totalPonderation !== 85) {
      return res.status(400).json({ message: 'La somme des pondérations des notes doit être égale à 85% (présence 10%, participation 5%).' });
    }

    // Vérifier que les notes et les autres champs sont valides (entre 0 et 20)
    if (
      !notes.every((note) => note >= 0 && note <= 20) ||
      noteParticipation < 0 || noteParticipation > 20 ||
      notePresence < 0 || notePresence > 20
    ) {
      return res.status(400).json({ message: 'Les notes, la participation et la présence doivent être entre 0 et 20.' });
    }

    // Créer une nouvelle note
    const note = new Note({
      etudiantMatricule,
      sousModuleCode,
      notes,
      ponderations,
      noteParticipation,
      notePresence,
      moyenneSousModule: calculateMoyenneSousModule(notes, ponderations, noteParticipation, notePresence),
    });

    // Sauvegarder la note
    await note.save();
    res.status(201).json({ message: 'Note sauvegardée avec succès', data: note });
  } catch (error) {
    console.error('Erreur dans /api/notes/sous-modules:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// ➤ Récupérer toutes les notes d’un étudiant
router.get('/:etudiantMatricule', verifyToken, canViewNotes, async (req, res) => {
  try {
    const { etudiantMatricule } = req.params;
    console.log(`📌 Récupération des notes de l'étudiant ${etudiantMatricule}`);

    // Trouver toutes les notes associées à cet étudiant
    const notes = await Note.find({ etudiantMatricule });

    if (notes.length === 0) {
      return res.status(404).json({ message: 'Aucune note trouvée pour cet étudiant.' });
    }

    res.json({ etudiantMatricule, notes });
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des notes :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer la moyenne d’un module global pour un étudiant
router.get('/:etudiantMatricule/module/:moduleCode', verifyToken, canViewNotes, async (req, res) => {
  try {
    const { etudiantMatricule, moduleCode } = req.params;

    // Trouver le module global
    const module = await Module.findOne({ code: moduleCode });
    if (!module) {
      return res.status(404).json({ message: 'Module global non trouvé.' });
    }

    // Vérifier que le module appartient au département de l'utilisateur
    if (module.departementCode !== req.user.departementCode) {
      return res.status(403).json({ message: 'Accès interdit. Ce module n’appartient pas à votre département.' });
    }

    // Trouver les sous-modules associés à ce module global
    const sousModules = await SousModule.find({ moduleId: module._id });
    if (sousModules.length === 0) {
      return res.status(404).json({ message: 'Aucun sous-module trouvé pour ce module global.' });
    }

    const sousModuleCodes = sousModules.map((sm) => sm.code);

    // Trouver les notes des sous-modules pour cet étudiant
    const notes = await Note.find({
      etudiantMatricule,
      sousModuleCode: { $in: sousModuleCodes },
    });

    if (notes.length === 0) {
      return res.status(404).json({ message: 'Aucune note trouvée pour ce module.' });
    }

    // Calculer la moyenne pondérée du module global
    // Supposons que chaque sous-module a un coefficient (par défaut 1 si non défini)
    const totalCoefficient = sousModules.reduce((acc, sm) => acc + (sm.coefficient || 1), 0);
    const moyenneModule = notes.reduce((acc, note) => {
      const sousModule = sousModules.find((sm) => sm.code === note.sousModuleCode);
      const coefficient = sousModule?.coefficient || 1;
      return acc + (note.moyenneSousModule * (coefficient / totalCoefficient));
    }, 0);

    res.json({ moduleCode, moyenneModule });
  } catch (error) {
    console.log('❌ Erreur lors du calcul de la moyenne du module :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer la moyenne semestrielle d’un étudiant
router.get('/:etudiantMatricule/semestre/:semestreNumero', verifyToken, canViewNotes, async (req, res) => {
  try {
    const { etudiantMatricule, semestreNumero } = req.params;

    // Validation du semestre
    const semestreFormat = `S${semestreNumero}`;
    if (!['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(semestreFormat)) {
      return res.status(400).json({ message: 'Numéro de semestre invalide. Valeurs possibles : 1, 2, 3, 4, 5, 6.' });
    }

    // Vérifier que l'étudiant existe
    const student = await Student.findOne({ matricule: etudiantMatricule });
    if (!student) {
      return res.status(404).json({ message: 'Étudiant non trouvé.' });
    }

    // Trouver les modules globaux du semestre donné pour le département et niveau de l'étudiant
    const modules = await Module.find({
      semestre: semestreFormat,
      departementCode: student.departementCode,
      niveauEtudes: student.niveau,
    });

    if (modules.length === 0) {
      return res.status(404).json({ message: 'Aucun module trouvé pour ce semestre, département, et niveau.' });
    }

    // Trouver les sous-modules associés à ces modules globaux
    const moduleIds = modules.map((module) => module._id);
    const sousModules = await SousModule.find({
      moduleId: { $in: moduleIds },
      departementCode: student.departementCode,
      niveauEtudes: student.niveau,
      semestre: semestreFormat,
    });

    if (sousModules.length === 0) {
      return res.status(404).json({ message: 'Aucun sous-module trouvé pour ce semestre, département, et niveau.' });
    }

    const sousModuleCodes = sousModules.map((sm) => sm.code);

    // Trouver les notes de l'étudiant pour ces sous-modules
    const notes = await Note.find({
      etudiantMatricule,
      sousModuleCode: { $in: sousModuleCodes },
    });

    if (notes.length === 0) {
      return res.status(404).json({ message: 'Aucune note trouvée pour ce semestre.' });
    }

    // Calculer la moyenne pondérée du semestre
    let totalCoefficient = 0;
    let totalPoints = 0;

    for (const module of modules) {
      const moduleSousModules = sousModules.filter((sm) => sm.moduleId.toString() === module._id.toString());
      const moduleSousModuleCodes = moduleSousModules.map((sm) => sm.code);
      const moduleNotes = notes.filter((note) => moduleSousModuleCodes.includes(note.sousModuleCode));

      if (moduleNotes.length === 0) continue;

      const moduleCoefficient = moduleSousModules.reduce((acc, sm) => acc + (sm.coefficient || 1), 0);
      const modulePoints = moduleNotes.reduce((acc, note) => {
        const sousModule = moduleSousModules.find((sm) => sm.code === note.sousModuleCode);
        const coefficient = sousModule?.coefficient || 1;
        return acc + (note.moyenneSousModule * (coefficient / moduleCoefficient));
      }, 0);

      totalCoefficient += moduleCoefficient;
      totalPoints += modulePoints;
    }

    const moyenneSemestre = totalCoefficient > 0 ? totalPoints / totalCoefficient : 0;
    res.json({ etudiantMatricule, semestre: semestreFormat, moyenneSemestre });
  } catch (error) {
    console.log('❌ Erreur lors du calcul de la moyenne semestrielle :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer la moyenne annuelle d’un étudiant
router.get('/:etudiantMatricule/annee', verifyToken, canViewNotes, async (req, res) => {
  try {
    const { etudiantMatricule } = req.params;

    // Vérifier que l'étudiant existe
    const student = await Student.findOne({ matricule: etudiantMatricule });
    if (!student) {
      return res.status(404).json({ message: 'Étudiant non trouvé.' });
    }

    // Déterminer les semestres en fonction du niveau (ex. L1 → S1 et S2, L2 → S3 et S4, etc.)
    let semestres;
    if (student.niveau === 'L1') semestres = ['S1', 'S2'];
    else if (student.niveau === 'L2') semestres = ['S3', 'S4'];
    else if (student.niveau === 'L3') semestres = ['S5', 'S6'];
    else return res.status(400).json({ message: 'Niveau invalide.' });

    // Calculer les moyennes des deux semestres
    let totalSemestrePoints = 0;
    let semestersWithNotes = 0;

    for (const semestre of semestres) {
      const modules = await Module.find({
        semestre,
        departementCode: student.departementCode,
        niveauEtudes: student.niveau,
      });

      if (modules.length === 0) continue;

      const moduleIds = modules.map((module) => module._id);
      const sousModules = await SousModule.find({
        moduleId: { $in: moduleIds },
        departementCode: student.departementCode,
        niveauEtudes: student.niveau,
        semestre,
      });

      if (sousModules.length === 0) continue;

      const sousModuleCodes = sousModules.map((sm) => sm.code);
      const notes = await Note.find({
        etudiantMatricule,
        sousModuleCode: { $in: sousModuleCodes },
      });

      if (notes.length === 0) continue;

      let totalCoefficient = 0;
      let totalPoints = 0;

      for (const module of modules) {
        const moduleSousModules = sousModules.filter((sm) => sm.moduleId.toString() === module._id.toString());
        const moduleSousModuleCodes = moduleSousModules.map((sm) => sm.code);
        const moduleNotes = notes.filter((note) => moduleSousModuleCodes.includes(note.sousModuleCode));

        if (moduleNotes.length === 0) continue;

        const moduleCoefficient = moduleSousModules.reduce((acc, sm) => acc + (sm.coefficient || 1), 0);
        const modulePoints = moduleNotes.reduce((acc, note) => {
          const sousModule = moduleSousModules.find((sm) => sm.code === note.sousModuleCode);
          const coefficient = sousModule?.coefficient || 1;
          return acc + (note.moyenneSousModule * (coefficient / moduleCoefficient));
        }, 0);

        totalCoefficient += moduleCoefficient;
        totalPoints += modulePoints;
      }

      const moyenneSemestre = totalCoefficient > 0 ? totalPoints / totalCoefficient : 0;
      totalSemestrePoints += moyenneSemestre;
      semestersWithNotes++;
    }

    if (semestersWithNotes === 0) {
      return res.status(404).json({ message: 'Aucune note trouvée pour calculer la moyenne annuelle.' });
    }

    const moyenneAnnuelle = totalSemestrePoints / semestersWithNotes;
    res.json({ etudiantMatricule, moyenneAnnuelle });
  } catch (error) {
    console.log('❌ Erreur lors du calcul de la moyenne annuelle :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer une note spécifique pour un étudiant et un sous-module
router.get('/sous-modules/:id', verifyToken, canViewNotes, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note non trouvée.' });
    }

    // Vérifier que le sous-module existe
    const sousModule = await SousModule.findOne({ code: note.sousModuleCode });
    if (!sousModule) {
      return res.status(404).json({ message: 'Sous-module non trouvé.' });
    }

    // Vérifier que le sous-module appartient au département de l'utilisateur
    if (sousModule.departementCode !== req.user.departementCode) {
      return res.status(403).json({ message: 'Accès interdit. Ce sous-module n’appartient pas à votre département.' });
    }

    res.status(200).json({ data: note });
  } catch (error) {
    console.log('❌ Erreur lors de la récupération :', error.message);
    res.status(500).json({ message: 'Erreur lors de la récupération de la note.' });
  }
});

// ➤ Modifier une note
router.put('/sous-modules/:id', authenticateToken, canEnterNotes, isProfesseur, isChefDepartement, async (req, res) => {
  try {
    const { id } = req.params;
    const { etudiantMatricule, notes, ponderations, noteParticipation, notePresence } = req.body;

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: 'Note non trouvée.' });
    }

    // Vérifier que le sous-module existe
    const sousModule = await SousModule.findOne({ code: note.sousModuleCode });
    if (!sousModule) {
      return res.status(404).json({ message: 'Sous-module non trouvé.' });
    }

    // Vérifier que le sous-module appartient au département de l'utilisateur
    if (sousModule.departementCode !== req.user.departementCode) {
      return res.status(403).json({ message: 'Accès interdit. Ce sous-module n’appartient pas à votre département.' });
    }

    // Vérifier que le professeur est assigné à ce sous-module
    if (!req.user.sousModulesEnseignes.includes(note.sousModuleCode)) {
      return res.status(403).json({ message: 'Accès interdit. Vous ne pouvez modifier que vos sous-modules assignés.' });
    }

    // Vérifier si le nombre de notes correspond au nombre de pondérations
    if (notes && ponderations && (notes.length !== ponderations.length || notes.length === 0)) {
      return res.status(400).json({ message: 'Le nombre de notes doit correspondre au nombre de pondérations.' });
    }

    // Vérifier que les pondérations totalisent 85% si elles sont fournies
    if (ponderations) {
      const totalPonderation = ponderations.reduce((acc, p) => acc + p, 0);
      if (totalPonderation !== 85) {
        return res.status(400).json({ message: 'La somme des pondérations des notes doit être égale à 85%.' });
      }
    }

    // Vérifier que les notes et les autres champs sont valides (entre 0 et 20)
    if (
      (notes && !notes.every((note) => note >= 0 && note <= 20)) ||
      (noteParticipation && (noteParticipation < 0 || noteParticipation > 20)) ||
      (notePresence && (notePresence < 0 || notePresence > 20))
    ) {
      return res.status(400).json({ message: 'Les notes, la participation et la présence doivent être entre 0 et 20.' });
    }

    // Mettre à jour la note
    note.etudiantMatricule = etudiantMatricule || note.etudiantMatricule;
    note.notes = notes || note.notes;
    note.ponderations = ponderations || note.ponderations;
    note.noteParticipation = noteParticipation || note.noteParticipation;
    note.notePresence = notePresence || note.notePresence;
    note.moyenneSousModule = calculateMoyenneSousModule(
      notes || note.notes,
      ponderations || note.ponderations,
      noteParticipation || note.noteParticipation,
      notePresence || note.notePresence
    );

    await note.save();
    res.status(200).json({ message: 'Note mise à jour avec succès', data: note });
  } catch (error) {
    console.log('❌ Erreur lors de la mise à jour :', error.message);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la note.' });
  }
});

// ➤ Supprimer une note
router.delete('/:etudiantMatricule/:sousModuleCode', authenticateToken, canEnterNotes, isProfesseur, isChefDepartement, async (req, res) => {
  try {
    const { etudiantMatricule, sousModuleCode } = req.params;

    // Vérifier que le sous-module existe
    const sousModule = await SousModule.findOne({ code: sousModuleCode });
    if (!sousModule) {
      return res.status(404).json({ message: 'Sous-module non trouvé.' });
    }

    // Vérifier que le sous-module appartient au département de l'utilisateur
    if (sousModule.departementCode !== req.user.departementCode) {
      return res.status(403).json({ message: 'Accès interdit. Ce sous-module n’appartient pas à votre département.' });
    }

    // Vérifier que le professeur est assigné à ce sous-module
    if (!req.user.sousModulesEnseignes.includes(sousModuleCode)) {
      return res.status(403).json({ message: 'Accès interdit. Vous ne pouvez supprimer que vos sous-modules assignés.' });
    }

    const note = await Note.findOneAndDelete({ etudiantMatricule, sousModuleCode });
    if (!note) {
      return res.status(404).json({ message: 'Note non trouvée.' });
    }

    res.json({ message: 'Note supprimée avec succès !' });
  } catch (error) {
    console.log('❌ Erreur lors de la suppression :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer toutes les notes pour un département, niveau et semestre
router.get('/:departement/:niveau/:semestre', verifyToken, canViewNotes, async (req, res) => {
  try {
    const { departement, niveau, semestre } = req.params;

    // Validation des paramètres
    if (!['INFO', 'MECA', 'ELEC'].includes(departement)) {
      return res.status(400).json({ message: 'Code de département invalide. Valeurs possibles : INFO, MECA, ELEC.' });
    }
    if (!['L1', 'L2', 'L3'].includes(niveau)) {
      return res.status(400).json({ message: 'Niveau invalide. Valeurs possibles : L1, L2, L3.' });
    }
    if (!['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(semestre)) {
      return res.status(400).json({ message: 'Semestre invalide. Valeurs possibles : S1, S2, S3, S4, S5, S6.' });
    }

    // Trouver les sous-modules pour ce département, niveau, et semestre
    const sousModules = await SousModule.find({
      departementCode: departement,
      niveauEtudes: niveau,
      semestre,
    });

    if (sousModules.length === 0) {
      return res.status(404).json({ message: 'Aucun sous-module trouvé pour ce département, niveau, et semestre.' });
    }

    const sousModuleCodes = sousModules.map((sm) => sm.code);

    // Récupérer les notes pour ces sous-modules
    const notes = await Note.find({ sousModuleCode: { $in: sousModuleCodes } });
    if (!notes.length) {
      return res.status(404).json({ message: 'Aucune note trouvée.' });
    }

    res.json(notes);
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des notes :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer toutes les notes
router.get('/', verifyToken, canViewNotes, async (req, res) => {
  try {
    console.log('📌 Récupération de toutes les notes...');

    const notes = await Note.find();
    if (notes.length === 0) {
      console.log('❌ Aucune note trouvée !');
      return res.status(404).json({ message: 'Aucune note enregistrée dans la base de données.' });
    }

    console.log(`✅ ${notes.length} notes trouvées.`);
    res.json(notes);
  } catch (error) {
    console.log('❌ Erreur :', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;