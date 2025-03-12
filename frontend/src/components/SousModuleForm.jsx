// src/components/SousModuleForm.jsx
import React, { useState, useEffect } from "react";
import { TextField, Button, Typography, Box, Grid, Select, MenuItem } from "@mui/material";

const SousModuleForm = ({ etudiantMatricule, sousModuleCode, sousModuleNom, onSave, onClose, initialNotes }) => {
  const [formData, setFormData] = useState({
    presence: "",
    participation: "",
    noteCount: 1,
    notes: [""],
    ponderations: [""],
  });
  const [moyenne, setMoyenne] = useState(null);
  const [error, setError] = useState("");

  // Initialiser avec les données existantes ou initialNotes
  useEffect(() => {
    if (initialNotes) {
      setFormData({
        presence: initialNotes.presence || "",
        participation: initialNotes.participation || "",
        noteCount: initialNotes.notes?.length || 1,
        notes: initialNotes.notes || [""],
        ponderations: initialNotes.ponderations || [""],
      });
    }
  }, [initialNotes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "noteCount") {
      const newCount = parseInt(value);
      setFormData((prev) => ({
        ...prev,
        noteCount: newCount,
        notes: Array(newCount).fill(""),
        ponderations: Array(newCount).fill(""),
      }));
    } else if (name.startsWith("note")) {
      const index = parseInt(name.split("-")[1]);
      setFormData((prev) => ({
        ...prev,
        notes: prev.notes.map((note, i) => (i === index ? value : note)),
      }));
    } else if (name.startsWith("ponderation")) {
      const index = parseInt(name.split("-")[1]);
      setFormData((prev) => ({
        ...prev,
        ponderations: prev.ponderations.map((pond, i) => (i === index ? value : pond)),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError(""); // Réinitialiser les erreurs lors d'une modification
  };

  const calculerMoyenne = () => {
    const { presence, participation, notes, ponderations } = formData;

    if (!presence || !participation) {
      setError("Veuillez remplir la présence et la participation.");
      return null;
    }

    const pres = parseFloat(presence) || 0;
    const part = parseFloat(participation) || 0;
    const noteValues = notes.map((n) => parseFloat(n) || 0);
    const pondValues = ponderations.map((p) => parseFloat(p) || 0);

    if (noteValues.some((n) => isNaN(n)) || pondValues.some((p) => isNaN(p))) {
      setError("Veuillez remplir toutes les notes et leurs pondérations.");
      return null;
    }

    const totalPondNotes = pondValues.reduce((acc, val) => acc + val, 0);
    if (totalPondNotes !== 85) {
      setError("La somme des pondérations des notes doit être égale à 85% (présence 10%, participation 5%).");
      return null;
    }

    const weightedSum = noteValues.reduce((acc, note, i) => acc + (note * (pondValues[i] / 100)), 0) +
                       (pres * 0.10) + (part * 0.05);
    const moyenneCalc = Math.min(20, Math.max(0, weightedSum));

    return moyenneCalc;
  };

  const convertirEnGrade = (moyenne) => {
    if (moyenne >= 16) return "A";
    if (moyenne >= 14) return "B";
    if (moyenne >= 12) return "C";
    if (moyenne >= 10) return "D";
    return "F";
  };

  const estReussi = (moyenne) => moyenne >= 10;

  const handleSubmit = (e) => {
    e.preventDefault();
    const moyenneCalc = calculerMoyenne();

    if (moyenneCalc === null) return;

    const data = {
      sousModuleNom,
      presence: parseFloat(formData.presence),
      participation: parseFloat(formData.participation),
      notes: formData.notes.map((n) => parseFloat(n)),
      ponderations: formData.ponderations.map((p) => parseFloat(p)),
      moyenne: moyenneCalc,
    };

    if (onSave) onSave(data);
    if (onClose) onClose();
  };

  // Mettre à jour la moyenne à chaque changement
  useEffect(() => {
    const newMoyenne = calculerMoyenne();
    if (newMoyenne !== null) setMoyenne(newMoyenne);
  }, [formData]);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, border: "1px solid #ccc", mb: 2 }}>
      <Typography variant="h6">{sousModuleNom || "Nouvelle note"}</Typography>
      {error && <Typography color="error">{error}</Typography>}

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Présence (10%)"
            name="presence"
            type="number"
            value={formData.presence}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0, max: 20 }}
            required
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Participation (5%)"
            name="participation"
            type="number"
            value={formData.participation}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0, max: 20 }}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <Select
            label="Nombre de notes"
            name="noteCount"
            value={formData.noteCount}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value={1}>1 note</MenuItem>
            <MenuItem value={2}>2 notes</MenuItem>
            <MenuItem value={3}>3 notes</MenuItem>
          </Select>
        </Grid>

        {Array.from({ length: formData.noteCount }, (_, i) => (
          <React.Fragment key={i}>
            <Grid item xs={6}>
              <TextField
                label={`Note ${i + 1}`}
                name={`note-${i}`}
                type="number"
                value={formData.notes[i] || ""}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 0, max: 20 }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={`Pondération Note ${i + 1} (%)`}
                name={`ponderation-${i}`}
                type="number"
                value={formData.ponderations[i] || ""}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                required
              />
            </Grid>
          </React.Fragment>
        ))}
      </Grid>

      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Enregistrer
      </Button>
      {moyenne && (
        <Box sx={{ mt: 2 }}>
          <Typography>Moyenne : {moyenne.toFixed(2)}</Typography>
          <Typography>Grade : {convertirEnGrade(moyenne)}</Typography>
          <Typography color={estReussi(moyenne) ? "success" : "error"}>
            Statut : {estReussi(moyenne) ? "PASS" : "FAIL"}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SousModuleForm;