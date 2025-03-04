// src/components/SousModuleForm.jsx
import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Grid } from '@mui/material';

const SousModuleForm = ({ sousModuleNom, onSave }) => {
  const [notes, setNotes] = useState({
    presence: '',
    participation: '',
    test1: '',
    test2: '',
    test3: '',
    test4: '',
    test5: '',
  });
  const [moyenne, setMoyenne] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNotes({ ...notes, [name]: value });
    setError(''); // Réinitialiser les erreurs lors d'une modification
  };

  const calculerMoyenne = () => {
    const { presence, participation, test1, test2, test3, test4, test5 } = notes;
    
    // Vérifier si toutes les notes sont remplies
    if (!presence || !participation || !test1 || !test2 || !test3 || !test4 || !test5) {
      setError('Veuillez remplir toutes les notes.');
      return null;
    }

    const pres = parseFloat(presence) || 0;
    const part = parseFloat(participation) || 0;
    const t1 = parseFloat(test1) || 0;
    const t2 = parseFloat(test2) || 0;
    const t3 = parseFloat(test3) || 0;
    const t4 = parseFloat(test4) || 0;
    const t5 = parseFloat(test5) || 0;

    // Pondérations : Présence (20%), Participation (20%), Tests (50% total, 10% chacun)
    const moyenneCalc = (pres * 0.2 + part * 0.2 + (t1 + t2 + t3 + t4 + t5) * 0.1);
    
    if (moyenneCalc > 20 || moyenneCalc < 0) {
      setError('La moyenne calculée est invalide (doit être entre 0 et 20).');
      return null;
    }

    return moyenneCalc;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const moyenneCalc = calculerMoyenne();
    
    if (moyenneCalc === null) return; // S'il y a une erreur, on arrête ici

    const data = {
      sousModuleNom,
      ...notes,
      moyenne: moyenneCalc,
    };

    try {
      const response = await fetch('http://localhost:5000/api/sous-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      console.log('Succès:', result);
      onSave(data); // Callback pour informer le parent
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de l\'envoi au backend.');
    }
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
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, border: '1px solid #ccc', mb: 2 }}>
      <Typography variant="h6">{sousModuleNom}</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <TextField
            label="Présence (20%)"
            name="presence"
            type="number"
            value={notes.presence}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0, max: 20 }}
            required
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Participation (20%)"
            name="participation"
            type="number"
            value={notes.participation}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0, max: 20 }}
            required
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Test #1 (10%)"
            name="test1"
            type="number"
            value={notes.test1}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0, max: 20 }}
            required
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Test #2 (10%)"
            name="test2"
            type="number"
            value={notes.test2}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0, max: 20 }}
            required
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Test #3 (10%)"
            name="test3"
            type="number"
            value={notes.test3}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0, max: 20 }}
            required
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Test #4 (10%)"
            name="test4"
            type="number"
            value={notes.test4}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0, max: 20 }}
            required
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Test #5 (10%)"
            name="test5"
            type="number"
            value={notes.test5}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0, max: 20 }}
            required
          />
        </Grid>
      </Grid>
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Calculer et enregistrer
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

export default SousModuleForm;