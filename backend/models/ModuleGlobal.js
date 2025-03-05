const mongoose = require("mongoose");

const sousModuleSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  code: { 
    type: String, 
    required: true, 
    unique: true, // S'assurer qu'un sousModuleCode comme ALG101 est unique dans toute la base
    index: true // Ajout d'un index pour les recherches rapides
  },
  coefficient: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 15 
  }
});

const moduleGlobalSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true, 
    unique: true 
  }, 
  code: { 
    type: String, 
    required: true, 
    unique: true 
  }, 
  departementCode: { 
    type: String, 
    required: true, 
    ref: 'Department' // Référence au modèle Department pour lier à un département
  }, 
  niveau: { 
    type: String, 
    required: true, 
    enum: ["L1", "L2", "L3"] 
  }, 
  sousModules: [sousModuleSchema],
  coefficientTotal: { 
    type: Number, 
    required: true, 
    min: 1 
  }, 
  semestre: { 
    type: Number, 
    required: true, 
    enum: [1, 2, 3, 4, 5, 6] 
  }
});

// Vérifier que la somme des coefficients des sous-modules = coefficient total
moduleGlobalSchema.pre("save", function (next) {
  const totalCoefficients = this.sousModules.reduce((sum, mod) => sum + mod.coefficient, 0);
  if (totalCoefficients !== this.coefficientTotal) {
    return next(new Error("La somme des coefficients des sous-modules doit être égale au coefficient total du module global."));
  }
  next();
});

// Index pour optimiser les recherches par département, niveau, et semestre
moduleGlobalSchema.index({ departementCode: 1, niveau: 1, semestre: 1 });

const ModuleGlobal = mongoose.model("ModuleGlobal", moduleGlobalSchema);
module.exports = ModuleGlobal;