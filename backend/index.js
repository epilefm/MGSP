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

//---------------------------------------------------------------------
app.post("/register", (req, res) => {
  const array = req.body;
  const results = [];
  const errors = []
  array.forEach((item) => {
    db.query(
      "INSERT INTO mydb.entrada (PO, Kitting_Plan, Line, Basic_Model, Shift, Reel_ID, Barcode, Part_Number, Qty, User, Registry_ID, Halb, Plant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
      [
        item.PO,
        item.Kitting_Plan,
        item.Line,
        item.Basic_Model,
        item.Shift,
        item.Reel_ID,
        item.Barcode,
        item.Part_Number,
        item.Qty,
        item.User,
        item.Registry_ID,
        item.Halb,
        item.Plant,
      ],
      (err, result) => {
        if (err) {
          console.log("Erro ao salvar dados na tela de entrada: " + err);
          // res.status(400).json({message: "Erro ao salvar dados na tela de entrada: " + err});
          errors.push(err);
        } else {
          console.log("Dados inseridos: " + res);
          // res.json({message: "sucesso"});
          results.push(result)
        }
      }
    );

  });

  if (errors.length > 0) {
    res.status(400).json({message: `Erro ao salvar ${errors.length} componentes`});
  } else {
    res.json({message: "Sucesso", data: results});
  }

});
        
app.post("/search", (req, res) => {
  const { Date } = req.body;
  const { PO } = req.body;
  const { Line } = req.body;
  const { Basic_Model } = req.body;
  const { Shift } = req.body;
  const { Reel_ID } = req.body;
  const { Barcode } = req.body;
  const { Part_Number } = req.body;
  const { Qty } = req.body;
  const { User } = req.body;
  const { Registry_ID } = req.body;
  const { Halb } = req.body;
  const { Plant } = req.body;

  let mysql =
    "SELECT*from entrada ORDER BY id desc WHERE Date = ? AND PO = ? AND Line = ? AND Basic_Model = ? AND Shift = ? AND Reel_ID = ? AND Barcode = ? \
    AND Part_Number = ?  AND Qty = ? AND User = ? AND Registry_ID = ? AND Halb = ?  AND Plant = ?";
  db.query(mysql, [Date, PO, Line, Basic_Model, Shift, Reel_ID, Barcode, Part_Number, Qty, User, Registry_ID, Halb, Plant], (err, result) => {
    if (err) res.send(err);
    console.log(err);
    res.send(result);
  });
});







