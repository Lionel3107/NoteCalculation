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
  TextField, 
  Button, 
  Box, 
  Grid 
} from "@mui/material";
import "../styles/notes.css";
import SousModuleForm from "../components/SousModuleForm"; // Importer notre composant
import ModuleGlobalForm from "../components/ModuleGlobalForm"; // Importer notre composant

const Notes = () => {
  const [departement, setDepartement] = useState("INFO");
  const [niveau, setNiveau] = useState("L1");
  const [semestre, setSemestre] = useState("1");
  const [etudiants, setEtudiants] = useState([]);
  const [modules, setModules] = useState([]);
  const [editingNotes, setEditingNotes] = useState({});
  const [userRole, setUserRole] = useState("");
  const [selectedEtudiant, setSelectedEtudiant] = useState(null); // Pour gérer la saisie détaillée

  // Fonction pour obtenir les semestres en fonction du niveau
  const getSemestresForNiveau = (niveau) => {
    switch (niveau) {
      case "L1": return ["1", "2"];
      case "L2": return ["3", "4"];
      case "L3": return ["5", "6"];
      default: return ["1", "2"];
    }
  };

  // Charger les étudiants, modules et rôle utilisateur
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

  // Gérer la modification locale des notes (présence, participation, tests)
  const handleNoteChange = (matricule, sousModuleCode, type, value) => {
    setEditingNotes((prev) => ({
      ...prev,
      [matricule]: {
        ...prev[matricule],
        [sousModuleCode]: {
          ...prev[matricule]?.[sousModuleCode],
          [type]: value,
        },
      },
    }));
  };

  // Calculer la moyenne d'un sous-module (pondérations : Présence 20%, Participation 20%, Tests 50% sur 5 tests de 10%)
  const calculerMoyenneSousModule = (notes) => {
    const { presence, participation, test1, test2, test3, test4, test5 } = notes;
    const pres = parseFloat(presence) || 0;
    const part = parseFloat(participation) || 0;
    const t1 = parseFloat(test1) || 0;
    const t2 = parseFloat(test2) || 0;
    const t3 = parseFloat(test3) || 0;
    const t4 = parseFloat(test4) || 0;
    const t5 = parseFloat(test5) || 0;

    const moyenne = (pres * 0.2 + part * 0.2 + (t1 + t2 + t3 + t4 + t5) * 0.1);
    return isNaN(moyenne) ? 0 : Math.min(20, Math.max(0, moyenne)); // Limiter entre 0 et 20
  };

  // Calculer la moyenne globale pondérée par crédits
  const calculerMoyenneGlobale = (etudiant, modulesData) => {
    const totalPondere = modulesData.reduce((acc, module) => {
      const moduleNotes = etudiant.notes?.[module.code] || {};
      const moduleMoyenne = Object.values(moduleNotes).reduce((sum, notes) => {
        return sum + calculerMoyenneSousModule(notes);
      }, 0) / (module.sousModules.length || 1);
      return acc + (moduleMoyenne * module.credits);
    }, 0);
    const totalCredits = modulesData.reduce((acc, module) => acc + module.credits, 0);
    return totalCredits ? totalPondere / totalCredits : 0;
  };

  // Sauvegarder les notes modifiées
  const handleSaveNotes = (matricule, sousModuleCode) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ Vous devez être connecté pour modifier une note !");
      return;
    }

    const notesToSend = editingNotes[matricule]?.[sousModuleCode] || {};
    const moyenne = calculerMoyenneSousModule(notesToSend);

    if (!notesToSend.presence || !notesToSend.participation || 
        !notesToSend.test1 || !notesToSend.test2 || !notesToSend.test3 || 
        !notesToSend.test4 || !notesToSend.test5) {
      alert("❌ Toutes les notes (présence, participation, tests) doivent être remplies !");
      return;
    }

    axios.put(`http://localhost:5000/api/notes/${matricule}/${sousModuleCode}`, {
      ...notesToSend,
      moyenne,
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

  // Afficher le formulaire détaillé pour un étudiant et un sous-module spécifique
  const openSousModuleForm = (etudiant, sousModule) => {
    setSelectedEtudiant({ ...etudiant, sousModule });
  };

  const convertirEnGrade = (moyenne) => {
    if (moyenne >= 16) return 'A';
    if (moyenne >= 14) return 'B';
    if (moyenne >= 12) return 'C';
    if (moyenne >= 10) return 'D';
    return 'F';
  };

  const estReussi = (moyenne) => moyenne >= 10;

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
                  {module.nom} (Crédits: {module.credits})
                </TableCell>
              ))}
              <TableCell rowSpan={2}>Moyenne Globale</TableCell>
              <TableCell rowSpan={2}>Grade</TableCell>
              <TableCell rowSpan={2}>Statut</TableCell>
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
            {etudiants.map((etudiant) => {
              const moyenneGlobale = calculerMoyenneGlobale(etudiant, modules);
              const grade = convertirEnGrade(moyenneGlobale);
              const statut = estReussi(moyenneGlobale) ? "PASS" : "FAIL";

              return (
                <TableRow key={etudiant.matricule}>
                  <TableCell>{etudiant.matricule}</TableCell>
                  <TableCell>{etudiant.nom}</TableCell>
                  <TableCell>{etudiant.prenom}</TableCell>

                  {modules.flatMap((module) =>
                    module.sousModules.map((sousModule, index) => (
                      <TableCell key={sousModule.code}>
                        {userRole === "Professeur" ? (
                          <Button 
                            variant="outlined" 
                            onClick={() => openSousModuleForm(etudiant, sousModule)}
                          >
                            Modifier
                          </Button>
                        ) : (
                          etudiant.notes?.[sousModule.code]?.moyenne?.toFixed(2) ?? "N/A"
                        )}
                      </TableCell>
                    ))
                  )}
                  <TableCell>{moyenneGlobale.toFixed(2)}</TableCell>
                  <TableCell sx={{ color: statut === "PASS" ? "green" : "red" }}>{grade}</TableCell>
                  <TableCell sx={{ color: statut === "PASS" ? "green" : "red" }}>{statut}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Formulaire détaillé pour la saisie (modal ou popup) */}
      {selectedEtudiant && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5">Saisie des notes pour {selectedEtudiant.nom} {selectedEtudiant.prenom}</Typography>
          <SousModuleForm 
            sousModuleNom={selectedEtudiant.sousModule.nom} 
            onSave={(data) => handleSaveNotes(selectedEtudiant.matricule, selectedEtudiant.sousModule.code, data)}
            initialNotes={etudiants.find(e => e.matricule === selectedEtudiant.matricule)?.notes?.[selectedEtudiant.sousModule.code]}
          />
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={() => setSelectedEtudiant(null)}
            sx={{ mt: 2 }}
          >
            Fermer
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Notes;