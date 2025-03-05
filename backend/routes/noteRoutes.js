const express = require("express");
const Note = require("../models/Note");
const ModuleGlobal = require("../models/ModuleGlobal");
const { 
  verifyToken, 
  isChefDepartement, 
  isProfesseur, 
  isDirecteur, 
  canViewNotes, 
  canEnterNotes, 
  authenticateToken 
} = require("../middlewares/authMiddleware"); // Import destructuré pour tous les middlewares
const router = express.Router();


console.log("Type de authenticateToken :", typeof authenticateToken);
console.log("Type de canEnterNotes :", typeof canEnterNotes);
// ➤ Ajouter une note pour un sous-module (POST /api/notes/sous-modules)
router.post("/sous-modules", authenticateToken, canEnterNotes, async (req, res) => {
  try {
    const { etudiantMatricule, sousModuleCode, notes, ponderations, noteParticipation, notePresence } = req.body;

    // Vérifier si le sous-module existe dans un module global
    const module = await ModuleGlobal.findOne({ "sousModules.code": sousModuleCode });
    if (!module) {
      return res.status(404).json({ message: "Sous-module non trouvé dans un module global." });
    }

    // Vérifier si le nombre de notes correspond au nombre de pondérations
    if (notes.length !== ponderations.length || notes.length === 0) {
      return res.status(400).json({ message: "Le nombre de notes doit correspondre au nombre de pondérations." });
    }

    // Vérifier que les pondérations totalisent 85% (pour laisser 10% à notePresence et 5% à noteParticipation)
    const totalPonderation = ponderations.reduce((acc, p) => acc + p, 0);
    if (totalPonderation !== 85) {
      return res.status(400).json({ message: "La somme des pondérations des notes doit être égale à 85% (présence 10%, participation 5%)." });
    }

    // Vérifier que les notes et les autres champs sont valides (entre 0 et 20)
    if (!notes.every(note => note >= 0 && note <= 20) ||
        noteParticipation < 0 || noteParticipation > 20 ||
        notePresence < 0 || notePresence > 20) {
      return res.status(400).json({ message: "Les notes, la participation et la présence doivent être entre 0 et 20." });
    }

    // Créer une nouvelle note (la moyenne sera calculée automatiquement par le middleware dans models/Note.js)
    const note = new Note({
      etudiantMatricule,
      sousModuleCode,
      notes,
      ponderations,
      noteParticipation,
      notePresence
    });

    // Sauvegarder la note
    await note.save();
    res.status(201).json({ message: "Note sauvegardée avec succès", data: note });
  } catch (error) {
    console.error('Erreur dans /api/notes/sous-modules:', error);
    res.status(500).json({ message: "Erreur serveur", details: error.message });
  }
});

