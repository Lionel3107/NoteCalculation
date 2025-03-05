// backend/controllers/Note.js
const Note = require('../models/Note'); // Ajuste selon ton modèle (par exemple, Note.js)
const ModuleGlobal = require('../models/ModuleGlobal'); // Pour vérifier les sous-modules

exports.createSousModuleNote = async (data) => {
  try {
    const { etudiantMatricule, sousModuleCode, notePresence, noteParticipation, notes, ponderations } = data;

    // Vérifier si le sous-module existe dans un module global
    const module = await ModuleGlobal.findOne({ 'sousModules.code': sousModuleCode });
    if (!module) {
      throw new Error('Sous-module non trouvé');
    }

    // Vérifier si le nombre de notes correspond au nombre de pondérations
    if (notes.length !== ponderations.length || notes.length === 0) {
      throw new Error('Le nombre de notes doit correspondre au nombre de pondérations.');
    }

    // Vérifier que les pondérations totalisent 85% (pour laisser 10% à notePresence et 5% à noteParticipation)
    const totalPonderation = ponderations.reduce((acc, p) => acc + p, 0);
    if (totalPonderation !== 85) {
      throw new Error('La somme des pondérations des notes doit être égale à 85% (présence 10%, participation 5%).');
    }

    // Vérifier que les notes et les autres champs sont valides (entre 0 et 20)
    if (!notes.every(note => note >= 0 && note <= 20) ||
        noteParticipation < 0 || noteParticipation > 20 ||
        notePresence < 0 || notePresence > 20) {
      throw new Error('Les notes, la participation et la présence doivent être entre 0 et 20.');
    }

    // Créer une nouvelle note (la moyenne sera calculée automatiquement par le middleware dans models/Note.js)
    const newNote = new Note({
      etudiantMatricule,
      sousModuleCode,
      notes,
      ponderations,
      noteParticipation,
      notePresence,
    });

    return await newNote.save();
  } catch (error) {
    throw new Error(`Erreur lors de la sauvegarde de la note: ${error.message}`);
  }
};

// Fonction pour vérifier l’existence d’un sous-module
exports.checkSousModule = async (sousModuleCode) => {
  const module = await ModuleGlobal.findOne({ 'sousModules.code': sousModuleCode });
  return module ? true : false;
};