app.get("/getCards", (req, res) => {
  let mysql = "SELECT *, date_format(SUBSTR(Date, 1, 10), '%d/%m/%Y') as Date, time_format(SUBSTR(Date, 11, 19), '%H:%i') as Hour FROM mydb.entrada where date >= curdate() - INTERVAL 30 DAY order by id desc;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.put("/edit", (req, res) => {
  const { id } = req.body;
  const { dia } = req.body;
  const { po } = req.body;
  const { linha } = req.body;
  const { modelo } = req.body;
  const { turno } = req.body;
  const { reel_id } = req.body;
  const { vendor } = req.body;
  const { part_number } = req.body;
  const { qty } = req.body;
  const { user } = req.body;
  const { matricula } = req.body;
  const { halb } = req.body;
  const { planta } = req.body;

  let mysql = "UPDATE entrada SET data = ?, linha = ?, modelo = ?, turno = ?, reel_id = ?, vendor = ?, part_number = ? WHERE id = ?";
  db.query(mysql, [dia, linha, modelo, turno, reel_id, vendor, part_number, qty, user, matricula, halb, planta], (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});

app.delete("/delete/:id", (req, res) => {
  const { id } = req.params;
  let mysql = "DELETE FROM entrada WHERE id = ?";
  db.query(mysql, id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});




//---------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------
// ----------------------------------------Consultas Kitting Plan GMES

app.post('/registerkit', (req, res) => {
  
  const array = req.body;
array.forEach(item => {
  
 
     db.query('INSERT INTO mydb.smdkittingplan (LINE_NM ,MODEL_CODE, BASIC_MODEL_CODE, PLAN_QTY, PRODC_INST_NO, PLANT_CODE,PLAN_YMD,WORK_YMD,CNTN_YN) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);', 
     [item.LINE_NM, item.MODEL_CODE, item.BASIC_MODEL_CODE, item.PLAN_QTY,
      item.PRODC_INST_NO,item.PLANT_CODE, item.CNTN_YN,item.WORK_YMD,item.PLAN_YMD], (err, result) => {
      if (err) throw err;
      console.log('Dados inseridos: ' + res.affectedRows);
    });
  });
})

app.get("/getkit", (req, res) => {
  let mysql = "SELECT id, WORK_YMD as Date, LINE_NM as Line,MODEL_CODE as Halb,BASIC_MODEL_CODE as Basic_Model,PLANT_CODE as Plant,sum(PLAN_QTY) as Qty FROM mydb.smdkittingplan where PLANT_CODE='P81J' or PLANT_CODE='P81L' or PLANT_CODE='P81M' or PLANT_CODE='P81N' or PLANT_CODE='P81P' group by LINE_NM;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  }); 
});


//---------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------
// ----------------------------------------Consultas de Saida


// app.post("/registersaida", (req, res) => {
//   const array = req.body;

//   array.forEach(item => {
       
//         db.query("INSERT INTO saida (Shift, Line, Plant, User, Registry_ID, Halb, Basic_Model, Reel_ID, Barcode, Part_Number, Date_Entrance, PO, Date_Output, Qty_Entrance, Qty_Output) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", 
//         [item.Shift, item.Line, item.Plant, item.User, item.Registry_ID, item.Halb, item.Basic_Model, item.Reel_ID, item.Barcode, item.Part_Number, item.Date_Entrance, item.PO, item.Date_Output, item.Qty_Entrance, item.Qty_Output], (err, res) => {
//           if (err) {
//             console.log(err);
//           } else {
            
//             let mysql = "Update mydb.saida as sai inner join mydb.entrada as entra ON entra.Reel_ID = sai.Reel_ID Set sai.Qty_Entrance= entra.Qty, sai.Date_Entrance= entra.Date, sai.Plant = entra.Plant where sai.id = sai.id";
//             db.query(mysql, (err, res) => { })
      
//           }
        
//        });
//       });

//     })

//---------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------
// ----------------------------------------Consultas de Rastreabilidade


// app.get("/getCardRast", (req, res) => {
//   let mysql = "select id, Date, Halb, Basic_Model as 'Basic_Model', Line, Plant, Reel_ID as 'Reel ID', Part_Number, Prod_Plan, Entrance, Output, Prod_Qty, \
//   Material_Return, Discard_Qty, Kit_Plan, ((Discard_Qty-Output)+Material_Return) as Diff from rastreabilidade order by id desc";
//   db.query(mysql, (err, result) => {
//     if (err) {
//       console.log(err);
//     } else {
//       res.send(result);
//     }
//   });
// });

// app.put("/editsaida", (req, res) => {
//   const { turno } = req.body;
//   const { user } = req.body;
//   const { matricula } = req.body;
//   const { halb } = req.body;
//   const { basic } = req.body;
//   const { line } = req.body;
//   const { plant } = req.body;
//   const { reel_id } = req.body;
//   const { barcode } = req.body;
//   const { part_number } = req.body;
//   const { data_entrada } = req.body;
//   const { data_saida } = req.body;
//   const { qty_entrada } = req.body;
//   const { qty_saida } = req.body;
  


//   let mysql = "UPDATE saida SET linha = ?, modelo = ?, turno = ?, reel_id = ?, vendor = ?, part_number = ?, data_entrada = ?, qty_entrada = ?, data_saida = ?, qty_saida = ? WHERE id = ?";
//   db.query(mysql, [turno, user, matricula, halb, basic, line, plant, reel_id, barcode, part_number, data_entrada, data_saida, qty_entrada, qty_saida], (err, result) => {
//     if (err) {
//       res.send(err);
//     } else {
//       res.send(result);
//     }
//   });
// });

// app.delete("/deletesaida/:id", (req, res) => {
//   const { id } = req.params;
//   let mysql = "DELETE FROM saida WHERE id = ?";
//   db.query(mysql, id, (err, result) => {
//     if (err) {
//       console.log(err);
//     } else {
//       res.send(result);
//     }
//   });
// });


//---------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------
// ----------------------------------------Consultas de filtro em resumo por dia e linha

app.get("/getDescarteResumo", (req, res) => {
  const { Line } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;
  
  let mysql = `select id, date_format(Date, '%Y%m%d') as Date,Line,Part_Number, sum(Qty_Discard) as Qty_Discard from mydb.descarte where\
   Line like '%${Line}%' and (date_format(Date, '%Y%m%d') between'${datei}' and '${datef}') group by Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/getEntra", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;

  let mysql = `select id, date_format(Date, '%Y-%m-%d') as Date,Line,Halb,Basic_Model,Part_Number,sum(Qty) as Qty_Entrance from mydb.entrada where Line \
  like '%${Line}%' and Halb like '%${Halb}%' and (date_format(Date, '%Y-%m-%d') between '${datei}' and '${datef}') group by Halb,Part_Number`;
  db.query(mysql, (err, result) => {
    
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/getResumo", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;
  
  let mysql = `select id, date_format(Date, '%Y%m%d') as Date,Line,Halb,Basic_Model,Part_Number, sum(Qty) as Qty_Entrance from mydb.entrada where\
   Line like '%${Line}%' and Halb like '%${Halb}%' and (date_format(Date, '%Y%m%d') between '${datei}' and '${datef}')  group by Halb,Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/getSaidaResumo", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;
  
  let mysql = `select id, date_format(Date_Output, '%Y%m%d') as Date,Line,Halb,Basic_Model,Part_Number, sum(Qty_Output) as Qty_Output from mydb.saida where\
   Line like '%${Line}%' and Halb like '%${Halb}%' and (date_format(Date_Output, '%Y%m%d') between '${datei}' and '${datef}')  group by Halb,Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/getReturnResumo", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;
  
  let mysql = `select id, date_format(Date, '%Y%m%d') as Date,Line,Halb,Basic_Model,Part_Number, sum(Qty_Return) as Qty_Return from mydb.devolucao where\
   Line like '%${Line}%' and Halb like '%${Halb}%' and (date_format(Date, '%Y%m%d') between '${datei}' and '${datef}')  group by Halb,Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});


app.get("/getClasseAResumo", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;
  let mysql = `select id, date_format(Date, '%Y%m%d') as Date,Line,Halb,Basic_Model,Part_Number,((Output)-(Discard_Qty)) as In_Process from mydb.rastreabilidade where\
   Line like '%${Line}%' and Halb like '%${Halb}%' and (date_format(Date, '%Y%m%d') between '${datei}' and '${datef}') group by Halb,Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

/*Consulta relacionada a diferença de materiais no WIP. Entrada - Saida*/
app.get("/getEstoque", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;
  
  let mysql = `  SELECT 
  a.id,
	date_format(a.Date, '%Y-m%-d%),
    a.Line,
    a.Basic_Model,
    a.Halb,
    a.Part_Number,
    a.Qty AS QTY_Entrada,
    b.Qty AS QTY_Saida,
    SUM(a.Qty - b.Qty) AS Pend_to_Process
FROM
    (SELECT 
      id,
        DATE_FORMAT(Date, '%Y%m%d') AS Date,
            Line,
            Basic_Model,
            Part_Number,
            Halb,
            SUM(Qty) AS Qty
    FROM
        mydb.entrada
    WHERE
        Line LIKE '%${Line}%'
            
            AND Halb like '%${Halb}%'
            AND (DATE_FORMAT(Date, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
    GROUP BY Basic_Model , Part_Number
    ORDER BY id DESC) a
        INNER JOIN
    (SELECT 
        DATE_FORMAT(Date_Output, '%Y%m%d') AS Date,
            Line,
            Basic_Model,
            Part_Number,
            SUM(Qty_Output) AS Qty
    FROM
        mydb.saida
    WHERE
        Line LIKE '%${Line}%'
            
        AND Halb like '%${Halb}%'
            AND (DATE_FORMAT(Date_Output, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
    GROUP BY Basic_Model , Part_Number
    ORDER BY id DESC) b ON (a.Part_Number = b.Part_Number)
GROUP BY a.Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

// nao ta usando-----------------------------------------------------
/*Consulta relacionada a diferença de materiais no processo. Entrada - Saida*/
/*Consulta relacionada a diferença de materiais no processo. Pagamento, Saida, Retorno, Descarte*/
app.get("/getProcesso", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;
  
  let mysql = `
  SELECT 
  a.id,
  a.Date,
  a.Line,
  a.Basic_Model,
  a.Halb,
  a.Part_Number,
  a.PO,
  coalesce((a.Qty_Entrada),0) AS QTY_Entrada,
  coalesce((b.Qty_Saida),0) AS QTY_Saida,
  (coalesce(a.Qty_Entrada,0) - coalesce(b.Qty_Saida,0)) + coalesce(c.Qty_Return,0) AS Estoque_Wip,
  coalesce((c.Qty_Return),0) AS QTY_Return,
  coalesce((d.Qty_Discard),0) AS QTY_Discard,
  coalesce((b.Qty_Saida - a.Qty_Entrada),0) AS Pend_to_Process,
  (coalesce(d.Qty_Discard,0) - coalesce(b.Qty_Saida,0)) + coalesce(c.Qty_Return,0) AS Remain_in_Process
FROM
(SELECT 
  id, PO,
    DATE_FORMAT(Date, '%Y%m%d') AS Date,
        Line,
        Basic_Model,
        Part_Number,
        Halb,
        coalesce(sum(Qty),0) AS Qty_Entrada
FROM
    mydb.entrada
WHERE
   Line like '%${Line}%'
  AND Halb like '%${Halb}%'
        AND (DATE_FORMAT(Date, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
GROUP BY Basic_Model , Part_Number 
ORDER BY id DESC) a
    left JOIN
(SELECT 
    DATE_FORMAT(Date_Output, '%Y%m%d') AS Date,
        Line,
        Halb,
        Basic_Model,
        Part_Number,
        coalesce(sum(Qty_Output),0) AS Qty_Saida
FROM
    mydb.saida
WHERE
    Line like '%${Line}%'
  AND Halb like '%${Halb}%'
        AND (DATE_FORMAT(Date_Output, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
GROUP BY Basic_Model , Part_Number
ORDER BY id DESC) b ON (a.Part_Number = b.Part_Number)
Left JOIN
  (SELECT 
      DATE_FORMAT(Date, '%Y%m%d') AS Date,
          Line,
          Basic_Model,
          Halb,
          Part_Number,
          coalesce(sum(Qty_Return),0) AS Qty_Return
  FROM
      mydb.devolucao
  WHERE
  Line like '%${Line}%'
  AND Halb like '%${Halb}%'
          AND (DATE_FORMAT(Date, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
  GROUP BY Basic_Model , Part_Number
  ORDER BY id DESC) c ON (b.Part_Number = c.Part_Number) 
  Left JOIN
  (SELECT 
      DATE_FORMAT(Date, '%Y%m%d') AS Date,
          Line,
          Basic_Model,
          Halb,
          Part_Number,
         coalesce(sum(Qty_Discard),0) AS Qty_Discard
  FROM
      mydb.descarte
  WHERE
 Line like '%${Line}%'
  AND Halb like '%${Halb}%'
          AND (DATE_FORMAT(Date, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
  GROUP BY Halb, Part_Number
  ORDER BY id DESC) d ON (b.Part_Number = d.Part_Number) 
GROUP BY a.Part_Number;`; 
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});


app.get("/getModelo", (req, res) => {
  let mysql = "SELECT Halb, Basic_Model, Plant FROM mydb.entrada where Plant='P81J' OR Plant='P81L' \
   OR Plant='P81M' OR Plant='P81N' OR Plant='P81P' OR Plant is null group by halb ORDER BY Halb ASC;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

// [Rota /getModeloReparo migrada para backend/routes/shared/getModeloReparo.routes.js]

// ---------------------------------------usuarios---------------------------------------

app.get("/getUser", (req, res) => {
  let mysql = "SELECT Nome FROM mydb.usuarios where matricula = 'Registry_ID' order by id desc;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});
 
// ---------------------------------------Mapping---------------------------------------

// app.get("/getmapping", (req, res) => {
//   let mysql = "select id, INP_COMP_YMD as Date, mapping.MODEL_CODE as HALB,\
//   mapping.BASIC_MODEL_CODE as BASIC_MODEL,\
//   mapping.PLANT_CODE as PLANT,\
//   mapping.LINE_NM as LINE,\
//   sum(mapping.PAOI_IN_CNT_BOT ) as PAOI_BOT,\
//   sum(mapping.PAOI_IN_CNT_TOP ) as PAOI_TOP,\
//   sum(mapping.MAOI_IN_CNT_BOT) as MAOI_BOT,\
//   sum(mapping.MAOI_IN_CNT_TOP) as MAOI_TOP,\
//   sum(mapping.SAOI_IN_CNT_BOT) as SAOI_BOT,\
//   sum(mapping.SAOI_IN_CNT_TOP) as SAOI_TOP,\
//   sum(mapping.FT_IN_CNT ) as SMD_FT,\
//   sum(mapping.FINAL_IN_CNT) as Result from mydb.mapping  where LINE_NM like '%%' group by mapping.LINE_NM,mapping.MODEL_CODE\
//   ,mapping.BASIC_MODEL_CODE,(mapping.PAOI_IN_CNT_TOP ) having BASIC_MODEL_CODE like '%%' or MODEL_CODE like '%%'  order by LINE;";
//   db.query(mysql, (err, result) => {
//     if (err) {
//       console.log(err);
//     } else {
//       res.send(result);
//     }
//   }); 
// });

// app.get("/getmappingsum", (req, res) => {
//   let mysql = "select id, INP_COMP_YMD as Date, mapping.MODEL_CODE as HALB,\
//   mapping.BASIC_MODEL_CODE as BASIC_MODEL,\
//   mapping.PLANT_CODE as PLANT,\
//   mapping.LINE_NM as LINE,\
//   sum(mapping.PAOI_IN_CNT_BOT ) as PAOI_BOT,\
//   sum(mapping.PAOI_IN_CNT_TOP ) as PAOI_TOP,\
//   sum(mapping.MAOI_IN_CNT_BOT) as MAOI_BOT,\
//   sum(mapping.MAOI_IN_CNT_TOP) as MAOI_TOP,\
//   sum(mapping.SAOI_IN_CNT_BOT) as SAOI_BOT,\
//   sum(mapping.SAOI_IN_CNT_TOP) as SAOI_TOP,\
//   sum(mapping.FT_IN_CNT ) as SMD_FT,\
//   sum(mapping.FINAL_IN_CNT) as Result from mydb.mapping where LINE_NM like '%%' group by mapping.LINE_NM order by LINE;";
//   db.query(mysql, (err, result) => {
//     if (err) {
//       console.log(err);
//     } else {
//       res.send(result);
//     }
//   }); 
// });



// ------------------------------------------------------------------------------

// app.post("/Baking", (req, res) => {
  
//   const {Processo} = req.body;
//   const {Part_Number} = req.body;
//   const {MSL} = req.body;
//   const {Qty} = req.body;
//   const {Reel_ID} = req.body;
//   const {Basic_Model} = req.body;
//   const {Line} = req.body;
//   const {Turno} = req.body;
//   const {Matricula} = req.body;
//   const {Motivo} = req.body;

//   let mysql = "INSERT INTO mydb.baking (Processo, Part_Number, MSL, Qty, Reel_ID, Basic_Model, Line,Turno, Matricula, Motivo) \
//   VALUES (?,?,?,?,?,?,?,?,?,?)";
//   db.query(mysql, [Processo, Part_Number, MSL, Qty, Reel_ID, Basic_Model, Line, Turno, Matricula, Motivo], (err, res) => {
//                     if (err) {
//                       console.log('Erro na entrada de dados do Baking: '+err+' ---- '+res);
                      
//                       }else{

//                       console.log('Dados inseridos com sucesso no Baking '+res);
                    
//                     }         
//   } );
// });

// app.get("/getBaking", (req, res) => {
//   let mysql = "select * from mydb.baking ORDER BY id desc;";
//   db.query(mysql, (err, result) => {
//     if (err) {
//       console.log(err);
//     } else {
//       res.send(result);
//     }
//   });
// });


// ----------------------------------------LOGIN-----------------------------------------

app.get ('/loginForm', (req, res) => {
  const sql = "SELECT * FROM mydb.login WHERE User = ? AND Password = ?"
  const values =[
    req.body.User,
    req.body.Password
  ]
db.query(sql, [values], (err,data) => {
  if (err) return res.json ("Login Failed");
  return res.json (data);
})})

// -------------------------------------------Charts----------------------------------------------



// -------------------------------------------Charts----------------------------------------------

// ------------Descarte------------

app.get("/getDiscardChart", (req, res) => {
  const { datei } = req.query;
  const { datef } = req.query;

  let mysql = `SELECT Line,  \
  count(Qty_Discard) AS Qty FROM mydb.descarte WHERE  \
(date_format(Date, '%Y%m%d') between '${datei}' and '${datef}') GROUP BY Line ORDER BY Qty ASC;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

// ---------------------------------------Inventário de Componentes / Placas ---------------------------------------

app.post('/inv', (req, res)=>{
  const {
    Data, 
    Basic_Model, 
    Codigo, 
    Fase,
    Material, 
    Qty_Bottom, 
    Qty_Top, 
    Qty_Reparo, 
    Qty_Offline, 
    Qty_Wip, 
    Qty_Scrap, 
    Pend_Kitting, 
    Qty_Plano, 
    Observacao
  } = req.body

  let mysql = "INSERT INTO mydb.inventario (Data, Basic_Model, Codigo, Fase, Material, Qty_Bottom, Qty_Top, Qty_Reparo, Qty_Offline, \
     Qty_Wip, Qty_Scrap, Pend_Kitting, Qty_Plano, Observacao) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
   db.query(mysql, [Data, Basic_Model, Codigo, Fase, Material, Qty_Bottom, Qty_Top, Qty_Reparo, Qty_Offline, Qty_Wip, Qty_Scrap, 
     Pend_Kitting, Qty_Plano, Observacao], (err) => {
                     if (err) {
                       console.log('Erro na entrada de dados do Inventario:'+err);
                       res.send({
                         STATUS : false,
                         msg : err
                       })
                       }else{
                       console.log('Dados inseridos com sucesso no Inventario');
                       res.send({
                         STATUS : true,
                         msg: "DADOS INSERIDOS COM SUCESSO"
                       })
                     }

   } );

})

app.get("/getinventario", (req, res) => {
 let mysql = "SELECT * FROM mydb.inventario ORDER BY id desc;";
 db.query(mysql, (err, result) => {
   if (err) {
     console.log(err);
   } else {
     res.send(result);
   }
 });
});

// --------------------------Dashboard turno descarte-----------------------------------
app.get("/getPie", (req, res) => {
  let mysql = "select shift, count(id) as Qty from mydb.descarte group by shift order by id desc ;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
 });

 //------------------------------------------------------------------------------------------

// [Rotas de Repair migradas para backend/routes/Repair/ (reparoEntrada, reparoProcesso, reparoSaida, reparoAnalise) e backend/routes/Repair/Offline/offlineSaida.routes.js; getReparoDetalhado migrou para backend/routes/shared/reparoDetalhado.routes.js]


// [Rotas migradas para backend/routes/Quality/]
  
/// ESD REAL - STRAP FREE
app.get("/StrapFree", (req, res) => {
  const { date } = req.query;

  let mysql = `
  select
  date_format(Data, '%d-%m-%Y') Data,
  date_format(Data, '%H:%i:%s') Hora,
   Funcionario, Turno, Resultado, Pulseira, Bata, calcado_dir, calcado_esq
   from mydb.strap_freee
    where date_format(Data, '%d-%m-%Y') = ?;
  `;
  db.query(mysql, [date], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send(err);
      } else {
          res.send(result);
      }
  });
});








/// ------------------------------------------------------------------------------ESD REAL - STRAP FREE
app.get("/StrapFree", (req, res) => {
  const { date } = req.query;

  let mysql = `
  select
  date_format(Data, '%d-%m-%Y') Data,
  date_format(Data, '%H:%i:%s') Hora,
   Funcionario, Turno, Resultado, Pulseira, Bata, calcado_dir, calcado_esq
   from mydb.strap_freee
    where date_format(Data, '%d-%m-%Y') = ?;
  `;
  db.query(mysql, [date], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send(err);
      } else {
          res.send(result);
      }
  });
});

// [Rotas migradas para backend/routes/Quality/]

// Rota para salvar dados da tela EntMaterial2
app.post("/saveEntradawip", (req, res) => {
  const { products, line, prodOrder, model, halb, plant, keep, planQty } = req.body;
  
  console.log('Recebendo requisição para salvar produtos:', { products, line, prodOrder, model, halb, plant, keep, planQty });
  
  // Verificar se products é um array
  if (!Array.isArray(products)) {
    console.log('Erro: Products não é um array');
    return res.status(400).json({ error: "Products deve ser um array" });
  }

  // Obter a data atual no formato YYYY-MM-DD
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Determinar o turno automaticamente com base no horário atual
  const turnoAtual = determinarTurno();

  // Preparar os dados para inserção
  const values = products.map(product => [
    currentDate,  // date
    line,  // line (valor do plano de produção)
    prodOrder,  // prod_order (valor do plano de produção)
    model,  // model (valor do plano de produção)
    halb,  // halb (valor do plano de produção)
    plant,  // plant (valor do plano de produção)
    keep,  // keep (valor do plano de produção)
    planQty,  // plan_qty (valor do plano de produção)
    product.reelId,
    product.barcode,
    product.partNumber,
    product.quantity,
    turnoAtual  // Turno determinado automaticamente
  ]);

  console.log('Dados preparados para inserção:', values);

  // Query para inserção dos dados
  const query = `INSERT INTO entradawip2 (date, line, prod_order, model, halb, plant, keep, plan_qty, reel_id, barcode, part_number, qty, shift) VALUES ?`;

  db.query(query, [values], (err, result) => {
    if (err) {
      console.error("Erro ao salvar dados: ", err);
      return res.status(500).json({ error: "Erro ao salvar dados", details: err.message });
    }
    console.log('Dados salvos com sucesso:', result);
    res.status(200).json({ message: "Dados salvos com sucesso", result, turno: turnoAtual });
  });
});

// Rota alternativa para salvar dados da tela EntMaterial2
app.post("/saveEntradawipAlternative", (req, res) => {
  const { products, turno } = req.body;
  
  // Verificar se products é um array
  if (!Array.isArray(products)) {
    return res.status(400).json({ error: "Products deve ser um array" });
  }

  // Preparar os dados para inserção
  const values = products.map(product => [
    product.reelId,
    product.barcode,
    product.partNumber,
    product.quantity,
    turno,  // Usar o turno do corpo da requisição
    product.shift || '1T'  // Usar o shift do produto ou '1T' como padrão
  ]);

  // Query para inserção dos dados
  const query = `INSERT INTO entradawip2 (reel_id, barcode, part_number, qty, turno, shift) VALUES ?`;

  db.query(query, [values], (err, result) => {
    if (err) {
      console.error("Erro ao salvar dados (alternativo): ", err);
      return res.status(500).json({ error: "Erro ao salvar dados", details: err.message });
    }
    res.status(200).json({ message: "Dados salvos com sucesso", result });
  });
});

// Rota para verificar se o Reel ID já existe no banco de dados
app.get("/checkReelId/:reelId", (req, res) => {
  const { reelId } = req.params;
  
  // Query para verificar se o Reel ID existe
  const query = `SELECT COUNT(*) AS count FROM entradawip2 WHERE reel_id = ?`;
  
  db.query(query, [reelId], (err, result) => {
    if (err) {
      console.error("Erro ao verificar Reel ID: ", err);
      return res.status(200).json({ exists: false }); // Retornar false em vez de erro
    }
    
    const exists = result[0].count > 0;
    res.status(200).json({ exists });
  });
});

// Rota para buscar todos os registros da tabela entradawip2
app.get("/getEntradawip", (req, res) => {
  // Query para buscar todos os registros
  const query = `SELECT * FROM entradawip2 ORDER BY created_at DESC`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar registros: ", err);
      return res.status(500).json({ error: "Erro ao buscar registros" });
    }
    
    res.status(200).json(results);
  });
});

// Rota para confirmar a saída de registros
app.post("/confirmExit", (req, res) => {
  const { recordIds } = req.body;
  
  // Verificar se recordIds é um array válido
  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    return res.status(400).json({ success: false, error: "Nenhum ID de registro fornecido" });
  }
  
  // Query para atualizar o status de confirmação de saída
  const query = `UPDATE entradawip2 SET confirmed_exit = TRUE WHERE id IN (?)`;
  
  db.query(query, [recordIds], (err, results) => {
    if (err) {
      console.error("Erro ao confirmar saída dos registros: ", err);
      return res.status(500).json({ success: false, error: "Erro ao confirmar saída dos registros" });
    }
    
    res.status(200).json({ success: true, message: `Saída confirmada para ${results.affectedRows} registro(s)` });
  });
});


 
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Endpoints para armários
// Buscar todos os armários
app.get('/armarios', (req, res) => {
  const query = `SELECT * FROM armario_smd ORDER BY numero_armario`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar armários: ", err);
      return res.status(500).json({ error: "Erro ao buscar armários" });
    }
    
    res.status(200).json(results);
  });
});

// Buscar um armário específico pelo número
app.get('/armario/:numero', (req, res) => {
  const { numero } = req.params;
  
  const query = `SELECT * FROM armario_smd WHERE numero_armario = ?`;
  
  db.query(query, [numero], (err, results) => {
    if (err) {
      console.error("Erro ao buscar armário: ", err);
      return res.status(500).json({ error: "Erro ao buscar armário" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Armário não encontrado" });
    }
    
    res.status(200).json(results[0]);
  });
});

// Criar ou atualizar um armário
app.post('/armario/:numero', (req, res) => {
  const { numero } = req.params;
  const { numero_real, pessoa_id, funcionario, matricula, turno, cargo, departamento } = req.body;
  
  // Validação de campos obrigatórios
  if (!numero) {
    return res.status(400).json({ error: "Número do armário é obrigatório" });
  }
  
  // Verificar se a pessoa já está em outro armário (exceto o armário atual)
  const checkPessoaArmarioQuery = `SELECT * FROM armario_smd WHERE pessoa_id = ? AND numero_armario != ?`;
  
  db.query(checkPessoaArmarioQuery, [pessoa_id, numero], (err, result) => {
    if (err) {
      console.error("Erro ao verificar pessoa em armário: ", err);
      return res.status(500).json({ error: "Erro ao verificar pessoa em armário" });
    }
    
    if (result.length > 0) {
      return res.status(400).json({ error: "Pessoa já está atribuída a outro armário" });
    }
    
    // Verificar se a pessoa existe na tabela de pessoas (apenas se pessoa_id foi fornecido)
    if (pessoa_id) {
      const checkPessoaQuery = `SELECT * FROM mydb.pessoas WHERE id = ?`;
      
      db.query(checkPessoaQuery, [pessoa_id], (err, result) => {
        if (err) {
          console.error("Erro ao verificar pessoa: ", err);
          return res.status(500).json({ error: "Erro ao verificar pessoa" });
        }
        
        if (result.length === 0) {
          return res.status(400).json({ error: "Pessoa não encontrada" });
        }
        
        // Inserir ou atualizar armário
        const updateArmarioQuery = `
          INSERT INTO armario_smd 
          (numero_armario, numero_real, pessoa_id, funcionario, matricula, turno, cargo, departamento)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          numero_real = VALUES(numero_real),
          pessoa_id = VALUES(pessoa_id),
          funcionario = VALUES(funcionario),
          matricula = VALUES(matricula),
          turno = VALUES(turno),
          cargo = VALUES(cargo),
          departamento = VALUES(departamento),
          updated_at = CURRENT_TIMESTAMP
        `;
        
        db.query(updateArmarioQuery, [
          numero, 
          numero_real || numero, 
          pessoa_id || null, 
          funcionario || null, 
          matricula || null, 
          turno || null, 
          cargo || null, 
          departamento || null
        ], (err, result) => {
          if (err) {
            console.error("Erro ao salvar armário: ", err);
            // Verificar se é um erro de duplicidade
            if (err.code === 'ER_DUP_ENTRY') {
              if (err.message.includes('numero_armario')) {
                return res.status(400).json({ error: "Número de armário já existe" });
              } else if (err.message.includes('pessoa_id')) {
                return res.status(400).json({ error: "Pessoa já está atribuída a outro armário" });
              }
            }
            return res.status(500).json({ error: "Erro ao salvar armário" });
          }
          
          // Recarregar os armários após a atualização
          const reloadQuery = `SELECT * FROM armario_smd ORDER BY numero_armario`;
          db.query(reloadQuery, (err, results) => {
            if (err) {
              console.error("Erro ao recarregar armários: ", err);
              return res.status(200).json({ message: "Pessoa atribuída ao armário com sucesso" });
            }
            
            res.status(200).json({ 
              message: "Pessoa atribuída ao armário com sucesso",
              armarios: results
            });
          });
        });
      });
    } else {
      // Se não tiver pessoa_id, apenas atualizar os dados do armário
      const updateArmarioQuery = `
        INSERT INTO armario_smd 
        (numero_armario, numero_real, pessoa_id, funcionario, matricula, turno, cargo, departamento)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        numero_real = VALUES(numero_real),
        pessoa_id = VALUES(pessoa_id),
        funcionario = VALUES(funcionario),
        matricula = VALUES(matricula),
        turno = VALUES(turno),
        cargo = VALUES(cargo),
        departamento = VALUES(departamento),
        updated_at = CURRENT_TIMESTAMP
      `;
      
      db.query(updateArmarioQuery, [
        numero, 
        numero_real || numero, 
        pessoa_id || null, 
        funcionario || null, 
        matricula || null, 
        turno || null, 
        cargo || null, 
        departamento || null
      ], (err, result) => {
        if (err) {
          console.error("Erro ao salvar armário: ", err);
          // Verificar se é um erro de duplicidade
          if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('numero_armario')) {
              return res.status(400).json({ error: "Número de armário já existe" });
            } else if (err.message.includes('pessoa_id')) {
              return res.status(400).json({ error: "Pessoa já está atribuída a outro armário" });
            }
          }
          return res.status(500).json({ error: "Erro ao salvar armário" });
        }
        
        // Recarregar os armários após a atualização
        const reloadQuery = `SELECT * FROM armario_smd ORDER BY numero_armario`;
        db.query(reloadQuery, (err, results) => {
          if (err) {
            console.error("Erro ao recarregar armários: ", err);
            return res.status(200).json({ message: "Armário atualizado com sucesso" });
          }
          
          res.status(200).json({ 
            message: "Armário atualizado com sucesso",
            armarios: results
          });
        });
      });
    }
  });
});

// Liberar um armário (remover pessoa)
app.delete('/armario/:numero', (req, res) => {
  const { numero } = req.params;
  
  // Verificar se o armário existe
  const checkArmarioQuery = `SELECT * FROM armario_smd WHERE numero_armario = ?`;
  
  db.query(checkArmarioQuery, [numero], (err, result) => {
    if (err) {
      console.error("Erro ao verificar armário: ", err);
      return res.status(500).json({ error: "Erro ao verificar armário" });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Armário não encontrado" });
    }
    
    // Remover pessoa do armário
    const updateArmarioQuery = `
      UPDATE armario_smd 
      SET pessoa_id = NULL, 
          funcionario = NULL, 
          matricula = NULL, 
          turno = NULL, 
          cargo = NULL, 
          departamento = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE numero_armario = ?
    `;
    
    db.query(updateArmarioQuery, [numero], (err, result) => {
      if (err) {
        console.error("Erro ao remover pessoa do armário: ", err);
        return res.status(500).json({ error: "Erro ao remover pessoa do armário" });
      }
      
      res.status(200).json({ message: "Pessoa removida do armário com sucesso" });
    });
  });
});

// Buscar todas as pessoas disponíveis para atribuição a armários
app.get('/pessoas', (req, res) => {
  const query = `SELECT id, funcionarios, matricula, turno, cargo, departamento, job_class FROM mydb.pessoas ORDER BY funcionarios`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar pessoas: ", err);
      return res.status(500).json({ error: "Erro ao buscar pessoas" });
    }
    
    res.status(200).json(results);
  });
});



// [Rotas migradas para backend/routes/Quality/]






///------------------------------------------------------------------------------------------------------
///------------------------------------------------------------------------------------------------------

// Rota para buscar ativos unificados (ativo_fixo + ativo_bnp)
app.get('/api/ativos-unificados', (req, res) => {
  const { tipo } = req.query; // Adiciona filtro por tipo (opcional)
  
  let query = '';
  
  // Se o tipo for especificado, filtra por tipo específico
  if (tipo === 'fixo') {
    query = `
      SELECT 
        asset AS asset_identifier,
        serial_number AS serial,
        asset_description AS description,
        inventario AS estacao,
        'fixo' AS tipo,
        inventario AS status
      FROM ativo_fixo
      ORDER BY asset_identifier
    `;
  } else if (tipo === 'bnp') {
    query = `
      SELECT 
        asset_number AS asset_identifier,
        serial_number AS serial,
        asset_desc AS description,
        location_district AS estacao,
        'bnp' AS tipo,
        NULL AS status
      FROM ativo_bnp
      ORDER BY asset_identifier
    `;
  } else {
    // Se não especificar tipo ou for 'todos', faz a união
    query = `
      SELECT 
        asset AS asset_identifier,
        serial_number AS serial,
        asset_description AS description,
        inventario AS estacao,
        'fixo' AS tipo,
        inventario AS status
      FROM ativo_fixo
      UNION ALL
      SELECT 
        asset_number AS asset_identifier,
        serial_number AS serial,
        asset_desc AS description,
        location_district AS estacao,
        'bnp' AS tipo,
        NULL AS status
      FROM ativo_bnp
      ORDER BY asset_identifier
    `;
  }
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar ativos unificados: ", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar ativos unificados" });
    }
    
    res.status(200).json({ success: true, data: results });
  });
});

// Endpoint para verificar se a tabela de inventário existe
app.get('/api/verificar-tabela-inventario', (req, res) => {
  const checkTableQuery = `
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'mydb' AND table_name = 'ativo_inventario_historico' LIMIT 1
  `;
  
  db.query(checkTableQuery, (err, results) => {
    if (err) {
      console.error("Erro ao verificar tabela de inventário: ", err);
      return res.status(500).json({ success: false, message: "Erro ao verificar tabela de inventário" });
    }
    
    const existe = results.length > 0;
    res.status(200).json({ success: true, existe: existe });
  });
});

// Rota para salvar o status do inventário de um ativo
app.post('/api/salvar-inventario-ativo', (req, res) => {
  const { asset_identifier, serial_number, description, localizacao, tipo_ativo, status } = req.body;
  
  // Validar campos obrigatórios
  if (!asset_identifier || !tipo_ativo || !status) {
    return res.status(400).json({ success: false, message: "Campos obrigatórios: asset_identifier, tipo_ativo e status" });
  }
  
  // Validar status
  if (status !== 'encontrado' && status !== 'nao_encontrado' && status !== 'pendente') {
    return res.status(400).json({ success: false, message: "Status inválido. Use 'encontrado', 'nao_encontrado' ou 'pendente'" });
  }
  
  // Iniciar uma transação para atualizar ambas as tabelas
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Erro ao obter conexão: ", err);
      return res.status(500).json({ success: false, message: "Erro ao obter conexão" });
    }
    
    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        console.error("Erro ao iniciar transação: ", err);
        return res.status(500).json({ success: false, message: "Erro ao iniciar transação" });
      }
      
      // Atualizar a tabela de inventário histórico
      const ciclo_id = req.body.ciclo_id || null;
      const inventarioQuery = `
        INSERT INTO ativo_inventario_historico 
        (asset_identifier, serial_number, description, localizacao, tipo_ativo, status, ciclo_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        serial_number = VALUES(serial_number),
        description = VALUES(description),
        localizacao = VALUES(localizacao),
        tipo_ativo = VALUES(tipo_ativo),
        status = VALUES(status),
        ciclo_id = VALUES(ciclo_id),
        data_hora = CURRENT_TIMESTAMP
      `;
      
      connection.query(inventarioQuery, [asset_identifier, serial_number, description, localizacao, tipo_ativo, status, ciclo_id], (err, results) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("Erro ao salvar inventário do ativo: ", err);
            return res.status(500).json({ success: false, message: "Erro ao salvar inventário do ativo" });
          });
        }
        
        // Commit da transação (localização é salva apenas no histórico, não nas tabelas originais)
        connection.commit(err => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Erro ao commitar transação: ", err);
              return res.status(500).json({ success: false, message: "Erro ao salvar dados" });
            });
          }
          
          connection.release();
          res.status(200).json({ 
            success: true, 
            message: "Inventário do ativo salvo com sucesso", 
            id: results.insertId
          });
        });
      });
    });
  });
});

// Rota para buscar o histórico de inventário de um ativo específico
app.get('/api/historico-inventario-ativo/:asset_identifier', (req, res) => {
  const { asset_identifier } = req.params;
  
  const query = `
    SELECT * FROM ativo_inventario_historico 
    WHERE asset_identifier = ? 
    ORDER BY data_hora DESC
  `;
  
  db.query(query, [asset_identifier], (err, results) => {
    if (err) {
      console.error("Erro ao buscar histórico de inventário do ativo: ", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar histórico de inventário do ativo" });
    }
    
    res.status(200).json({ success: true, data: results });
  });
});

// Rota para buscar estatísticas de inventário
app.get('/api/estatisticas-inventario', (req, res) => {
  const query = `
    SELECT 
      tipo_ativo,
      status,
      COUNT(*) as quantidade
    FROM ativo_inventario_historico
    WHERE data_hora = (SELECT MAX(data_hora) FROM ativo_inventario_historico ai2 WHERE ai2.asset_identifier = ativo_inventario_historico.asset_identifier)
    GROUP BY tipo_ativo, status
    ORDER BY tipo_ativo, status
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar estatísticas de inventário: ", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar estatísticas de inventário" });
    }
    
    // Processar os resultados para um formato mais amigável
    const estatisticas = {
      fixo: { encontrado: 0, nao_encontrado: 0 },
      bnp: { encontrado: 0, nao_encontrado: 0 }
    };
    
    results.forEach(row => {
      if (row.tipo_ativo === 'fixo') {
        estatisticas.fixo[row.status] = row.quantidade;
      } else if (row.tipo_ativo === 'bnp') {
        estatisticas.bnp[row.status] = row.quantidade;
      }
    });
    
    res.status(200).json({ success: true, data: estatisticas });
  });
});

// Rota para buscar contadores de ativos
app.get('/api/contadores-ativos', (req, res) => {
  // Contar total de ativos fixos
  const queryFixos = `SELECT COUNT(*) as total FROM ativo_fixo`;
  
  // Contar total de ativos BNP
  const queryBnp = `SELECT COUNT(*) as total FROM ativo_bnp`;
  
  // Contar ativos fixos inventariados
  const queryFixosInventariados = `
    SELECT status, COUNT(*) as quantidade 
    FROM ativo_inventario_historico 
    WHERE tipo_ativo = 'fixo' 
    AND data_hora = (SELECT MAX(data_hora) FROM ativo_inventario_historico ai2 WHERE ai2.asset_identifier = ativo_inventario_historico.asset_identifier)
    GROUP BY status
  `;
  
  // Contar ativos BNP inventariados
  const queryBnpInventariados = `
    SELECT status, COUNT(*) as quantidade 
    FROM ativo_inventario_historico 
    WHERE tipo_ativo = 'bnp' 
    AND data_hora = (SELECT MAX(data_hora) FROM ativo_inventario_historico ai2 WHERE ai2.asset_identifier = ativo_inventario_historico.asset_identifier)
    GROUP BY status
  `;
  
  // Executar todas as queries em paralelo
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(queryFixos, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queryBnp, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queryFixosInventariados, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queryBnpInventariados, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    })
  ])
  .then(([totalFixos, totalBnp, fixosInventariados, bnpInventariados]) => {
    // Processar resultados
    const contadores = {
      fixos: {
        total: totalFixos,
        encontrado: 0,
        nao_encontrado: 0
      },
      bnp: {
        total: totalBnp,
        encontrado: 0,
        nao_encontrado: 0
      }
    };
    
    // Preencher contadores de ativos fixos
    fixosInventariados.forEach(row => {
      if (row.status === 'encontrado') {
        contadores.fixos.encontrado = row.quantidade;
      } else if (row.status === 'nao_encontrado') {
        contadores.fixos.nao_encontrado = row.quantidade;
      }
    });
    
    // Preencher contadores de ativos BNP
    bnpInventariados.forEach(row => {
      if (row.status === 'encontrado') {
        contadores.bnp.encontrado = row.quantidade;
      } else if (row.status === 'nao_encontrado') {
        contadores.bnp.nao_encontrado = row.quantidade;
      }
    });
    
    res.status(200).json({ success: true, data: contadores });
  })
  .catch(err => {
    console.error("Erro ao buscar contadores de ativos: ", err);
    res.status(500).json({ success: false, message: "Erro ao buscar contadores de ativos" });
  });
});

// Rota para buscar status de múltiplos ativos de uma vez
app.post('/api/ativos-com-status', (req, res) => {
  const { assetIdentifiers } = req.body;
  
  if (!assetIdentifiers || !Array.isArray(assetIdentifiers) || assetIdentifiers.length === 0) {
    return res.status(400).json({ success: false, message: "Lista de identificadores de ativos é obrigatória" });
  }
  
  // Criar placeholders para a query
  const placeholders = assetIdentifiers.map(() => '?').join(',');
  
  // Query para buscar o status mais recente de cada ativo
  const query = `
    SELECT 
      asset_identifier,
      status,
      localizacao,
      data_hora
    FROM ativo_inventario_historico aih1
    WHERE 
      asset_identifier IN (${placeholders}) AND
      data_hora = (
        SELECT MAX(data_hora) 
        FROM ativo_inventario_historico aih2 
        WHERE aih2.asset_identifier = aih1.asset_identifier
      )
  `;
  
  db.query(query, assetIdentifiers, (err, results) => {
    if (err) {
      console.error("Erro ao buscar status de ativos: ", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar status de ativos" });
    }
    
    res.status(200).json({ success: true, data: results });
  });
});

// ═══════════════════════════════════════════════════════════════
// ROTAS PARA GESTÃO DE CICLOS DE INVENTÁRIO
// ═══════════════════════════════════════════════════════════════

// GET /api/ciclo-inventario-ativo
// Retorna o ciclo de inventário atualmente ativo. Se não existir, cria automaticamente.
app.get('/api/ciclo-inventario-ativo', (req, res) => {
  // Usar data_fim IS NULL para encontrar o ciclo ativo (evita problemas com UNIQUE constraint na coluna ativo)
  const queryBuscar = `SELECT * FROM ativo_inv_ciclo WHERE data_fim IS NULL ORDER BY id DESC LIMIT 1`;

  db.query(queryBuscar, (err, results) => {
    if (err) {
      console.error('Erro ao buscar ciclo ativo:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar ciclo ativo' });
    }

    if (results.length > 0) {
      return res.status(200).json({ success: true, data: results[0] });
    }

    // Nenhum ciclo existe → cria o primeiro automaticamente
    const nome = `Inventário ${new Date().toLocaleDateString('pt-BR')}`;
    const queryCriar = `
      INSERT INTO ativo_inv_ciclo (nome, descricao, data_inicio, criado_em)
      VALUES (?, 'Ciclo inicial criado automaticamente', NOW(), NOW())
    `;
    db.query(queryCriar, [nome], (err2, result2) => {
      if (err2) {
        console.error('Erro ao criar ciclo inicial:', err2);
        return res.status(500).json({ success: false, message: 'Erro ao criar ciclo inicial' });
      }
      const novoCiclo = { id: result2.insertId, nome, data_inicio: new Date() };
      return res.status(200).json({ success: true, data: novoCiclo });
    });
  });
});

// POST /api/novo_ciclo_inventario
// Fecha o ciclo atual e cria um novo. O histórico anterior fica intacto.
app.post('/api/novo_ciclo_inventario', (req, res) => {
  const { descricao } = req.body;
  const nome = descricao || `Inventário ${new Date().toLocaleDateString('pt-BR')}`;

  // 0. Remover UNIQUE constraint da coluna ativo se existir (causa Duplicate Entry)
  db.query(`ALTER TABLE ativo_inv_ciclo DROP INDEX uq_ativo`, (errDrop) => {
    // Ignorar erro se o índice não existir
    
    // 1. Fechar o ciclo atual
    const queryFechar = `UPDATE ativo_inv_ciclo SET data_fim = NOW() WHERE data_fim IS NULL`;
    
    db.query(queryFechar, (err) => {
      if (err) {
        console.error('Erro ao fechar ciclo:', err.message);
        return res.status(500).json({ success: false, message: 'Erro ao fechar ciclo atual', error: err.message });
      }

      // 2. Criar o novo ciclo (sem usar a coluna ativo para evitar conflito com UNIQUE)
      const queryCriar = `INSERT INTO ativo_inv_ciclo (nome, descricao, data_inicio, criado_em) VALUES (?, ?, NOW(), NOW())`;
      
      db.query(queryCriar, [nome, `Criado em ${new Date().toLocaleString('pt-BR')}`], (err2, result) => {
        if (err2) {
          console.error('Erro ao criar novo ciclo:', err2.message);
          // Se ainda der erro de Duplicate Entry, tentar sem a coluna ativo setando explicitamente
          if (err2.code === 'ER_DUP_ENTRY') {
            // Tentar remover o índice e inserir novamente
            db.query(`ALTER TABLE ativo_inv_ciclo DROP INDEX uq_ativo`, () => {
              db.query(queryCriar, [nome, `Criado em ${new Date().toLocaleString('pt-BR')}`], (err3, result3) => {
                if (err3) {
                  console.error('Erro na segunda tentativa:', err3.message);
                  return res.status(500).json({ success: false, message: 'Erro ao criar novo ciclo', error: err3.message });
                }
                return res.status(200).json({
                  success: true,
                  message: 'Novo ciclo criado com sucesso',
                  data: { id: result3.insertId, nome, data_inicio: new Date() },
                });
              });
            });
          } else {
            return res.status(500).json({ success: false, message: 'Erro ao criar novo ciclo', error: err2.message });
          }
        } else {
          return res.status(200).json({
            success: true,
            message: 'Novo ciclo criado com sucesso',
            data: { id: result.insertId, nome, data_inicio: new Date() },
          });
        }
      });
    });
  });
});

// GET /api/ciclos-historico
// Lista todos os ciclos anteriores (para relatórios).
app.get('/api/ciclos-historico', (req, res) => {
  const query = `
    SELECT
      c.*,
      COUNT(h.id) AS total_registros,
      SUM(CASE WHEN h.status = 'encontrado' THEN 1 ELSE 0 END) AS encontrados,
      SUM(CASE WHEN h.status = 'nao_encontrado' THEN 1 ELSE 0 END) AS nao_encontrados
    FROM ativo_inv_ciclo c
    LEFT JOIN ativo_inventario_historico h ON h.ciclo_id = c.id
    GROUP BY c.id
    ORDER BY c.data_inicio DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar histórico de ciclos' });
    }
    return res.status(200).json({ success: true, data: results });
  });
});


// [Rotas de Repair (componentes/estoque) migradas para backend/routes/Repair/reparoComponentes.routes.js]






// [Rotas de MX migradas para backend/routes/MX/inspecMX.routes.js e mxAdmin.routes.js]



//////////------------------------//////////---------/************************************////////////////////---------------------------------------------------------------------- *///////////------------------------//////////---------/************************************////////////////////---------------------------------------------------------------------- */
//////////------------------------//////////---------/************************************////////////////////---------------------------------------------------------------------- *///////////------------------------//////////---------/************************************////////////////////---------------------------------------------------------------------- */
//////////------------------------//////////---------/************************************////////////////////---------------------------------------------------------------------- *///////////------------------------//////////---------/************************************////////////////////---------------------------------------------------------------------- */
//////////------------------------//////////---------/************************************////////////////////---------------------------------------------------------------------- *///////////------------------------//////////---------/************************************////////////////////---------------------------------------------------------------------- */
//////////------------------------//////////---------/************************************////////////////////---------------------------------------------------------------------- *///////////------------------------//////////---------/************************************////////////////////---------------------------------------------------------------------- */
// ==========================================
// Hanaro Scrap - Origens
// ==========================================
app.get("/getOrigens", (req, res) => {
  let query = `SELECT id, Origem as nome FROM hanaro_origem ORDER BY Origem ASC`;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar origens: ", err);
      return res.status(500).json({ message: "Erro ao buscar origens", error: err });
    }
    res.status(200).json(result);
  });
});

// ==========================================
// Hanaro Scrap - Equipamentos
// ==========================================
app.get("/getEquipamentos", (req, res) => {
  let query = `SELECT id, Equipamentos as nome FROM hanaro_equip ORDER BY Equipamentos ASC`;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar equipamentos: ", err);
      return res.status(500).json({ message: "Erro ao buscar equipamentos", error: err });
    }
    res.status(200).json(result);
  });
});

// ==========================================
// Hanaro Scrap - Causas
// ==========================================
app.get("/getCausas", (req, res) => {
  let query = `SELECT id, Causas as nome FROM hanaro_causas ORDER BY Causas ASC`;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar causas: ", err);
      return res.status(500).json({ message: "Erro ao buscar causas", error: err });
    }
    res.status(200).json(result);
  });
});


// ----------------------------------------Custo de Placas----------------------------------------
app.get("/api/custo-placa", (req, res) => {
  try {
    const { modelo, tipoPlaca } = req.query;
    
    if (!modelo || !tipoPlaca) {
      return res.status(400).json({ error: 'Modelo e tipoPlaca são obrigatórios' });
    }

    // Query otimizada que usa CASE para selecionar a coluna apropriada
    // Faz matching exato do modelo selecionado (sem tratamento adicional)
    const query = `
      SELECT 
        CASE 
          WHEN ? = 'Bot' THEN fase_bottom
          WHEN ? = 'Top' THEN fase_top
          WHEN ? = 'Limpa' THEN placa_limpa
          ELSE NULL
        END AS custo_unitario
      FROM hanaro_halb_custo 
      WHERE modelo = ?
        AND (
          (? = 'Bot' AND fase_bottom IS NOT NULL AND fase_bottom > 0) OR
          (? = 'Top' AND fase_top IS NOT NULL AND fase_top > 0) OR
          (? = 'Limpa' AND placa_limpa IS NOT NULL AND placa_limpa > 0)
        )
      LIMIT 1
    `;

    const params = [
      tipoPlaca, tipoPlaca, tipoPlaca, 
      modelo, // modelo = ? (usa diretamente o modelo selecionado)
      tipoPlaca, tipoPlaca, tipoPlaca
    ];
    
    db.execute(query, params, (err, results) => {
      if (err) {
        console.error('Erro ao buscar custo:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (results.length > 0 && results[0].custo_unitario !== null) {
        // Converter string com vírgula para número (formato brasileiro)
        const custoString = results[0].custo_unitario.toString();
        const custoNumerico = parseFloat(custoString.replace(',', '.')) || 0;
        // Garantir que o valor tenha 2 casas decimais
        res.json({ custo_unitario: Number(custoNumerico.toFixed(2)) });
      } else {
        res.json({ custo_unitario: 0 });
      }
    });
  } catch (error) {
    console.error('Erro ao buscar custo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ----------------------------------------Modelos de Custo----------------------------------------
app.get("/api/modelos-custo", (req, res) => {
  try {
    const query = `
      SELECT DISTINCT modelo, halb 
      FROM hanaro_halb_custo 
      WHERE (fase_bottom IS NOT NULL AND fase_bottom > 0) 
         OR (fase_top IS NOT NULL AND fase_top > 0) 
         OR (placa_limpa IS NOT NULL AND placa_limpa > 0)
      ORDER BY modelo ASC
    `;
    
    db.execute(query, (err, results) => {
      if (err) {
        console.error('Erro ao buscar modelos de custo:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (!results || results.length === 0) {
        return res.json({ modelos: [] });
      }
      
      const modelos = results.map(row => ({
        modelo: row.modelo || '',
        halb: row.halb || ''
      }));
      
      res.json({ modelos });
    });
  } catch (error) {
    console.error('Erro ao buscar modelos de custo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// Função para enviar email via Agent IA quando um scrap for registrado
// OTIMIZADA: Fire-and-forget + timeout de 10s + sem logs
const enviarEmailNotificacaoScrap = async (scrapData) => {
  const API_KEY = process.env.HANARO_SCRAP_AGENT_API_KEY;
  const BASE_URL = process.env.HANARO_SCRAP_AGENT_URL;
  const FLOW_ID = process.env.HANARO_SCRAP_AGENT_FLOW_ID;

  if (!API_KEY || !BASE_URL || !FLOW_ID) {
    return;
  }

  const prompt = `Foi registrado um novo Hanaro Scrap que precisa de aprovação.
    
DADOS DO REGISTRO:
- ID: ${scrapData.id}
- Modelo: ${scrapData.modelo_nome || 'N/A'}
- Linha: ${scrapData.linha_nome || 'N/A'}
- Turno: ${scrapData.turno || 'N/A'}
- Tipo: ${scrapData.tipo_scrap || 'N/A'}
- Quantidade: ${scrapData.qty || 0} unidades
- Custo Unitário: R$ ${parseFloat(scrapData.custo_unitario || 0).toFixed(2)}
- Custo Total: R$ ${parseFloat(scrapData.custo_total || 0).toFixed(2)}
- Registrado por: ${scrapData.nome_operador || 'N/A'} (${scrapData.matricula})
- Data: ${new Date().toLocaleString('pt-BR')}

Por favor, envie um email de notificação para aprovação.
- Aprovador: f.miguel@samsung.com
- Copia (CC): f.jarlenj@samsung.com
- Assunto: Aprovação de Hanaro Scrap - Modelo ${scrapData.modelo_nome || 'N/A'}
- Tom: Formal e profissional
- Incluir todos os dados acima no corpo do email`;

  const url = `${BASE_URL}/api/v1/run/${FLOW_ID}?stream=false`;

  // Fire-and-forget: não espera resposta, timeout de 10s para fila do Agent
  axios.post(url, {
    input_type: "chat",
    output_type: "text",
    input_value: prompt
  }, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    timeout: 10000
  }).catch(() => {}); // Silencioso - erros não afetam o registro
};

// Rota para verificar CN duplicada
// Agora suporta múltiplas CNs separadas por ';' no banco de dados
// A busca usa LIKE para encontrar a CN dentro de uma string com múltiplas CNs
app.get("/api/hanaro-scrap/verificar-cn/:cn", (req, res) => {
  const { cn } = req.params;

  if (!cn || cn.length !== 13) {
    return res.status(400).json({ 
      success: false, 
      message: "CN inválida. Deve conter 13 caracteres." 
    });
  }

  // Buscar usando LIKE para encontrar a CN em qualquer posição da string
  // Pode estar sozinha (cn) ou no início (cn;...), meio (...;cn;...) ou fim (...;cn)
  const query = "SELECT id, cn FROM hanaro_scrap WHERE cn = ? OR cn LIKE ? OR cn LIKE ? OR cn LIKE ?";
  const params = [
    cn,                    // CN sozinha: "ABC1234567890"
    `${cn};%`,            // CN no início: "ABC1234567890;XYZ..."
    `%;${cn};%`,          // CN no meio: "...;ABC1234567890;XYZ..."
    `%;${cn}`             // CN no fim: "...;ABC1234567890"
  ];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Erro ao verificar CN duplicada:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao verificar CN duplicada" 
      });
    }

    const duplicada = results && results.length > 0;
    
    res.json({ 
      success: true, 
      duplicada: duplicada,
      message: duplicada ? "CN já registrada" : "CN disponível"
    });
  });
});

// Rota para salvar registro de scrap
app.post("/api/hanaro-scrap", async (req, res) => {
  const {
    matricula,
    nome_operador,
    tipo_scrap,
    tipo_placa,
    modelo_id,
    modelo_nome,
    halb,
    qty,
    custo_unitario,
    custo_total,
    linha_id,
    linha_nome,
    turno,
    planta_id,
    planta_nome,
    origem_id,
    origem_nome,
    equipamento_id,
    equipamento_nome,
    causa_id,
    causa_nome,
    causa_raiz,
    acao_corretiva,
    contramedida,
    cn
  } = req.body;

  // Validação de campos obrigatórios
  if (!matricula || !tipo_scrap || !tipo_placa || !modelo_id || !linha_id || !turno) {
    return res.status(400).json({ 
      success: false, 
      message: "Campos obrigatórios não preenchidos: matricula, tipo_scrap, tipo_placa, modelo_id, linha_id, turno" 
    });
  }

  // Processar CN: pode vir como string única, array de strings, ou string separada por ';'
  let cnFinal = null;
  if (cn) {
    if (Array.isArray(cn)) {
      // Se for array, juntar com ';'
      cnFinal = cn.filter(c => c && c.trim()).join(';') || null;
    } else if (typeof cn === 'string') {
      // Se for string, usar diretamente (já pode conter ';' se vier do frontend)
      cnFinal = cn.trim() || null;
    }
  }

  const query = "INSERT INTO hanaro_scrap SET ?";

  const values = {
    matricula: matricula,
    nome_operador: nome_operador,
    tipo_scrap: tipo_scrap,
    tipo_placa: tipo_placa,
    modelo_id: modelo_id,
    modelo_nome: modelo_nome,
    halb: halb,
    qty: qty || 1,
    custo_unitario: custo_unitario || 0,
    custo_total: custo_total || 0,
    linha_id: linha_id,
    linha_nome: linha_nome,
    turno: turno,
    planta_id: planta_id,
    planta_nome: planta_nome,
    origem_id: origem_id,
    origem_nome: origem_nome,
    equipamento_id: equipamento_id,
    equipamento_nome: equipamento_nome,
    causa_id: causa_id,
    causa_nome: causa_nome,
    causa_raiz: causa_raiz,
    acao_corretiva: acao_corretiva,
    contramedida: contramedida,
    cn: cnFinal,
    status: 'Pendente'
  };

  try {
    const result = await new Promise((resolve, reject) => {
      db.query(query, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    // Enviar email de notificação após salvar o registro
    const scrapData = {
      id: result.insertId,
      modelo_nome,
      linha_nome,
      turno,
      tipo_scrap,
      qty,
      custo_unitario,
      custo_total,
      nome_operador,
      matricula
    };

    // Envia email em background (fire-and-forget, silencioso)
    enviarEmailNotificacaoScrap(scrapData);

    res.status(201).json({ 
      success: true, 
      message: "Registro de scrap salvo com sucesso!", 
      id: result.insertId 
    });
  } catch (err) {
    console.error("Erro ao salvar registro de scrap: ", err);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao salvar registro de scrap", 
      error: err.message 
    });
  }
});

// Rota para buscar histórico de registros de scrap
app.get("/api/hanaro-scrap", (req, res) => {
  const { 
    dataInicio, 
    dataFim, 
    linha, 
    turno, 
    status,
    modelo,
    limit = 100,
    offset = 0
  } = req.query;

  let query = "SELECT * FROM hanaro_scrap WHERE 1=1";
  const params = [];

  if (dataInicio && dataFim) {
    query += " AND DATE(data_hora) BETWEEN ? AND ?";
    params.push(dataInicio, dataFim);
  }

  if (linha) {
    query += " AND linha_id = ?";
    params.push(linha);
  }

  if (turno) {
    query += " AND turno = ?";
    params.push(turno);
  }

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  if (modelo) {
    query += " AND modelo_id LIKE ?";
    params.push(`%${modelo}%`);
  }

  query += " ORDER BY data_hora DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Erro ao buscar registros de scrap: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar registros de scrap", 
        error: err.message 
      });
    }

    // Contar total de registros para paginação
    let countQuery = "SELECT COUNT(*) as total FROM hanaro_scrap WHERE 1=1";
    const countParams = [];

    if (dataInicio && dataFim) {
      countQuery += " AND DATE(data_hora) BETWEEN ? AND ?";
      countParams.push(dataInicio, dataFim);
    }

    if (linha) {
      countQuery += " AND linha_id = ?";
      countParams.push(linha);
    }

    if (turno) {
      countQuery += " AND turno = ?";
      countParams.push(turno);
    }

    if (status) {
      countQuery += " AND status = ?";
      countParams.push(status);
    }

    if (modelo) {
      countQuery += " AND modelo_id LIKE ?";
      countParams.push(`%${modelo}%`);
    }

    db.query(countQuery, countParams, (countErr, countResult) => {
      if (countErr) {
        console.error("Erro ao contar registros: ", countErr);
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao contar registros", 
          error: countErr.message 
        });
      }

      res.status(200).json({
        success: true,
        data: results,
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    });
  });
});

// Rota para buscar um registro específico por ID
app.get("/api/hanaro-scrap/:id", (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM hanaro_scrap WHERE id = ?";

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar registro de scrap: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar registro de scrap", 
        error: err.message 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Registro não encontrado" 
      });
    }

    res.status(200).json({
      success: true,
      data: results[0]
    });
  });
});

// Rota para atualizar status do registro (aprovar/rejeitar)
app.put("/api/hanaro-scrap/:id/status", (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    aprovado_por, 
    nome_aprovador, 
    observacao 
  } = req.body;

  // Validar status
  if (!['Aprovado', 'Rejeitado', 'Pendente'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: "Status inválido. Use: Aprovado, Rejeitado ou Pendente" 
    });
  }

  // Buscar status anterior
  const getStatusQuery = "SELECT status FROM hanaro_scrap WHERE id = ?";
  
  db.query(getStatusQuery, [id], (getStatusErr, getStatusResult) => {
    if (getStatusErr) {
      console.error("Erro ao buscar status anterior: ", getStatusErr);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar status anterior", 
        error: getStatusErr.message 
      });
    }

    if (getStatusResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Registro não encontrado" 
      });
    }

    const statusAnterior = getStatusResult[0].status;

    // Atualizar status
    const updateQuery = `
      UPDATE hanaro_scrap 
      SET status = ?, 
          data_aprovacao = CURRENT_TIMESTAMP, 
          aprovado_por = ?, 
          nome_aprovador = ?
      WHERE id = ?
    `;

    db.query(updateQuery, [status, aprovado_por, nome_aprovador, id], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Erro ao atualizar status: ", updateErr);
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao atualizar status", 
          error: updateErr.message 
        });
      }

      // Inserir no histórico
      const historicoQuery = `
        INSERT INTO hanaro_scrap_historico 
        (scrap_id, status_anterior, status_novo, alterado_por, nome_alterador, observacao)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(historicoQuery, [id, statusAnterior, status, aprovado_por, nome_aprovador, observacao], (histErr) => {
        if (histErr) {
          console.error("Erro ao salvar histórico: ", histErr);
          // Não retorna erro, pois o status já foi atualizado
        }

        res.status(200).json({
          success: true,
          message: `Status atualizado para ${status} com sucesso!`,
          status_anterior: statusAnterior,
          status_novo: status
        });
      });
    });
  });
});



// Rota para buscar registros pendentes de aprovação
app.get("/api/hanaro-scrap/aprovacao/pendentes", (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  const query = `
    SELECT * FROM hanaro_scrap 
    WHERE status = 'Pendente' 
    ORDER BY data_hora DESC 
    LIMIT ? OFFSET ?
  `;

  db.query(query, [parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error("Erro ao buscar registros pendentes: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar registros pendentes", 
        error: err.message 
      });
    }

    res.status(200).json({
      success: true,
      data: results
    });
  });
});

