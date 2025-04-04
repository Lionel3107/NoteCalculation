const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["Directeur", "ChefDepartement", "Professeur", "Secretaire"],
    required: true,
  },
  departementCode: { type: String }, // Utilisé pour les chefs de département et la secrétaire
  sousModulesEnseignes: [{ type: String, default: [] }], // Utilisé pour les professeurs
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
