const mongoose = require("mongoose");

// Définition du schéma Étudiant
const studentSchema = new mongoose.Schema({
  matricule: { 
    type: String, 
    required: true, 
    unique: true, 
    match: /^bs\d{5}$/ // Vérifie que le matricule respecte "bsXXXXX"
  },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telephone: { type: String },
  dateNaissance: { type: Date },
  departement: { type: mongoose.Schema.Types.ObjectId, ref: "Departement", required: true }, // Lien vers le département
  niveau: { 
    type: String, 
    required: true,
    enum: ["L1", "L2", "L3"] // Uniquement L1, L2, L3
  },
  dateInscription: { type: Date, default: Date.now }
});

// Création du modèle
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
