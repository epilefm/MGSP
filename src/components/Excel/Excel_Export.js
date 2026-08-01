import React from 'react';
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";

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
        backgroundColor: 'transparent', 
        border: '0.1em solid', 
        borderRadius: 5, 
        borderColor: 'gray',
        width: 100, 
        height: 30, 
        marginLeft: '92%', 
        marginTop: -20, 
        marginBottom: 10, 
        fontSize: 13
      }}
      onClick={(e) => exportToCSV(apiData, fileName)}
    >
      Export Excel
    </button>
  );
};

export default ExportToExcel;
