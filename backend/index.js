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
// Rotas migradas para backend/routes/<Departamento>/
// ==========================================
app.use(require('./routes/MX/inspecMX.routes'));
app.use(require('./routes/MX/mxAdmin.routes'));
app.use(require('./routes/shared/reparoDetalhado.routes'));
app.use(require('./routes/shared/getModeloReparo.routes'));
app.use(require('./routes/Repair/reparoEntrada.routes'));
app.use(require('./routes/Repair/reparoProcesso.routes'));
app.use(require('./routes/Repair/reparoSaida.routes'));
app.use(require('./routes/Repair/Offline/offlineSaida.routes'));
app.use(require('./routes/Repair/reparoAnalise.routes'));
app.use(require('./routes/Repair/reparoComponentes.routes'));
app.use(require('./routes/Quality/versionMapping.routes'));
app.use(require('./routes/Quality/bloqueioMateriais.routes'));
app.use(require('./routes/Quality/Inspec_Router/monitorRouter.routes'));
app.use(require('./routes/Quality/Inspec_Router/routerIA.routes'));
app.use(require('./routes/Quality/plantHistory.routes'));
app.use(require('./routes/Quality/popControl.routes'));
app.use(require('./routes/Quality/KPIQ/kpiAoiRpa.routes'));
app.use(require('./routes/Quality/KPIQ/kpiAoi.routes'));
app.use(require('./routes/Manutenção/Spindle/spindle.routes'));
app.use(require('./routes/Manutenção/Feeder/feeder.routes'));
app.use(require('./routes/Manutenção/Control_Temp/controlTemp.routes'));
app.use(require('./routes/Manutenção/BadHead/badHead.routes'));
app.use(require('./routes/Manutenção/PM/pm.routes'));
app.use(require('./routes/Manutenção/ftSkip.routes'));
app.use(require('./routes/Production/scrap.routes'));
app.use(require('./routes/Production/slip.routes'));
app.use(require('./routes/Production/Splicing/splicingMonitoring.routes'));
app.use(require('./routes/Production/Splicing/splicingDefect.routes'));
app.use(require('./routes/Production/Splicing/splicingNoCheck.routes'));
app.use(require('./routes/Production/HoraProd/horaProd.routes'));
app.use(require('./routes/Production/HoraDropWorst/dropWorst.routes'));
app.use(require('./routes/Production/gravacaoCN.routes'));
app.use(require('./routes/Production/lobMounter.routes'));
app.use(require('./routes/Production/PlanResult/planResult.routes'));
app.use(require('./routes/Material/entrada.routes'));
app.use(require('./routes/Material/resumo.routes'));
app.use(require('./routes/Material/inventario.routes'));
app.use(require('./routes/Material/wip.routes'));
app.use(require('./routes/Material/hanaro_scrap/hanaroScrap.routes'));
app.use(require('./routes/Material/hanaro_scrap/hanaroFiltros.routes'));
app.use(require('./routes/Material/hanaro_scrap/hanaroAprovadores.routes'));
app.use(require('./routes/Material/hanaro_scrap/hanaroDashboard.routes'));
app.use(require('./routes/Production/kitting.routes'));
app.use(require('./routes/Material_analysis/materialAnalysis.routes'));
app.use(require('./routes/shared/usuarios.routes'));
app.use(require('./routes/shared/legacyLogin.routes'));
app.use(require('./routes/Quality/ESD/strapFree.routes'));
app.use(require('./routes/Suporte/Armario/armario.routes'));
app.use(require('./routes/Suporte/GestaoAtivos/ativos.routes'));
app.use(require('./routes/Suporte/GestaoAtivos/ciclosInventario.routes'));
app.use(require('./routes/Repair/reparoIA.routes'));
app.use(require('./routes/shared/fileTransfer.routes'));
