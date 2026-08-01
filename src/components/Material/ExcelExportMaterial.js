import React from 'react';
import * as XLSX from "xlsx";
import { IconButton, Tooltip } from '@mui/material';
import { Download } from '@mui/icons-material';

export const ExcelExportMaterial = ({ apiData, fileName }) => {
  const fileType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const fileExtension = ".xlsx";

  const exportToCSV = (apiData, fileName) => {
    const ws = XLSX.utils.json_to_sheet(apiData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: fileType });
    
    // Criar um link temporário para download
    const link = document.createElement('a');
    const url = URL.createObjectURL(data);
    
    link.href = url;
    link.download = fileName + fileExtension;
    link.style.display = 'none';
    
    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar o objeto URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <Tooltip title="Exportar para Excel">
      <IconButton 
        onClick={(e) => exportToCSV(apiData, fileName)} 
        color="primary"
      >
        <Download />
      </IconButton>
    </Tooltip>
  );
};

export default ExcelExportMaterial;
