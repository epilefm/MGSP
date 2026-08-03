// Catálogo de telas do sistema. `slug` bate exatamente com o `path` de cada
// rota em frontend/src/index.js. `grupo` é só organização visual/admin, não
// controla acesso (quem controla acesso é a tabela user_screens + is_public).
//
// Fonte: cruzamento de frontend/src/index.js (rotas reais), Home.js e
// NavbarComp.js (nomes amigáveis já usados no projeto).

const SCREENS_BASE = [
  // material
  { slug: "Material_Analysis", nome: "Análise de Material", grupo: "material" },
  { slug: "Charts", nome: "Dashboards", grupo: "material" },
  { slug: "LavEnt", nome: "Lavagem de Componentes", grupo: "material" },
  { slug: "InputScreenEntrada", nome: "Registro de Entrada", grupo: "material" },
  { slug: "InputScreenSaida", nome: "Registro de Saída", grupo: "material" },
  { slug: "InputScreenDevolucao", nome: "Registro de Devolução", grupo: "material" },
  { slug: "InputScreenDescarte", nome: "Registro de Descarte", grupo: "material" },
  { slug: "DescarteInput", nome: "Registro de Descarte (alternativo)", grupo: "material" },
  { slug: "Inventario", nome: "Registro de Inventário", grupo: "material" },
  { slug: "HanaroScrap", nome: "Hanaro Scrap", grupo: "material" },
  { slug: "EntMaterial2", nome: "Entrada de Material", grupo: "material" },
  { slug: "ListaEntradaWIP", nome: "Lista de Entrada WIP", grupo: "material" },
  { slug: "Mapa", nome: "Mapa (AGV)", grupo: "material" },
  { slug: "Pgto", nome: "Pagamento (AGV)", grupo: "material" },

  // quality (inclui Inspeção MX, como já era na Navbar - Reparo agora é grupo próprio, ver abaixo)
  { slug: "Bloq_Mat", nome: "Bloqueio de Materiais", grupo: "quality" },
  { slug: "ESD", nome: "Controle ESD", grupo: "quality" },
  { slug: "ESD_Edit", nome: "Edição ESD", grupo: "quality" },
  { slug: "Version", nome: "Monitoramento de Versão", grupo: "quality" },
  { slug: "Mapping", nome: "Mapeamento 2D", grupo: "quality" },
  { slug: "baking", nome: "Controle MSL", grupo: "quality" },
  { slug: "PlantScreen", nome: "Monitoramento de Planta", grupo: "quality" },
  { slug: "SubScreen", nome: "Gestão de Materiais", grupo: "quality" },
  { slug: "Sub", nome: "Gestão de Substância", grupo: "quality" },
  { slug: "SaidaSub", nome: "Saída de Substância", grupo: "quality" },
  { slug: "WPlant", nome: "Planta Incorreta", grupo: "quality" },
  { slug: "WPlantHistory", nome: "Histórico - Planta Incorreta", grupo: "quality" },
  { slug: "DefectTracking", nome: "Rastreamento de Defeitos", grupo: "quality" },
  { slug: "Monit_Router", nome: "Monitor Router", grupo: "quality" },
  { slug: "KPIQuality", nome: "KPI Status Trend", grupo: "quality" },
  { slug: "POPControl", nome: "Controle POP", grupo: "quality" },
  { slug: "Prod", nome: "Plano de Produção (legado)", grupo: "quality" },
  { slug: "InspecMX", nome: "Inspeção MX", grupo: "quality" },
  { slug: "RepairScreen", nome: "Reparo - Entrada", grupo: "repair" },
  { slug: "RepairScreen_2", nome: "Reparo - Entrada (V2)", grupo: "repair" },
  { slug: "RepairProcess", nome: "Reparo - Processo", grupo: "repair" },
  { slug: "RepairSaida", nome: "Reparo - Saída", grupo: "repair" },
  { slug: "RepairAnalysis", nome: "Reparo - Análise", grupo: "repair" },
  { slug: "RepairInv", nome: "Reparo - Inventário", grupo: "repair" },
  { slug: "RepairTNP_IA", nome: "Reparo TNP - Assistente IA", grupo: "repair" },
  { slug: "Estoque_comp", nome: "Estoque de Componentes", grupo: "repair" },
  { slug: "OfflineSaida", nome: "Offline - Saída", grupo: "repair" },

  // production
  { slug: "HoraHora", nome: "Produção Mounter", grupo: "production" },
  { slug: "HoraHora2T", nome: "Produção Mounter - 2 Turnos", grupo: "production" },
  { slug: "HoraHora3T", nome: "Produção Mounter - 3 Turnos", grupo: "production" },
  { slug: "HoraHoraMounter", nome: "Produção Mounter (consolidado)", grupo: "production", is_public: true },
  { slug: "HoraProdLista", nome: "Produção - Lista Detalhada", grupo: "production" },
  { slug: "HoraPlanResult", nome: "Hora Resultado", grupo: "production", is_public: true },
  { slug: "HoraDropW", nome: "50 Piores Indicadores", grupo: "production" },
  { slug: "KPITable", nome: "Tabela de KPI", grupo: "production" },
  { slug: "2D_CN", nome: "Gravação CN - Todos os Turnos", grupo: "production" },
  { slug: "CN_List", nome: "Lista de CN", grupo: "production" },
  { slug: "CNresult", nome: "Resultado CN", grupo: "production" },
  { slug: "SplicingScreen", nome: "Monitoramento Splicing", grupo: "production" },
  { slug: "SplicingNoCheck", nome: "Splicing - No Check", grupo: "production" },
  { slug: "Splicing_history", nome: "Splicing - Histórico", grupo: "production" },
  { slug: "Splicing_ops", nome: "Splicing - Operações", grupo: "production" },
  { slug: "Switch_splice", nome: "Splicing - Troca", grupo: "production" },
  { slug: "OfflineSplicing", nome: "Splicing Offline", grupo: "production" },
  { slug: "SlipScreen", nome: "Duplo Check CN", grupo: "production" },
  { slug: "Virtual_Label", nome: "Virtual T/O", grupo: "production" },
  { slug: "VirtualL_Modal", nome: "Virtual T/O - Modal", grupo: "production" },

  // maintenance
  { slug: "SM_Slots", nome: "Monitoramento Smart Rack", grupo: "inovacao" },
  { slug: "Control_Temp", nome: "Controle de Temperatura", grupo: "maintenance" },
  { slug: "InputSpindle", nome: "Monitoramento Spindle - Registro", grupo: "maintenance" },
  { slug: "Input_Reflow", nome: "Reflow - Registro de Perfis", grupo: "maintenance" },
  { slug: "ReflowW", nome: "Reflow - Monitoramento", grupo: "maintenance" },
  { slug: "Feeder", nome: "Registro de Feeder", grupo: "maintenance" },
  { slug: "BadHead", nome: "Auditoria BadHead", grupo: "maintenance" },
  { slug: "BadHead_Lista", nome: "BadHead - Lista", grupo: "maintenance" },
  { slug: "MFM", nome: "Auditoria MFM", grupo: "maintenance" },
  { slug: "PM", nome: "Gestão de PM", grupo: "maintenance" },
  { slug: "FTSkipMonitoring", nome: "FT Skip Monitoring", grupo: "maintenance" },

  // support
  // Nota: Home.js/Navbar linkam em minúsculo ("spareparts"), mas a rota real
  // registrada em index.js é "SpareParts" - o React Router é case-insensitive
  // por padrão, então é a mesma tela; mantemos só uma entrada no catálogo.
  { slug: "SpareParts", nome: "Peças de Reposição", grupo: "support" },
  { slug: "Armarios", nome: "Armários SMD", grupo: "support" },
  { slug: "GestaoAtivos", nome: "Gestão de Ativos", grupo: "support" },
  { slug: "AlarmePonto", nome: "Alarme de Ponto", grupo: "support" },
  { slug: "DescriptN", nome: "Tradutor de Descrição", grupo: "support" },
];

