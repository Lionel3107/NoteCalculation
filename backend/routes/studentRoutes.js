const express = require("express");
const Student = require("../models/Student");
const { body, validationResult } = require("express-validator");
const { verifyToken, isSecretaire } = require("../middlewares/authMiddleware");

const router = express.Router();

// ➤ Ajouter un étudiant
router.post(
  "/", verifyToken, isSecretaire,
  [
    body("matricule").notEmpty().withMessage("Le matricule est requis"),
    body("nom").notEmpty().withMessage("Le nom est requis"),
    body("email").isEmail().withMessage("Email invalide"),
    body("departementCode").notEmpty().withMessage("Le département est requis"),
    body("niveau").isIn(["L1", "L2", "L3"]).withMessage("Niveau invalide"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const student = new Student(req.body);
      await student.save();
      res.status(201).json(student);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);


// ➤ Récupérer tous les étudiants
router.get("/", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const students = await Student.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
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
router.put("/:id", verifyToken, isSecretaire, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!student) return res.status(404).json({ message: "Étudiant non trouvé." });

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ➤ Supprimer un étudiant
router.delete("/:id", verifyToken, isSecretaire, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Étudiant non trouvé." });

    res.json({ message: "Étudiant supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
