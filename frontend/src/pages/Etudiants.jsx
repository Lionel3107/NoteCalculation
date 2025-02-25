import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Typography, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import "../styles/etudiants.css";

const Etudiants = () => {
  const [departement, setDepartement] = useState("INFO");
  const [niveau, setNiveau] = useState("L1");
  const [etudiants, setEtudiants] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/departements/${departement}/${niveau}`)
      .then((res) => setEtudiants(res.data.students))
      .catch((err) => console.error("❌ Erreur API :", err));
  }, [departement, niveau]);

  return (
    <div className="container">
      <div className="table-container">
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

        {/* Tableau des étudiants */}
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
    </div>
  );
};

export default Etudiants;