// ==========================================
// Hanaro - Valores Disponíveis para Filtros Correlacionados
// ==========================================
// Helper para construir condições WHERE dinâmicas
// Aplica TODOS os filtros recebidos (comportamento de segmentação de dados do Excel)
const buildFilterConditions = (req) => {
  const conditions = [];
  const params = [];
  const { dataInicio, dataFim, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap } = req.query;
  
  // Sempre filtra por status Aprovado e data
  conditions.push("status = 'Aprovado'");
  if (dataInicio && dataFim) {
    conditions.push("DATE(data_hora) BETWEEN ? AND ?");
    params.push(dataInicio, dataFim);
  } else {
    const hoje = new Date().toISOString().split('T')[0];
    conditions.push("DATE(data_hora) >= ?");
    params.push(hoje);
  }
  
  // Adiciona TODOS os filtros (incluindo o do próprio gráfico)
  // Isso faz com que cada gráfico mostre apenas os dados filtrados por TODOS os campos selecionados
  if (modelo) {
    conditions.push("modelo_nome = ?");
    params.push(modelo);
  }
  if (origem) {
    conditions.push("origem_nome = ?");
    params.push(origem);
  }
  if (equipamento) {
    conditions.push("equipamento_nome = ?");
    params.push(equipamento);
  }
  if (causa) {
    conditions.push("causa_nome = ?");
    params.push(causa);
  }
  if (linha) {
    conditions.push("linha_nome = ?");
    params.push(linha);
  }
  if (fase) {
    conditions.push("tipo_placa = ?");
    params.push(fase);
  }
  if (turno) {
    conditions.push("turno = ?");
    params.push(turno);
  }
  if (responsavel) {
    conditions.push("nome_operador = ?");
    params.push(responsavel);
  }
  if (tipo_scrap) {
    conditions.push("tipo_scrap = ?");
    params.push(tipo_scrap);
  }
  
  return { conditions, params };
};

