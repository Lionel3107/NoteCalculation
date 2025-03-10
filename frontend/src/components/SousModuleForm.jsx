// src/components/SousModuleForm.jsx
import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Grid, Select, MenuItem } from '@mui/material';

const SousModuleForm = ({ noteId, sousModuleNom, onSave, onClose, initialNotes }) => {
  const [formData, setFormData] = useState({
    presence: '',
    participation: '',
    noteCount: 1,
    notes: [''],
    ponderations: [''],
  });
  const [existingNote, setExistingNote] = useState(null);
  const [moyenne, setMoyenne] = useState(null);
  const [error, setError] = useState('');

  // Récupérer les données de la note existante si noteId est fourni
  useEffect(() => {
    const fetchNote = async () => {
      if (noteId) {
        try {
          const response = await fetch(`http://localhost:5000/api/notes/sous-modules/${noteId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            },
          });
          const data = await response.json();
          if (response.ok) {
            setExistingNote(data.data);
            setFormData({
              presence: data.data.notePresence || '',
              participation: data.data.noteParticipation || '',
              noteCount: data.data.notes?.length || 1,
              notes: data.data.notes || [''],
              ponderations: data.data.ponderations || [''],
            });
          } else {
            throw new Error(data.message || 'Erreur lors de la récupération de la note');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération :', error.message);
          setError('Erreur lors de la récupération : ' + error.message);
        }
      } else if (initialNotes) {
        // Utiliser initialNotes pour un nouvel ajout
        setFormData({
          presence: initialNotes.presence || '',
          participation: initialNotes.participation || '',
          noteCount: initialNotes.notes?.length || 1,
          notes: initialNotes.notes || [''],
          ponderations: initialNotes.ponderations || [''],
        });
      }
    };
    fetchNote();
  }, [noteId, initialNotes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'noteCount') {
      const newCount = parseInt(value);
      setFormData((prev) => ({
        ...prev,
        noteCount: newCount,
        notes: Array(newCount).fill(''),
        ponderations: Array(newCount).fill(''),
      }));
    } else if (name.startsWith('note')) {
      const index = parseInt(name.split('-')[1]);
      setFormData((prev) => ({
        ...prev,
        notes: prev.notes.map((note, i) => (i === index ? value : note)),
      }));
    } else if (name.startsWith('ponderation')) {
      const index = parseInt(name.split('-')[1]);
      setFormData((prev) => ({
        ...prev,
        ponderations: prev.ponderations.map((pond, i) => (i === index ? value : pond)),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError(''); // Réinitialiser les erreurs lors d'une modification
  };

  const calculerMoyenne = () => {
    const { presence, participation, notes, ponderations } = formData;

    if (!presence || !participation) {
      setError('Veuillez remplir la présence et la participation.');
      return null;
    }

    const pres = parseFloat(presence) || 0;
    const part = parseFloat(participation) || 0;
    const noteValues = notes.map((n) => parseFloat(n) || 0);
    const pondValues = ponderations.map((p) => parseFloat(p) || 0);

    if (noteValues.some((n) => isNaN(n)) || pondValues.some((p) => isNaN(p))) {
      setError('Veuillez remplir toutes les notes et leurs pondérations.');
      return null;
    }

    const totalPondNotes = pondValues.reduce((acc, val) => acc + val, 0);
    if (totalPondNotes !== 85) {
      setError('La somme des pondérations des notes doit être égale à 85% (présence 10%, participation 5%).');
      return null;
    }

    const weightedSum = noteValues.reduce((acc, note, i) => acc + (note * (pondValues[i] / 100)), 0) +
                       (pres * 0.1) + (part * 0.05);
    const moyenneCalc = Math.min(20, Math.max(0, weightedSum));

    return moyenneCalc;
  };

  const convertirEnGrade = (moyenne) => {
    if (moyenne >= 16) return 'A';
    if (moyenne >= 14) return 'B';
    if (moyenne >= 12) return 'C';
    if (moyenne >= 10) return 'D';
    return 'F';
  };

  const estReussi = (moyenne) => moyenne >= 10;

  const handleSubmit = async (e) => {
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

    try {
      const url = noteId ? `http://localhost:5000/api/notes/sous-modules/${noteId}` : 'http://localhost:5000/api/notes/sous-modules';
      const method = noteId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          etudiantMatricule: 'bs00016', // Récupérer dynamiquement
          sousModuleCode: existingNote?.sousModuleCode || sousModuleNom.split(' ').join('').toUpperCase() + '101', // Utiliser existingNote si disponible
          notes: formData.notes.map((n) => parseFloat(n)),
          ponderations: formData.ponderations.map((p) => parseFloat(p)),
          noteParticipation: parseFloat(formData.participation),
          notePresence: parseFloat(formData.presence),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Succès:', result);
      if (onSave) onSave(data);
      if (onClose) onClose();
    } catch (error) {
      console.error('Erreur:', error);
      setError(`Erreur lors de l'envoi au backend: ${error.message}`);
    }
  };

  // Mettre à jour la moyenne à chaque changement
  useEffect(() => {
    const newMoyenne = calculerMoyenne();
    if (newMoyenne !== null) setMoyenne(newMoyenne);
  }, [formData]);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, border: '1px solid #ccc', mb: 2 }}>
      <Typography variant="h6">{sousModuleNom || (existingNote?.sousModuleCode ? `Modification: ${existingNote.sousModuleCode}` : 'Nouvelle note')}</Typography>
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
                value={formData.notes[i] || ''}
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
                value={formData.ponderations[i] || ''}
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
        {noteId ? 'Mettre à jour' : 'Calculer et enregistrer'}
      </Button>
      {moyenne && (
        <Box sx={{ mt: 2 }}>
          <Typography>Moyenne : {moyenne.toFixed(2)}</Typography>
          <Typography>Grade : {convertirEnGrade(moyenne)}</Typography>
          <Typography color={estReussi(moyenne) ? 'success' : 'error'}>
            Statut : {estReussi(moyenne) ? 'PASS' : 'FAIL'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Fonctions utilitaires
const convertirEnGrade = (moyenne) => {
  if (moyenne >= 16) return 'A';
  if (moyenne >= 14) return 'B';
  if (moyenne >= 12) return 'C';
  if (moyenne >= 10) return 'D';
  return 'F';
};

const estReussi = (moyenne) => moyenne >= 10;

export default SousModuleForm;