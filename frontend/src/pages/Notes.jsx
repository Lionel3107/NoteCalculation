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
  Box 
} from "@mui/material";
import "../styles/notes.css";
import SousModuleForm from "../components/SousModuleForm"; // Importer notre composant

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

  // Gérer la modification locale des notes (présence, participation, tests) - Optionnel, peut être retiré si on utilise uniquement SousModuleForm
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

  // Calculer la moyenne d'un sous-module (pondérations personnalisées + présence 10%, participation 5%)
  const calculerMoyenneSousModule = (notes, ponderations) => {
    const { presence, participation } = notes;
    const noteValues = notes.notes || [];
    const pondValues = ponderations || Array(noteValues.length).fill(100 / noteValues.length); // Pondérations par défaut si none

    const pres = parseFloat(presence) || 0;
    const part = parseFloat(participation) || 0;
    const totalPondNotes = pondValues.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);

    if (totalPondNotes !== 85) { // Les notes doivent totaliser 85% (présence 10%, participation 5%)
      console.warn("Les pondérations des notes ne totalisent pas 85%");
      return 0;
    }

    const weightedSum = noteValues.reduce((acc, note, i) => 
      acc + (parseFloat(note) || 0) * (parseFloat(pondValues[i]) / 100), 0) +
      (pres * 0.1) + (part * 0.05);
    
    return Math.min(20, Math.max(0, weightedSum)); // Limiter entre 0 et 20
  };

  // Calculer la moyenne globale pondérée par crédits
  const calculerMoyenneGlobale = (etudiant, modulesData) => {
    const totalPondere = modulesData.reduce((acc, module) => {
      const moduleNotes = etudiant.notes?.[module.code] || {};
      const modulePonderations = module.notes?.ponderations || []; // Si pondérations définies au niveau module
      const moduleMoyenne = Object.values(moduleNotes).reduce((sum, notes) => {
        return sum + calculerMoyenneSousModule(notes, modulePonderations);
      }, 0) / (module.sousModules.length || 1);
      return acc + (moduleMoyenne * (module.credits || 1));
    }, 0);
    const totalCredits = modulesData.reduce((acc, module) => acc + (module.credits || 1), 0);
    return totalCredits ? totalPondere / totalCredits : 0;
  };

  // Sauvegarder les notes modifiées via SousModuleForm
  const handleSaveNotes = (matricule, sousModuleCode, data) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ Vous devez être connecté pour modifier une note !");
      return;
    }

    const moyenne = calculerMoyenneSousModule(data, data.ponderations);

    axios.put(`http://localhost:5000/api/notes/${matricule}/${sousModuleCode}`, {
      presence: data.presence,
      participation: data.participation,
      notes: data.notes,
      ponderations: data.ponderations,
      moyenne,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      alert("✅ Notes mises à jour !");
      setSelectedEtudiant(null);
      // Rafraîchir les données
      axios.get(`http://localhost:5000/api/departements/${departement}/${niveau}/semestre/${semestre}/etudiants`)
        .then((res) => setEtudiants(res.data.students))
        .catch((err) => console.error("❌ Erreur lors du rechargement :", err));
    })
    .catch((err) => {
      console.error("❌ Erreur lors de l'enregistrement :", err.response?.data || err);
      alert("❌ Erreur lors de l'enregistrement des notes !");
    });
  };

  // Afficher le formulaire détaillé pour un étudiant et un sous-module spécifique
  const openSousModuleForm = (etudiant, sousModule) => {
    setSelectedEtudiant({ 
      ...etudiant, 
      sousModule, 
      initialNotes: etudiant.notes?.[sousModule.code] || {
        presence: '',
        participation: '',
        notes: [''],
        ponderations: [''],
      }
    });
  };

  // Convertir la moyenne en grade
  const convertirEnGrade = (moyenne) => {
    if (moyenne >= 16) return 'A';
    if (moyenne >= 14) return 'B';
    if (moyenne >= 12) return 'C';
    if (moyenne >= 10) return 'D';
    return 'F';
  };

  // Vérifier si l'étudiant a réussi
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
                  {module.nom} (Crédits: {module.credits || 1})
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
                    module.sousModules.map((sousModule) => (
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
        <Box sx={{ mt: 3, p: 2, border: '1px solid #ccc' }}>
          <Typography variant="h5">Saisie des notes pour {selectedEtudiant.nom} {selectedEtudiant.prenom}</Typography>
          <SousModuleForm 
            sousModuleNom={selectedEtudiant.sousModule.nom} 
            onSave={(data) => handleSaveNotes(selectedEtudiant.matricule, selectedEtudiant.sousModule.code, data)}
            initialNotes={selectedEtudiant.initialNotes}
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