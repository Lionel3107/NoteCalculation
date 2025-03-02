import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Typography, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import "../styles/etudiants.css";

const Etudiants = () => {
  const [departement, setDepartement] = useState("INFO");
  const [niveau, setNiveau] = useState("L1");
  const [semestre, setSemestre] = useState("1"); // Ajout de l'état du semestre
  const [etudiants, setEtudiants] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({ matricule: "", nom: "", prenom: "", email: "" });
  // Charger la liste des étudiants selon le département et le niveau
  useEffect(() => {
    if (!departement || !niveau || !semestre) return;
  
    axios.get(`http://localhost:5000/api/departements/${departement}/${niveau}/semestre/${semestre}/etudiants`)
      .then((res) => {
        console.log("🟢 Étudiants récupérés :", res.data.students); // 🔍 DEBUG
        setEtudiants(res.data.students);
      })
      .catch((err) => console.error("❌ Erreur lors du chargement des étudiants :", err));
  }, [departement, niveau, semestre]);
  

  // Ouvrir la boîte de dialogue de modification
  const handleOpenEditDialog = (student) => {
    setCurrentStudent(student);
    setOpenEditDialog(true);
  };

  // Fermer la boîte de dialogue
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setCurrentStudent(null);
  };
   // Ouvrir la boîte de dialogue d'ajout
   const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  // Fermer la boîte de dialogue d'ajout
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setNewStudent({ matricule: "", nom: "", prenom: "", email: "" });
  };

  const handleAddStudent = () => {
    if (!newStudent.matricule || !newStudent.nom || !newStudent.prenom || !newStudent.email) {
      alert("⚠️ Tous les champs sont obligatoires !");
      return;
    }
  
    const studentData = {
      ...newStudent,
      departementCode: departement, // On prend la valeur sélectionnée
      niveau: niveau // On prend la valeur sélectionnée
    };
  
    console.log("🔍 Données envoyées :", studentData); // Vérification avant envoi
  
    const token = localStorage.getItem("token");
    axios.post("http://localhost:5000/api/students", studentData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      alert("✅ Étudiant ajouté avec succès !");
      setEtudiants([...etudiants, res.data]);
      handleCloseAddDialog();
    })
    .catch((err) => {
      console.error("❌ Erreur lors de l'ajout :", err);
      console.error("🔍 Réponse du serveur :", err.response?.data);
      alert("❌ Erreur lors de l'ajout ! Vérifiez les données.");
    });
  };
  
  // Modifier les informations d'un étudiant
  const handleEditStudent = () => {
    const token = localStorage.getItem("token");
    axios.put(`http://localhost:5000/api/students/${currentStudent._id}`, currentStudent, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      alert("✅ Étudiant modifié avec succès !");
      setEtudiants(etudiants.map(etudiant => etudiant._id === res.data._id ? res.data : etudiant));
      handleCloseEditDialog();
    })
    .catch((err) => {
      console.error("❌ Erreur lors de la modification :", err);
      alert("❌ Erreur lors de la modification !");
    });
  };

  // Supprimer un étudiant
  const handleDeleteStudent = (id) => {
    const token = localStorage.getItem("token");

    if (!window.confirm("⚠️ Voulez-vous vraiment supprimer cet étudiant ?")) {
      return;
    }

    axios.delete(`http://localhost:5000/api/students/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      alert("✅ Étudiant supprimé avec succès !");
      setEtudiants(etudiants.filter((etudiant) => etudiant._id !== id)); // Mise à jour dynamique
    })
    .catch((err) => {
      console.error("❌ Erreur lors de la suppression :", err);
      alert("❌ Erreur lors de la suppression !");
    });
  };

  return (
    <Container className="container">
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

        {/* <Select value={semestre} onChange={(e) => setSemestre(e.target.value)}>
          <MenuItem value="1">Semestre 1</MenuItem>
          <MenuItem value="2">Semestre 2</MenuItem>
          <MenuItem value="3">Semestre 3</MenuItem>
          <MenuItem value="4">Semestre 4</MenuItem>
          <MenuItem value="5">Semestre 5</MenuItem>
          <MenuItem value="6">Semestre 6</MenuItem>
        </Select> */}

      </div>

      {/* Tableau des étudiants */}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Matricule</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Prénom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Actions</TableCell>
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
                  <TableCell>
                  <Button variant="outlined" color="primary" onClick={handleOpenAddDialog} style={{ margin: "10px" }}>
                    Ajouter un étudiant
                  </Button>
                    <Button variant="outlined" color="primary" onClick={() => handleOpenEditDialog(etudiant)}>
                      Modifier
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={() => handleDeleteStudent(etudiant._id)} style={{ marginLeft: "10px" }}>
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">Aucun étudiant trouvé</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Fenêtre modale pour ajouter un étudiant */}
      
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Ajouter un étudiant</DialogTitle>
        <DialogContent>
          <TextField label="Matricule" value={newStudent.matricule} onChange={(e) => setNewStudent({ ...newStudent, matricule: e.target.value })} fullWidth />
          <TextField label="Nom" value={newStudent.nom} onChange={(e) => setNewStudent({ ...newStudent, nom: e.target.value })} fullWidth />
          <TextField label="Prénom" value={newStudent.prenom} onChange={(e) => setNewStudent({ ...newStudent, prenom: e.target.value })} fullWidth />
          <TextField label="Email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color="secondary">Annuler</Button>
          <Button onClick={handleAddStudent} color="primary">Ajouter</Button>
        </DialogActions>
      </Dialog>
      
      {/* Fenêtre modale pour modifier un étudiant */}
      {currentStudent && (
        <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
          <DialogTitle>Modifier un étudiant</DialogTitle>
          <DialogContent>
            <TextField label="Matricule" value={currentStudent.matricule} fullWidth disabled />
            <TextField label="Nom" value={currentStudent.nom} onChange={(e) => setCurrentStudent({ ...currentStudent, nom: e.target.value })} fullWidth />
            <TextField label="Prénom" value={currentStudent.prenom} onChange={(e) => setCurrentStudent({ ...currentStudent, prenom: e.target.value })} fullWidth />
            <TextField label="Email" value={currentStudent.email} onChange={(e) => setCurrentStudent({ ...currentStudent, email: e.target.value })} fullWidth />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog} color="secondary">Annuler</Button>
            <Button onClick={handleEditStudent} color="primary">Enregistrer</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default Etudiants;
