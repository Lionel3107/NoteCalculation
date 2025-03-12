const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  etudiantMatricule: { 
    type: String, 
    required: true, 
    ref: 'Student' // Référence au modèle Student pour lier les notes à un étudiant
  },
  sousModuleCode: { 
    type: String, 
    required: true, 
    ref: 'SousModule' // Référence au modèle SousModule pour lier à un sous-module spécifique (ex. ALG101)
  },
  notes: [{ 
    type: Number, 
    required: true, 
    min: 0, 
    max: 20 
  }], // Tableau de notes (1, 2, ou 3 notes)
  ponderations: [{ 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  }], // Tableau de pourcentages pour chaque note (doit totaliser 85%)
  noteParticipation: { 
    type: Number, 
    required: true, 
    default: 0, 
    min: 0, 
    max: 20 
  }, // Note de participation (5%)
  notePresence: { 
    type: Number, 
    required: true, 
    default: 0, 
    min: 0, 
    max: 20 
  }, // Note de présence (10%)
  moyenneSousModule: { 
    type: Number, 
    default: null, 
    min: 0, 
    max: 20 
  }, // Moyenne calculée automatiquement
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ➤ Calcul automatique de la moyenne avant d'enregistrer
noteSchema.pre("save", function (next) {
  if (this.notes.length === 0 || this.ponderations.length !== this.notes.length) {
    return next(new Error("Le nombre de notes doit correspondre au nombre de pondérations."));
  }

  // Vérifier que les pondérations totalisent 85% (pour laisser 10% à la présence et 5% à la participation)
  const totalPonderations = this.ponderations.reduce((sum, pond) => sum + pond, 0);
  if (totalPonderations !== 85) {
    return next(new Error("La somme des pondérations des notes doit être égale à 85%."));
  }

  // Calcul de la moyenne pondérée : 85% pour les notes, 10% pour la participation, 5% pour la présence
  const moyenneNotes = this.notes.reduce((sum, note, index) => sum + (note * (this.ponderations[index] / 100)), 0);
  const moyennePonderee = (moyenneNotes * 0.85) + (this.noteParticipation * 0.10) + (this.notePresence * 0.05);
  
  // Limiter la moyenne entre 0 et 20
  this.moyenneSousModule = Math.min(20, Math.max(0, moyennePonderee));
  
  next();
});

const Note = mongoose.model("Note", noteSchema);
module.exports = Note;