// Equipamentos disponíveis
app.get("/api/hanaro-equipamentos-registrados", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT DISTINCT equipamento_nome as equipamento
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND equipamento_nome IS NOT NULL AND equipamento_nome != ''
    ORDER BY equipamento_nome ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar equipamentos registrados: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar equipamentos registrados",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ equipamento: item.equipamento }))
    });
  });
});

// Causas disponíveis
app.get("/api/hanaro-causas-registradas", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT DISTINCT causa_nome as causa
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND causa_nome IS NOT NULL AND causa_nome != ''
    ORDER BY causa_nome ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar causas registradas: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar causas registradas",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ causa: item.causa }))
    });
  });
});

// Linhas disponíveis
app.get("/api/hanaro-linhas-registradas", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT DISTINCT linha_nome as linha
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND linha_nome IS NOT NULL AND linha_nome != ''
    ORDER BY linha_nome ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar linhas registradas: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar linhas registradas",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ linha: item.linha }))
    });
  });
});

// Fases disponíveis (usa tipo_placa que é o campo correto na tabela)
app.get("/api/hanaro-fases-registradas", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT DISTINCT tipo_placa as fase
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND tipo_placa IS NOT NULL AND tipo_placa != ''
    ORDER BY tipo_placa ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar fases registradas: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar fases registradas",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ fase: item.fase }))
    });
  });
});

