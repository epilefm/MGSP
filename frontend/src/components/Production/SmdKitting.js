import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Axios from "axios";
import { textAlign } from "@mui/system";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import { getRowIdFromRowModel } from '@mui/x-data-grid/internals';

export default function Tabela() {

  const [values, setValues] = useState();
  const [listCard, setListCard] = useState([]);

      let current = new Date();
      // dias conforme o filtro do gmes
      let dias = (current.getDate());
      if ((current.getDate()) < 10) {
        dias = '0' + (current.getDate())
      } else {
        dias = (current.getDate());
      };
      let mes = (current.getMonth());
      if ((current.getMonth() + 1) < 10) {
        mes = '0' + (current.getMonth() + 1)
      } else {
        mes = (current.getMonth() + 1);
      };
      let curDate = current.getFullYear() + '' + mes + '' + dias;
    
      const [data, setData] = useState([]);
      const [registerkit, setregisterkit] = useState([]);
  
    useEffect(() => {
      Axios
      .get("http://105.103.39.102:8080/getCardRast")
      .then(response=>setListCard(response.data))
    }, []);

    useEffect(() => {
      let period = [curDate]
      Axios.get(`http://105.103.2.25/json/smd-material-tracking/?context=get_productionplanbyorder&date=${curDate}`).then((response) => {
        setData(response.data)
      });
    }, [])

  return (
    <h2 className='h2'> SMD Kitting
    <div style={{height:'82vh' , width: '100%', padding:'5px'}}>
      <DataGrid  hover={true}  className='tabelass'
        columns={[
          { field: 'id', hideable: true,
          minWidth: 50, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Date', flex: 2,
          minWidth: 180, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Halb', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Basic_Model', flex: 2,
          minWidth: 180, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Line', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Plant', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Part_Number', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: "PLAN_QTY", flex: 2,
          // minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: 'Kit_Plan', flex: 2,
          // minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Entrance', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Output', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: 'Pend_to_process', flex: 2,
          // minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: 'Prod_Qty', flex: 2,
          // minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: 'Material_Return', flex: 2,
          // minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
        ]}

        rows = {listCard}
        slots={{
        toolbar: GridToolbar,
        
      }}
      
      />
    </div>
    </h2>
  );
}



// import { Box, Grid } from '@mui/material';
// import NavbarComp from './../components/NavbarComp';
// import Axios from 'axios';
// import { useEffect, useState} from 'react';

// function Kit(){

//   let current = new Date();
// // dias conforme o filtro do gmes
// let dias = (current.getDate());
// if ((current.getDate()) < 10) {
//   dias = '0' + (current.getDate())
// } else {
//   dias = (current.getDate());
// };
// let mes = (current.getMonth());
// if ((current.getMonth() + 1) < 10) {
//   mes = '0' + (current.getMonth() + 1)
// } else {
//   mes = (current.getMonth() + 1);
// };
// let curDate = current.getFullYear()+''+ mes +''+ dias;

//     const [data, setData] = useState([]);
//     const [registerkit, setregisterkit] = useState([]);

//     useEffect(() => {
//       let period = [curDate]
//       Axios.get(`http://105.103.2.25/json/smd-material-tracking/?context=get_smdkitting&date=${period}`).then((response) => {
//         setData(response.data)
//       });
//     }, [])

           
//     return(
//         <>
//             <div  display={'center'} style={{backgroundColor:'snow'}}>
//           <Box display={'flex'}>


//           <div display={'flex'}>
//       <div class="container-fluid" style={{ backgroundColor: 'snow' }}>
//         <div>
//           <div class="col-sm-5 offset-sm-0 mt- mb-1" style={{ color: "#292929", alignContent: 'flex-start' }}><h2><b>KITTING PLAN</b></h2></div>
//         </div>
//         <div class="row">
//           <div class="table-responsive">
//             <table class="table table-striped table-hover table-bordered">
//               <thead style={{ backgroundColor: "#6495ed", textAlign: 'center', borderRadius: 5 }}>
//                 <tr>
//                   <th>PO CODE</th>
//                   <th>WORK_DATE</th>
//                   <th>PLAN_DATE</th>
//                   <th>ADDITION</th>
//                   <th>PLANT</th>
//                   <th>LINE</th>
//                   <th>MODEL_CODE</th>
//                   <th>BASIC_MODEL</th>
//                   <th>KIT_PLAN_QTY</th>
//                 </tr>
//               </thead>

//               <tbody style={{ textAlign: 'center' }}>
//                 {data.map((val) => (
//                   <tr component='th' style={{ alignItems: 'center', fontSize: 16, fontWeight: 'lighter', fontFamily: 'Arial' }} key={val.PRODC_INST_NO}
//                     sx={{ width: '100%', '&:last-child td, &:last-child th': { border: 0 } }}>
//                     <th style={{ alignItems: 'content', fontSize: 16, fontWeight: 'lighter', fontFamily: 'Arial' }}>{val.PRODC_INST_NO}</th>
//                     <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.WORK_YMD}</th>
//                     <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.PLAN_YMD}</th>
//                     <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.CNTN_YN}</th>
//                     <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.PLANT_CODE}</th>
//                     <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.LINE_NM}</th>
//                     <th style={{alignItems:'content', fontSize:16,
//                     fontWeight:'lighter', fontFamily:'Arial'}}>{val.MODEL_CODE}</th>
//                     <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.BASIC_MODEL_CODE}</th>
//                     <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.PLAN_QTY}</th>
//                     </tr>
//                     ))}
//                     </tbody>
//                     </table>
//                     </div>
//                     </div>
//                     </div>
//                     </div>
//                     </Box>
//                     </div>
//                     </>


//                     )
//                     }

//                     export default Kit;
