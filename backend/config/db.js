const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Tentative de connexion à MongoDB avec l'URL:", process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB :", error);
    process.exit(1); // Arrêter le serveur en cas d'échec
  }
};

module.exports = connectDB;
