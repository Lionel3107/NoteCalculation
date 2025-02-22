const mongoose = require("mongoose");

const semestreSchema = new mongoose.Schema({
  numero: { type: Number, required: true, unique: true, enum: [1, 2, 3, 4, 5, 6] },
  description: { type: String }, // Ex: "Semestre 1", "Semestre 2"
  modulesGlobales: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ModuleGlobal" 
  }] // Liste des modules globaux spécifiques à ce semestre
});

const Semestre = mongoose.model("Semestre", semestreSchema);
module.exports = Semestre;
