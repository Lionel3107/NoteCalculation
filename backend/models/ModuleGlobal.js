const mongoose = require("mongoose");

const moduleGlobalSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true }, 
  code: { type: String, required: true, unique: true }, 
  departementCode: { type: String, required: true }, // Département auquel appartient le module 
  niveau: { 
    type: String, 
    required: true, 
    enum: ["L1", "L2", "L3"] 
  }, 
  sousModules: [{
    nom: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    coefficient: { type: Number, required: true, min: 1, max: 15 }
  }],
  coefficientTotal: { type: Number, required: true, min: 1 }, 
  semestre: { type: Number, required: true, enum: [1, 2, 3, 4, 5, 6] }
});

// Vérifier que la somme des coefficients des sous-modules = coefficient total
moduleGlobalSchema.pre("save", function (next) {
  const totalCoefficients = this.sousModules.reduce((sum, mod) => sum + mod.coefficient, 0);
  if (totalCoefficients !== this.coefficientTotal) {
    return next(new Error("La somme des coefficients des sous-modules doit être égale au coefficient total du module global."));
  }
  next();
});

const ModuleGlobal = mongoose.model("ModuleGlobal", moduleGlobalSchema);
module.exports = ModuleGlobal;
