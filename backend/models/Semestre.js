// backend/models/Semestre.js
const mongoose = require('mongoose');

const semestreSchema = new mongoose.Schema({
  numero: { type: Number, required: true, enum: [1, 2, 3, 4, 5, 6] }, // Correspond à S1, S2, etc.
  description: { type: String },
  modulesGlobales: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }], // Référence aux modules globaux
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Semestre', semestreSchema);