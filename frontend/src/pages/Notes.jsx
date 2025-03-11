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
  Box,
  Tooltip,
} from "@mui/material";
import "../styles/notes.css";
import SousModuleForm from "../components/SousModuleForm";

const Notes = () => {
  const [departement, setDepartement] = useState("INFO");
  const [niveau, setNiveau] = useState("L1");
  const [semestre, setSemestre] = useState("S1");
  const [etudiants, setEtudiants] = useState([]);
  const [modules, setModules] = useState([]);
  const [editingNotes, setEditingNotes] = useState({});
  const [userRole, setUserRole] = useState("");
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getSemestresForNiveau = (niveau) => {
    switch (niveau) {
      case "L1": return ["S1", "S2"];
      case "L2": return ["S3", "S4"];
      case "L3": return ["S5", "S6"];
      default: return ["S1", "S2"];
    }
  };

  // Charger les étudiants, modules et rôle utilisateur
  useEffect(() => {
    if (!departement || !niveau || !semestre) return;

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [etudiantsRes, modulesRes, userRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/stats/etudiants/${departement}/${niveau}/${semestre}`),
          axios.get(`http://localhost:5000/api/departements/${departement}/${niveau}/semestre/${semestre.replace('S', '')}/modules`),
          axios.get(`http://localhost:5000/api/auth/me`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
        ]);
        setEtudiants(etudiantsRes.data.students);
        setModules(modulesRes.data.modules);
        setUserRole(userRes.data.role);
      } catch (err) {
        console.error("❌ Erreur lors du chargement des données :", err);
        setError("Erreur lors du chargement des données : " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [departement, niveau, semestre]);

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

  const calculerMoyenneSousModule = (notes, ponderations) => {
    const { presence, participation } = notes;
    const noteValues = notes.notes || [];
    const pondValues = ponderations || Array(noteValues.length).fill(100 / noteValues.length);

    const pres = parseFloat(presence) || 0;
    const part = parseFloat(participation) || 0;
    const totalPondNotes = pondValues.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);

    if (totalPondNotes !== 85) {
      console.warn("Les pondérations des notes ne totalisent pas 85%");
      return 0;
    }

    const weightedSum = noteValues.reduce((acc, note, i) =>
      acc + (parseFloat(note) || 0) * (parseFloat(pondValues[i]) / 100), 0) +
      (pres * 0.10) + (part * 0.05);

    return Math.min(20, Math.max(0, weightedSum));
  };

  const calculerMoyenneGlobale = (etudiant, modulesData) => {
    const totalPondere = modulesData.reduce((acc, module) => {
      const moduleNotes = etudiant.notes || {};
      const moduleMoyenne = module.sousModules.reduce((sum, sousModule) => {
        const notes = moduleNotes[sousModule.code];
        if (!notes) return sum;
        const moyenne = notes.moyenneSousModule || calculerMoyenneSousModule(notes, notes.ponderations || []);
        return sum + moyenne;
      }, 0) / (module.sousModules.length || 1);
      return acc + (moduleMoyenne * (module.credits || 1));
    }, 0);
    const totalCredits = modulesData.reduce((acc, module) => acc + (module.credits || 1), 0);
    return totalCredits ? totalPondere / totalCredits : 0;
  };

  const handleSaveNotes = (matricule, sousModuleCode, data) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ Vous devez être connecté pour modifier une note !");
      return;
    }

    const { presence, participation, notes, ponderations } = data;
    const moyenne = calculerMoyenneSousModule({ presence, participation, notes }, ponderations);

    const payload = {
      etudiantMatricule: matricule,
      sousModuleCode,
      notePresence: presence,
      noteParticipation: participation,
      notes: notes.map(Number),
      ponderations: ponderations.map(Number),
      moyenneSousModule: moyenne,
    };

    setLoading(true);
    axios({
      method: etudiants.find((e) => e.matricule === matricule)?.notes?.[sousModuleCode] ? "put" : "post",
      url: `http://localhost:5000/api/notes${etudiants.find((e) => e.matricule === matricule)?.notes?.[sousModuleCode] ? `/${matricule}/${sousModuleCode}` : ''}`,
      data: payload,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        alert("✅ Notes mises à jour ou ajoutées avec succès !");
        setSelectedEtudiant(null);
        axios
          .get(`http://localhost:5000/api/stats/etudiants/${departement}/${niveau}/${semestre}`)
          .then((res) => setEtudiants(res.data.students))
          .catch((err) => console.error("❌ Erreur lors du rechargement :", err));
      })
      .catch((err) => {
        console.error("❌ Erreur lors de l'enregistrement :", err.response?.data || err);
        alert(`❌ Erreur lors de l'enregistrement des notes : ${err.response?.data?.message || err.message}`);
      })
      .finally(() => setLoading(false));
  };

  const openSousModuleForm = (etudiant, sousModule) => {
    setSelectedEtudiant({
      ...etudiant,
      sousModule,
      initialNotes: etudiant.notes?.[sousModule.code] || {
        presence: "",
        participation: "",
        notes: ["", ""],
        ponderations: ["", ""],
      },
    });
  };

  const convertirEnGrade = (moyenne) => {
    if (moyenne >= 16) return "A";
    if (moyenne >= 14) return "B";
    if (moyenne >= 12) return "C";
    if (moyenne >= 10) return "D";
    return "F";
  };

  const estReussi = (moyenne) => moyenne >= 10;

  return (
    <Container className="container">
      <Typography variant="h4">Notes des Étudiants</Typography>

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
            <MenuItem key={sem} value={sem}>Semestre {sem.replace('S', '')}</MenuItem>
          ))}
        </Select>
      </div>

      {loading && <Typography>Chargement...</Typography>}
      {error && <Typography color="error">{error}</Typography>}

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
              const moyenneGlobale = etudiant.moyenneGenerale || calculerMoyenneGlobale(etudiant, modules);
              const grade = convertirEnGrade(moyenneGlobale);
              const statut = estReussi(moyenneGlobale) ? "PASS" : "FAIL";

              return (
                <TableRow key={etudiant.matricule}>
                  <TableCell>{etudiant.matricule}</TableCell>
                  <TableCell>{etudiant.nom}</TableCell>
                  <TableCell>{etudiant.prenom}</TableCell>

                  {modules.flatMap((module) =>
                    module.sousModules.map((sousModule) => {
                      const note = etudiant.notes?.[sousModule.code] || {};
                      const moyenne = note.moyenneSousModule || calculerMoyenneSousModule(note, note.ponderations || []);

                      return (
                        <TableCell key={sousModule.code}>
                          {userRole === "Professeur" ? (
                            <Button
                              variant="outlined"
                              onClick={() => openSousModuleForm(etudiant, sousModule)}
                            >
                              {note.moyenneSousModule ? "Modifier" : "Saisir"}
                            </Button>
                          ) : note.notes ? (
                            <Tooltip
                              title={
                                <Box>
                                  <Typography>Notes : {note.notes.join(", ")}</Typography>
                                  <Typography>Présence : {note.notePresence}</Typography>
                                  <Typography>Participation : {note.noteParticipation}</Typography>
                                  <Typography>Moyenne : {moyenne.toFixed(2)}</Typography>
                                </Box>
                              }
                            >
                              <Typography>{moyenne.toFixed(2)}</Typography>
                            </Tooltip>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                      );
                    })
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

      {selectedEtudiant && (
        <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc" }}>
          <Typography variant="h5">
            {etudiants.find((e) => e.matricule === selectedEtudiant.matricule)?.notes?.[
              selectedEtudiant.sousModule.code
            ]
              ? "Modifier les notes"
              : "Saisir une nouvelle note"}{" "}
            pour {selectedEtudiant.nom} {selectedEtudiant.prenom} - {selectedEtudiant.sousModule.nom}
          </Typography>
          <SousModuleForm
            etudiantMatricule={selectedEtudiant.matricule}
            sousModuleCode={selectedEtudiant.sousModule.code}
            sousModuleNom={selectedEtudiant.sousModule.nom}
            onSave={(data) =>
              handleSaveNotes(selectedEtudiant.matricule, selectedEtudiant.sousModule.code, data)
            }
            onClose={() => setSelectedEtudiant(null)}
            initialNotes={selectedEtudiant.initialNotes}
          />
        </Box>
      )}
    </Container>
  );
};

export default Notes;