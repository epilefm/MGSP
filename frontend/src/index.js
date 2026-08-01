import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import LoginForm from './components/Layout/Loginform'
import InputScreenEntrada from './Pages/Material/InputScreenEntrada'
import Entrada from './components/Material/Entrada'
import InputScreenOut from './Pages/Material/InputScreenOut'
import InputScreenDevolucao from './Pages/Material/InputScreenDevolucao'
import KittingScreen from './Pages/Production/KittingScreen'
import FiltroMat from  './components/Quality/MSL/filtroMat'
import MatAnalysisScreen from './Pages/Material/MatAnalysisScreen'
import BakingScreen from './Pages/Quality/BakingScreen'
import InputScreenDescarte from './Pages/Material/InputScreenDescarte'
import Home from './components/Layout/Home'
import Charts from './Pages/Material/Charts/Charts'
import Inventario from './components/Material/Inventario'
//----------/-/-/------------------------------------------------------
import Lav_Entrada from './components/Material/lavagem/Lav_Entrada'
//----------------------------------------------------------------------
import InputSpindle from './components/Manutenção/Spindle/Input Spindle'
//----------------------------------------------------------------------
import Reparo_Ent from './components/Repair/Reparo_Ent'
import Reparo_Ent_2 from './components/Repair/Reparo_Ent_2'
import Repair_Process from './components/Repair/Repair_Process'
import Reparo_Saida from './components/Repair/Reparo_Saida'
import RepairAnalysis from './Pages/Repair/RepairAnalysis'
import Repair_Inventario from './components/Repair/Repair_Inventario'
import RepairTNP_IA from './components/Repair/RepairTNP_IA'
//----------------------------------------------------------------------
import Offline_Saida from './components/Repair/Offline/Offline_Saida'
//----------------------------------------------------------------------

//----------------------------------------------------------------------
//----------------------------------------------------------------------
import Mapa from './components/Material/AGV/Mapa'
import Pagamento from './components/Material/AGV/Pagamento'
import InputFeeder from './components/Manutenção/Feeder/InputFeeder'
import CNcheck from './components/Production/CNcheck'
import OfflineSplicing from './Pages/Production/OfflineSplicing'
import CN_List from './components/Production/CN_List'
import SlipScreen from './Pages/Production/SlipScreen'
//------------------------------------------------------
import SubMgmt from './components/Quality/SubMgtm'
import SaidaSub from './components/Quality/SaidaSub'
import SubScreen from './Pages/Quality/SubScreen'
import Version from './components/Quality/Version'
import Wrong_plant from './components/Quality/Wrong_Plant'
import Wrong_plantHistory from './components/Quality/Wrong_PlantHistory'
import MappingNew from './components/Quality/MappingNew'
import PlantScreen from './Pages/Quality/PlantScreen'
import Monit_Router from './components/Quality/Inspec_Router/Monit_Router';

//----------------------------------------------------------
import Switch_splice from './components/Production/Splicing/Switch_splice'
import SplicingScreen from './Pages/Production/SplicingScreen'
import Splicing_history from './components/Production/Splicing/Splicing_history'
import Splicing_ops from './components/Production/Splicing/Splicing_ops'
import SplicingNoCheck from './components/Production/Splicing/SplicingNoCheck';
//--------------------------------------------------------------
import HoraProdLista from './components/Production/HoraProd/HoraProdLista'
import HoraHora from './components/Production/HoraProd/HoraHora'
import HoraHora2T from './components/Production/HoraProd/HoraHora2T'
import HoraHora3T from './components/Production/HoraProd/HoraHora3T'
import HoraHoraMounter from './components/Production/HoraProd/HoraHoraMounter'
import HoraMounterContainer from './components/Production/HoraProd/HoraMounterContainer'
import HoraPlanResult from './components/Production/PlanResult/HoraPlanResult'
//---------------------------------------------------------------
//--------------------------------------------------------------
// import HoraProdLista from './components/Production/HoraProd/HoraProdLista'
import HoraDropW from './components/Production/HoraDropWorst/HoraDropW'

// Gravação CN
import CN2D from './components/Production/HoraProd/CN2D'

//---------------------------------------------------------------
import Input_Reflow from './components/Manutenção/Reflow/Input_Reflow'
import ReflowW from './Pages/Maintenance/ReflowW'
import Control_Temp from './components/Manutenção/Control_Temp/Control_Temp'
import Bloqueio_Mat from './components/Quality/Bloqueio_Mat'
import AlarmePonto from './components/Suporte/AlarmePonto'

