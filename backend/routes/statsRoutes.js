const express = require("express");
const Student = require("../models/Student");
const ModuleGlobal = require("../models/ModuleGlobal");

const router = express.Router();

// 📊 ➤ 1️⃣ Rapport de Performance des Étudiants
router.get("/etudiants/:departement/:niveau/:semestre", async (req, res) => {
    try {
      const { departement, niveau, semestre } = req.params;
      console.log(`📌 Rapport étudiants - Département: ${departement}, Niveau: ${niveau}, Semestre: ${semestre}`);
  
      // Récupérer les étudiants du département et niveau donnés
      const students = await Student.find({ departementCode: departement, niveau });
  
      if (students.length === 0) {
        return res.status(404).json({ message: "Aucun étudiant trouvé pour ces critères." });
      }
  
      // Trier les étudiants par moyenne générale (calculée) et ajouter leur moyenne dans la réponse
      const classement = students
        .map(student => ({
          matricule: student.matricule,
          nom: student.nom,
          prenom: student.prenom,
          email: student.email,
          moyenneGenerale: student.moyenneGenerale || 0, // Vérifie si la moyenne est bien définie
        }))
        .sort((a, b) => b.moyenneGenerale - a.moyenneGenerale); // Tri par moyenne décroissante
  
      res.json({ departement, niveau, semestre, classement });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  

// 📊 ➤ 2️⃣ Rapport des Modules
router.get("/modules/:departement/:semestre", async (req, res) => {
    try {
      const { departement, semestre } = req.params;
      console.log(`📌 Rapport modules - Département: ${departement}, Semestre: ${semestre}`);
  
      // Récupérer tous les modules globaux du département et semestre donné
      const modules = await ModuleGlobal.find({ departementCode: departement, semestre });
  
      if (modules.length === 0) {
        return res.status(404).json({ message: "Aucun module trouvé pour ces critères." });
      }
  
      // Vérifier les notes des étudiants et calculer les moyennes
      let rapportModules = await Promise.all(
        modules.map(async (module) => {
          // Récupérer tous les étudiants qui ont une note pour ce module
          const students = await Student.find({ "notes.sousModuleCode": { $in: module.sousModules.map(sm => sm.code) } });
  
          let totalMoyenne = 0;
          let nombreEtudiants = 0;
  
          students.forEach(student => {
            let moyenneModule = 0;
            let nombreNotes = 0;
            
            student.notes.forEach(note => {
              if (module.sousModules.some(sm => sm.code === note.sousModuleCode)) {
                moyenneModule += note.moyenne;
                nombreNotes++;
              }
            });
  
            if (nombreNotes > 0) {
              totalMoyenne += (moyenneModule / nombreNotes);
              nombreEtudiants++;
            }
          });
  
          const moyenneEtudiants = nombreEtudiants > 0 ? (totalMoyenne / nombreEtudiants).toFixed(2) : "Aucune note";
  
          return {
            nom: module.nom,
            code: module.code,
            moyenneEtudiants
          };
        })
      );
  
      res.json({ departement, semestre, modules: rapportModules });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  

module.exports = router;
