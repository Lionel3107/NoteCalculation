// backend/models/Module.js
const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  nom: { type: String, required: true }, // Ex. "Mathématiques", "Programmation"
  code: { type: String, required: true, unique: true }, // Ex. "MATH", "PROG"
  departementCode: { type: String, required: true, enum: ['INFO', 'MECA', 'ELEC'] }, // Département associé
  niveauEtudes: { type: String, required: true, enum: ['L1', 'L2', 'L3'] }, // Niveau d'études
  semestre: { type: String, required: true, enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] }, // Semestre
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Module', moduleSchema);