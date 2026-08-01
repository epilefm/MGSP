const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('KPIQuality');

// Definir metas como constantes para fácil manutenção
const METAS_QUALIDADE = {
  'P-AOI': 635,
  'M-AOI': 377,
  'S-AOI': 112,
  'FT': 1309,
  'TEACHING M': 2.0,
  'TEACHING S': 2.0
};

router.get("/kpi_aoi_historico", requireScreen, (req, res) => {
  let mysql = `
SELECT
      date_format(Work_ymd, '%d/%m/%Y') as Data,
      date_format(created_at, '%H:%i:%s') as hora_coleta,
      WORK_YMD,
      HOUR(created_at) as hora_referencia,
      PAOI_PPM as 'P-AOI',
      MAOI_PPM as 'M-AOI',
      SAOI_PPM as 'S-AOI',
      AOI_PPM as 'FT',
      AOI_PROD as 'TEACHING M',
      AOI as 'TEACHING S'
    FROM mydb.kpi_aoi_historico
    WHERE id IN (
      SELECT MAX(id)
      FROM kpi_aoi_historico
      GROUP BY DATE(WORK_YMD), HOUR(created_at)
    )
    ORDER BY created_at DESC
  `;

  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Erro ao buscar dados do KPI de qualidade");
    } else {
      // Adicionar metas aos resultados
      const resultWithTargets = result.map(item => ({
        ...item,
        metas: METAS_QUALIDADE
      }));
      res.json(resultWithTargets);
    }
  })});

router.get("/kpi_aoi_atual", requireScreen, (req, res) => {
  let mysql = `
    SELECT date_format(Work_ymd, '%d/%m/%Y') as Data, PAOI_PPM as 'P-AOI', MAOI_PPM as 'M-AOI', SAOI_PPM as 'S-AOI',  AOI_PPM as 'FT', AOI_PROD 'TEACHING M', AOI as 'TEACHING S'
    FROM mydb.kpi_aoii where WORK_YMD = CURDATE() order by WORK_YMD desc limit 1;
  `;

  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Erro ao buscar dados atuais do KPI de qualidade");
    } else {
      res.json(result);
    }
  })})

module.exports = router;