// ➤ Récupérer toutes les notes d’un étudiant
router.get("/:etudiantMatricule", verifyToken, canViewNotes, async (req, res) => {
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
    const moyenneModule = notes.reduce((acc, note) => {
      const sousModule = module.sousModules.find(s => s.code === note.sousModuleCode);
      return acc + (note.moyenneSousModule * (sousModule?.coefficient / totalCoefficient || 0));
    }, 0);

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
    const modules = await ModuleGlobal.find({ semestre: parseInt(semestreNumero) });
    if (modules.length === 0) return res.status(404).json({ message: "Aucun module trouvé pour ce semestre" });

    // Calcul de la moyenne pondérée du semestre
    let totalCoefficient = 0;
    let totalPoints = 0;

    for (const module of modules) {
      const notes = await Note.find({ etudiantMatricule, sousModuleCode: { $in: module.sousModules.map(s => s.code) } });
      if (notes.length === 0) continue;

      const coefficientModule = module.sousModules.reduce((acc, s) => acc + s.coefficient, 0);
      totalCoefficient += coefficientModule;
      totalPoints += notes.reduce((acc, note) => {
        const sousModule = module.sousModules.find(s => s.code === note.sousModuleCode);
        return acc + (note.moyenneSousModule * (sousModule?.coefficient / coefficientModule || 0));
      }, 0);
    }

    const moyenneSemestre = totalCoefficient > 0 ? totalPoints / totalCoefficient : 0;
    res.json({ etudiantMatricule, semestreNumero, moyenneSemestre });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ajout d'une route GET pour récupérer la moyenne annuelle d'un étudiant
router.get("/:etudiantMatricule/annee", async (req, res) => {
  try {
    const { etudiantMatricule } = req.params;

    // Récupérer les moyennes des deux semestres (assumant L1 = semestres 1 et 2, etc.)
    const [semestre1, semestre2] = await Promise.all([
      Note.find({ etudiantMatricule, semestre: 1 }),
      Note.find({ etudiantMatricule, semestre: 2 }),
    ]);

    if (semestre1.length === 0 || semestre2.length === 0) {
      return res.status(404).json({ message: "Données incomplètes pour calculer la moyenne annuelle" });
    }

    // Calculer la moyenne annuelle (moyenne des moyennes semestrielles)
    const moyenneAnnuelle = (semestre1.moyenneSemestre + semestre2.moyenneSemestre) / 2;
    res.json({ etudiantMatricule, moyenneAnnuelle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer une note spécifique pour un étudiant et un sous-module
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
router.put("/:etudiantMatricule/:sousModuleCode", verifyToken, canEnterNotes, async (req, res) => {
  try {
    const { etudiantMatricule, sousModuleCode } = req.params;
    console.log(`🔍 Recherche de la note pour l'étudiant ${etudiantMatricule} et le sous-module ${sousModuleCode}`);

    const note = await Note.findOne({ etudiantMatricule, sousModuleCode });

    if (!note) {
      console.log("❌ Aucune note trouvée avec findOne() !");
      console.log("🔍 Tentative de recherche avec find() pour voir s'il y a des doublons...");
      const allNotes = await Note.find({ etudiantMatricule, sousModuleCode });

      if (allNotes.length > 0) {
        console.log(`⚠️ Plusieurs notes trouvées (${allNotes.length} entrées), possible problème de doublon.`);
        return res.status(400).json({ message: "Plusieurs notes trouvées pour cet étudiant et sous-module. Vérifiez la base de données." });
      }

      return res.status(404).json({ message: "Aucune note trouvée." });
    }

    console.log("✅ Note trouvée :", note);

    note.notes = req.body.notes || note.notes;
    note.ponderations = req.body.ponderations || note.ponderations;
    note.noteParticipation = req.body.noteParticipation || note.noteParticipation;
    note.notePresence = req.body.notePresence || note.notePresence;

    // Recalculer la moyenne si des modifications sont apportées
    if (req.body.notes || req.body.ponderations || req.body.noteParticipation || req.body.notePresence) {
      const totalPonderation = (note.ponderations || req.body.ponderations).reduce((acc, p) => acc + p, 0);
      if (totalPonderation !== 85) {
        return res.status(400).json({ message: "La somme des pondérations des notes doit être égale à 85%." });
      }

      const moyenneNotes = (note.notes || req.body.notes).reduce((sum, note, index) => 
        sum + (note * ((note.ponderations || req.body.ponderations)[index] / 100)), 0);
      note.moyenneSousModule = (moyenneNotes * 0.85) + (note.noteParticipation * 0.10) + (note.notePresence * 0.05);
    }

    await note.save();
    res.json({ message: "Notes mises à jour avec succès", note });
  } catch (error) {
    console.log("❌ ERREUR :", error.message);
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

// ➤ Récupérer toutes les notes pour un département, niveau et semestre
router.get("/:departement/:niveau/:semestre", async (req, res) => {
  try {
    const { departement, niveau, semestre } = req.params;
    const notes = await Note.find({ departementCode: departement, niveau, semestre })
      .populate("etudiant")
      .populate("sousModule");
    if (!notes.length) {
      return res.status(404).json({ message: "Aucune note trouvée" });
    }
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer toutes les notes
router.get("/", async (req, res) => {
  try {
    console.log("📌 Récupération de toutes les notes...");

    const notes = await Note.find();
    if (notes.length === 0) {
      console.log("❌ Aucune note trouvée !");
      return res.status(404).json({ message: "Aucune note enregistrée dans la base de données." });
    }

    console.log(`✅ ${notes.length} notes trouvées.`);
    res.json(notes);
  } catch (error) {
    console.log("❌ ERREUR :", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Ajouter une note (POST /api/notes)
router.post("/", verifyToken, canEnterNotes, async (req, res) => {
  try {
    const note = new Note(req.body);
    await note.save();
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;