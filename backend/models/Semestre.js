const mongoose = require("mongoose");

const semestreSchema = new mongoose.Schema({
  numero: { type: Number, required: true, unique: true, enum: [1, 2, 3, 4, 5, 6] }, 
  modulesGlobales: [{ type: mongoose.Schema.Types.ObjectId, ref: "ModuleGlobal" }], 
  totalCredits: { type: Number, default: 30 }
});

const Semestre = mongoose.model("Semestre", semestreSchema);
module.exports = Semestre;
