const express = require("express");
const { addStudent } = require("../controllers/studentController");
const { verifyToken, isSecretaire } = require("../middlewares/authMiddleware");

const router = express.Router();

// ➤ Ajouter un étudiant
router.post("/", verifyToken, isSecretaire, addStudent);

module.exports = router;
