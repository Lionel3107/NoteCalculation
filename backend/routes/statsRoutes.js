// backend/routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Module = require('../models/Module');
const SousModule = require('../models/SousModule');
const Note = require('../models/Note');

// 📊 ➤ 1️⃣ Rapport de Performance des Étudiants avec détails des notes
router.get('/etudiants/:departement/:niveau/:semestre', async (req, res) => {
  try {
    const { departement, niveau, semestre } = req.params;
    console.log(`📌 Rapport étudiants - Département: ${departement}, Niveau: ${niveau}, Semestre: ${semestre}`);

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

    // Récupérer les étudiants du département et niveau donnés
    const students = await Student.find({ departementCode: departement, niveau });

    if (students.length === 0) {
      return res.status(404).json({ message: 'Aucun étudiant trouvé pour ces critères.' });
    }

    // Récupérer les sous-modules pour ce département, niveau, et semestre
    const sousModules = await SousModule.find({
      departementCode: departement,
      niveauEtudes: niveau,
      semestre,
    });

    if (sousModules.length === 0) {
      return res.status(404).json({ message: 'Aucun sous-module trouvé pour ce département, niveau, et semestre.' });
    }

    const sousModuleCodes = sousModules.map((sm) => sm.code);

    // Récupérer les notes des étudiants pour ces sous-modules
    const notes = await Note.find({
      etudiantMatricule: { $in: students.map((s) => s.matricule) },
      sousModuleCode: { $in: sousModuleCodes },
    });

    // Construire les données des étudiants avec leurs notes détaillées
    const detailedStudents = students.map((student) => {
      const studentNotes = notes.filter((note) => note.etudiantMatricule === student.matricule);
      const notesBySousModule = studentNotes.reduce((acc, note) => {
        acc[note.sousModuleCode] = {
          notePresence: note.notePresence,
          noteParticipation: note.noteParticipation,
          notes: note.notes,
          ponderations: note.ponderations,
          moyenneSousModule: note.moyenneSousModule,
        };
        return acc;
      }, {});

      // Calculer la moyenne générale
      let totalMoyenne = 0;
      let totalCoefficient = 0;
      studentNotes.forEach((note) => {
        const sousModule = sousModules.find((sm) => sm.code === note.sousModuleCode);
        const coefficient = sousModule?.coefficient || 1;
        totalMoyenne += note.moyenneSousModule * coefficient;
        totalCoefficient += coefficient;
      });

      const moyenneGenerale = totalCoefficient > 0 ? parseFloat((totalMoyenne / totalCoefficient).toFixed(2)) : 0;

      return {
        _id: student._id,
        matricule: student.matricule,
        nom: student.nom,
        prenom: student.prenom,
        email: student.email,
        departementCode: student.departementCode,
        niveau: student.niveau,
        dateInscription: student.dateInscription,
        notes: notesBySousModule,
        moyenneGenerale,
      };
    });

    // Trier les étudiants par moyenne générale (décroissante)
    detailedStudents.sort((a, b) => b.moyenneGenerale - a.moyenneGenerale);

    res.json({
      departement,
      niveau,
      semestre,
      students: detailedStudents,
    });
  } catch (error) {
    console.log('❌ Erreur lors de la génération du rapport des étudiants :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// 📊 ➤ 2️⃣ Rapport des Modules (inchangé pour l'instant)
router.get('/modules/:departement/:semestre', async (req, res) => {
  try {
    const { departement, semestre } = req.params;
    console.log(`📌 Rapport modules - Département: ${departement}, Semestre: ${semestre}`);

    // Validation des paramètres
    if (!['INFO', 'MECA', 'ELEC'].includes(departement)) {
      return res.status(400).json({ message: 'Code de département invalide. Valeurs possibles : INFO, MECA, ELEC.' });
    }
    if (!['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(semestre)) {
      return res.status(400).json({ message: 'Semestre invalide. Valeurs possibles : S1, S2, S3, S4, S5, S6.' });
    }

    // Récupérer tous les modules globaux du département et semestre donné
    const modules = await Module.find({
      departementCode: departement,
      semestre,
    });

    if (modules.length === 0) {
      return res.status(404).json({ message: 'Aucun module trouvé pour ces critères.' });
    }

    // Récupérer les sous-modules associés à ces modules globaux
    const moduleIds = modules.map((m) => m._id);
    const sousModules = await SousModule.find({
      moduleId: { $in: moduleIds },
      departementCode: departement,
      semestre,
    });

    if (sousModules.length === 0) {
      return res.status(404).json({ message: 'Aucun sous-module trouvé pour ces modules.' });
    }

    const sousModuleCodes = sousModules.map((sm) => sm.code);

    // Récupérer les notes pour ces sous-modules
    const notes = await Note.find({
      sousModuleCode: { $in: sousModuleCodes },
    });

    // Calculer les moyennes par module global
    const rapportModules = await Promise.all(
      modules.map(async (module) => {
        const moduleSousModules = sousModules.filter((sm) => sm.moduleId.toString() === module._id.toString());
        const moduleSousModuleCodes = moduleSousModules.map((sm) => sm.code);
        const moduleNotes = notes.filter((note) => moduleSousModuleCodes.includes(note.sousModuleCode));

        let totalMoyenne = 0;
        let nombreEtudiants = 0;
        const studentMatricules = [...new Set(moduleNotes.map((note) => note.etudiantMatricule))];

        studentMatricules.forEach((matricule) => {
          const studentNotes = moduleNotes.filter((note) => note.etudiantMatricule === matricule);
          let studentMoyenne = 0;
          let totalCoefficient = 0;

          studentNotes.forEach((note) => {
            const sousModule = moduleSousModules.find((sm) => sm.code === note.sousModuleCode);
            const coefficient = sousModule?.coefficient || 1;
            studentMoyenne += note.moyenneSousModule * coefficient;
            totalCoefficient += coefficient;
          });

          if (totalCoefficient > 0) {
            totalMoyenne += studentMoyenne / totalCoefficient;
            nombreEtudiants++;
          }
        });

        const moyenneEtudiants = nombreEtudiants > 0 ? parseFloat((totalMoyenne / nombreEtudiants).toFixed(2)) : 'Aucune note';

        return {
          nom: module.nom,
          code: module.code,
          moyenneEtudiants,
        };
      })
    );

    res.json({ departement, semestre, modules: rapportModules });
  } catch (error) {
    console.log('❌ Erreur lors de la génération du rapport des modules :', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;