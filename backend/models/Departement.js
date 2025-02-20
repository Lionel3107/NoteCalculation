const mongoose = require("mongoose");

const departementSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true }, // Ex: Informatique, Mécanique, Électricité
  code: { type: String, required: true, unique: true }, // Ex: INFO, MECA, ELEC
  niveaux: [{ type: String, enum: ["L1", "L2", "L3"] }], // Niveaux disponibles dans ce département
  semestres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Semestre" }], // Liste des semestres associés
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }] // Liste des étudiants du département
});

const Departement = mongoose.model("Departement", departementSchema);
module.exports = Departement;