//-----------------------------------------------------------
import SM_Slots from './components/Inovacao/Smart_Rack/SM_Slots'
import InputSpare from './components/Suporte/InputSpare'
import ESD from './components/Quality/ESD'
import ESD_Edit from './components/Quality/ESD_Edit'
//-----------------------------------------------------------------
import Virtual_Label from './components/Production/Virtual_Label/Virtual_Label'
import VirtualL_Modal from './components/Production/Virtual_Label/VirtualL_Modal'
//-----------------------------------------------------------------
import BadHead from './components/Manutenção/BadHead/BadHead'
import BadHead_Lista from './components/Manutenção/BadHead/BadHead_Lista'
import PMManagementSystem from './components/Manutenção/PM/PMManagementSystem'
import MFM from './components/Manutenção/MFM/MFM'
import KPITable from './components/Production/KPITable/KPITable'
import DefectTracking from './components/Quality/DefectTracking';
import KPIQuality from './components/Quality/KPIQ/KPI_Quality';
import ListaEntradaWIP from './components/Material/ListaEntradaWIP';
import EntMaterial2 from './components/Material/EntMaterial2'
import FTSkipMonitoringV2 from './components/Manutenção/FTSkipMonitoringV2';
import Armarios from './components/Suporte/Armario/Armarios';
import POP_Control from './components/Quality/POP_Control';
import GestaoAtivos from './components/Suporte/GestaoAtivos/GestaoAtivos';
import EstoqueComp from './components/Repair/SaldoComp/Estoque_comp';
import InspecMX from './components/MX/InspecMX';
import HanaroScrap from './components/Material/hanaro_scrap/HanaroScrap';
import DescriptN from './components/Suporte/DescriptN';





import {
  createBrowserRouter,
  RouterProvider,
  Route,
} from "react-router-dom";
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';

// Rotas acessíveis sem login. Todas as outras exigem autenticação.
const PUBLIC_PATHS = new Set(["Login"]);