// Teste temporário de monitoramento de acesso: todo mundo que se cadastrar já
// vê todas as telas, sem precisar de liberação individual pelo admin. A
// "Gestão de Usuários" não entra aqui - ela nem faz parte desse catálogo, é
// protegida à parte (rota /Admin, só pra quem é is_admin).
// Pra voltar ao controle por usuário: troque TESTE_TODAS_PUBLICAS pra false
// e rode "node backend/auth/db/seed.js" de novo.
const TESTE_TODAS_PUBLICAS = true;

// Telas em desenvolvimento - incompletas, o admin ainda está mexendo nelas.
// Ficam escondidas de todo mundo que não é admin (admin sempre vê tudo, via
// bypass em authorizeScreen/podeAcessar - independe de is_public). Essa
// lista manda mais que TESTE_TODAS_PUBLICAS: mesmo com o teste geral ligado,
// essas continuam fora do ar pra usuário comum.
const TELAS_EM_DESENVOLVIMENTO = new Set([
  // Material - só "Entrada de Material" (EntMaterial2) fica visível por enquanto
  "Material_Analysis", "Charts", "LavEnt", "InputScreenEntrada", "InputScreenSaida",
  "InputScreenDevolucao", "InputScreenDescarte", "DescarteInput", "Inventario",
  "HanaroScrap", "ListaEntradaWIP", "Mapa", "Pgto",
  // Qualidade
  "ESD_Edit", "baking", "Sub", "Mapping", "SubScreen", "WPlantHistory",
  "PlantScreen", "Prod", "WPlant", "DefectTracking", "SaidaSub",
  // Reparo
  "OfflineSaida", "RepairTNP_IA",
  // Produção
  "CN_List", "HoraHora", "HoraHora2T", "HoraHora3T", "OfflineSplicing",
  "Virtual_Label", "VirtualL_Modal",
  // Manutenção
  "Input_Reflow", "ReflowW", "Feeder", "InputSpindle",
  // Suporte
  "SpareParts", "DescriptN",
]);

const SCREENS = SCREENS_BASE.map((tela) => {
  if (TELAS_EM_DESENVOLVIMENTO.has(tela.slug)) return { ...tela, is_public: false };
  return TESTE_TODAS_PUBLICAS ? { ...tela, is_public: true } : tela;
});

module.exports = { SCREENS };
