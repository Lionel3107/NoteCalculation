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

// Ajouter plusieurs étudiants (pour l'upload Excel)
const addMultipleStudents = async (req, res) => {
  try {
    const students = req.body;
    console.log("Données reçues pour l'ajout multiple :", students);

    if (!Array.isArray(students)) {
      return res.status(400).json({ message: "Les données doivent être un tableau d'étudiants." });
    }

    if (students.length === 0) {
      return res.status(400).json({ message: "Aucun étudiant à ajouter." });
    }

    const results = [];
    const errors = [];

    // Traiter chaque étudiant
    for (const student of students) {
      try {
        const { matricule, nom, prenom, email, departementCode, niveau } = student;

        // Vérifier si tous les champs requis sont présents
        if (!matricule || !nom || !prenom || !email || !departementCode || !niveau) {
          console.log("Champs manquants pour l'étudiant:", student);
          errors.push({ student, error: "Champs manquants" });
          continue;
        }

        // Vérifier si l'étudiant existe déjà
        const existingStudent = await Student.findOne({
          $or: [
            { email: email },
            { matricule: matricule }
          ]
        });

        if (existingStudent) {
          // Option pour mettre à jour l'étudiant existant au lieu de le rejeter
          if (req.query.update === 'true') {
            existingStudent.nom = nom;
            existingStudent.prenom = prenom;
            existingStudent.email = email;
            existingStudent.departementCode = departementCode;
            existingStudent.niveau = niveau;
            
            const updatedStudent = await existingStudent.save();
            results.push(updatedStudent);
            console.log("Étudiant mis à jour avec succès:", updatedStudent);
          } else {
            console.log("Étudiant existant:", existingStudent);
            errors.push({ 
              student, 
              error: "Un étudiant avec cet email ou ce matricule existe déjà",
              details: {
                existingEmail: existingStudent.email === email,
                existingMatricule: existingStudent.matricule === matricule
              }
            });
          }
          continue;
        }

        // Créer et sauvegarder le nouvel étudiant
        const newStudent = new Student({
          matricule,
          nom,
          prenom,
          email,
          departementCode,
          niveau,
        });

        const savedStudent = await newStudent.save();
        results.push(savedStudent);
        console.log("Étudiant ajouté avec succès:", savedStudent);
      } catch (error) {
        console.error("Erreur lors de l'ajout d'un étudiant:", error);
        errors.push({ student, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `${results.length} étudiants ajoutés avec succès.`,
      results,
      errors
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout multiple d'étudiants :", error);
    res.status(500).json({ message: "Erreur lors de l'ajout des étudiants." });
  }
};

module.exports = { addStudent, addMultipleStudents };