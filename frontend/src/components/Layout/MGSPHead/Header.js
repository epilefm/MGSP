import { useState } from "react";
import { useLocation } from "react-router-dom";
import "./Header.css";

import Links from "./links";

const items = [
  {
    menu: "Production",
    categories: [
      {
        name: "Operator",
        links: [
        
          {
            icon: "/images/icones/prod/ReelEnt.png",
            name: "Entrada de Material - WIP",
            path: "EntMaterial2",
          },
          {
            icon: "/images/icones/prod/Reelreg.png",
            name: "Registro de Material - WIP",
            path: "ListaEntradaWIP",
          },
          {
            icon: "/images/icones/prod/qrcode2d.png",
            name: "2D CN Monitoring",
            path: "2D_CN",
          },
          {
            icon: "/images/icones/prod/duplocn.png",
            name: "Duplo Check de CN",
            path: "SlipScreen",
          },

        ],
      },
      {
        name: "Management",
        links: [
          {
            icon: "/images/icones/prod/mounter_hora.png",
            name: "Hora Mounter",
            path: "HoraHora",
          },
          {
            icon: "/images/icones/prod/worst50.png",
            name: "Drop Worst 50",
            path: "HoraDropW",
          },
          {
            icon: "/images/icones/prod/reelreg.png",
            name: "Splicing - Geral",
            path: "Splicing_history",
          },
          {
            icon: "/images/icones/prod/reelpessoa.png",
            name: "Splicing - Operador",
            path: "Splicing_ops",
          },
          {
            icon: "/images/icones/prod/nosplicing.png",
            name: "Splicing No Check",
            path: "SplicingNoCheck",
          },

        ],
      },
    ],
  },
  {
    menu: "Quality",
    categories: [
      {
        name: "PQC",
        links: [
          {
            icon: "/images/icones/Quality/bloqmat.png",
            name: "Bloqueio de Material",
            path: "Bloq_Mat",
          },
          {
            icon: "/images/icones/Quality/version.png",
            name: "SW Version",
            path: "Version",
          },
          {
            icon: "/images/icones/Quality/fastT.png",
            name: "Fast Defect Tracking",
            path: "DefectTracking",
          },
          {
            icon: "/images/icones/Quality/KPI.png",
            name: "Defect Trend Quality",
            path: "kpiquality",
          },
          {
            icon: "/images/icones/Quality/pop.png",
            name: "POP Control",
            path: "popcontrol",
          },
          {
            icon: "/images/icones/Quality/monit_router.png",
            name: "Router Cutting Checking",
            path: "monit_router",
          },

        ],
      },
      {
        name: "Repair",
        links: [
          {
            icon: "/images/icones/Repair/repEntra.png",
            name: "Entrada no Reparo",
            path: "RepairScreen",
          },
          {
            icon: "/images/icones/Repair/repAnalise.png",
            name: "Reparo de Placa",
            path: "RepairProcess",
          },
          {
            icon: "/images/icones/Repair/repSaida.png",
            name: "Saida de Placa do Reparo",
            path: "RepairSaida",
          },
          {
            icon: "/images/icones/Repair/repDetal.png",
            name: "Histórico de Reparo",
            path: "RepairAnalysis",
          },
          {
            icon: "/images/icones/Repair/estoquecomp.png",
            name: "Estoque de Componente",
            path: "estoque_comp",
          },

        ],
      },
    ],
  },
  {
    menu: "Maintenance",
    categories: [
      {
        name: "Monitoring - Audit",
        links: [
          {
            icon: "/images/icones/manut/smartR.png",
            name: "Smart Rack Slots",
            path: "sm_slots",
          },
          {
            icon: "/images/icones/manut/MFM.png",
            name: "MFM Audit",
            path: "MFM",
          },
          {
            icon: "/images/icones/manut/badhead.png",
            name: "Badhead",
            path: "badhead",
          },
          {
            icon: "/images/icones/manut/PM.png",
            name: "PM",
            path: "PM",
          },
          {
            icon: "/images/icones/manut/ftskip.png",
            name: "FT Skip Monitoring",
            path: "FTSkipMonitoring",
          },
          {
            icon: "/images/icones/suporte/armario.png",
            name: "Armários SMD",
            path: "Armarios",
          },
          {
            icon: "/images/icones/manut/asset.png",
            name: "Asset Management",
            path: "GestaoAtivos",
          },
          // Ícone em progresso - não é clicável e aparece opaco
          {
            icon: "",
            name: "LOB - Em Progresso",
            path: null,
            locked: true
          },

        ],
      },
    ],
  },
  
];
export default function Header() {
  const location = useLocation();
  const path = location.pathname;
  const [activeTab, setActiveTab] = useState(items[0].menu);
  const [showLinks, setShowLinks] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);

  return (
    <header className="mgsp-header">
      <div className="mgsp-top">
        <img src="/images/icones/MGSP.png" style={{width:32, height:28,
          marginTop:0, marginRight:-5, marginBottom:14
        }} 
         />
        <p>MX Global SMD Platform (SEDA-M)</p>
      </div>
      {/* <ul className="mgsp-help-links">
        <li className="login">Login <span>Off</span></li>
        <li className="lang">Language <select><option value="en">en</option></select></li>
      </ul> */}
      <ul className="mgsp-tabs" style={{marginTop:-12}}>
        {items.map((tab) => {
          const isActive = activeTab === tab.menu ?? tab.categories.flatMap((l) => l.links.map(ll => ll.path)).includes(path);
          return (
            <li
              key={tab.menu}
              onClick={() => {
                setActiveTab(tab.menu);
                setShowLinks(true);
              }}
              onMouseEnter={() => {
                setHoveredTab(tab.menu);
                setShowLinks(true);
              }}
              onMouseLeave={() => {
                setHoveredTab(null);
                // Não esconder imediatamente, apenas quando sair da área de links também
              }}
              aria-disabled={isActive}
              className={`mgsp-tabs-link ${
                isActive ? "active" : ""
              }`}
            >
              {tab.menu}
            </li>
          );
        })}
      </ul>
      <div 
        className="mgsp-links-container"
        onMouseEnter={() => setShowLinks(true)}
        onMouseLeave={() => setShowLinks(false)}
        style={{display: showLinks ? 'block' : 'none'}}
      >
        <Links categories={items.find(i => i.menu === activeTab).categories}/>
      </div>
    </header>
  );
}
