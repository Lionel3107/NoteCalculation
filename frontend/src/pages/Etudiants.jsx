import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import "../styles/etudiants.css";
import * as XLSX from "xlsx";

const Etudiants = () => {
  const [departement, setDepartement] = useState("INFO");
  const [niveau, setNiveau] = useState("L1");
  const [semestre, setSemestre] = useState("1");
  const [etudiants, setEtudiants] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    email: "",
  });
  const [studentsData, setStudentsData] = useState([]);

  // Charger la liste des étudiants selon le département, le niveau et le semestre
  useEffect(() => {
    if (!departement || !niveau || !semestre) return;

    axios
      .get(
        `http://localhost:4040/api/departements/${departement}/${niveau}/semestre/${semestre}/etudiants`
      )
      .then((res) => {
        console.log("🟢 Étudiants récupérés :", res.data.students); // 🔍 DEBUG
        setEtudiants(res.data.students);
      })
      .catch((err) =>
        console.error("❌ Erreur lors du chargement des étudiants :", err)
      );
  }, [departement, niveau, semestre]);

  // Ouvrir la boîte de dialogue de modification
  const handleOpenEditDialog = (student) => {
    setCurrentStudent(student);
    setOpenEditDialog(true);
  };

  // Fermer la boîte de dialogue de modification
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

  // Ajouter un étudiant manuellement
  const handleAddStudent = () => {
    if (
      !newStudent.matricule ||
      !newStudent.nom ||
      !newStudent.prenom ||
      !newStudent.email
    ) {
      alert("⚠️ Tous les champs sont obligatoires !");
      return;
    }

    const studentData = {
      ...newStudent,
      departementCode: departement,
      niveau: niveau,
    };

    console.log("🔍 Données envoyées à l'API :", studentData);

    const token = localStorage.getItem("token");
    axios
      .post("http://localhost:4040/api/students", studentData, {
        headers: { Authorization: `Bearer ${token}` },
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
    axios
      .put(
        `http://localhost:4040/api/students/${currentStudent._id}`,
        currentStudent,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        alert("✅ Étudiant modifié avec succès !");
        setEtudiants(
          etudiants.map((etudiant) =>
            etudiant._id === res.data._id ? res.data : etudiant
          )
        );
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

    axios
      .delete(`http://localhost:4040/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("✅ Étudiant supprimé avec succès !");
        setEtudiants(etudiants.filter((etudiant) => etudiant._id !== id));
      })
      .catch((err) => {
        console.error("❌ Erreur lors de la suppression :", err);
        alert("❌ Erreur lors de la suppression !");
      });
  };

  // Gérer l'upload d'un fichier Excel
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("Données extraites du fichier Excel :", jsonData);

      // Vérification de la structure du fichier Excel
      const requiredFields = ["Matricule", "Nom", "Prenom", "Email"];
      const isValidStructure = jsonData.every((item) =>
        requiredFields.every((field) => Object.keys(item).includes(field))
      );

      if (!isValidStructure) {
        alert(
          "❌ Le fichier Excel n'a pas la structure attendue. Les colonnes doivent être : Matricule, Nom, Prenom, Email."
        );
        return;
      }

      // Mettre à jour l'état des étudiants avec les données extraites
      const formattedData = jsonData.map((item) => ({
        matricule: item.Matricule,
        nom: item.Nom,
        prenom: item.Prenom,
        email: item.Email,
      }));

      console.log("Données formatées :", formattedData);

      // Ajouter les nouveaux étudiants à l'état
      setEtudiants([...etudiants, ...formattedData]);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <Container className="container">
      <Typography variant="h4">Gestion des Étudiants</Typography>

      {/* Filtres */}
      <div className="filters">
        <Select
          value={departement}
          onChange={(e) => setDepartement(e.target.value)}
        >
          <MenuItem value="INFO">Informatique</MenuItem>
          <MenuItem value="MECA">Mécanique</MenuItem>
          <MenuItem value="ELEC">Électricité</MenuItem>
        </Select>

        <Select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
          <MenuItem value="L1">L1</MenuItem>
          <MenuItem value="L2">L2</MenuItem>
          <MenuItem value="L3">L3</MenuItem>
        </Select>

        <Select value={semestre} onChange={(e) => setSemestre(e.target.value)}>
          <MenuItem value="1">Semestre 1</MenuItem>
          <MenuItem value="2">Semestre 2</MenuItem>
          <MenuItem value="3">Semestre 3</MenuItem>
          <MenuItem value="4">Semestre 4</MenuItem>
          <MenuItem value="5">Semestre 5</MenuItem>
          <MenuItem value="6">Semestre 6</MenuItem>
        </Select>
      </div>

      {/* Bouton pour ajouter un étudiant */}
      <Button
        variant="outlined"
        color="primary"
        onClick={handleOpenAddDialog}
        style={{ margin: "10px" }}
      >
        Ajouter un étudiant
      </Button>

      {/* Bouton pour uploader un fichier Excel */}
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        style={{ margin: "10px" }}
      />

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
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleOpenEditDialog(etudiant)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleDeleteStudent(etudiant._id)}
                      style={{ marginLeft: "10px" }}
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucun étudiant trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Fenêtre modale pour ajouter un étudiant */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Ajouter un étudiant</DialogTitle>
        <DialogContent>
          <TextField
            label="Matricule"
            value={newStudent.matricule}
            onChange={(e) =>
              setNewStudent({ ...newStudent, matricule: e.target.value })
            }
            fullWidth
          />
          <TextField
            label="Nom"
            value={newStudent.nom}
            onChange={(e) =>
              setNewStudent({ ...newStudent, nom: e.target.value })
            }
            fullWidth
          />
          <TextField
            label="Prénom"
            value={newStudent.prenom}
            onChange={(e) =>
              setNewStudent({ ...newStudent, prenom: e.target.value })
            }
            fullWidth
          />
          <TextField
            label="Email"
            value={newStudent.email}
            onChange={(e) =>
              setNewStudent({ ...newStudent, email: e.target.value })
            }
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleAddStudent} color="primary">
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fenêtre modale pour modifier un étudiant */}
      {currentStudent && (
        <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
          <DialogTitle>Modifier un étudiant</DialogTitle>
          <DialogContent>
            <TextField
              label="Matricule"
              value={currentStudent.matricule}
              fullWidth
              disabled
            />
            <TextField
              label="Nom"
              value={currentStudent.nom}
              onChange={(e) =>
                setCurrentStudent({ ...currentStudent, nom: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Prénom"
              value={currentStudent.prenom}
              onChange={(e) =>
                setCurrentStudent({ ...currentStudent, prenom: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Email"
              value={currentStudent.email}
              onChange={(e) =>
                setCurrentStudent({ ...currentStudent, email: e.target.value })
              }
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog} color="secondary">
              Annuler
            </Button>
            <Button onClick={handleEditStudent} color="primary">
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default Etudiants;