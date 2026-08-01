const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('HoraPlanResult');

// ///--------- 
//---------------- Plan vs Result Hourly
router.get("/planVsResultHourly", requireScreen, (req, res) => {
  const {data} = req.query;

  let mysql = `
    SELECT
      pvr.id,
      DATE_FORMAT(pvr.WORK_YMD, '%Y-%m-%d') AS WORK_YMD,
      pvr.PROC_TYPE_NM,
      pvr.LINE_NM,
      pvr.MODEL_CODE,
      pvr.PLAN_QTY,
      pvr.ACRS_QTY,
      pvr.DIFF_QTY,
      pvr.PROGRESS_RATE,
      pvr.h0, pvr.h1, pvr.h2, pvr.h3, pvr.h4, pvr.h5, pvr.h6, pvr.h7, pvr.h8, pvr.h9, pvr.h10, pvr.h11,
      pvr.h12, pvr.h13, pvr.h14, pvr.h15, pvr.h16, pvr.h17, pvr.h18, pvr.h19, pvr.h20, pvr.h21, pvr.h22, pvr.h23,
      CASE
        WHEN pvr.LINE_NM IN ('SMD-16', 'SMD-17', 'SMD-18', 'SMD-19', 'SMD-20')
          THEN CAST(IF(pqp.Meta8 = '' OR pqp.Meta8 IS NULL, pqp.Meta7, pqp.Meta8) AS UNSIGNED)
        ELSE pqp.Meta7
      END AS TARGET
    FROM plan_vs_result_hourly pvr
    LEFT JOIN pcb_qty_plan pqp ON TRIM(pvr.MODEL_CODE) = TRIM(pqp.Halb)
    WHERE DATE_FORMAT(pvr.WORK_YMD, '%Y-%m-%d') = ?
    ORDER BY pvr.PROC_TYPE_NM, pvr.LINE_NM, pvr.MODEL_CODE
  `;

  db.query(mysql, [data], (err, result) => {
    if (err) {
      console.log("Erro ao buscar dados Plan vs Result Hourly: " + err);
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});


module.exports = router;