// Turnos disponíveis
app.get("/api/hanaro-turnos-registrados", (req, res) => {
  const { conditions, params } = buildFilterConditions(req, 'turno');
  
  let query = `
    SELECT DISTINCT turno
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND turno IS NOT NULL AND turno != ''
    ORDER BY turno ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar turnos registrados: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar turnos registrados",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ turno: item.turno }))
    });
  });
});

// Responsáveis disponíveis
app.get("/api/hanaro-responsaveis-registrados", (req, res) => {
  const { conditions, params } = buildFilterConditions(req, 'responsavel');
  
  let query = `
    SELECT DISTINCT nome_operador as responsavel
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND nome_operador IS NOT NULL AND nome_operador != ''
    ORDER BY nome_operador ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar responsáveis registrados: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar responsáveis registrados",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ responsavel: item.responsavel }))
    });
  });
});

// Tipos de Scrap disponíveis
app.get("/api/hanaro-tipo-scrap-registrados", (req, res) => {
  const { conditions, params } = buildFilterConditions(req, 'tipo_scrap');
  
  let query = `
    SELECT DISTINCT tipo_scrap
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND tipo_scrap IS NOT NULL AND tipo_scrap != ''
    ORDER BY tipo_scrap ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar tipos de scrap registrados: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar tipos de scrap registrados",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ tipo_scrap: item.tipo_scrap }))
    });
  });
});

// Rota para deletar registro de scrap
app.delete("/api/hanaro-scrap/:id", (req, res) => {
  const { id } = req.params;

  // Verificar se o registro existe
  const checkQuery = "SELECT id FROM hanaro_scrap WHERE id = ?";

  db.query(checkQuery, [id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error("Erro ao verificar registro: ", checkErr);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao verificar registro", 
        error: checkErr.message 
      });
    }

    if (checkResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Registro não encontrado" 
      });
    }

    // Deletar histórico primeiro
    const deleteHistoricoQuery = "DELETE FROM hanaro_scrap_historico WHERE scrap_id = ?";
    
    db.query(deleteHistoricoQuery, [id], (histErr) => {
      if (histErr) {
        console.error("Erro ao deletar histórico: ", histErr);
        // Continua mesmo com erro
      }

      // Deletar registro
      const deleteQuery = "DELETE FROM hanaro_scrap WHERE id = ?";
      
      db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
        if (deleteErr) {
          console.error("Erro ao deletar registro: ", deleteErr);
          return res.status(500).json({ 
            success: false, 
            message: "Erro ao deletar registro", 
            error: deleteErr.message 
          });
        }

        res.status(200).json({
          success: true,
          message: "Registro deletado com sucesso"
        });
      });
    });
  });
});


// ==========================================
// Hanaro Scrap - Aprovadores (Chefes/Gerentes)
// ==========================================
// Listar todos os aprovadores
app.get("/api/hanaro-aprovadores", (req, res) => {
  const query = `SELECT * FROM hanaro_aprovadores WHERE ativo = TRUE ORDER BY nome ASC`;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar aprovadores: ", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar aprovadores" });
    }
    res.status(200).json({ success: true, data: result });
  });
});

// Adicionar aprovador
app.post("/api/hanaro-aprovadores", (req, res) => {
  const { matricula, nome, cargo, departamento } = req.body;
  
  if (!matricula || !nome) {
    return res.status(400).json({ success: false, message: "Matrícula e nome são obrigatórios" });
  }
  
  // Verificar se a matrícula existe na tabela de pessoas
  const checkPessoaQuery = `SELECT funcionarios FROM mydb.pessoas WHERE matricula = ?`;
  
  db.query(checkPessoaQuery, [matricula], (err, pessoaResult) => {
    if (err) {
      console.error("Erro ao verificar pessoa: ", err);
      return res.status(500).json({ success: false, message: "Erro ao verificar matrícula" });
    }
    
    // Inserir ou atualizar aprovador
    const insertQuery = `
      INSERT INTO hanaro_aprovadores (matricula, nome, cargo, departamento, ativo)
      VALUES (?, ?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
      nome = VALUES(nome),
      cargo = VALUES(cargo),
      departamento = VALUES(departamento),
      ativo = TRUE,
      updated_at = CURRENT_TIMESTAMP
    `;
    
    const nomeFinal = pessoaResult.length > 0 ? pessoaResult[0].funcionarios : nome;
    
    db.query(insertQuery, [matricula, nomeFinal, cargo || null, departamento || null], (err, result) => {
      if (err) {
        console.error("Erro ao adicionar aprovador: ", err);
        return res.status(500).json({ success: false, message: "Erro ao adicionar aprovador" });
      }
      res.status(200).json({ 
        success: true, 
        message: "Aprovador adicionado com sucesso",
        data: { id: result.insertId, matricula, nome: nomeFinal }
      });
    });
  });
});

// Remover aprovador (desativar)
app.delete("/api/hanaro-aprovadores/:matricula", (req, res) => {
  const { matricula } = req.params;
  
  const query = `UPDATE hanaro_aprovadores SET ativo = FALSE WHERE matricula = ?`;
  
  db.query(query, [matricula], (err, result) => {
    if (err) {
      console.error("Erro ao remover aprovador: ", err);
      return res.status(500).json({ success: false, message: "Erro ao remover aprovador" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Aprovador não encontrado" });
    }
    
    res.status(200).json({ success: true, message: "Aprovador removido com sucesso" });
  });
});



// Verificar se uma matrícula pode aprovar (seguindo padrão de verifyMatricula)
app.get("/verificar-aprovador/:matricula", (req, res) => {
  const { matricula } = req.params;
  
  const query = `
    SELECT a.*, p.funcionarios as nome_completo 
    FROM hanaro_aprovadores a
    LEFT JOIN mydb.pessoas p ON a.matricula = p.matricula
    WHERE a.matricula = ? AND a.ativo = 1
  `;
  
  db.query(query, [matricula], (err, result) => {
    if (err) {
      console.error("Erro ao verificar aprovador: ", err);
      return res.status(500).json({ success: false, message: "Erro ao verificar aprovador" });
    }
    
    if (result.length === 0) {
      return res.json({ 
        success: true, 
        podeAprovar: false, 
        message: "Esta matrícula não tem permissão para aprovar registros" 
      });
    }
    
    res.json({ 
      success: true, 
      podeAprovar: true, 
      aprovador: result[0],
      message: "Matrícula autorizada para aprovação" 
    });
  });
});


// ==========================================
// Dashboard Hanaro - Rota com Filtros (Total do Período)
// ==========================================
// Apenas registros APROVADOS (igual ao histórico)
app.get("/api/hanaro-dashboard-hoje", (req, res) => {
  const { dataInicio, dataFim, modelo, origem } = req.query;
  
  let query = `
    SELECT 
      SUM(custo_total) as total_valor,
      SUM(qty) as total_qtd,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado'
  `;
  
  const params = [];
  const conditions = [];
  
  // Filtro de data
  if (dataInicio && dataFim) {
    conditions.push("DATE(data_hora) BETWEEN ? AND ?");
    params.push(dataInicio, dataFim);
  } else {
    // Padrão: data de hoje
    const hoje = new Date().toISOString().split('T')[0];
    conditions.push("DATE(data_hora) >= ?");
    params.push(hoje);
  }
  
  // Filtro de modelo
  if (modelo) {
    conditions.push("modelo_nome = ?");
    params.push(modelo);
  }
  
  // Filtro de origem
  if (origem) {
    conditions.push("origem_nome = ?");
    params.push(origem);
  }
  
  if (conditions.length > 0) {
    query += " AND " + conditions.join(" AND ");
  }
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard",
        error: err.message 
      });
    }
    
    const data = result[0] || { total_valor: 0, total_qtd: 0, total_registros: 0 };
    const dataConsulta = dataInicio || new Date().toISOString().split('T')[0];
    
    res.json({ 
      success: true, 
      data: {
        totalValor: parseFloat(data.total_valor) || 0,
        totalQtd: parseInt(data.total_qtd) || 0,
        totalRegistros: parseInt(data.total_registros) || 0,
        data: dataConsulta
      }
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Modelo (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por modelo
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
app.get("/api/hanaro-dashboard-por-modelo", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      modelo_nome as modelo,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND modelo_nome IS NOT NULL AND modelo_nome != ''
      AND ${conditions.join(' AND ')}
    GROUP BY modelo_nome ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por modelo: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por modelo",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        modelo: item.modelo || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Origem (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por origem
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
app.get("/api/hanaro-dashboard-por-origem", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      origem_nome as origem,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND origem_nome IS NOT NULL AND origem_nome != ''
      AND ${conditions.join(' AND ')}
    GROUP BY origem_nome ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por origem: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por origem",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        origem: item.origem || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Hanaro Scrap - Modelos Únicos (para filtro)
// ==========================================
// Retorna apenas modelos que já têm registros APROVADOS
app.get("/api/hanaro-modelos-registrados", (req, res) => {
  const { dataInicio, dataFim, origem } = req.query;
  
  let query = `
    SELECT DISTINCT modelo_nome as modelo, modelo_id
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND modelo_nome IS NOT NULL AND modelo_nome != ''
  `;
  
  const params = [];
  const conditions = [];
  
  // Filtro de data
  if (dataInicio && dataFim) {
    conditions.push("DATE(data_hora) BETWEEN ? AND ?");
    params.push(dataInicio, dataFim);
  }
  
  // Filtro de origem
  if (origem) {
    conditions.push("origem_nome = ?");
    params.push(origem);
  }
  
  if (conditions.length > 0) {
    query += " AND " + conditions.join(" AND ");
  }
  
  query += " ORDER BY modelo_nome ASC";
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar modelos registrados: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar modelos registrados",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        modelo: item.modelo || 'N/A',
        modelo_id: item.modelo_id || ''
      }))
    });
  });
});

// ==========================================
// Hanaro Scrap - Origens Únicas (para filtro)
// ==========================================
// Retorna apenas origens que já têm registros APROVADOS
app.get("/api/hanaro-origens-registradas", (req, res) => {
  const { dataInicio, dataFim, modelo } = req.query;
  
  let query = `
    SELECT DISTINCT origem_nome as origem, origem_id
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND origem_nome IS NOT NULL AND origem_nome != ''
  `;
  
  const params = [];
  const conditions = [];
  
  // Filtro de data
  if (dataInicio && dataFim) {
    conditions.push("DATE(data_hora) BETWEEN ? AND ?");
    params.push(dataInicio, dataFim);
  }
  
  // Filtro de modelo
  if (modelo) {
    conditions.push("modelo_nome = ?");
    params.push(modelo);
  }
  
  if (conditions.length > 0) {
    query += " AND " + conditions.join(" AND ");
  }
  
  query += " ORDER BY origem_nome ASC";
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar origens registradas: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar origens registradas",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        origem: item.origem || 'N/A',
        origem_id: item.origem_id || ''
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Equipamento (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por equipamento
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
app.get("/api/hanaro-dashboard-por-equipamento", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      equipamento_nome as equipamento,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND equipamento_nome IS NOT NULL AND equipamento_nome != ''
      AND ${conditions.join(' AND ')}
    GROUP BY equipamento_nome ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por equipamento: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por equipamento",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        equipamento: item.equipamento || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Causa (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por causa
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
app.get("/api/hanaro-dashboard-por-causa", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      causa_nome as causa,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND causa_nome IS NOT NULL AND causa_nome != ''
      AND ${conditions.join(' AND ')}
    GROUP BY causa_nome ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por causa: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por causa",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        causa: item.causa || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Linha (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por linha
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
app.get("/api/hanaro-dashboard-por-linha", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      linha_nome as linha,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND linha_nome IS NOT NULL AND linha_nome != ''
      AND ${conditions.join(' AND ')}
    GROUP BY linha_nome ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por linha: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por linha",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        linha: item.linha || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Fase/Tipo Placa (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por tipo_placa
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
app.get("/api/hanaro-dashboard-por-fase", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      tipo_placa as fase,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND tipo_placa IS NOT NULL AND tipo_placa != ''
      AND ${conditions.join(' AND ')}
    GROUP BY tipo_placa ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por fase: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por fase",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        fase: item.fase || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Turno (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por turno
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
app.get("/api/hanaro-dashboard-por-turno", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      turno,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND turno IS NOT NULL AND turno != ''
      AND ${conditions.join(' AND ')}
    GROUP BY turno ORDER BY CASE turno WHEN '1T' THEN 1 WHEN '2T' THEN 2 WHEN '3T' THEN 3 ELSE 4 END
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por turno: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por turno",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        turno: item.turno || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Responsável (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por responsavel (matricula/nome)
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
app.get("/api/hanaro-dashboard-por-responsavel", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      matricula,
      nome_operador as responsavel,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND matricula IS NOT NULL AND matricula != ''
      AND ${conditions.join(' AND ')}
    GROUP BY matricula, nome_operador ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por responsavel: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por responsavel",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        responsavel: item.responsavel || item.matricula || 'N/A',
        matricula: item.matricula || '',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Tipo de Scrap (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por tipo_scrap
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
app.get("/api/hanaro-dashboard-por-tipo-scrap", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      tipo_scrap,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND tipo_scrap IS NOT NULL AND tipo_scrap != ''
      AND ${conditions.join(' AND ')}
    GROUP BY tipo_scrap ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por tipo scrap: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por tipo scrap",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        tipo_scrap: item.tipo_scrap || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Evolução por PERÍODO (Custo + Qty)
// ==========================================
// Gráfico estilo STOCKS: Area (custo) + Bar (quantidade)
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
app.get("/api/hanaro-dashboard-por-periodo", (req, res) => {
  const { dataInicio, dataFim, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap } = req.query;
  
  const conditions = ["status = 'Aprovado'"];
  const params = [];
  
  // Filtro de data - usar dataInicio/dataFim se fornecidos, senão usar hoje
  if (dataInicio && dataFim) {
    conditions.push("DATE(data_hora) BETWEEN ? AND ?");
    params.push(dataInicio, dataFim);
  } else {
    const hoje = new Date().toISOString().split('T')[0];
    conditions.push("DATE(data_hora) >= ?");
    params.push(hoje);
  }
  
  // Adicionar outros filtros se fornecidos
  if (modelo) { conditions.push("modelo_nome = ?"); params.push(modelo); }
  if (origem) { conditions.push("origem_nome = ?"); params.push(origem); }
  if (equipamento) { conditions.push("equipamento_nome = ?"); params.push(equipamento); }
  if (causa) { conditions.push("causa_nome = ?"); params.push(causa); }
  if (linha) { conditions.push("linha_nome = ?"); params.push(linha); }
  if (fase) { conditions.push("tipo_placa = ?"); params.push(fase); }
  if (turno) { conditions.push("turno = ?"); params.push(turno); }
  if (responsavel) { conditions.push("nome_operador = ?"); params.push(responsavel); }
  if (tipo_scrap) { conditions.push("tipo_scrap = ?"); params.push(tipo_scrap); }
  
  let query = `
    SELECT 
      DATE(data_hora) as data,
      SUM(custo_total) as total_valor,
      SUM(qty) as total_qtd,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')}
    GROUP BY DATE(data_hora)
    ORDER BY data ASC
  `;
  
  // console.log("Query período:", query);
  // console.log("Params período:", params);
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por período: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por período",
        error: err.message 
      });
    }
    
    // console.log("Resultado período:", result);
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        data: item.data ? new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/A',
        periodo: item.data ? new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// Função auxiliar para agrupar dados (MOVIDA PARA ANTES DO ENDPOINT)
function agruparPorCampo(dados, campo) {
  return dados.reduce((acc, item) => {
    const key = item[campo] || 'Não informado';
    if (!acc[key]) {
      acc[key] = { quantidade: 0, valor: 0, registros: 0 };
    }
    // Tratamento seguro para valores numéricos
    const qty = parseFloat(item.qty) || 0;
    const custo = parseFloat(item.custo_total) || 0;
    acc[key].quantidade += qty;
    acc[key].valor += custo;
    acc[key].registros += 1;
    return acc;
  }, {});
}

// Endpoint para IA - Buscar dados completos para análise (COM DADOS TEMPORAIS)
app.get("/api/hanaro_scrap_dados_ia", (req, res) => {
  const { limite } = req.query;
  const limiteQtd = limite ? parseInt(limite) : 1000; // Default 1000 registros
  
  console.log('[API Hanaro IA] Buscando dados, limite:', limiteQtd);
  
  // Buscar últimos registros com todos os detalhes
  const query = `
    SELECT 
      h.id,
      h.data_hora,
      h.turno,
      h.linha_nome as linha,
      h.modelo_nome as modelo,
      h.tipo_placa as placa,
      h.halb,
      h.qty,
      h.custo_unitario,
      h.custo_total,
      h.origem_nome as origem,
      h.equipamento_nome as equipamento,
      h.causa_nome as causa,
      h.causa_raiz,
      h.acao_corretiva,
      h.contramedida,
      h.matricula,
      h.nome_operador as operador,
      h.status,
      h.cn,
      h.tipo_scrap
    FROM hanaro_scrap h
    ORDER BY h.data_hora DESC
    LIMIT ?
  `;
  
  db.query(query, [limiteQtd], (err, result) => {
    if (err) {
      console.error('[API Hanaro IA] Erro SQL:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar dados',
        error: err.message 
      });
    }
    
    console.log('[API Hanaro IA] Registros encontrados:', result ? result.length : 0);
    
    if (!result || result.length === 0) {
      return res.json({ 
        success: true, 
        registros: [],
        estatisticas: {
          totalRegistros: 0,
          totalValor: 0,
          totalQtd: 0,
          periodoInicio: null,
          periodoFim: null,
          modelosUnicos: [],
          causasUnicas: [],
          equipamentosUnicos: [],
          linhasUnicas: [],
          turnosUnicos: [],
          origensUnicas: [],
          porModelo: {},
          porCausa: {},
          porEquipamento: {},
          porLinha: {},
          porTurno: {},
          porOrigem: {},
          porDia: {},
          porSemana: {},
          porMes: {},
          ultimos7Dias: [],
          amostraRegistros: []
        }
      });
    }
    
    try {
      // Calcular período coberto pelos dados
      const datas = result.map(r => new Date(r.data_hora)).filter(d => !isNaN(d.getTime()));
      const dataMaisAntiga = datas.length > 0 ? new Date(Math.min(...datas)) : null;
      const dataMaisRecente = datas.length > 0 ? new Date(Math.max(...datas)) : null;
      
      // Formatando datas para exibição
      const formatarData = (d) => {
        if (!d || isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      const formatarDataHora = (d) => {
        if (!d || isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      };
      
      // Agrupar por DIA
      const porDia = {};
      result.forEach(r => {
        const data = new Date(r.data_hora);
        if (isNaN(data.getTime())) return;
        const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (!porDia[dia]) {
          porDia[dia] = { quantidade: 0, valor: 0, registros: 0, data: dia };
        }
        porDia[dia].quantidade += parseInt(r.qty) || 0;
        porDia[dia].valor += parseFloat(r.custo_total) || 0;
        porDia[dia].registros += 1;
      });
      
      // Agrupar por SEMANA (ISO week)
      const getSemanaAno = (data) => {
        const d = new Date(data);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${weekNo}/${d.getFullYear()}`;
      };
      const porSemana = {};
      result.forEach(r => {
        const data = new Date(r.data_hora);
        if (isNaN(data.getTime())) return;
        const semana = getSemanaAno(data);
        if (!porSemana[semana]) {
          porSemana[semana] = { quantidade: 0, valor: 0, registros: 0, semana: semana };
        }
        porSemana[semana].quantidade += parseInt(r.qty) || 0;
        porSemana[semana].valor += parseFloat(r.custo_total) || 0;
        porSemana[semana].registros += 1;
      });
      
      // Agrupar por MÊS
      const porMes = {};
      result.forEach(r => {
        const data = new Date(r.data_hora);
        if (isNaN(data.getTime())) return;
        const mes = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        if (!porMes[mes]) {
          porMes[mes] = { quantidade: 0, valor: 0, registros: 0, mes: mes };
        }
        porMes[mes].quantidade += parseInt(r.qty) || 0;
        porMes[mes].valor += parseFloat(r.custo_total) || 0;
        porMes[mes].registros += 1;
      });
      
      // Últimos 7 dias (apenas registros com data)
      const hoje = new Date();
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(hoje.getDate() - 7);
      const ultimos7Dias = result
        .filter(r => {
          const data = new Date(r.data_hora);
          return !isNaN(data.getTime()) && data >= seteDiasAtras;
        })
        .map(r => ({
          id: r.id,
          data: formatarDataHora(new Date(r.data_hora)),
          modelo: r.modelo,
          causa: r.causa,
          linha: r.linha,
          turno: r.turno,
          quantidade: parseInt(r.qty) || 0,
          valor: parseFloat(r.custo_total) || 0
        }));
      
      // Amostra de registros recentes (para a IA citar exemplos)
      const amostraRegistros = result.slice(0, 10).map(r => ({
        id: r.id,
        data: formatarDataHora(new Date(r.data_hora)),
        modelo: r.modelo,
        placa: r.placa,
        causa: r.causa,
        equipamento: r.equipamento,
        linha: r.linha,
        turno: r.turno,
        quantidade: parseInt(r.qty) || 0,
        valor: parseFloat(r.custo_total) || 0,
        operador: r.operador
      }));
      
      // Estatísticas resumidas com tratamento seguro
      const estatisticas = {
        totalRegistros: result.length,
        totalValor: result.reduce((sum, r) => {
          const val = parseFloat(r.custo_total);
          return sum + (isNaN(val) ? 0 : val);
        }, 0),
        totalQtd: result.reduce((sum, r) => {
          const val = parseInt(r.qty);
          return sum + (isNaN(val) ? 0 : val);
        }, 0),
        
        // DADOS TEMPORAIS (NOVO!)
        periodoInicio: formatarData(dataMaisAntiga),
        periodoFim: formatarData(dataMaisRecente),
        periodoInicioRaw: dataMaisAntiga ? dataMaisAntiga.toISOString() : null,
        periodoFimRaw: dataMaisRecente ? dataMaisRecente.toISOString() : null,
        
        // Agrupamentos temporais
        porDia: porDia,
        porSemana: porSemana,
        porMes: porMes,
        ultimos7Dias: ultimos7Dias,
        amostraRegistros: amostraRegistros,
        
        // Listas únicas (existente)
        modelosUnicos: [...new Set(result.map(r => r.modelo || 'N/A').filter(v => v !== null))],
        causasUnicas: [...new Set(result.map(r => r.causa || 'N/A').filter(v => v !== null))],
        equipamentosUnicos: [...new Set(result.map(r => r.equipamento || 'N/A').filter(v => v !== null))],
        linhasUnicas: [...new Set(result.map(r => r.linha || 'N/A').filter(v => v !== null))],
        turnosUnicos: [...new Set(result.map(r => r.turno || 'N/A').filter(v => v !== null))],
        origensUnicas: [...new Set(result.map(r => r.origem || 'N/A').filter(v => v !== null))],
        
        // Agrupamentos por categoria (existente)
        porModelo: agruparPorCampo(result, 'modelo'),
        porCausa: agruparPorCampo(result, 'causa'),
        porEquipamento: agruparPorCampo(result, 'equipamento'),
        porLinha: agruparPorCampo(result, 'linha'),
        porTurno: agruparPorCampo(result, 'turno'),
        porOrigem: agruparPorCampo(result, 'origem')
      };
      
      console.log('[API Hanaro IA] Dados processados com sucesso, período:', estatisticas.periodoInicio, 'até', estatisticas.periodoFim);
      
      res.json({ 
        success: true, 
        registros: result,
        estatisticas 
      });
    } catch (procErr) {
      console.error('[API Hanaro IA] Erro ao processar dados:', procErr);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar dados',
        error: procErr.message 
      });
    }
  });
});




















