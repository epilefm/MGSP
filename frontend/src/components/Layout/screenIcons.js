import {
  Package, ShieldCheck, Factory, Wrench, Hammer, Lightbulb, LifeBuoy,
  Link2, Activity, Trash2, ClipboardList, Archive, Boxes, Zap,
  ClipboardCheck, BarChart3, GitCommit, Map, Flame, Layers,
  WifiOff, Tag, Cpu, CircleDot, Thermometer, AlertTriangle,
  SkipForward, Scissors, SearchCheck, Grid3x3, LogIn, Undo2,
  LogOut, Award, Truck, TrendingUp, TrendingDown, ShieldAlert,
  Bug, QrCode, DollarSign, PieChart, LineChart, Bot, Users,
  ClipboardType, PackageSearch, Recycle,
} from "lucide-react";

// Departamentos exibidos na Home. Paleta em família de tons frios
// (índigo/azul/ciano/violeta/teal) pra dar identidade sem parecer um arco-íris.
export const GRUPOS = [
  { id: "material", nome: "Material", icone: Package, cor: "#4f46e5" },
  { id: "quality", nome: "Qualidade", icone: ShieldCheck, cor: "#2563eb" },
  { id: "repair", nome: "Reparo", icone: Hammer, cor: "#0891b2" },
  { id: "production", nome: "Produção", icone: Factory, cor: "#0284c7" },
  { id: "maintenance", nome: "Manutenção", icone: Wrench, cor: "#7c3aed" },
  { id: "inovacao", nome: "Inovação", icone: Lightbulb, cor: "#c026d3" },
  { id: "support", nome: "Suporte", icone: LifeBuoy, cor: "#0d9488" },
];

// Palavras-chave (no slug ou nome da tela) -> ícone. Ordem importa: a
// primeira que casar vence. Cobertura por padrão, não precisão cirúrgica -
// o objetivo é dar identidade visual sem precisar de um ícone único por
// tela (são ~80).
const REGRAS = [
  [/hanaro/i, Recycle],
  [/scrap|descarte/i, Trash2],
  [/splicing|switch_splice/i, Link2],
  [/hora|prod(?!uto)/i, Activity],
  [/repair|reparo/i, Wrench],
  [/invent/i, ClipboardList],
  [/armario/i, Archive],
  [/ativos|gestao/i, Boxes],
  [/^esd|_esd/i, Zap],
  [/pop_?control|popcontrol/i, ClipboardCheck],
  [/kpi/i, BarChart3],
  [/version/i, GitCommit],
  [/mapping|mapa(?!_)/i, Map],
  [/baking/i, Flame],
  [/plant|subsidiary|sub(?!scr)/i, Layers],
  [/offline/i, WifiOff],
  [/virtual_label|label/i, Tag],
  [/mfm/i, Cpu],
  [/spindle/i, CircleDot],
  [/feeder/i, Layers],
  [/control_temp|temperatura/i, Thermometer],
  [/badhead/i, AlertTriangle],
  [/ftskip/i, SkipForward],
  [/router|corte/i, Scissors],
  [/inspecmx|^mx/i, SearchCheck],
  [/sm_slots|smart.?rack/i, Grid3x3],
  [/entrada|wip/i, LogIn],
  [/devolucao/i, Undo2],
  [/saida/i, LogOut],
  [/classea|classe.?a/i, Award],
  [/agv|pagamento/i, Truck],
  [/kit(ting)?/i, PackageSearch],
  [/planresult|plan_result/i, TrendingUp],
  [/dropw|worst/i, TrendingDown],
  [/nocheck/i, ShieldAlert],
  [/defect/i, Bug],
  [/gravacao|cn(2t|3t|_list|result)?$/i, QrCode],
  [/lobmounter/i, Boxes],
  [/custo/i, DollarSign],
  [/charts|dashboard/i, PieChart],
  [/analysis|analise/i, LineChart],
  [/_ia$|chat/i, Bot],
  [/pessoas|colaborador/i, Users],
  [/descric|report/i, ClipboardType],
];

export function iconeParaTela(slug, nome, grupoId) {
  const alvo = `${slug} ${nome}`;
  for (const [regex, Icone] of REGRAS) {
    if (regex.test(alvo)) return Icone;
  }
  const grupo = GRUPOS.find((g) => g.id === grupoId);
  return grupo ? grupo.icone : Package;
}
