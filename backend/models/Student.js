const mongoose = require("mongoose");

// Définition du schéma Étudiant
const studentSchema = new mongoose.Schema({
  matricule: { type: String, required: true },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telephone: { type: String },
  dateNaissance: { type: Date },
  departementCode: { type: String, required: true },
  niveau: { type: String, required: true },
  dateInscription: { type: Date, default: Date.now }
});

// Création du modèle
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
