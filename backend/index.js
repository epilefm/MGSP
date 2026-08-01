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
// Autenticação (Fase 4)
// ==========================================
const { authenticateToken, authorizeDepartment } = require('./middleware/auth');

// Rota de login é pública; tudo abaixo dela exige token válido.
app.use('/auth', require('./routes/auth/auth.routes'));
app.use(authenticateToken);

// ==========================================
// Rotas compartilhadas (qualquer usuário autenticado)
// ==========================================
app.use(require('./routes/shared/reparoDetalhado.routes'));
app.use(require('./routes/shared/getModeloReparo.routes'));
app.use(require('./routes/shared/usuarios.routes'));
app.use(require('./routes/shared/legacyLogin.routes'));
app.use(require('./routes/shared/fileTransfer.routes'));

// ==========================================
// Rotas migradas para backend/routes/<Departamento>/
// (protegidas por departamento - ver backend/db/migrations/001_auth_schema.sql)
// ==========================================
app.use(authorizeDepartment('quality'), require('./routes/MX/inspecMX.routes'));
app.use(authorizeDepartment('quality'), require('./routes/MX/mxAdmin.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Repair/reparoEntrada.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Repair/reparoProcesso.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Repair/reparoSaida.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Repair/Offline/offlineSaida.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Repair/reparoAnalise.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Repair/reparoComponentes.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Repair/reparoIA.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Quality/versionMapping.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Quality/bloqueioMateriais.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Quality/Inspec_Router/monitorRouter.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Quality/Inspec_Router/routerIA.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Quality/plantHistory.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Quality/popControl.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Quality/KPIQ/kpiAoiRpa.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Quality/KPIQ/kpiAoi.routes'));
app.use(authorizeDepartment('quality'), require('./routes/Quality/ESD/strapFree.routes'));
app.use(authorizeDepartment('maintenance'), require('./routes/Manutenção/Spindle/spindle.routes'));
app.use(authorizeDepartment('maintenance'), require('./routes/Manutenção/Feeder/feeder.routes'));
app.use(authorizeDepartment('maintenance'), require('./routes/Manutenção/Control_Temp/controlTemp.routes'));
app.use(authorizeDepartment('maintenance'), require('./routes/Manutenção/BadHead/badHead.routes'));
app.use(authorizeDepartment('maintenance'), require('./routes/Manutenção/PM/pm.routes'));
app.use(authorizeDepartment('maintenance'), require('./routes/Manutenção/ftSkip.routes'));
app.use(authorizeDepartment('production'), require('./routes/Production/scrap.routes'));
app.use(authorizeDepartment('production'), require('./routes/Production/slip.routes'));
app.use(authorizeDepartment('production'), require('./routes/Production/Splicing/splicingMonitoring.routes'));
app.use(authorizeDepartment('production'), require('./routes/Production/Splicing/splicingDefect.routes'));
app.use(authorizeDepartment('production'), require('./routes/Production/Splicing/splicingNoCheck.routes'));
app.use(authorizeDepartment('production'), require('./routes/Production/HoraProd/horaProd.routes'));
app.use(authorizeDepartment('production'), require('./routes/Production/HoraDropWorst/dropWorst.routes'));
app.use(authorizeDepartment('production'), require('./routes/Production/gravacaoCN.routes'));
app.use(authorizeDepartment('production'), require('./routes/Production/lobMounter.routes'));
app.use(authorizeDepartment('production'), require('./routes/Production/PlanResult/planResult.routes'));
app.use(authorizeDepartment('production'), require('./routes/Production/kitting.routes'));
app.use(authorizeDepartment('material'), require('./routes/Material/entrada.routes'));
app.use(authorizeDepartment('material'), require('./routes/Material/resumo.routes'));
app.use(authorizeDepartment('material'), require('./routes/Material/inventario.routes'));
app.use(authorizeDepartment('material'), require('./routes/Material/wip.routes'));
app.use(authorizeDepartment('material'), require('./routes/Material/hanaro_scrap/hanaroScrap.routes'));
app.use(authorizeDepartment('material'), require('./routes/Material/hanaro_scrap/hanaroFiltros.routes'));
app.use(authorizeDepartment('material'), require('./routes/Material/hanaro_scrap/hanaroAprovadores.routes'));
app.use(authorizeDepartment('material'), require('./routes/Material/hanaro_scrap/hanaroDashboard.routes'));
app.use(authorizeDepartment('material'), require('./routes/Material_analysis/materialAnalysis.routes'));
app.use(authorizeDepartment('support'), require('./routes/Suporte/Armario/armario.routes'));
app.use(authorizeDepartment('support'), require('./routes/Suporte/GestaoAtivos/ativos.routes'));
app.use(authorizeDepartment('support'), require('./routes/Suporte/GestaoAtivos/ciclosInventario.routes'));
