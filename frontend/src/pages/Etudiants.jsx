import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Typography, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Box } from "@mui/material";
import "../styles/etudiants.css";

const Etudiants = () => {
  const [departement, setDepartement] = useState("INFO");
  const [niveau, setNiveau] = useState("L1");
  const [etudiants, setEtudiants] = useState([]);
  const [newStudent, setNewStudent] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    email: "",
  });

  // Charger la liste des étudiants selon le département et le niveau
  useEffect(() => {
    axios.get(`http://localhost:5000/api/departements/${departement}/${niveau}`)
      .then((res) => setEtudiants(res.data.students))
      .catch((err) => console.error("❌ Erreur API :", err));
  }, [departement, niveau]);

  // Gérer la modification des champs du formulaire
  const handleChange = (e) => {
    setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
  };

  // Fonction pour ajouter un étudiant
  const handleAddStudent = () => {
    const token = localStorage.getItem("token"); // Récupérer le token
    console.log("🟢 Token récupéré :", token); // ✅ Vérifier si le token est bien là

    if (!token) {
      alert("🔴 Accès refusé ! Veuillez vous reconnecter.");
      return;
    }
  
    if (!newStudent.matricule || !newStudent.nom || !newStudent.prenom || !newStudent.email) {
      alert("🔴 Veuillez remplir tous les champs !");
      return;
    }
  
    axios.post("http://localhost:5000/api/students", {
      ...newStudent,
      departementCode: departement,
      niveau: niveau,
    }, {
      headers: { Authorization: `Bearer ${token}` } // 🔥 Ajouter le token ici
    })
    .then((res) => {
      console.log("✅ Étudiant ajouté :", res.data);
      alert("✅ Étudiant ajouté avec succès !");
      setEtudiants([...etudiants, res.data]); // Ajouter l’étudiant à la liste affichée
      setNewStudent({ matricule: "", nom: "", prenom: "", email: "" }); // Réinitialiser le formulaire
    })
    .catch((err) => {
      console.error("❌ Erreur lors de l'ajout :", err.response?.data || err);
      alert("❌ Erreur lors de l'ajout de l'étudiant !");
    });
  };
  
  return (
    <Container className="container">
      <Box className="table-container">
        <Typography variant="h4">Gestion des Étudiants</Typography>

        {/* Filtres */}
        <div className="filters">
          <Select value={departement} onChange={(e) => setDepartement(e.target.value)}>
            <MenuItem value="INFO">Informatique</MenuItem>
            <MenuItem value="MECA">Mécanique</MenuItem>
            <MenuItem value="ELEC">Électricité</MenuItem>
          </Select>

          <Select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
            <MenuItem value="L1">L1</MenuItem>
            <MenuItem value="L2">L2</MenuItem>
            <MenuItem value="L3">L3</MenuItem>
          </Select>
        </div>

        {/* Formulaire d'ajout */}
        <Box className="add-student-form">
          <TextField label="Matricule" name="matricule" value={newStudent.matricule} onChange={handleChange} />
          <TextField label="Nom" name="nom" value={newStudent.nom} onChange={handleChange} />
          <TextField label="Prénom" name="prenom" value={newStudent.prenom} onChange={handleChange} />
          <TextField label="Email" name="email" value={newStudent.email} onChange={handleChange} />
          <Button variant="contained" color="primary" onClick={handleAddStudent}>Ajouter Étudiant</Button>
        </Box>

        {/* Tableau des étudiants */}
        <div className="table-responsive">
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Matricule</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Prénom</TableCell>
                  <TableCell>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {etudiants.length > 0 ? (
                  etudiants.map((etudiant) => (
                    <TableRow key={etudiant._id}>
                      <TableCell>{etudiant.matricule}</TableCell>
                      <TableCell>{etudiant.nom}</TableCell>
                      <TableCell>{etudiant.prenom}</TableCell>
                      <TableCell>{etudiant.email}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">Aucun étudiant trouvé</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </Box>
    </Container>
  );
};

export default Etudiants;
