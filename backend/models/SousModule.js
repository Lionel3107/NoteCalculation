// backend/models/SousModule.js
const mongoose = require('mongoose');

const sousModuleSchema = new mongoose.Schema({
  nom: { type: String, required: true }, // Ex. "Algèbre 1", "Programmation C"
  code: { type: String, required: true, unique: true }, // Ex. "ALG101", "PROG101"
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true }, // Référence au module global
  departementCode: { type: String, required: true, enum: ['INFO', 'MECA', 'ELEC'] }, // Département associé
  niveauEtudes: { type: String, required: true, enum: ['L1', 'L2', 'L3'] }, // Niveau d'études
  semestre: { type: String, required: true, enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] }, // Semestre
  coefficient: { type: Number, default: 1 },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SousModule', sousModuleSchema);