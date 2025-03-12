const express = require("express");
const { addStudent, addMultipleStudents } = require("../controllers/studentController");
const { verifyToken, isSecretaire } = require("../middlewares/authMiddleware");

const router = express.Router();

// ➤ Ajouter un étudiant
router.post("/", verifyToken, isSecretaire, addStudent);

// ➤ Ajouter plusieurs étudiants (pour l'upload Excel)
// Temporairement, nous supprimons les middlewares pour tester
router.post("/batch", addMultipleStudents);

module.exports = router;
