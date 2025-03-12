// src/components/ModuleGlobalForm.jsx
import React, { useState } from 'react';
import { Typography, Box } from '@mui/material';
import SousModuleForm from './SousModuleForm';

const ModuleGlobalForm = ({ moduleNom, credits }) => {
  const [sousModulesData, setSousModulesData] = useState([]);
  const [moyenneGlobale, setMoyenneGlobale] = useState(null);

  const handleSousModuleSave = (data) => {
    setSousModulesData([...sousModulesData, data]);
    calculerMoyenneGlobale([...sousModulesData, data]);
  };

  const calculerMoyenneGlobale = (dataList) => {
    if (!dataList.length) return null;

    const totalNotes = dataList.reduce((acc, curr) => acc + curr.moyenne, 0);
    const moyenne = totalNotes / dataList.length; // Simplifié, à ajuster avec crédits
    setMoyenneGlobale(moyenne);
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
    <Box sx={{ p: 3, border: '1px solid #ccc', mb: 2 }}>
      <Typography variant="h5">{moduleNom} (Crédits : {credits})</Typography>
      <SousModuleForm sousModuleNom="Sous-module 1" onSave={handleSousModuleSave} />
      <SousModuleForm sousModuleNom="Sous-module 2" onSave={handleSousModuleSave} />
      {moyenneGlobale && (
        <Box sx={{ mt: 2 }}>
          <Typography>Moyenne globale : {moyenneGlobale.toFixed(2)}</Typography>
          <Typography>Grade : {convertirEnGrade(moyenneGlobale)}</Typography>
          <Typography color={estReussi(moyenneGlobale) ? 'success' : 'error'}>
            Statut : {estReussi(moyenneGlobale) ? 'PASS' : 'FAIL'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ModuleGlobalForm;