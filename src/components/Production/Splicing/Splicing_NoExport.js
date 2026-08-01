import React from 'react'
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";

export const SplicingExportToExcel = ({ apiData, fileName }) => {
  const fileType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const fileExtension = ".xlsx";

  const exportToCSV = (apiData, fileName) => {
    // Verificar se os dados são de splicing por turno, por operador ou No Check
    const isOperatorData = apiData.length > 0 && 
      (apiData[0].hasOwnProperty('OPERATOR_NAME') || apiData[0].hasOwnProperty('Turno'));
    const isNoCheckData = apiData.length > 0 && 
      apiData[0].hasOwnProperty('Erro');

    let formattedData;
    let headers;
    let colWidths;

    if (isNoCheckData) {
      // Formatar dados de No Check
      formattedData = apiData.map(item => {
        return {
          "Data/Hora": item.Data || '',
          "Turno": item.Turno || '',
          "Linha": item.Linha || '',
          "Equipamento": item.Equipamento || '',
          "Lado": item.Lado || '',
          "Erro": item.Erro || '',
          "Feeder": item.Feeder || ''
        };
      });

      headers = ["Data/Hora", "Turno", "Linha", "Equipamento", "Lado", "Erro", "Feeder"];
      colWidths = [
        { wch: 20 }, // Data/Hora
        { wch: 8 },  // Turno
        { wch: 10 }, // Linha
        { wch: 15 }, // Equipamento
        { wch: 8 },  // Lado
        { wch: 25 }, // Erro
        { wch: 10 }  // Feeder
      ];
    } else if (isOperatorData) {
      // Formatar dados de operadores
      formattedData = apiData.map(item => {
        return {
          "Data": item.data || '',
          "Linha": item.Linha || '',
          "Turno": item.Turno || '',
          "Operador": item.OPERATOR_NAME || '',
          "Quantidade": typeof item['QTY'] === 'number' ? Math.round(item['QTY'] * 100) / 100 : item['QTY']
        };
      });
      
      headers = ["Data", "Linha", "Turno", "Operador", "Quantidade"];
      colWidths = [
        { wch: 15 }, // Data
        { wch: 10 }, // Linha
        { wch: 10 }, // Turno
        { wch: 20 }, // Operador
        { wch: 12 }  // Quantidade
      ];
    } else {
      // Formatar dados de splicing por turno
      formattedData = apiData.map(item => {
        return {
          "Data": item.data || '',
          "Linha": item.Linha || '',
          "1º Turno": typeof item['1T'] === 'number' ? Math.round(item['1T'] * 100) / 100 : item['1T'],
          "2º Turno": typeof item['2T'] === 'number' ? Math.round(item['2T'] * 100) / 100 : item['2T'],
          "3º Turno": typeof item['3T'] === 'number' ? Math.round(item['3T'] * 100) / 100 : item['3T']
        };
      });
      
      headers = ["Data", "Linha", "1º Turno", "2º Turno", "3º Turno"];
      colWidths = [
        { wch: 15 }, // Data
        { wch: 10 }, // Linha
        { wch: 12 }, // 1º Turno
        { wch: 12 }, // 2º Turno
        { wch: 12 }  // 3º Turno
      ];
    }

    const ws = XLSX.utils.json_to_sheet(formattedData, { origin: "A2" });

    // Adicionar cabeçalhos descritivos
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

    // Configurar largura das colunas
    ws['!cols'] = colWidths;

    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, fileName + fileExtension);
  };

  return (
    <button className="splicing-export-btn"
    onClick={(e) => exportToCSV(apiData, fileName)}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
      </svg>
      Exportar Excel
    </button>
  );
};