// Rota para buscar estatísticas gerais
app.get("/reparo-ia/stats", (req, res) => {
  const stats = {
    totalEntrada: 0,
    totalProcess: 0,
    totalAnalise: 0,
    taxaSucesso: 0,
    topComponents: [],
    topDefects: []
  };

  // Contar total de entradas
  db.query("SELECT COUNT(*) as total FROM mydb.reparo_entrada", (err, result) => {
    if (!err && result.length > 0) {
      stats.totalEntrada = result[0].total;
    }

    // Contar total de processos
    db.query("SELECT COUNT(*) as total FROM mydb.reparo_process", (err2, result2) => {
      if (!err2 && result2.length > 0) {
        stats.totalProcess = result2[0].total;
      }

      // Buscar top componentes trocados
      db.query(
        `SELECT Troca_Comp as comp, COUNT(*) as n FROM mydb.reparo_process 
         WHERE Troca_Comp != '' AND Troca_Comp IS NOT NULL 
         GROUP BY Troca_Comp ORDER BY n DESC LIMIT 5`,
        (err3, result3) => {
          if (!err3) {
            stats.topComponents = result3 || [];
          }

          // Buscar top defeitos
          db.query(
            `SELECT Defeito as defeito, COUNT(*) as n FROM mydb.reparo_process 
             WHERE Defeito != '' AND Defeito IS NOT NULL 
             GROUP BY Defeito ORDER BY n DESC LIMIT 5`,
            (err4, result4) => {
              if (!err4) {
                stats.topDefects = result4 || [];
              }

              // Calcular taxa de sucesso (Conserto OK / Troca OK)
              db.query(
                `SELECT Status, COUNT(*) as n FROM mydb.reparo_process 
                 WHERE Status IN ('Conserto OK', 'Troca OK', 'OK') 
                 GROUP BY Status`,
                (err5, result5) => {
                  if (!err5 && result5.length > 0) {
                    const successCount = result5.reduce((sum, r) => sum + r.n, 0);
                    stats.taxaSucesso = stats.totalProcess > 0 
                      ? Math.round((successCount / stats.totalProcess) * 100) 
                      : 0;
                  }

                  res.json(stats);
                }
              );
            }
          );
        }
      );
    });
  });
});

