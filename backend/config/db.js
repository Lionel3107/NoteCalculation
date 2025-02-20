const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB :", error);
    process.exit(1); // Arrêter le serveur en cas d'échec
  }
};

module.exports = connectDB;
