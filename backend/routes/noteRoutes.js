const express = require("express");
const Note = require("../models/Note");
const ModuleGlobal = require("../models/ModuleGlobal");


const router = express.Router();

// ➤ Ajouter une note pour un sous-module
router.post("/", async (req, res) => {
    try {
      const { etudiantMatricule, sousModuleCode, notes, ponderations, noteParticipation, notePresence } = req.body;
  
      // Vérifier si le sous-module existe
      const module = await ModuleGlobal.findOne({ "sousModules.code": sousModuleCode });
      if (!module) {
        return res.status(404).json({ message: "Sous-module non trouvé dans un module global." });
      }
  
      if (notes.length !== ponderations.length) {
        return res.status(400).json({ message: "Le nombre de pondérations doit correspondre au nombre de notes." });
      }
  
      const totalPonderation = ponderations.reduce((acc, p) => acc + p, 0);
      if (totalPonderation !== 100) {
        return res.status(400).json({ message: "La somme des pondérations doit être égale à 100%." });
      }
  
      const note = new Note({
        etudiantMatricule,
        sousModuleCode,
        notes,
        ponderations,
        noteParticipation,
        notePresence
      });
  
      await note.save();
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // ➤ Récupérer toutes les notes d’un étudiant
  router.get("/:etudiantMatricule", async (req, res) => {
    try {
      const { etudiantMatricule } = req.params;
      console.log(`📌 Récupération des notes de l'étudiant ${etudiantMatricule}`);
  
      // Trouver toutes les notes associées à cet étudiant
      const notes = await Note.find({ etudiantMatricule });
  
      if (notes.length === 0) {
        return res.status(404).json({ message: "Aucune note trouvée pour cet étudiant." });
      }
  
      res.json({ etudiantMatricule, notes });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  module.exports = router;
  
// Ajout d'une route GET pour récupérer la moyenne d'un module global
router.get("/:etudiantMatricule/module/:moduleCode", async (req, res) => {
    try {
      const { etudiantMatricule, moduleCode } = req.params;
  
      // Trouver le module global
      const module = await ModuleGlobal.findOne({ code: moduleCode });
      if (!module) return res.status(404).json({ message: "Module non trouvé" });
  
      // Trouver les notes des sous-modules du module global
      const notes = await Note.find({ etudiantMatricule, sousModuleCode: { $in: module.sousModules.map(s => s.code) } });
  
      if (notes.length === 0) return res.status(404).json({ message: "Aucune note trouvée pour ce module" });
  
      // Calcul de la moyenne pondérée du module global
      const totalCoefficient = module.sousModules.reduce((acc, s) => acc + s.coefficient, 0);
      const moyenneModule = notes.reduce((acc, note) => acc + (note.moyenneSousModule * (module.sousModules.find(s => s.code === note.sousModuleCode).coefficient / totalCoefficient)), 0);
  
      res.json({ moduleCode, moyenneModule });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// Ajout d'une route GET pour récupérer la moyenne semestrielle d'un étudiant
router.get("/:etudiantMatricule/semestre/:semestreNumero", async (req, res) => {
    try {
      const { etudiantMatricule, semestreNumero } = req.params;
  
      // Trouver les modules globaux du semestre donné
      const modules = await ModuleGlobal.find({ semestre: semestreNumero });
      if (modules.length === 0) return res.status(404).json({ message: "Aucun module trouvé pour ce semestre" });
  
      // Calcul de la moyenne pondérée du semestre
      let totalCoefficient = 0;
      let totalPoints = 0;
  
      for (const module of modules) {
        const moyenneModule = await Note.find({ etudiantMatricule, sousModuleCode: { $in: module.sousModules.map(s => s.code) } });
        if (moyenneModule.length === 0) continue;
  
        const coefficientModule = module.sousModules.reduce((acc, s) => acc + s.coefficient, 0);
        totalCoefficient += coefficientModule;
        totalPoints += moyenneModule.reduce((acc, note) => acc + (note.moyenneSousModule * (module.sousModules.find(s => s.code === note.sousModuleCode).coefficient / coefficientModule)), 0);
      }
  
      const moyenneSemestre = totalPoints / totalCoefficient;
      res.json({ etudiantMatricule, semestreNumero, moyenneSemestre });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


//  Ajout d'une route GET pour récupérer la moyenne annuelle d'un étudiant
router.get("/:etudiantMatricule/annee", async (req, res) => {
    try {
      const { etudiantMatricule } = req.params;
  
      // Récupérer les moyennes des deux semestres
      const semestre1 = await Note.find({ etudiantMatricule, semestre: 1 });
      const semestre2 = await Note.find({ etudiantMatricule, semestre: 2 });
  
      if (semestre1.length === 0 || semestre2.length === 0) {
        return res.status(404).json({ message: "Données incomplètes pour calculer la moyenne annuelle" });
      }
  
      const moyenneAnnuelle = (semestre1.moyenneSemestre + semestre2.moyenneSemestre) / 2;
      res.json({ etudiantMatricule, moyenneAnnuelle });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});  


// �� Récupérer toutes les notes pour un étudiant
router.get("/:etudiantMatricule/:sousModuleCode", async (req, res) => {
    try {
      const { etudiantMatricule, sousModuleCode } = req.params;
      const note = await Note.findOne({ etudiantMatricule, sousModuleCode });
  
      if (!note) return res.status(404).json({ message: "Note non trouvée" });
  
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  

// ➤ Modifier une note
router.put("/:etudiantMatricule/:sousModuleCode", async (req, res) => {
    try {
      const { etudiantMatricule, sousModuleCode } = req.params;
      const { notes, ponderations, noteParticipation, notePresence } = req.body;
  
      console.log("📌 Requête reçue :", req.body); // Debug
  
      const note = await Note.findOne({ etudiantMatricule, sousModuleCode });
      if (!note) return res.status(404).json({ message: "Note non trouvée" });
  
      // Vérifier si notes et ponderations sont bien envoyés
      if (!notes || !ponderations) {
        return res.status(400).json({ message: "Les notes et les pondérations sont requises." });
      }
  
      if (notes.length === 0 || ponderations.length === 0) {
        return res.status(400).json({ message: "Les notes et les pondérations ne peuvent pas être vides." });
      }
      if (notes.length !== ponderations.length) {
        return res.status(400).json({ message: "Le nombre de pondérations doit correspondre au nombre de notes." });
      }
  
      note.notes = notes;
      note.ponderations = ponderations;
  
      if (noteParticipation !== undefined) note.noteParticipation = noteParticipation;
      if (notePresence !== undefined) note.notePresence = notePresence;
  
      console.log("📌 Notes après modification :", note.notes);
      console.log("📌 Pondérations après modification :", note.ponderations);
  
      // Vérifier que la somme des pondérations fait bien 100%
      const totalPonderation = note.ponderations.reduce((acc, p) => acc + p, 0);
      if (totalPonderation !== 100) {
        return res.status(400).json({ message: "La somme des pondérations doit être égale à 100%." });
      }
  
      // Correction ici : Vérifier si `ponderations[index]` existe avant de l'utiliser
      const moyennePonderee = note.notes.reduce((sum, noteValue, index) => {
        if (typeof note.ponderations[index] === "undefined") {
          console.error(`❌ Erreur : pondérations[${index}] est undefined`);
          return sum;
        }
        return sum + (noteValue * (note.ponderations[index] / 100));
      }, 0);
  
      note.moyenneSousModule = (moyennePonderee * 0.85) + (note.noteParticipation * 0.10) + (note.notePresence * 0.05);
  
      await note.save();
      res.json(note);
    } catch (error) {
      console.error("❌ Erreur :", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  

// ➤ Supprimer une note
router.delete("/:etudiantMatricule/:sousModuleCode", async (req, res) => {
  try {
    const { etudiantMatricule, sousModuleCode } = req.params;

    const note = await Note.findOneAndDelete({ etudiantMatricule, sousModuleCode });
    if (!note) return res.status(404).json({ message: "Note non trouvée" });

    res.json({ message: "Note supprimée avec succès !" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
