// backend/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { body, validationResult } = require('express-validator');
const { verifyToken, isSecretaire } = require('../middlewares/authMiddleware');

// ➤ Ajouter un étudiant
router.post(
  '/',
  verifyToken,
  isSecretaire,
  [
    body('matricule').notEmpty().withMessage('Le matricule est requis'),
    body('nom').notEmpty().withMessage('Le nom est requis'),
    body('prenom').notEmpty().withMessage('Le prénom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('departementCode')
      .notEmpty()
      .withMessage('Le département est requis')
      .isIn(['INFO', 'MECA', 'ELEC'])
      .withMessage('Département invalide. Valeurs possibles : INFO, MECA, ELEC'),
    body('niveau')
      .notEmpty()
      .withMessage('Le niveau est requis')
      .isIn(['L1', 'L2', 'L3'])
      .withMessage('Niveau invalide. Valeurs possibles : L1, L2, L3'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { matricule, email } = req.body;

      // Vérifier que le matricule n’est pas déjà utilisé
      const existingStudentByMatricule = await Student.findOne({ matricule });
      if (existingStudentByMatricule) {
        return res.status(400).json({ message: 'Ce matricule est déjà utilisé.' });
      }

      // Vérifier que l’email n’est pas déjà utilisé
      const existingStudentByEmail = await Student.findOne({ email });
      if (existingStudentByEmail) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
      }

      const student = new Student(req.body);
      await student.save();
      res.status(201).json(student);
    } catch (error) {
      console.log('❌ Erreur lors de l’ajout de l’étudiant :', error.message);
      res.status(500).json({ message: error.message });
    }
  }
);

// ➤ Récupérer tous les étudiants
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const students = await Student.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalStudents = await Student.countDocuments();

    res.json({
      students,
      totalStudents,
      totalPages: Math.ceil(totalStudents / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des étudiants :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Récupérer un étudiant par matricule
router.get('/:matricule', async (req, res) => {
  try {
    const student = await Student.findOne({ matricule: req.params.matricule });
    if (!student) {
      return res.status(404).json({ message: 'Étudiant non trouvé.' });
    }
    res.json(student);
  } catch (error) {
    console.log('❌ Erreur lors de la récupération de l’étudiant :', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ➤ Mettre à jour un étudiant
router.put(
  '/:matricule',
  verifyToken,
  isSecretaire,
  [
    body('departementCode')
      .optional()
      .isIn(['INFO', 'MECA', 'ELEC'])
      .withMessage('Département invalide. Valeurs possibles : INFO, MECA, ELEC'),
    body('niveau')
      .optional()
      .isIn(['L1', 'L2', 'L3'])
      .withMessage('Niveau invalide. Valeurs possibles : L1, L2, L3'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email invalide'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { matricule } = req.params;
      const { email } = req.body;

      // Trouver l’étudiant
      const student = await Student.findOne({ matricule });
      if (!student) {
        return res.status(404).json({ message: 'Étudiant non trouvé.' });
      }

      // Si l’email est modifié, vérifier qu’il n’est pas déjà utilisé
      if (email && email !== student.email) {
        const existingStudentByEmail = await Student.findOne({ email });
        if (existingStudentByEmail) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        }
      }

      // Mettre à jour l’étudiant
      const updatedStudent = await Student.findOneAndUpdate(
        { matricule },
        req.body,
        { new: true }
      );

      res.json(updatedStudent);
    } catch (error) {
      console.log('❌ Erreur lors de la mise à jour de l’étudiant :', error.message);
      res.status(500).json({ message: error.message });
    }
  }
);

// ➤ Supprimer un étudiant
router.delete('/:matricule', verifyToken, isSecretaire, async (req, res) => {
  try {
    const { matricule } = req.params;

    // Trouver l’étudiant
    const student = await Student.findOne({ matricule });
    if (!student) {
      return res.status(404).json({ message: 'Étudiant non trouvé.' });
    }

    // Supprimer l’étudiant
    await Student.findOneAndDelete({ matricule });
    res.json({ message: 'Étudiant supprimé avec succès.' });
  } catch (error) {
    console.log('❌ Erreur lors de la suppression de l’étudiant :', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;