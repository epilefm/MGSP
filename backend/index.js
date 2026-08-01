const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios")
const cron = require("node-cron");
const { exec } = require("child_process");
const path = require("path");
const http = require("http");
require('dotenv').config();
const fs = require('fs');
const { Transform } = require('stream');
const multer = require('multer');




const PORT = process.env.PORT || 8080
// Criar router para endpoints do Router
const router = express.Router();

app.listen(PORT, () => {
  console.log(`rodando na porta ${PORT}`);
});

// Registrar router com prefixo /router
app.use('/router', router);

// Comece com o mínimo
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "materiais",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "mydb",
  connectionLimit: 50
});


app.use(cors());
app.use(bodyParser.json());

// ==========================================
// Autenticação (Fase 4) - login/cadastro são públicos, tudo depois exige token
// ==========================================
const { authenticateToken, authorizeScreen } = require('./auth/middleware');
// Prefixo /auth é obrigatório aqui: sem ele, POST /register colidiria com a
// rota legada POST /register de Material/entrada.routes.js (e venceria, por
// ser montada antes), quebrando o registro de entrada de material.
app.use('/auth', require('./auth/routes'));
app.use(require('./auth/admin.routes'));
app.use(authenticateToken);

// ==========================================
// Rotas compartilhadas/utilitárias (qualquer usuário autenticado, sem
// exigir uma tela específica - são lookups genéricos usados por várias telas)
// ==========================================
app.use(require('./routes/shared/reparoDetalhado.routes'));
app.use(require('./routes/shared/getModeloReparo.routes'));
app.use(require('./routes/shared/usuarios.routes'));
app.use(require('./routes/shared/legacyLogin.routes'));
app.use(require('./routes/shared/fileTransfer.routes'));

