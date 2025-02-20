const mongoose = require("mongoose");

const semestreSchema = new mongoose.Schema({
  numero: { type: Number, required: true, unique: true, enum: [1, 2, 3, 4, 5, 6] }, 
  departement: { type: mongoose.Schema.Types.ObjectId, ref: "Departement", required: true }, // Lien vers le département
  niveau: { type: String, required: true, enum: ["L1", "L2", "L3"] }, // Niveau d'étude
  modulesGlobales: [{ type: mongoose.Schema.Types.ObjectId, ref: "ModuleGlobal" }], 
  totalCredits: { type: Number, default: 30 }
});

const Semestre = mongoose.model("Semestre", semestreSchema);
module.exports = Semestre;
