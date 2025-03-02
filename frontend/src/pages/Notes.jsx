import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Typography, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button } from "@mui/material";
import "../styles/notes.css";

const Notes = () => {
  const [departement, setDepartement] = useState("INFO");
  const [niveau, setNiveau] = useState("L1");
  const [semestre, setSemestre] = useState("1");
  const [etudiants, setEtudiants] = useState([]);
  const [modules, setModules] = useState([]);
  const [editingNotes, setEditingNotes] = useState({}); // Stockage des notes en modification
  const [editingPonderations, setEditingPonderations] = useState({});
  const [userRole, setUserRole] = useState(""); // Récupération du rôle de l'utilisateur

  // Fonction pour obtenir les semestres en fonction du niveau
  const getSemestresForNiveau = (niveau) => {
    switch (niveau) {
      case "L1": return ["1", "2"];
      case "L2": return ["3", "4"];
      case "L3": return ["5", "6"];
      default: return ["1", "2"];
    }
  };

  // Charger les étudiants, modules et notes
  useEffect(() => {
    if (!departement || !niveau || !semestre) return;

    axios.get(`http://localhost:5000/api/departements/${departement}/${niveau}/semestre/${semestre}/etudiants`)
      .then((res) => setEtudiants(res.data.students))
      .catch((err) => console.error("❌ Erreur lors du chargement des étudiants :", err));

    axios.get(`http://localhost:5000/api/departements/${departement}/${niveau}/semestre/${semestre}/modules`)
      .then((res) => setModules(res.data.modules))
      .catch((err) => console.error("❌ Erreur lors du chargement des modules :", err));

    axios.get(`http://localhost:5000/api/auth/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => setUserRole(res.data.role))
      .catch((err) => console.error("❌ Erreur récupération utilisateur :", err));
  }, [departement, niveau, semestre]);

  // Gérer la modification locale des notes avant envoi
  const handleNoteChange = (matricule, sousModuleCode, value, index) => {
    setEditingNotes((prev) => ({
      ...prev,
      [matricule]: {
        ...prev[matricule],
        [sousModuleCode]: {
          ...prev[matricule]?.[sousModuleCode],
          [index]: value,
        },
      },
    }));
  };

  // Sauvegarder les notes modifiées
  const handleSaveNotes = (matricule, sousModuleCode) => {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("❌ Vous devez être connecté pour modifier une note !");
        return;
    }

    // Récupérer les notes et convertir en nombres
    let notesToSend = Object.values(editingNotes[matricule]?.[sousModuleCode] || {}).map(value => Number(value));

    // Vérifier que toutes les valeurs sont bien des nombres
    if (notesToSend.some(isNaN) || notesToSend.length === 0) {
        alert("❌ Une ou plusieurs notes ne sont pas valides !");
        return;
    }

    // Vérification des pondérations
    let ponderations = Object.values(editingPonderations[matricule]?.[sousModuleCode] || {}).map(value => Number(value));

    // 🔥 **Correction : Si aucune pondération, on répartit automatiquement**
    if (ponderations.length === 0 || ponderations.some(isNaN)) {
        ponderations = Array(notesToSend.length).fill(100 / notesToSend.length);
    }

    // ✅ **Correction : S'assurer que notes et pondérations ont la même longueur**
    while (ponderations.length < notesToSend.length) {
        ponderations.push(100 / notesToSend.length);
    }

    while (notesToSend.length < ponderations.length) {
        notesToSend.push(0);  // Ajouter une note par défaut si manquante
    }

    // Vérifier que la somme des pondérations fait bien 100%
    const totalPonderation = ponderations.reduce((acc, val) => acc + val, 0);
    if (totalPonderation !== 100) {
        alert(`❌ La somme des pondérations doit être égale à 100% (actuellement ${totalPonderation}%)`);
        return;
    }

    console.log("📌 Données envoyées :", {
    notes: notesToSend,
    ponderations: ponderations,
    sousModuleCode: sousModuleCode
});

    axios.put(`http://localhost:5000/api/notes/${matricule}/${sousModuleCode}`, {
        notes: notesToSend,
        ponderations: ponderations,
        sousModuleCode: sousModuleCode
    }, {
        headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
        alert("✅ Notes mises à jour !");
        setEditingNotes((prev) => {
            const updatedNotes = { ...prev };
            delete updatedNotes[matricule][sousModuleCode];
            return updatedNotes;
        });
    })
    .catch((err) => {
        console.error("❌ Erreur lors de l'enregistrement :", err.response?.data || err);
        alert("❌ Erreur lors de l'enregistrement des notes !");
    });
};


  // Gérer la modification locale des pondérations avant envoi
  const handlePonderationChange = (matricule, sousModuleCode, index, value) => {
    setEditingPonderations((prev) => ({
        ...prev,
        [matricule]: {
            ...prev[matricule],
            [sousModuleCode]: {
                ...prev[matricule]?.[sousModuleCode],
                [index]: Number(value), // Assure que la pondération est un nombre
            },
        },
    }));
};


  return (
    <Container className="container">
      <Typography variant="h4">Notes des Étudiants</Typography>

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

        <Select value={semestre} onChange={(e) => setSemestre(e.target.value)}>
          {getSemestresForNiveau(niveau).map((sem) => (
            <MenuItem key={sem} value={sem}>Semestre {sem}</MenuItem>
          ))}
        </Select>
      </div>

      {/* Tableau des notes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2}>Matricule</TableCell>
              <TableCell rowSpan={2}>Nom</TableCell>
              <TableCell rowSpan={2}>Prénom</TableCell>
              {modules.map((module) => (
                <TableCell key={module.code} colSpan={module.sousModules.length}>
                  {module.nom}
                </TableCell>
              ))}
              <TableCell rowSpan={2}>Moyenne Module Global</TableCell>
            </TableRow>
            <TableRow>
              {modules.flatMap((module) =>
                module.sousModules.map((sousModule) => (
                  <TableCell key={sousModule.code}>{sousModule.nom}</TableCell>
                ))
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {etudiants.map((etudiant) => (
              <TableRow key={etudiant.matricule}>
                <TableCell>{etudiant.matricule}</TableCell>
                <TableCell>{etudiant.nom}</TableCell>
                <TableCell>{etudiant.prenom}</TableCell>

                {modules.flatMap((module) =>
                  module.sousModules.map((sousModule, index) => (
                    <TableCell key={sousModule.code}>
                      {userRole === "Professeur" ? (
                        <TextField
                          type="number"
                          value={editingNotes[etudiant.matricule]?.[sousModule.code]?.[index] ?? ""}
                          onChange={(e) => handleNoteChange(etudiant.matricule, sousModule.code, e.target.value, index)}
                          size="small"
                        />
                      ) : (
                        etudiant.notes?.[sousModule.code]?.[index] ?? "N/A"
                      )}
                    </TableCell>
                  ))
                )}
                {userRole === "Professeur" && (
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSaveNotes(etudiant.matricule, modules[0].sousModules[0].code)}
                    >
                      Enregistrer
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Notes;