// Rota para buscar casos históricos baseados na mensagem - COM JOIN ENTRE TABELAS
// Suporta filtro por data, técnico, modelo, sintoma, CN, e perguntas genéricas
app.post("/reparo-ia/chat", (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Mensagem não fornecida" });
  }

  // Extrair termos de busca da mensagem
  const searchTerms = [];
  let dateFilter = '';
  let dateParams = [];
  
  // Tentar extrair modelo (padrões comuns)
  const modelMatch = message.match(/(?:modelo|model)\s*[:\-]?\s*([A-Z0-9\-]+)/i);
  if (modelMatch) {
    searchTerms.push({ field: 'e.Modelo', value: modelMatch[1] });
  }
  
  // Tentar extrair sintoma
  const symptomMatch = message.match(/(?:sintoma|falha|defeito|problema)\s*[:\-]?\s*(.+)/i);
  if (symptomMatch) {
    searchTerms.push({ field: 'e.Sintoma', value: symptomMatch[1].trim() });
  }

  // Tentar extrair CN
  const cnMatch = message.match(/(?:cn|CN)\s*[:\-]?\s*([A-Z0-9\-]+)/i);
  if (cnMatch) {
    searchTerms.push({ field: 'e.CN_rep', value: cnMatch[1] });
  }
  
  // Tentar extrair técnico
  const techMatch = message.match(/(?:tecnico|técnico|técnicos)\s*[:\-]?\s*([A-Za-z\s]+)/i);
  if (techMatch) {
    searchTerms.push({ field: 'p.Tecnico', value: techMatch[1].trim() });
  }
  
  // Detectar filtro de período (ex: "desde abril", "durante o mês de maio", "em maio", "mês de maio")
  const monthNames = {
    'janeiro': '01', 'fevereiro': '02', 'marco': '03', 'março': '03',
    'abril': '04', 'maio': '05', 'junho': '06',
    'julho': '07', 'agosto': '08', 'setembro': '09',
    'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();
  const currentMonthStr = String(currentMonth).padStart(2, '0');
  
  // Regex melhorado para detectar QUALQUER menção de mês com filtro temporal
  const monthMatch = message.match(/(?:desde|a partir de|durante o|durante|no mês de|mes de| mês de|em|no|no ano de)\s+(janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i);
  
  // Detectar "este mês", "esse mês", "mês atual", "desde o início do mês", "desde o inicio do mês"
  const thisMonthMatch = message.match(/(?:este|esse|atual|presente)\s*(?:mês|mes)|desde o início do mês|desde o inicio do mês|desde o começo do mês|início deste mês|inicio deste mês/i);
  
  if (thisMonthMatch) {
    // Filtro automático para o mês atual (do dia 1 até hoje)
    const startDate = `${currentYear}-${currentMonthStr}-01`;
    const endDate = `${currentYear}-${currentMonthStr}-${String(currentDay).padStart(2, '0')}`;
    dateFilter = ` AND DATE(e.Data) BETWEEN '${startDate}' AND '${endDate}'`;
    dateParams = [];
    console.log('[Reparo IA] Filtro "mês atual" aplicado:', startDate, 'até', endDate, '(hoje é dia', currentDay + ')');
  } else if (monthMatch) {
    const monthNum = monthNames[monthMatch[1].toLowerCase()];
    const startDate = `${currentYear}-${monthNum}-01`;
    
    // Calcular último dia do mês
    const lastDay = new Date(currentYear, parseInt(monthNum), 0).getDate();
    const endDate = `${currentYear}-${monthNum}-${String(lastDay).padStart(2, '0')}`;
    
    // Filtro de data com início E fim do mês (BETWEEN)
    dateFilter = ` AND DATE(e.Data) BETWEEN '${startDate}' AND '${endDate}'`;
    dateParams = []; // Já incluído na string SQL
    console.log('[Reparo IA] Filtro de data aplicado:', startDate, 'até', endDate);
  }
  
  // Detectar perguntas sobre técnicos/retrabalho/processo - busca TODOS os dados
  const isTechQuery = /(?:tecnicos|técnicos|tecnico|técnico|retrabalho|re-trabalho|analise|análise|processo|diagnostico|diagnóstico)/i.test(message);

  // Detectar filtro de LINHA (ex: "linha 5", "SMD-5", "na linha 16", "linhas 5 e 6")
  const lineMatches = message.match(/(?:linha|linhas|smd)[\s\-:]*([0-9]+(?:\s*(?:e|ou)\s*[0-9]+)*)/gi);
  if (lineMatches) {
    lineMatches.forEach(match => {
      const lineNum = match.match(/[0-9]+/)[0];
      searchTerms.push({ field: 'e.Linha', value: `SMD-${lineNum}` });
      console.log('[Reparo IA] Filtro de linha detectado:', `SMD-${lineNum}`);
    });
  }

  // Detectar termos de sintomas/defeitos/componentes para busca em MÚLTIPLAS COLUNAS
  // Isso captura termos que podem estar em: Sintoma, Defeito, Detalhe, Detalhes, Causa, Troca_Comp, Location
  const symptomDefectTerms = [];
  const symptomPatterns = [
    /sintomas?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /defeitos?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /falhas?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /problemas?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /erros?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /componentes?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /partes?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /peças?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
  ];
  
  symptomPatterns.forEach(pattern => {
    const match = message.match(pattern);
    if (match && match[1]) {
      const term = match[1].trim();
      if (term.length >= 3) { // Apenas termos com 3+ letras
        symptomDefectTerms.push(term);
      }
    }
  });
  
  // Se não encontrou padrões específicos, tentar extrair palavras-chave após preposições
  if (symptomDefectTerms.length === 0) {
    // Extrair termos após "de", "do", "da", "com", "em", "na", "no"
    const keywordMatch = message.match(/(?:de|do|da|dos|das|com|em|na|no|sobre)\s+([A-Za-z0-9\-_]{3,})/i);
    if (keywordMatch && keywordMatch[1]) {
      const term = keywordMatch[1].trim();
      // Ignorar palavras comuns
      const ignoreWords = ['que', 'qual', 'quais', 'como', 'quando', 'onde', 'por', 'para', 'uma', 'um', 'todo', 'toda', 'todos', 'todas'];
      if (!ignoreWords.includes(term.toLowerCase())) {
        symptomDefectTerms.push(term);
      }
    }
  }

  // Construir query de busca com JOIN entre entrada e processo via CN
  let whereClause = [];
  let params = [];
  
  // Se encontrou termos de sintoma/defeito, buscar em MÚLTIPLAS COLUNAS
  if (symptomDefectTerms.length > 0) {
    symptomDefectTerms.forEach(term => {
      // Buscar em: Sintoma, Defeito, Detalhe, Detalhes, Causa, Troca_Comp, Location (entrada e processo)
      whereClause.push(`(
        e.Sintoma LIKE ? OR 
        e.Detalhe LIKE ? OR 
        e.Causa LIKE ? OR 
        e.Location LIKE ? OR
        p.Defeito LIKE ? OR 
        p.Detalhes LIKE ? OR 
        p.Troca_Comp LIKE ? OR 
        p.Location LIKE ?
      )`);
      // Adicionar o mesmo termo 8 vezes (uma para cada coluna)
      for (let i = 0; i < 8; i++) {
        params.push(`%${term}%`);
      }
    });
  }
  
  // Adicionar outros termos de busca específicos (modelo, CN, técnico, linha)
  searchTerms.forEach(term => {
    whereClause.push(`${term.field} LIKE ?`);
    params.push(`%${term.value}%`);
  });

  // Se não encontrou termos específicos OU é pergunta sobre técnicos, busca todos
  if (whereClause.length === 0 || isTechQuery) {
    whereClause = ['1=1'];
    params = [];
  }

  // Query COMPLETA com JOIN entre TODAS as tabelas: reparo_entrada, reparo_process e reparo_saida
  // Inclui TODAS as colunas disponíveis para análise completa pela IA
  // Sem limite - retorna todos os casos encontrados para análise completa
  const query = `
    SELECT 
      -- TODAS as colunas de reparo_entrada
      e.id as entrada_id,
      e.Data as data_entrada,
      DATE_FORMAT(e.Data, '%Y-%m-%d') as data_registro,
      TIME_FORMAT(e.Data, '%H:%i:%s') as hora_registro,
      e.Halb,
      e.Modelo,
      e.Linha,
      e.Turno as turno_entrada,
      e.Responsavel,
      e.Recebimento,
      e.Processo,
      e.Fase,
      e.Origem_SMD,
      e.Origem_Main,
      e.Causa,
      e.Sintoma,
      e.Detalhe,
      e.Location as location_entrada,
      e.CN_rep,
      e.Data_Feedback,
      
      -- TODAS as colunas de reparo_process
      p.id as processo_id,
      p.Data as data_processo,
      DATE_FORMAT(p.Data, '%Y-%m-%d') as data_processo_registro,
      TIME_FORMAT(p.Data, '%H:%i:%s') as hora_processo_registro,
      p.Tipo,
      p.Tecnico,
      p.Bancada,
      p.Troca_Comp,
      p.Detalhes as proc_detalhes,
      p.Defeito,
      p.Status,
      p.Location as location_processo,
      p.CN_processo,
      
      -- TODAS as colunas de reparo_saida (se existir)
      s.id as saida_id,
      s.Data_saida as data_saida,
      DATE_FORMAT(s.Data_saida, '%Y-%m-%d') as data_saida_registro,
      TIME_FORMAT(s.Data_saida, '%H:%i:%s') as hora_saida_registro,
      s.Saida,
      s.Linha_saida,
      s.Resp_saida,
      s.Receb_saida,
      s.CN_saida,
      s.Saida_Processo
    FROM mydb.reparo_entrada e
    LEFT JOIN mydb.reparo_process p ON e.CN_rep = p.CN_processo
    LEFT JOIN mydb.reparo_saida s ON p.CN_processo = s.CN_saida
    WHERE ${whereClause.join(' OR ')}${dateFilter}
    ORDER BY e.Data DESC
  `;

  const allParams = [...params, ...dateParams];
  console.log('[Reparo IA] Query:', query);
  console.log('[Reparo IA] Params:', allParams);

  db.query(query, allParams, (err, results) => {
    if (err) {
      console.error("Erro ao buscar casos:", err);
      return res.status(500).json({ error: "Erro ao buscar casos históricos" });
    }
    
    console.log('[Reparo IA] Resultados:', results.length);

    // Formatar casos para resposta - dados COMPLETOS das 3 tabelas (entrada, processo, saida)
    // Para perguntas sobre técnicos, incluir TODOS os casos com dados de processo
    const cases = results.map(r => ({
      modelo: r.Modelo,
      halb: r.Halb,
      linha: r.Linha,
      turno: r.Turno,
      sintoma: r.Sintoma,
      causa: r.Causa,
      detalhe: r.Detalhe,
      origem_smd: r.Origem_SMD,
      origem_main: r.Origem_Main,
      defeito: r.Defeito,
      componente: r.Troca_Comp,
      resultado: r.Status,
      tecnico: r.Tecnico,
      bancada: r.Bancada,
      detalhes_processo: r.ProcDetalhes,
      cn: r.CN_rep,
      // DATAS FORMATADAS PARA FILTRO TEMPORAL
      data_entrada: r.data_entrada,
      data_registro: r.data_registro,  // YYYY-MM-DD
      hora_registro: r.hora_registro,  // HH:MM:SS
      data_processo: r.data_processo,
      data_processo_registro: r.data_processo_registro,  // YYYY-MM-DD
      hora_processo: r.hora_processo_registro,  // HH:MM:SS
      data_saida: r.data_saida,
      data_saida_registro: r.data_saida_registro,  // YYYY-MM-DD
      hora_saida: r.hora_saida_registro,  // HH:MM:SS
      // Mes/Ano para filtro
      mes_ano: r.data_registro ? new Date(r.data_registro).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }) : null,
      mes_numero: r.data_registro ? new Date(r.data_registro).getMonth() + 1 : null,
      ano: r.data_registro ? new Date(r.data_registro).getFullYear() : null
    })).filter(c => 
      isTechQuery 
        ? (c.tecnico || c.defeito || c.componente || c.resultado)  // Para perguntas de técnico
        : (c.modelo || c.sintoma || c.defeito)  // Para outras perguntas
    );

    // Calcular estatísticas para o prompt
    const totalCases = cases.length;
    const goodCount = cases.filter(c => c.resultado && c.resultado.toLowerCase().includes('good')).length;
    const ngCount = cases.filter(c => c.resultado && c.resultado.toLowerCase().includes('ng')).length;
    const scrapCount = cases.filter(c => c.resultado && c.resultado.toLowerCase().includes('scrap')).length;
    const modelosUnicos = [...new Set(cases.map(c => c.modelo).filter(m => m))];
    const tecnicosUnicos = [...new Set(cases.map(c => c.tecnico).filter(t => t))];
    const mesesUnicos = [...new Set(cases.map(c => c.mes_ano).filter(m => m))];

    // Gerar prompt rico com TODOS os dados encontrados e CONTEXTO TEMPORAL
    const systemPrompt = `Você é um assistente especializado em análise de dados de reparo de placas industriais da Samsung.

=== CONTEXTO TEMPORAL DOS DADOS ===
- Período coberto: ${mesesUnicos.join(', ') || 'N/A'}
- Ano dos dados: ${cases[0]?.ano || new Date().getFullYear()}
- Filtro de data aplicado: ${dateFilter || 'Nenhum'}

=== ESTATÍSTICAS GERAIS ===
- Total de casos encontrados: ${totalCases}
- Casos com resultado GOOD: ${goodCount}
- Casos com resultado NG: ${ngCount}  
- Casos com resultado SCRAP: ${scrapCount}
- Taxa de sucesso: ${totalCases > 0 ? Math.round((goodCount / totalCases) * 100) : 0}%

=== DADOS DISPONÍVEIS ===
- Modelos únicos: ${modelosUnicos.join(', ') || 'N/A'}
- Técnicos: ${tecnicosUnicos.join(', ') || 'N/A'}
- CNs analisadas: ${[...new Set(cases.map(c => c.cn).filter(c => c))].slice(0, 10).join(', ')}

=== INSTRUÇÕES DE RESPOSTA ===
1. Responda SEMPRE em português brasileiro (pt-BR)
2. Para perguntas de QUANTIDADE/CONTAGEM, use os valores exatos das estatísticas acima
3. Para perguntas com FILTRO DE MÊS, considere apenas casos com mes_numero correspondente:
   - janeiro=1, fevereiro=2, março=3, abril=4, maio=5, junho=6
   - julho=7, agosto=8, setembro=9, outubro=10, novembro=11, dezembro=12
4. Analise TODOS os casos históricos encontrados (não apenas 10)
5. Identifique padrões em: modelo, sintoma, causa, componente trocado, defeito
6. Use **asteriscos** para destacar termos importantes
7. Forneça valores NUMÉRICOS EXATOS quando perguntado sobre quantidades
8. Se houver múltiplos modelos, mencione todos

=== EXEMPLOS DE RESPOSTAS PARA PERGUNTAS DE CONTAGEM ===
- "Quantas placas good em maio?" → "Foram **${goodCount} placas** com resultado Good no período"
- "Qual quantidade de técnicos?" → "Foram **${tecnicosUnicos.length} técnicos** diferentes"
- "Quantos casos no total?" → "Foram **${totalCases} casos** registrados"

=== CASOS ENCONTRADOS (amostra dos primeiros 30 com DATAS) ===
${JSON.stringify(cases.slice(0, 30).map(c => ({
  cn: c.cn,
  modelo: c.modelo,
  resultado: c.resultado,
  tecnico: c.tecnico,
  defeito: c.defeito,
  componente: c.componente,
  data_registro: c.data_registro,
  mes_ano: c.mes_ano,
  mes_numero: c.mes_numero
})), null, 2)}

=== PERGUNTA DO USUÁRIO ===
${message}`;

    // Chamar API Gauss com timeout de 30 segundos
    const payload = {
      input_type: 'chat',
      output_type: 'chat',
      input_value: systemPrompt
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    fetch('https://agent.sec.samsung.net/api/v1/run/ChatGauss-Hanaro?stream=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sk-L6d36cORFh5iMzCZjF5L42FkLixzEf7hZvhr62O8K3g'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    .then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Erro na API Gauss: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      let reply = '';
      
      if (result?.outputs?.[0]?.outputs?.[0]?.results?.message?.text) {
        reply = result.outputs[0].outputs[0].results.message.text;
      } else if (result?.outputs?.[0]?.outputs?.[0]) {
        const rawOutput = result.outputs[0].outputs[0];
        reply = rawOutput.text || rawOutput.content || 
                (rawOutput.results && (rawOutput.results.text || rawOutput.results.content)) ||
                (rawOutput.message && (rawOutput.message.text || rawOutput.message.content)) || '';
      }

      if (!reply || reply.trim() === '') {
        reply = gerarRespostaFallback(cases, totalCases, goodCount, ngCount, scrapCount, modelosUnicos, tecnicosUnicos);
      }

      // Calcular estatísticas
      const successCases = cases.filter(c => c.resultado && (c.resultado.includes('OK') || c.resultado.includes('Concluído'))).length;
      const taxaSucesso = totalCases > 0 ? Math.round((successCases / totalCases) * 100) : 0;

      res.json({
        reply,
        cases: cases.slice(0, 100), // Retorna até 100 casos
        stats: {
          total: totalCases,
          taxaSucesso
        }
      });
    })
    .catch(error => {
      console.error("Erro ao chamar Gauss API (usando fallback):", error.message);
      
      // Resposta fallback SEM IA - dados diretos do banco
      const successCases = cases.filter(c => c.resultado && (c.resultado.includes('OK') || c.resultado.includes('Concluído'))).length;
      const taxaSucesso = totalCases > 0 ? Math.round((successCases / totalCases) * 100) : 0;
      
      const fallbackReply = gerarRespostaFallback(cases, totalCases, goodCount, ngCount, scrapCount, modelosUnicos, tecnicosUnicos, message);

      res.json({
        reply: fallbackReply,
        cases: cases.slice(0, 100),
        stats: {
          total: totalCases,
          taxaSucesso
        }
      });
    });
  });
})