// ==========================================
// Rotas migradas para backend/routes/<Departamento>/, protegidas por tela
// (ver backend/auth/db/seedScreens.js para o catálogo completo)
// ==========================================
app.use(authorizeScreen('InspecMX'), require('./routes/MX/inspecMX.routes'));
app.use(authorizeScreen('InspecMX'), require('./routes/MX/mxAdmin.routes'));
app.use(authorizeScreen('RepairScreen'), require('./routes/Repair/reparoEntrada.routes'));
app.use(authorizeScreen('RepairProcess'), require('./routes/Repair/reparoProcesso.routes'));
app.use(authorizeScreen('RepairSaida'), require('./routes/Repair/reparoSaida.routes'));
app.use(authorizeScreen('OfflineSaida'), require('./routes/Repair/Offline/offlineSaida.routes'));
app.use(authorizeScreen(['RepairAnalysis', 'RepairInv']), require('./routes/Repair/reparoAnalise.routes'));
app.use(authorizeScreen('Estoque_comp'), require('./routes/Repair/reparoComponentes.routes'));
app.use(authorizeScreen('RepairTNP_IA'), require('./routes/Repair/reparoIA.routes'));
app.use(authorizeScreen(['Version', 'Mapping']), require('./routes/Quality/versionMapping.routes'));
app.use(authorizeScreen('Bloq_Mat'), require('./routes/Quality/bloqueioMateriais.routes'));
app.use(authorizeScreen('Monit_Router'), require('./routes/Quality/Inspec_Router/monitorRouter.routes'));
app.use(authorizeScreen('Monit_Router'), require('./routes/Quality/Inspec_Router/routerIA.routes'));
app.use(authorizeScreen('PlantScreen'), require('./routes/Quality/plantHistory.routes'));
app.use(authorizeScreen('POPControl'), require('./routes/Quality/popControl.routes'));
app.use(authorizeScreen('KPIQuality'), require('./routes/Quality/KPIQ/kpiAoiRpa.routes'));
app.use(authorizeScreen('KPIQuality'), require('./routes/Quality/KPIQ/kpiAoi.routes'));
app.use(authorizeScreen('ESD'), require('./routes/Quality/ESD/strapFree.routes'));
app.use(authorizeScreen('InputSpindle'), require('./routes/Manutenção/Spindle/spindle.routes'));
app.use(authorizeScreen('Feeder'), require('./routes/Manutenção/Feeder/feeder.routes'));
app.use(authorizeScreen('Control_Temp'), require('./routes/Manutenção/Control_Temp/controlTemp.routes'));
app.use(authorizeScreen(['BadHead', 'BadHead_Lista']), require('./routes/Manutenção/BadHead/badHead.routes'));
app.use(authorizeScreen('PM'), require('./routes/Manutenção/PM/pm.routes'));
app.use(authorizeScreen('FTSkipMonitoring'), require('./routes/Manutenção/ftSkip.routes'));
// Scrap_entrada/Scrap_Receb/Scrap_reposicao/Scrap_saida/ScrapInv são linkados
// em Home.js/NavbarComp.js mas NÃO existem como rota registrada em
// frontend/src/index.js (bug pré-existente, não introduzido agora) - sem uma
// tela real pra vincular, liberamos só pra quem estiver autenticado.
app.use(require('./routes/Production/scrap.routes'));
app.use(authorizeScreen('SlipScreen'), require('./routes/Production/slip.routes'));
app.use(authorizeScreen(['SplicingScreen', 'OfflineSplicing', 'Splicing_history', 'Splicing_ops', 'Switch_splice']), require('./routes/Production/Splicing/splicingMonitoring.routes'));
app.use(authorizeScreen('SplicingScreen'), require('./routes/Production/Splicing/splicingDefect.routes'));
app.use(authorizeScreen('SplicingNoCheck'), require('./routes/Production/Splicing/splicingNoCheck.routes'));
app.use(authorizeScreen(['HoraHora', 'HoraHora2T', 'HoraHora3T', 'HoraHoraMounter', 'HoraProdLista']), require('./routes/Production/HoraProd/horaProd.routes'));
app.use(authorizeScreen('HoraDropW'), require('./routes/Production/HoraDropWorst/dropWorst.routes'));
app.use(authorizeScreen(['2D_CN', 'CN_List', 'CNresult']), require('./routes/Production/gravacaoCN.routes'));
// LobMounter/SmdKitting: componente existe (Production/SmdKitting.js) mas não
// tem rota registrada em frontend/src/index.js (bug pré-existente) - mesma
// situação do Scrap acima, liberado só por autenticação por enquanto.
app.use(require('./routes/Production/lobMounter.routes'));
app.use(authorizeScreen('HoraPlanResult'), require('./routes/Production/PlanResult/planResult.routes'));
// registerkit/getkit (Kitting Plan GMES): mesma situação, sem tela registrada.
app.use(require('./routes/Production/kitting.routes'));
app.use(authorizeScreen(['InputScreenEntrada', 'EntMaterial2']), require('./routes/Material/entrada.routes'));
app.use(authorizeScreen(['Charts', 'Material_Analysis']), require('./routes/Material/resumo.routes'));
app.use(authorizeScreen('Inventario'), require('./routes/Material/inventario.routes'));
app.use(authorizeScreen(['ListaEntradaWIP', 'InputScreenEntrada']), require('./routes/Material/wip.routes'));
app.use(authorizeScreen('HanaroScrap'), require('./routes/Material/hanaro_scrap/hanaroScrap.routes'));
app.use(authorizeScreen('HanaroScrap'), require('./routes/Material/hanaro_scrap/hanaroFiltros.routes'));
app.use(authorizeScreen('HanaroScrap'), require('./routes/Material/hanaro_scrap/hanaroAprovadores.routes'));
app.use(authorizeScreen('HanaroScrap'), require('./routes/Material/hanaro_scrap/hanaroDashboard.routes'));
app.use(authorizeScreen('Material_Analysis'), require('./routes/Material_analysis/materialAnalysis.routes'));
app.use(authorizeScreen('Armarios'), require('./routes/Suporte/Armario/armario.routes'));
app.use(authorizeScreen('GestaoAtivos'), require('./routes/Suporte/GestaoAtivos/ativos.routes'));
app.use(authorizeScreen('GestaoAtivos'), require('./routes/Suporte/GestaoAtivos/ciclosInventario.routes'));
