import React from 'react';
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import { Download } from 'lucide-react';

export const ExportToExcel = ({ apiData, fileName }) => {
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
    <button 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 15px',
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fff',
        fontSize: '14px',
        color: '#333',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        width: 'auto',
        height: 'auto'
      }}
      onClick={(e) => exportToCSV(apiData, fileName)}
    >
      <Download size={20} />
      <span>Exportar</span>
    </button>
  );
};

export default ExportToExcel;