///----------------- Aplicação Anti Nasca ------------------
// Configuração do multer para upload de arquivos em memória (sem salvar em disco)

const upload = multer({ storage: multer.memoryStorage() });

class FTPByteHandler extends Transform {
  constructor(mode = 'BINARY') {
    super();
    this.mode = mode.toUpperCase();
  }

  _transform(chunk, encoding, callback) {
    if (this.mode === 'ASCII') {
      const content = chunk.toString().replace(/\n/g, '\r\n');
      this.push(Buffer.from(content));
    } else {
      this.push(chunk);
    }
    callback();
  }
}

app.post('/api/process', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
  }

  const mode = req.body.mode || 'BINARY';
  const originalName = req.file.originalname;
  const destPath = path.join(__dirname, 'downloads', `processed_${Date.now()}${path.extname(originalName)}`);

  const downloadDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  console.log(`Processando arquivo em modo: ${mode}`);
  console.log(`[Control] TYPE ${mode === 'BINARY' ? 'I' : 'A'}`);
  console.log(`[Control] STOR ${destPath}`);

  // Com memoryStorage, o arquivo está em req.file.buffer
  // Processar o buffer através do byteHandler para remover criptografia NASCA
  const writeStream = fs.createWriteStream(destPath);
  const byteHandler = new FTPByteHandler(mode);

  // Criar ReadStream do buffer e pipe através do byteHandler
  const { Readable } = require('stream');
  const readStream = Readable.from(req.file.buffer);

  readStream
    .pipe(byteHandler)
    .pipe(writeStream)
    .on('finish', () => {
      console.log(`[Data] Transferência concluída. Arquivo salvo em: ${destPath}`);
      console.log(`[Control] Transfer complete.`);

      res.json({
        success: true,
        filename: path.basename(destPath),
        message: 'Arquivo processado com sucesso'
      });
    })
    .on('error', (err) => {
      console.error(`[Error] Erro na transferência: ${err.message}`);
      res.status(500).json({ error: `Erro na transferência: ${err.message}` });
    });
});

app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'downloads', filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }

  res.download(filepath, (err) => {
    if (err) {
      console.error('Erro ao fazer download:', err);
    } else {
      // Deletar arquivo após download
      fs.unlink(filepath, (err) => {
        if (err) console.error('Erro ao deletar arquivo:', err);
      });
    }
  });
});
 