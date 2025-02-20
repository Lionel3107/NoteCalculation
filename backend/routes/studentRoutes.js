const express = require("express");
const Student = require("../models/Student");

const router = express.Router();

// ➤ Ajouter un étudiant
router.post("/", async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ➤ Récupérer tous les étudiants
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer un étudiant par matricule
router.get("/:matricule", async (req, res) => {
  try {
    const student = await Student.findOne({ matricule: req.params.matricule });
    if (!student) return res.status(404).json({ message: "Étudiant non trouvé" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➤ Mettre à jour un étudiant
router.put("/:matricule", async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { matricule: req.params.matricule },
      req.body,
      { new: true }
    );
    if (!student) return res.status(404).json({ message: "Étudiant non trouvé" });
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ➤ Supprimer un étudiant
router.delete("/:matricule", async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ matricule: req.params.matricule });
    if (!student) return res.status(404).json({ message: "Étudiant non trouvé" });
    res.json({ message: "Étudiant supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
