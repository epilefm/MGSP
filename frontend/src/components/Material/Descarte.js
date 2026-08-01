// import { DataGrid, GridToolbar } from '@mui/x-data-grid';
// import Axios from "axios";
// import { textAlign } from "@mui/system";
// import "bootstrap/dist/css/bootstrap.min.css";
// import React, { useEffect, useState } from "react";
// import { Box } from "@mui/material";
// import {ExportToExcel} from '../Excel/Excel_Export'

// export default function App() {
//   const [values, setValues] = useState();
//   const [listCard, setListCard] = useState([]);
  
//   console.log(listCard);
  
//   useEffect(() => {
//     Axios.get(`${API_URL}/getDescarte`).then((response) => {
//       setListCard(response.data); 
//     });
//   }, []);

//   const fileName = "Disposal Data"; // here enter filename for your excel file

//      return (
//       <>
      
//       <h2 className='h2' style={{height:0}}> Material Disposal (In Line)    </h2>

//       <div style={{height:'82vh' , width: '100%', padding:'5px'}}>
//       <ExportToExcel apiData={listCard} fileName={fileName}/>

//       <DataGrid hover={true} className='tabelass'
//         columns={[
//           { field: 'id', hideable: false,
//           align:'center', headerAlign:'center', headerClassName:'headerr'},
//           { field: 'Date', hideable: false,
//           minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
//           { field: 'Hour', hideable: false,
//           minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
//           { field: 'Registry_ID', hideable: false, headerName:'Registry ID',
//           minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
//           { field: 'Shift', flex: 2,
//           minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
//           { field: 'Halb', flex: 2,
//           minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
//           { field: 'Basic_Model', flex: 2, headerName:'Basic Model',
//           minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
//           { field: 'Line', flex: 2,
//           minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
//           { field: 'Reel_ID', flex: 2, headerName:'Reel ID',
//           minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
//           { field: 'Barcode', flex: 2,
//           minWidth: 280, align:'center', headerAlign:'center', headerClassName:'headerr'},
//           { field: 'Part_Number', flex: 2, headerName:'Part Number',
//           minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
//           { field: 'Qty_Discard', flex: 2, headerName:'Qty Discard',
//           minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
//           ]}

//         rows = {listCard}
//         slots={{
//         toolbar: GridToolbar,
//         }}
      
//         slotProps={{
//           toolbar: {
//             showQuickFilter: true,
//             quickFilterProps: { debounceMs: 500 },
//           },
//         }}

//       />
//     </div>

//     </>
//   );
// }