const rawRoutes = [
  {
    path: "/",
    element: <App/>,
  },
  {
    path: "Login",
    element: <LoginForm/>,
  },
  {
    path: "InputScreenEntrada",
    element: <InputScreenEntrada/>,
  },
  {
    path: "InputScreenSaida",
    element: <InputScreenOut/>,
  },
  {
    path: "InputScreenDevolucao",
    element: <InputScreenDevolucao/>, 
  },
  {
    path: "InputScreenDescarte",
    element: <InputScreenDescarte/>,
  },
  {
    path: "Prod",
    element: <FiltroMat/>,
   },
  {
    path: "Material_Analysis",
    element: <MatAnalysisScreen/>,
  },
  {
    path: "baking",
    element: <BakingScreen/>,
  },
  {
    path: "DescarteInput",
    element: <InputScreenDescarte/>,
  },
  {
    path: "Home",
    element: <App/>,
  },
  {
    path: "Charts",
    element: <Charts/>,
  },
  {
    path: "Inventario",
    element: <Inventario/>,
  },
  {
    path: "InputSpindle",
    element: <InputSpindle/>,
  },

  //Reparo----------------------------
  {
    path: "RepairScreen",
    element: <Reparo_Ent/>,
  },
  {
    path: "RepairScreen_2",
    element: <Reparo_Ent_2/>,
  },
  {
    path: "RepairProcess",
    element: <Repair_Process/>,
  },
  {
    path: "RepairSaida",
    element: <Reparo_Saida />,
  },
  {
    path: "RepairAnalysis",
    element: <RepairAnalysis/>,
  },
  {
    path: "RepairInv",
    element: <Repair_Inventario/>,
  },

  //-----------------------------------
  {
    path: "OfflineSaida",
    element: <Offline_Saida/>,
  },
  //-----------------------------------
  {
    path: "Mapa",
    element: <Mapa/>,
  },
  {
    path: "Pgto",
    element: <Pagamento/>,
  },
  {
    path: "Feeder",
    element: <InputFeeder/>,
  },
  {
    path: "CNresult",
    element: <CNcheck/>,
  },
  {
    path: "OfflineSplicing",
    element: <OfflineSplicing/>,
  },
  {
    path: "CN_List",
    element: <CN_List/>,
  },
  {
    path: "SlipScreen",
    element: <SlipScreen/>,
  },
  {
    path: "Sub",
   element: <SubMgmt/>,
 },
 {
  path: "SaidaSub",
 element: <SaidaSub/>,
},
{
  path: "SubScreen",
 element: <SubScreen/>,
},
{
  path: "Version",
 element: <Version/>,
},
{
  path: "WPlant",
 element: <Wrong_plant/>,
},
{
  path: "WPlantHistory",
 element: <Wrong_plantHistory/>,
},
{
  path: "PlantScreen",
 element: <PlantScreen/>,
},
{
  path: "Mapping",
 element: <MappingNew/>,
},
{
  path: "LavEnt",
 element: <Lav_Entrada/>,
},
{
  path: "Switch_splice",
 element: <Switch_splice/>, 
},
{
  path: "SplicingScreen",
 element: <SplicingScreen/>, 
},
{
  path: "Splicing_history",
 element: <Splicing_history/>, 
},
{
  path: "Splicing_ops",
 element: <Splicing_ops/>, 
},

{
  path: "Input_Reflow",
 element: <Input_Reflow/>, 
},
{
  path: "ReflowW",
 element: <ReflowW/>, 
},
{
  path: "Control_Temp",
 element: <Control_Temp/>, 
},
{
  path: "Bloq_Mat",
 element: <Bloqueio_Mat/>, 
},
{
  path: "AlarmePonto",
 element: <AlarmePonto/>, 
},
{
  path: "HoraProdLista",
 element: <HoraProdLista/>, 
},
{
  path: "HoraHora",
 element: <HoraHora/>, 
},
{
  path: "HoraHora2T",
 element: <HoraHora2T/>, 
},
{
  path: "HoraHora3T",
  element: <HoraHora3T/>, 
},
{
  path: "HoraHora",
  element: <HoraHora/>,
},
{
  path: "HoraHoraMounter",
  element: <HoraMounterContainer/>,
},
{
  path: "HoraPlanResult",
  element: <HoraPlanResult/>, 
},
{
  path: "HoraDropW",
 element: <HoraDropW/>, 
},

{
  path: "SM_Slots",
 element: <SM_Slots/>, 
},
{
  path: "SpareParts",
 element: <InputSpare/>, 
},
{
  path: "ESD",
 element: <ESD/>, 
},
{
  path: "ESD_Edit",
 element: <ESD_Edit/>, 
},
{
  path: "Virtual_Label",
 element: <Virtual_Label/>, 
},
{
  path: "VirtualL_Modal",
 element: <VirtualL_Modal/>, 
},
{
  path: "BadHead",
 element: <BadHead/>, 
},
{
  path: "BadHead_Lista",
 element: <BadHead_Lista/>, 
},
{
  path: "Monit_Router",
 element: <Monit_Router/>, 
},
{
  path: "PM",
 element: <PMManagementSystem/>, 
},
{
  path: "MFM",
 element: <MFM/>, 
},
{
  path: "KPITable",
 element: <KPITable/>, 
},
{
  path: "DefectTracking",
 element: <DefectTracking/>, 
},

// Gravação CN
{
  path: "2D_CN",
 element: <CN2D/>, 
},
// Gravação CN
{
  path: "KPIQuality",
 element: <KPIQuality/>, 
},
{
  path: "ListaEntradaWIP",
 element: <ListaEntradaWIP/>, 
},
  {
    path: "EntMaterial2",
   element: <EntMaterial2/>, 
  },
  {
    path: "FTSkipMonitoring",
   element: <FTSkipMonitoringV2/>, 
  },
  {
    path: "SplicingNoCheck",
   element: <SplicingNoCheck/>, 
  },
  {
    path: "Armarios",
   element: <Armarios/>, 
  },
  {
    path: "POPControl",
   element: <POP_Control/>, 
  },
  {
    path: "GestaoAtivos",
   element: <GestaoAtivos/>, 
   },
  {
    path: "Estoque_comp",
   element: <EstoqueComp/>, 
   },
  {
    path: "InspecMX",
   element: <InspecMX/>, 
   },
  {
    path: "HanaroScrap",
   element: <HanaroScrap/>, 
   },
  {
    path: "RepairTNP_IA",
   element: <RepairTNP_IA/>, 
   },
  {
    path: "DescriptN",
   element: <DescriptN/>,
   },



];

const router = createBrowserRouter(
  rawRoutes.map((route) =>
    PUBLIC_PATHS.has(route.path)
      ? route
      : { ...route, element: <RequireAuth>{route.element}</RequireAuth> }
  )
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);
