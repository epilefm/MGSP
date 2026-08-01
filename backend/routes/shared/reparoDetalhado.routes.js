const express = require("express");
const router = express.Router();
const db = require("../../config/db");

// Compartilhada entre Repair e Manutenção
// //--------------Reparo Detalhado------------------------------------------------------
router.get("/getReparoDetalhado", (req, res) => {
  let mysql = `select date_format(a.Data, '%Y-%m-%d %H:%i:%s') as Data, a.Modelo, a.Halb, a.Linha, a.Turno, a.Responsavel, a.Recebimento, a.Processo, a.Fase, a.Origem_SMD,
  case when a.Origem_Main is null then '-' else a.Origem_Main end as Origem_Main, a.Causa, a.Sintoma,
  case when a.Detalhe is null then '-' else a.Detalhe end as Detalhe,
  case when a.Location is null then '-' else a.Location end as Location_Ent,
  a.CN_rep, case when a.Data_Feedback is null then '-' else a.Data_Feedback end as Data_Feedback,

  date_format(b.Data, '%Y-%m-%d %H:%i:%s') as DataP, b.Tipo, b.Tecnico, b.Bancada, b.Defeito, b.Status, b.Detalhes,
  case when b.Location is null then '-' else b.Location end as Location, b.Troca_Comp, b.CN_processo,
  date_format(c.Data_saida, '%Y-%m-%d %H:%i:%s') as DataS, c.Saida, c.Linha_saida, c.Resp_saida, c.Receb_saida, c.CN_saida, c.Data_saida, c.Saida_Processo, c.id_fk,

  case when c.id is not null then 'OK' else 'Pendente' end as 'Status_reparo'
  from reparo_entrada a
  left join ( select b.*, row_number() over (partition by b.CN_processo order by b.id desc) as p from reparo_process b -- partition by b.id order ...
  ) b on a.CN_rep = b.CN_processo  left join reparo_saida c on b.CN_processo = c.CN_saida group by a.CN_rep order by a.id desc;`

  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
