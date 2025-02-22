const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  etudiantMatricule: { type: String, required: true }, // Identifiant de l'étudiant
  sousModuleCode: { type: String, required: true }, // Code du sous-module concerné
  notes: [{ type: Number, required: true }], // Liste des notes
  ponderations: [{ type: Number, required: true }], // Pondérations attribuées aux notes
  noteParticipation: { type: Number, required: true, default: 0 }, // Note de participation (10%)
  notePresence: { type: Number, required: true, default: 0 }, // Note de présence (5%)
  moyenneSousModule: { type: Number, default: null } // Moyenne calculée automatiquement
});

// ➤ Calcul automatique de la moyenne avant d'enregistrer
noteSchema.pre("save", function (next) {
  if (this.notes.length === 0 || this.ponderations.length !== this.notes.length) {
    return next(new Error("Le nombre de notes doit correspondre au nombre de pondérations."));
  }

  // Calcul de la moyenne pondérée
  const moyennePonderee = this.notes.reduce((sum, note, index) => sum + (note * (this.ponderations[index] / 100)), 0);
  this.moyenneSousModule = (moyennePonderee * 0.85) + (this.noteParticipation * 0.10) + (this.notePresence * 0.05);
  
  next();
});

const Note = mongoose.model("Note", noteSchema);
module.exports = Note;
