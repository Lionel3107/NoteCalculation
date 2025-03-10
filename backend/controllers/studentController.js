const Student = require("../models/Student");

// Ajouter un étudiant
const addStudent = async (req, res) => {
  try {
    const { matricule, nom, prenom, email, departementCode, niveau } = req.body;

    // Vérifiez si l'étudiant existe déjà
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: "Cet étudiant existe déjà." });
    }

    const newStudent = new Student({
      matricule,
      nom,
      prenom,
      email,
      departementCode,
      niveau,
    });

    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout d'un étudiant :", error);
    res.status(500).json({ message: "Erreur lors de l'ajout de l'étudiant." });
  }
};

module.exports = { addStudent };