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
 //--------------------------------Manutenção    =     Spindle-------------------------------
 //------------------------------------------------------------------------------------------

 app.post('/spindle', (req, res)=>{
  const {
    id,
    data_manutencao,
    pecas_trocadas,
    codigo_spindle,
    periodicidade,
    tecnico,
    matricula,
    linha,
  
  } = req.body

  let mysql = "INSERT INTO mydb.spindle (id, data_manutencao, pecas_trocadas, codigo_spindle, periodicidade, tecnico, \
    matricula, linha) VALUES (?,?,?,?,?,?,?,?);"
   db.query(mysql, [id, data_manutencao, pecas_trocadas, codigo_spindle, periodicidade, tecnico,
    matricula, linha], (err) => {
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

app.get("/getspindle", (req, res) => {
 let mysql = "SELECT *, date_format(adddate(data_manutencao, INTERVAL 90 DAY), '%Y-%m-%d / %H-%mm-%ss') as periodicidade, \
 date_format(data_manutencao, '%Y-%m-%d / %H-%mm-%ss') as data_manutencao FROM mydb.spindle ORDER BY ID DESC;"
 db.query(mysql, (err, result) => {
   if (err) {
     console.log(err);
   } else {
     res.send(result);
   }
 });
});


// [Rotas de Repair migradas para backend/routes/Repair/ (reparoEntrada, reparoProcesso, reparoSaida, reparoAnalise) e backend/routes/Repair/Offline/offlineSaida.routes.js; getReparoDetalhado migrou para backend/routes/shared/reparoDetalhado.routes.js]

//----------------------Feeder-------------------------------
app.post('/Feeder', (req, res) => {
  const {
    id,    Turno,    Tecnico,    Codigo,    Tamanho,
    Ano,    Status,    Manutencao,    Peca
  } = req.body

  let mysql = `INSERT INTO mydb.feeder (id,
    Turno,  Tecnico,  Codigo,   Tamanho,   Ano,
    Status,   Manutencao,   Peca) VALUES (?,?,?,?,?,?,?,?,?);`

  db.query(mysql, [id,
    Turno,    Tecnico,    Codigo,    Tamanho,    Ano,
    Status,    Manutencao,    Peca],

     (err) => {
      if (err) {
        console.log('Erro na entrada de dados do Feeder:' + err);
        res.send({
          STATUS: false,
          msg: err
        })
      } else {
        console.log('Dados inseridos com sucesso no Feeder');
        res.send({
          STATUS: true,
          msg: "DADOS INSERIDOS COM SUCESSO"
        })
      }

    });

})

app.get("/getFeeder", (req, res) => {
  let mysql = `select *, date_format(Data, '%Y-%m-%d / %Hh:%mm') as Data from mydb.feeder order by id desc;`
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
//--                                         SCRAP                                           --

app.post("/Scrap", (req, res) => {
  const array = req.body;

  array.forEach(item => {

    let mysql = 'INSERT INTO mydb.scrap_entrada (id, Processo, CN, Fase, Halb, Modelo, Linha, Turno, \
    Origem, Motivo, Equipamento, Causa_raiz, Corretiva, Preventiva, Operador, MK, Lider, Sup_Manut, Sup_Qualidade, Sup_Prod, PQC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(mysql, [item.id, item.Processo, item.CN, item.Fase, item.Halb, item.Modelo, item.Linha, item.Turno, item.Origem, item.Motivo, item.Equipamento, item.Causa_raiz, 
      item.Corretiva, item.Preventiva, item.Operador, item.MK, item.Lider, item.Sup_Manut, item.Sup_Qualidade, item.Sup_Prod, item.PQC], (err, res) => {

      if (err) {
        console.log('Erro na entrada de dados de scrap/washboard: ' + err);
      } else {
        console.log('Dados inseridos com sucesso no scrap/washboard: ' + res);

      }
    });
  });
});


app.get("/getScrap", (req, res) => {
  let mysql = "SELECT *, SUBSTR(Data, 1, 10) as Data, SUBSTR(Data, 11, 19) as Hour FROM mydb.scrap_entrada order by id desc;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//----------------------------Scrap Recebimento--------------------------------------------------------

app.get("/getScrapRecebim", (req, res) => {
  let mysql = "select *, date_format(Data, '%y-%m-%d %Hh:%i') as Data from mydb.scrap_receb order by id desc;"
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.post('/ScrapReceb', async (req, res) => {
  try {
    let result = await verifyScrap(req.body.CN_receb);
    if (result.success) {
      let resultInserir1 = await inserirScrap(req.body)
      res.json(resultInserir1)
    }
  } catch (e) {
    res.json({
      success: false,
      msg: e.msg
    })
  }
})

const inserirScrap = (data) => {
  return new Promise((resolve, reject) => {

    const {
      id, Recebimento, Responsavel, CN_receb
    } = data

    let query = `INSERT INTO mydb.scrap_receb (id, Recebimento, Responsavel, CN_receb) VALUES (?,?,?,?);`;

    db.query(query, [id, Recebimento, Responsavel, CN_receb
    ], (err, result) => {
      if (!err) {
        resolve({
          success: true,
          msg: "SUCCESS REGISTER - CN REGISTRADA"
        })
      } else {
        reject({
          success: false,
          msg: "ERRO, CONTATE O ADMINISTRADOR - query"
        })
      }
    })
  })
}

const verifyScrap = (CN_SCRAP) => {
  return new Promise((resolve, reject) => {

    let query = `SELECT 
  COUNT(*) AS count
      FROM
  mydb.scrap_entrada
      WHERE
  CN = ?;`;

    db.query(query, [
      CN_SCRAP
    ], (err, result) => {
      if (!err) {
        if (result[0].count > 0) {
          resolve({
            success: true
          })
        } else {
          reject({
            success: false,
            msg: "FALHA DE INPUT -  CN NÃO CADASTRADA NO INPUT DE ENTRADA DE SCRAP"
          })
        }
      } else {
        reject({
          success: false,
          msg: "ERRO, CONTATE O ADMINISTRADOR - verify"
        })
      }
    })
  })
}

app.get("/getScrapReceb", (req, res) => {
  let mysql = `SELECT 
  *,
  Linha,
  Fase,
  Halb,
  Modelo,
  Fase,
  DATE_FORMAT(a.Data, '%y-%m-%d %Hh:%i') AS Data, b.Recebimento
FROM
  scrap_entrada a
      INNER JOIN
  scrap_receb b
ON
  a.CN = b.CN_receb and b.recebimento = 'scrap'
  where  b.cn_status is null order by a.id desc`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});


app.put("/updatescrap", (req, res)=>{
  const {cn , user1, user2} = req.body
  console.log (req.body)
  let sql = "UPDATE mydb.scrap_receb SET cn_status = 'PAGO', saida_wip = ?, entrada_prod = ? where CN_receb = ?"
  db.query(sql,[
      user1,
      user2,
      cn
  ], (err, result)=>{
    if(!err){
      res.send({"MSG" : "REPOSIÇÃO DA PCB CONCLUIDA"})
    }else{
      res.send({"MSG" : "ERRO"})
    }
  })
})


//----------------------------Placa Saida--------------------------------------------------------

app.post('/scrapSaida', async (req, res) => {
  console.log(req.body)
  try {
    let result = await verifyScrap2(req.body.CN_saida);
    if (result.success) {
      let resultadoInserir = await inserirScrap2(req.body)
      res.json(resultadoInserir)
    }
  } catch (e) {
    res.json({
      success: false,
      msg: e.msg
    })
  }
})

const inserirScrap2 = (data) => {
  return new Promise((resolve, reject) => {

    const {
      id,
    Saida,
    Linha,
    Responsavel,
    Recebedor,
    Processo,
    CN_saida,
    
    } = data

    let query = `INSERT INTO mydb.scrap_saida (
      id, Saida,
      Linha,
      Responsavel,
      Recebedor,
      Processo,
      CN_saida)
    VALUES (?,?,?,?,?,?,?)`;

    db.query(query, [
      id, Saida,
      Linha,
      Responsavel,
      Recebedor,
      Processo,
      CN_saida
    ], (err, result) => {
      if (!err) {
        resolve({
          success: true,
          msg: "REGISTER SUCCESS - CN REGISTRADA"
        })
      } else {
        reject({
          success: false,
          msg: "ERRO, CONTATE O ADMINISTRADOR - query"
        })
      }
    })
  })
}

const verifyScrap2 = (CN_saida) => {
  return new Promise((resolve, reject) => {

    let query = `SELECT 
    COUNT(*) AS count
        FROM
    mydb.scrap_receb
        WHERE
        CN_receb = ?;`;


        db.query(query, [
          CN_saida
        ], (err, result) => {
          if (!err) {
            if (result[0].count > 0) {
              resolve({
                success: true
              })
            } else {
              reject({
                success: false,
                msg: "FALHA DE INPUT -  CN NÃO CADASTRADA NO INPUT DE RECEBIMENTO DE SCRAP "
              })
            }
          } else {
            reject({
              success: false,
              msg: "ERRO, CONTATE O ADMINISTRADOR - verify"
            })
          }
        
    })
  })
}

app.get("/getScrapSaida", (req, res) => {
  let mysql = "select *, date_format(Data_saida, '%y-%m-%d %Hh:%i') as Data_saida from mydb.scrap_saida order by id desc;"
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});
//-------------------------------------------------
//-------------------GMES SLIP

app.post("/slip", (req, res) => {
  
  const array = req.body.dados;

  console.log(req.body.dados)
  
  array.forEach((item) => {
    db.query(
      "INSERT INTO mydb.slip (slip, cn, resultado) VALUES (?, ?, ?);",
      [
        item.slip,
        item.cn,
        item.resultado,

      ],
      (err, res) => {
        if (err) {
          console.log("Erro ao salvar dados na tela de entrada: " + err);
        } else {
          console.log("Dados inseridos: " + res);
        }
      }
    );
  });
})

app.get("/getSlip", (req, res) => {
  let mysql = `select *,  date_format(Data, '%Y-%m-%d / %H:%m') as Data from mydb.slip order by id desc limit 1000;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

////---------------------------------Comparacao Reel id -------------------------
app.post("/SplicingOffline", (req, res) => {
  const data = req.body;

  let mysql =
    `INSERT INTO mydb.compare_reel (Operador, Modelo, Linha, Reel_ID, 
    Barcode, Codigo, Qty, Status_barcode, Status_codigo, Qty_Splicing)
    VALUES ?`;

  const values = data.map(item => [
    item.operator,
    item.model,
    item.line,
    item.reelId,            // Alinhar com front-end
    item.barcode,
    item.codigo,            // Alinhar com front-end (anteriormente `codigoAtual`)
    item.qtySplicing,       // Alinhar com front-end (anteriormente `ultimos6`)
    item.barcodeStatus,
    item.codigoStatus,
    item.totalQtySplicing   // Alinhar com front-end (anteriormente `somaUltimosDigitos`)
  ]);

  db.query(mysql, [values], (err, result) => {
    if (err) {
      console.log(
        "Erro na entrada de dados do Splicing Offline: " + err + " ---- " + result
      );
      res.status(500).send("Erro ao salvar dados.");
    } else {
      console.log("Dados inseridos com sucesso no Splicing Offline " + result);
      res.status(200).send("Dados salvos com sucesso.");
    }
  });
});

app.get("/getSplicingOffline", (req, res) => {
  let mysql =
    `SELECT id, date_format(t1.Data, '%Y-%m-%d %H:%i:%s') as Data, t1.operador, t1.Modelo,
t1.Linha, t1.Reel_ID, t1.Codigo, t1.Qty, t1.Barcode, t1.Status_barcode, t1.Status_codigo, t1.Qty_Splicing
FROM compare_reel t1
INNER JOIN (
    SELECT MAX(id) AS max_id, DATE_FORMAT(Data, '%Y-%m-%d %H-%i-%s') AS Data
    FROM compare_reel 
    GROUP BY Data
) t2 ON t1.id = t2.max_id order by id desc;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/getModalOffSplicing", (req, res) => {
  const Barcode = req.query.Barcode;
  // Modify your SQL query to filter by CN
  let mysql = `SELECT date_format(t1.Data, '%Y-%m-%d %H:%i:%s') as Data,
t1.Operador, t1.Modelo, t1.Linha, t1.Reel_ID as 'Reel ID', t1.Codigo, t1.Qty,
t1.Barcode, t1.Status_barcode as 'Status Barcode', t1.Status_codigo as 'Status Codigo',
t1.Qty_Splicing as 'Qty Splicing'
FROM compare_reel t1 
JOIN compare_reel t2 ON date_format(t1.Data, '%Y-%m-%d %H:%i:%s') = date_format(t2.Data, '%Y-%m-%d %H:%i:%s') AND t1.id != t2.id
 WHERE t1.Barcode and t2.barcode = '${Barcode}' 
GROUP BY t1.id; `;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  }); //console.log(req.query.cnProcess)
});



// [Rotas migradas para backend/routes/Quality/]

 //---------------------------------------------------------------------
//--------------------------------
app.get("/Splicing", (req, res) => {
  const {data, turno} = req.query;
 
   let mysql = `SELECT Linha, replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') as data,
   sum(case when Turno = '1T' then QTY else 0 end) as '1T',
   sum(case when Turno = '2T' then QTY else 0 end) as '2T',
   sum(case when Turno = '3T' then QTY else 0 end) as '3T'
   FROM mydb.splicing_history
    WHERE replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') = ?`;
   
   // Adicionar filtro de turno se não for "Todos"
   if (turno && turno !== 'Todos') {
     mysql += ` AND Turno = ?`;
     mysql += ` group by linha;`;
     db.query(mysql, [data, turno], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   } else {
     mysql += ` group by linha;`;
     db.query(mysql, [data], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   }
 });

app.get("/SplicingOpss", (req, res) => {
  const {data, turno} = req.query;
 
   let mysql = `SELECT *, replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') as data
   FROM mydb.splicing_opss
    WHERE replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') = ?`;
   
   // Adicionar filtro de turno se não for "todos"
   if (turno && turno !== 'todos') {
     mysql += ` AND turno = ?`;
     mysql += ` order by turno, operator_name;`;
     db.query(mysql, [data, turno], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   } else {
     mysql += ` order by turno, operator_name;`;
     db.query(mysql, [data], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   }
 });
 
  app.get("/SplicingOpssMaior", (req, res) => {
   const {data} = req.query;
  
    let mysql = `SELECT OPERATOR_NAME, turno, linha, replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') as data, sum(qty) as qty
    FROM mydb.splicing_opss
     WHERE replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') = ? group by OPERATOR_NAME, turno order by qty desc;`;
    
    db.query(mysql, [data], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(result);
      }
    });
  });
 
 
  app.get("/SplicingComparison", (req, res) => {
   const {data} = req.query;
  
    let mysql = ` select DATE_FORMAT(WORK_YMD, '%Y-%m-%d %H:%i:%s') as data, turno, OPERATOR_NAME, Linha, Qty, COMPARISON_ID, PAC_PART_NO,
    case when 
    COMPARISON_ID = PAC_PART_NO then 'OK' else 'NG' end as Status
    from splicing_comparison WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ? order by linha, turno, operator_name;`;
    
    db.query(mysql, [data], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(result);
      }
    });
  });

  
  app.get("/SplicingDMF", (req, res) => {
    const {data} = req.query;
   
     let mysql = `SELECT * FROM (
      SELECT SUBSTR(WORK_YMD, 1,10) WORK_YMD, Linha LINE_NM,  Module MODULE, Turno SHIFT,
      date_format(Work_YMD, '%Y-%m-%d %H:%i:%s') TIME_ON , OPERATOR_NAME, PAC_PART_NO, COMPARISON_ID, '-' FAILURE_DESC FROM splicing_dmf1 UNION ALL
      SELECT SUBSTR(WORK_YMD, 1,10) WORK_YMD, LINE LINE_NM,  MODULE, Turno SHIFT, WORK_YMD TIME_ON, OPERATOR_NAME, PART_NO PAC_PART_NO, COMPARISON_ID, FAILURE_DESC FROM transaction_dmf) A 
      WHERE WORK_YMD = ? ORDER BY WORK_YMD, TIME_ON`;
     
     db.query(mysql, [data], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   });
  // http://105.103.39.102:80/SplicingDMF?data=${date}


  app.get("/SplicingDefect", (req, res) => {
    const {data} = req.query;
   
     let mysql = ` SELECT 
     DATE_FORMAT(a.WORK_YMD, '%H:%i:%s') AS Hora, 
     a.Turno,
     DATE_FORMAT(a.WORK_YMD, '%Y-%m-%d') AS data,
     a.OPERATOR_NAME, a.PART_NO, a.COMPARISON_ID,
     case when 
     a.LINE = 'SST' then 'Pre Setup' else LINE end as LINE,
     
     a.FAILURE_DESC,
 CASE
   WHEN a.PART_NO = a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan de rolo do mesmo código'
     when a.PART_NO != a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan em rolos diferentes'
     
     WHEN a.PART_NO != a.COMPARISON_ID and a.COMPARISON_ID = '-' and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Divergência de Scan'
     WHEN a.PART_NO != a.COMPARISON_ID and a.COMPARISON_ID = '-' and FAILURE_DESC = 'Unmatched Old New Part Scan' then 'Repetindo scan em rolo antigo'
   WHEN a.PART_NO != a.COMPARISON_ID and a.COMPARISON_ID = '-' and FAILURE_DESC = 'Unused Part Scan Error' then 'Lista divergente do rolo'
     
    -- when a.PART_NO = '-' and a.COMPARISON_ID = '-' and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Falha de scan'
    -- when a.PART_NO = '-' and a.COMPARISON_ID = '-' and FAILURE_DESC = 'Unmatched Old New Part Scan' then 'Falha de scan em rolo antigo'
 
     else 'Divergência'
     end as 'Status'
 FROM 
     mydb.transaction1 a 
 LEFT JOIN 
     splicing_comparison b 
 ON 
     a.WORK_YMD = b.WORK_YMD  and a.OPERATOR_NAME = b.OPERATOR_NAME
     where
  (a.PART_NO <> '-' AND a.COMPARISON_ID <> '-') and Line <> 'SST' and
     FAILURE_DESC <> 'Cancel Button on Scanner' and DATE_FORMAT(a.WORK_YMD, '%Y-%m-%d') = ?
     order by a.WORK_YMD desc`;
     
     db.query(mysql, [data], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   });

   app.get("/SplicingDefectQTY", (req, res) => {
    const {date} = req.query;
   
     let mysql =  `select  'Total', '',
     SUM(1T) AS 'primeiroT', SUM(2T) AS 'segundoT', SUM(3T) AS 'terceiroT',
     SUM(Scan_diferente) AS 'scanDif',
     SUM(Scan_igual) AS 'ScanIgual'
     from (SELECT 
     REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') AS data,
     CASE WHEN REPLACE(a.Line, '_', '') = 'SST' THEN 'Pre Setup'
     ELSE REPLACE(a.Line, '_', '')
     END AS LINE, 
     SUM(CASE WHEN Turno = '1T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '1T',
     SUM(CASE WHEN Turno = '2T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '2T',
     SUM(CASE WHEN Turno = '3T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '3T',
     
     -- WHEN a.PART_NO = a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan de rolo do mesmo código'
     -- when a.PART_NO != a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan em rolos diferentes'
     
     SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID != PART_NO THEN 1 ELSE 0 END) AS Scan_diferente,
     SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID = PART_NO THEN 1 ELSE 0 END) AS Scan_igual
  --   SUM(CASE WHEN FAILURE_DESC NOT IN ('Inapplicable Part Scan Error', 'Unmatched Old New Part Scan', 'Unused Part Scan Error','Cancel Button on Scanner') THEN 1 ELSE 0 END) AS 'Divergência'
  FROM mydb.transaction1 a 
  WHERE 
     REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') = ?
     AND COMPARISON_ID <> '-' AND FAILURE_DESC <> 'Cancel Button on Scanner' 
  GROUP BY LINE
  
  UNION ALL
  
  SELECT 
    'Total', '',
     SUM(1T) AS '1T', SUM(2T) AS '2T', SUM(3T) AS '3T',
     SUM(Scan_diferente) AS 'Scan em rolos diferentes',
     SUM(Scan_igual) AS 'Scan de rolo do mesmo código'
  FROM (
     SELECT 
         REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') AS data,
         CASE WHEN REPLACE(a.Line, '_', '') = 'SST' THEN 'Pre Setup'
         ELSE REPLACE(a.Line, '_', '')
         END AS LINE, 
         SUM(CASE WHEN Turno = '1T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '1T',
         SUM(CASE WHEN Turno = '2T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '2T',
         SUM(CASE WHEN Turno = '3T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '3T',
         
         -- WHEN a.PART_NO = a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan de rolo do mesmo código'
         -- when a.PART_NO != a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan em rolos diferentes'
         
         SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID != PART_NO THEN 1 ELSE 0 END) AS Scan_diferente,
         SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID = PART_NO THEN 1 ELSE 0 END) AS Scan_igual
     --   SUM(CASE WHEN FAILURE_DESC NOT IN ('Inaplicable Part Scan Error', 'Unmatched Old New Part Scan', 'Unused Part Scan Error','Cancel Button on Scanner') THEN 1 ELSE 0 END) AS 'Divergência'
     FROM mydb.transaction1 a 
     WHERE 
         REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') = curdate()
         AND COMPARISON_ID <> '-' AND FAILURE_DESC <> 'Cancel Button on Scanner' 
     GROUP BY LINE
  ) a
  ) a`
     
     db.query(mysql, [date], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   });
  
   app.get("/SplicingDefectLineQTY", (req, res) => {
    const {date} = req.query;
   
     let mysql =  `select  * from (SELECT 
      REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') AS data,
      CASE WHEN REPLACE(a.Line, '_', '') = 'SST' THEN 'Pre Setup'
      ELSE REPLACE(a.Line, '_', '')
      END AS LINE, 
      SUM(CASE WHEN Turno = '1T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS 'primT',
      SUM(CASE WHEN Turno = '2T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS 'secT',
      SUM(CASE WHEN Turno = '3T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS 'tercT',
      
      -- WHEN a.PART_NO = a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan de rolo do mesmo código'
      -- when a.PART_NO != a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan em rolos diferentes'
      
      SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID != PART_NO THEN 1 ELSE 0 END) AS Scan_diferente,
      SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID = PART_NO THEN 1 ELSE 0 END) AS Scan_igual
  --   SUM(CASE WHEN FAILURE_DESC NOT IN ('Inapplicable Part Scan Error', 'Unmatched Old New Part Scan', 'Unused Part Scan Error','Cancel Button on Scanner') THEN 1 ELSE 0 END) AS 'Divergência'
  FROM mydb.transaction1 a 
  WHERE 
      REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') = curdate()
      AND COMPARISON_ID <> '-' AND FAILURE_DESC <> 'Cancel Button on Scanner' 
  GROUP BY LINE order by line) a;`
     
     db.query(mysql, [date], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   });

   //-----------------
//-Erro de Splicing - Não foi feito splicing

app.get("/SplicingNoCheck", (req, res) => {
  const {data} = req.query;
 
   let mysql = `SELECT 
    DATE_FORMAT(WORK_DT, '%d-%m-%Y %H:%i:%s') as 'Data', 
    Equip as 'Equipamento', LINE_NM as 'Linha', 
    Side as 'Lado', ERR_DESC as 'Erro',
    Feeder,
    CASE 
        WHEN TIME(WORK_DT) BETWEEN '06:55:00' AND '16:42:59' THEN '1T'
        WHEN TIME(WORK_DT) BETWEEN '14:55:00' AND '22:54:59' THEN '2T'
        ELSE '3T' END as 'Turno'
FROM mydb.mounter_eff WHERE 
    ERR_DESC = 'No Splicing Check'
    AND WORK_YMD = ?
ORDER BY WORK_DT desc;`;
   
   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });

 app.get("/SplicingNoCheckGraf", (req, res) => {
  const {date} = req.query;
 
   let mysql = `SELECT DATE_FORMAT(WORK_YMD, '%d-%m-%Y') AS data, LINE_NM, SUM(CASE WHEN ERR_DESC = 'No Splicing Check' THEN 1 ELSE 0 END) AS ErrorCount
FROM mounter_eff WHERE WORK_YMD = ?
GROUP BY LINE_NM HAVING ErrorCount > 0
ORDER BY ErrorCount DESC limit 10;`;
   
   db.query(mysql, [date], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });

 app.get("/SplicingNoCheckGrafII", (req, res) => {
  const {date} = req.query;
 
   let mysql = `SELECT DATE_FORMAT(WORK_YMD, '%d-%m-%Y') AS data,LINE_NM, equip, feeder, SUM(CASE WHEN ERR_DESC = 'No Splicing Check' THEN 1 ELSE 0 END) AS ErrorCount
FROM mounter_eff WHERE WORK_YMD = ?
GROUP BY feeder, equip HAVING ErrorCount > 0 
ORDER BY ErrorCount DESC limit 10;`;
   
   db.query(mysql, [date], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });

//----------------
//----------------Tela de temperatura e umidade------------------------------------------------------------------------------
app.get("/Temperatura", (req, res) => {
  const {data} = req.query;
 
   let mysql = `SELECT 
    t1.line_smd AS 'linha', 
    t1.temp_equipament_smd AS 'temp', 
    t1.humidity_equipament_smd AS 'umidade', 
    t1.equipament_smd AS 'equip', 
    DATE_FORMAT(t1.hours_days, '%Y-%m-%d') AS 'data'
FROM 
    mydb.temperatura t1
INNER JOIN (
    SELECT 
        line_smd, 
        equipament_smd, 
        MAX(hours_days) AS max_hour
    FROM 
        mydb.temperatura
    WHERE 
        DATE_FORMAT(hours_days, '%Y-%m-%d') = CURDATE() and equipament_smd <> 'AMBIENTE'
    GROUP BY 
        line_smd, 
        equipament_smd
) t2 ON t1.line_smd = t2.line_smd AND t1.equipament_smd = t2.equipament_smd AND t1.hours_days = t2.max_hour group by equip, linha
order by linha;
 `;
   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });

app.get("/TempAmbiente", (req, res) => {
  const {data} = req.query;
 
   let mysql = `SELECT 
    t1.line_smd AS 'linha', 
    t1.temp_equipament_smd AS 'temp', 
    t1.humidity_equipament_smd AS 'umidade', 
    t1.equipament_smd AS 'equip', 
    DATE_FORMAT(t1.hours_days, '%Y-%m-%d') AS 'data'
FROM 
    mydb.temperatura t1
INNER JOIN (
    SELECT 
        line_smd, 
        equipament_smd, 
        MAX(hours_days) AS max_hour
    FROM 
        mydb.temperatura
    WHERE 
        DATE_FORMAT(hours_days, '%Y-%m-%d') = CURDATE() and equipament_smd = 'AMBIENTE'
    GROUP BY 
        line_smd, 
        equipament_smd
) t2 ON t1.line_smd = t2.line_smd AND t1.equipament_smd = t2.equipament_smd AND t1.hours_days = t2.max_hour group by equip, linha;
 `;
   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });



   app.get("/Temperaturaa", (req, res) => {
    const {data} = req.query;
   
     let mysql = `SELECT line_smd AS 'line', 
     temp_equipament_smd AS 'temperature', 
     humidity_equipament_smd AS 'humidity', 
     equipament_smd AS 'equipament', 
     DATE_FORMAT(hours_days, '%Y-%m-%d') AS 'period'
  FROM mydb.temperatura where DATE_FORMAT(hours_days, '%Y-%m-%d') = curdate()
  order by hours_days desc `;
     db.query(mysql, [data], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   });

  //  http://105.103.39.102:80/Temperaturaa
   //-----------------------------------

// [Rotas migradas para backend/routes/Quality/]
  
 //---------------- Hora produção 1T
 app.get("/HoraProd", (req, res) => {
  const {data} = req.query;

    let mysql = `
   SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
    
    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
   A.HORARIO_1_1 * B.Array AS HORARIO_1_1,
   A.HORARIO_1_2 * B.Array AS HORARIO_1_2,
   A.HORARIO_1_3 * B.Array AS HORARIO_1_3,
   A.HORARIO_1_4 * B.Array AS HORARIO_1_4,
   A.HORARIO_1_5 * B.Array AS HORARIO_1_5,
   A.HORARIO_1_6 * B.Array AS HORARIO_1_6,
   A.HORARIO_1_7 * B.Array AS HORARIO_1_7,
   A.HORARIO_1_8 * B.Array AS HORARIO_1_8,
   A.HORARIO_2_1 * B.Array AS HORARIO_2_1,
   A.HORARIO_2_2 * B.Array AS HORARIO_2_2,
   (A.HORARIO_1_1 + A.HORARIO_1_2 + A.HORARIO_1_3 +
    A.HORARIO_1_4 + A.HORARIO_1_5 + A.HORARIO_1_6 +
    A.HORARIO_1_7 + A.HORARIO_1_8 + A.HORARIO_2_1 + A.HORARIO_2_2) * B.Array AS Total
FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
     HORARIO_1_1, HORARIO_1_2,
     HORARIO_1_3, HORARIO_1_4,
     HORARIO_1_5, HORARIO_1_6,
     HORARIO_1_7, HORARIO_1_8,
     HORARIO_2_1, HORARIO_2_2
   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
    AND (HORARIO_1_1 + HORARIO_1_2 + HORARIO_1_3 +
        HORARIO_1_4 + HORARIO_1_5 + HORARIO_1_6 +
        HORARIO_1_7 + HORARIO_1_8 + HORARIO_2_1 + HORARIO_2_2) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
union all
SELECT '','TOTAL','',sum(Meta), SUM(HORARIO_1_1),SUM(HORARIO_1_2),
SUM(HORARIO_1_3),SUM(HORARIO_1_4),SUM(HORARIO_1_5),SUM(HORARIO_1_6),
SUM(HORARIO_1_7),SUM(HORARIO_1_8),SUM(HORARIO_2_1),SUM(HORARIO_2_2),
 SUM(TOTAL) 
FROM (
SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

   WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
   WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
   WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
   WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
   WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
   WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
   WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
   WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
   WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
   WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
   WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
   WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
   WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
   WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
   WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
   WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
   WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
   WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
   
   WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
   WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
   WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
   WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
   WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
   WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
   WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
   WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
   WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
   WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
   WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
   WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
   WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
   WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
   WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
   WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
   WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
   WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

   WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
   WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
   WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
   WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
   WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
   WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
   WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
   WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
   WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
   WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
   WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
   WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
   WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
   WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
   WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
   WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
   WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
   WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

   WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
   WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
   WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
   WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
   WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
   WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
   WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
   WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
   WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
   WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
   WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
   WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
   WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
   WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
   WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
   WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
   WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
   WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

   WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
   WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
   WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
   WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
   WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
   WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
   WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
   WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
   WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
   WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
   WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
   WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
   WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
   WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
   WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
   WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
   WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
   WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
   A.HORARIO_1_1 * B.Array AS HORARIO_1_1,
   A.HORARIO_1_2 * B.Array AS HORARIO_1_2,
   A.HORARIO_1_3 * B.Array AS HORARIO_1_3,
   A.HORARIO_1_4 * B.Array AS HORARIO_1_4,
   A.HORARIO_1_5 * B.Array AS HORARIO_1_5,
   A.HORARIO_1_6 * B.Array AS HORARIO_1_6,
   A.HORARIO_1_7 * B.Array AS HORARIO_1_7,
   A.HORARIO_1_8 * B.Array AS HORARIO_1_8,
   A.HORARIO_2_1 * B.Array AS HORARIO_2_1,
   A.HORARIO_2_2 * B.Array AS HORARIO_2_2,
   (A.HORARIO_1_1 + A.HORARIO_1_2 + A.HORARIO_1_3 +
    A.HORARIO_1_4 + A.HORARIO_1_5 + A.HORARIO_1_6 +
    A.HORARIO_1_7 + A.HORARIO_1_8 + A.HORARIO_2_1 + A.HORARIO_2_2) * B.Array AS Total
FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
     HORARIO_1_1, HORARIO_1_2,
     HORARIO_1_3, HORARIO_1_4,
     HORARIO_1_5, HORARIO_1_6,
     HORARIO_1_7, HORARIO_1_8,
     HORARIO_2_1, HORARIO_2_2
   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
    AND (HORARIO_1_1 + HORARIO_1_2 + HORARIO_1_3 +
        HORARIO_1_4 + HORARIO_1_5 + HORARIO_1_6 +
        HORARIO_1_7 + HORARIO_1_8 + HORARIO_2_1 + HORARIO_2_2) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
) A             
 ORDER BY Linha ASC;
 
   `;
   
   db.query(mysql, [data, data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });


// GET para buscar comentários
app.get("/horaProd_comments", (req, res) => {
  const { data, linha, modelo, horario } = req.query;
  
  const sql = `
    SELECT * FROM hora_mounter_comments 
    WHERE data = ? 
    AND linha = ? 
    AND modelo = ? 
    AND horario = ?
  `;
  
  db.query(sql, [data, linha, modelo, horario], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar comentário' });
    }
    res.json(result[0] || null);
  });
});

// POST/PUT para salvar/atualizar comentários
app.post("/horaProdUp_comments", (req, res) => {
  console.log("Dados recebidos:", req.body); // Adicione este log

  const { 
    data, 
    linha, 
    modelo, 
    horario, 
    comentario,
    comentario_manutencao,
    matricula_tecnico,
    matricula_operador,
    target,      
    actual,       
    difference,   
    loss_minutes,
    tipo_comentario
  } = req.body;
  
  let sql, params;
  
  if (tipo_comentario === 'manutencao') {
    // Salvar comentário de manutenção
    sql = `
      INSERT INTO hora_mounter_comments 
      (data, linha, modelo, horario, comentario_manutencao, matricula_tecnico, target, actual, difference, loss_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      comentario_manutencao = VALUES(comentario_manutencao),
      matricula_tecnico = VALUES(matricula_tecnico),
      target = VALUES(target),
      actual = VALUES(actual),
      difference = VALUES(difference),
      loss_minutes = VALUES(loss_minutes),
      data_atualizacao = CURRENT_TIMESTAMP
    `;
    
    params = [
      data, 
      linha, 
      modelo, 
      horario, 
      comentario_manutencao,
      matricula_tecnico,
      target,
      actual,
      difference,
      loss_minutes
    ];
  } else {
    // Salvar comentário de produção (comportamento original)
    sql = `
      INSERT INTO hora_mounter_comments 
      (data, linha, modelo, horario, comentario, matricula_operador, target, actual, difference, loss_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      comentario = VALUES(comentario),
      matricula_operador = VALUES(matricula_operador),
      target = VALUES(target),
      actual = VALUES(actual),
      difference = VALUES(difference),
      loss_minutes = VALUES(loss_minutes),
      data_atualizacao = CURRENT_TIMESTAMP
    `;
    
    params = [
      data, 
      linha, 
      modelo, 
      horario, 
      comentario,
      matricula_operador,
      target,
      actual,
      difference,
      loss_minutes
    ];
  }
  
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao salvar comentário' });
    }
    res.json({ success: true, message: 'Comentário salvo com sucesso!' });
  });
});


// Historico de registro do horahora

app.get("/HoraProd_Lista", (req, res) => {
  const { date } = req.query;

  let mysql = `
  SELECT date_format(a.data, '%Y-%m-%d') data, a.linha, a.modelo, 
  case
  when a.horario = 'HORARIO_1_1' then '1T 1°H'
  when a.horario = 'HORARIO_1_2' then '1T 2°H'
  when a.horario = 'HORARIO_1_3' then '1T 3°H'
  when a.horario = 'HORARIO_1_4' then '1T 4°H'
  when a.horario = 'HORARIO_1_5' then '1T 5°H'
  when a.horario = 'HORARIO_1_6' then '1T 6°H'
  when a.horario = 'HORARIO_1_7' then '1T 7°H'
  when a.horario = 'HORARIO_1_8' then '1T 8°H'
  when a.horario = 'HORARIO_2_1' then '1T 9°H'
  when a.horario = 'HORARIO_2_2' then '1T 10°H'
  when a.horario = 'HORARIO_2_3' then '2T 1°H'
  when a.horario = 'HORARIO_2_4' then '2T 2°H'
  when a.horario = 'HORARIO_2_5' then '2T 3°H'
  when a.horario = 'HORARIO_2_6' then '2T 4°H'
  when a.horario = 'HORARIO_2_7' then '2T 5°H'
  when a.horario = 'HORARIO_2_8' then '2T 6°H'
  when a.horario = 'HORARIO_3_1' then '2T 7°H'
  when a.horario = 'HORARIO_3_2' then '2T 8°H'
  when a.horario = 'HORARIO_3_3' then '2T 9°H'
  when a.horario = 'HORARIO_3_4' then '3T 1°H'
  when a.horario = 'HORARIO_3_5' then '3T 2°H'
  when a.horario = 'HORARIO_3_6' then '3T 3°H'
  when a.horario = 'HORARIO_3_7' then '3T 4°H'
  when a.horario = 'HORARIO_3_8' then '3T 5°H'
  else a.horario
    end Horario,
    a.comentario comentario, 
    date_format(a.data_atualizacao, '%H:%i:%s') data_atualizacao,
    a.target,       
    a.actual,        
    a.difference,   
    a.loss_minutes,
    a.loss_minutes,
    a.comentario_manutencao
    
  FROM mydb.hora_mounter_comments a
  WHERE date_format(a.data, '%Y-%m-%d') = ?
  ORDER BY data DESC;
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


  //---------------Hora produção 2T
app.get("/HoraProd2T", (req, res) => {
  const {data} = req.query;
 
   let mysql = `
SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
    
    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
  A.HORARIO_2_3 * B.Array AS HORARIO_2_3, /*5:55*/
  A.HORARIO_2_4 * B.Array AS HORARIO_2_4, /*6:55*/
  A.HORARIO_2_5 * B.Array AS HORARIO_2_5, /*7:55*/
  A.HORARIO_2_6 * B.Array AS HORARIO_2_6, /*8:55*/
  A.HORARIO_2_7 * B.Array AS HORARIO_2_7, /*9:55*/
  A.HORARIO_2_8 * B.Array AS HORARIO_2_8, /*10:55*/
  A.HORARIO_3_1 * B.Array AS HORARIO_3_1, /*11:55*/
  A.HORARIO_3_2 * B.Array AS HORARIO_3_2, /*00:55*/
  A.HORARIO_3_3 * B.Array AS HORARIO_3_3, /*1:55*/
  
  (A.HORARIO_2_3 + A.HORARIO_2_4 + A.HORARIO_2_5 +
   A.HORARIO_2_6 + A.HORARIO_2_7 + A.HORARIO_2_8 +
   A.HORARIO_3_1 + A.HORARIO_3_2 + A.HORARIO_3_3) * B.Array AS Total
FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
     HORARIO_2_3 , HORARIO_2_4 , HORARIO_2_5 ,
   HORARIO_2_6 , HORARIO_2_7 , HORARIO_2_8 ,
   HORARIO_3_1 , HORARIO_3_2 , HORARIO_3_3
   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
AND (HORARIO_2_3 + HORARIO_2_4 + HORARIO_2_5 +
   HORARIO_2_6 + HORARIO_2_7 + HORARIO_2_8 +
   HORARIO_3_1 + HORARIO_3_2 + HORARIO_3_3) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
union all
SELECT '','TOTAL','',sum(Meta), SUM(HORARIO_2_3),SUM(HORARIO_2_4),
SUM(HORARIO_2_5),SUM(HORARIO_2_6),SUM(HORARIO_2_7),SUM(HORARIO_2_8),
SUM(HORARIO_3_1),SUM(HORARIO_3_2),SUM(HORARIO_3_3),
 SUM(TOTAL) 
FROM (
SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
    
    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
  A.HORARIO_2_3 * B.Array AS HORARIO_2_3, /*5:55*/
  A.HORARIO_2_4 * B.Array AS HORARIO_2_4, /*6:55*/
  A.HORARIO_2_5 * B.Array AS HORARIO_2_5, /*7:55*/
  A.HORARIO_2_6 * B.Array AS HORARIO_2_6, /*8:55*/
  A.HORARIO_2_7 * B.Array AS HORARIO_2_7, /*9:55*/
  A.HORARIO_2_8 * B.Array AS HORARIO_2_8, /*10:55*/
  A.HORARIO_3_1 * B.Array AS HORARIO_3_1, /*11:55*/
  A.HORARIO_3_2 * B.Array AS HORARIO_3_2, /*00:55*/
  A.HORARIO_3_3 * B.Array AS HORARIO_3_3, /*1:55*/

  (A.HORARIO_2_3 + A.HORARIO_2_4 + A.HORARIO_2_5 +
   A.HORARIO_2_6 + A.HORARIO_2_7 + A.HORARIO_2_8 +
   A.HORARIO_3_1 + A.HORARIO_3_2 + A.HORARIO_3_3) * B.Array AS Total

FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
   HORARIO_2_3 , HORARIO_2_4 , HORARIO_2_5 ,
   HORARIO_2_6 , HORARIO_2_7 , HORARIO_2_8 ,
   HORARIO_3_1 , HORARIO_3_2 , HORARIO_3_3

   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
    AND (HORARIO_2_3 + HORARIO_2_4 + HORARIO_2_5 +
   HORARIO_2_6 + HORARIO_2_7 + HORARIO_2_8 +
   HORARIO_3_1 + HORARIO_3_2 + HORARIO_3_3) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
) A             
 ORDER BY Linha ASC;

    `;
   
   db.query(mysql, [data, data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });


 //-------- Hora produção 3T
app.get("/HoraProd3T", (req, res) => {
  const {data} = req.query;
 
   let mysql = ` 
SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
    
    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
  A.HORARIO_3_4 * B.Array AS HORARIO_3_4, /*5:55*/
  A.HORARIO_3_5 * B.Array AS HORARIO_3_5, /*6:55*/
  A.HORARIO_3_6 * B.Array AS HORARIO_3_6, /*7:55*/
  A.HORARIO_3_7 * B.Array AS HORARIO_3_7, /*8:55*/
  A.HORARIO_3_8 * B.Array AS HORARIO_3_8, /*9:55*/
  
(A.HORARIO_3_4 + A.HORARIO_3_5 + A.HORARIO_3_6 +
   A.HORARIO_3_7 + A.HORARIO_3_8 ) * B.Array AS Total

FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
     HORARIO_3_4 , HORARIO_3_5 , HORARIO_3_6 ,
   HORARIO_3_7 , HORARIO_3_8
   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
AND (HORARIO_3_4 + HORARIO_3_5 + HORARIO_3_6 +
   HORARIO_3_7 + HORARIO_3_8) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
union all
SELECT '','TOTAL','',sum(Meta), SUM(HORARIO_3_4),SUM(HORARIO_3_5),
SUM(HORARIO_3_6),SUM(HORARIO_3_7),SUM(HORARIO_3_8),
 SUM(TOTAL) 
FROM (
SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
    
    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
  A.HORARIO_3_4 * B.Array AS HORARIO_3_4, 
  A.HORARIO_3_5 * B.Array AS HORARIO_3_5, 
  A.HORARIO_3_6 * B.Array AS HORARIO_3_6, 
  A.HORARIO_3_7 * B.Array AS HORARIO_3_7,
  A.HORARIO_3_8 * B.Array AS HORARIO_3_8, 

  (HORARIO_3_4 + HORARIO_3_5 + HORARIO_3_6 +
   HORARIO_3_7 + HORARIO_3_8) * B.Array AS Total

FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
    HORARIO_3_4 , HORARIO_3_5 , HORARIO_3_6 ,
   HORARIO_3_7 , HORARIO_3_8

   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
    AND (HORARIO_3_4 + HORARIO_3_5 + HORARIO_3_6 +
   HORARIO_3_7 + HORARIO_3_8) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
) A             
 ORDER BY Linha ASC;

    `;
   
   db.query(mysql, [data, data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });

 //-----------------------------------------------------------------------------------------------
 //---------- ATR Slots

// // Node.js backend
// app.get("/getATRSlots", async (req, res) => {
//   const { slip } = req.query;

//   // Consulta para obter slots e slips do banco de dados
//   let mysql = `SELECT idModel_Tray as slot, Model_Tray as slip 
//                FROM mydb.smart_rack 
//                ORDER BY Model_date DESC`;

//   try {
//     const [result] = await db2.promise().execute(mysql);
//     res.json(result); // Envia o resultado para o frontend
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Erro ao buscar dados");
//   }
// });


///------------------------------------------------------------------ RPA -------------------------------
//------------KPI_AOI
app.get("/KPI_AOI", (req, res) => {
  const { slip } = req.query;

  // Consulta para obter slots e slips do banco de dados
  let mysql = `SELECT date_format(Work_ymd, '%d/%m/%Y') as Data, PAOI_PPM as 'P-AOI', MAOI_PPM as 'M-AOI', SAOI_PPM as 'S-AOI',  AOI_PPM as 'FT', AOI_PROD 'TEACHING M', AOI as 'TEACHING S'
  FROM mydb.kpi_aoi where WORK_YMD BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND CURDATE() order by WORK_YMD desc;`;

  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});


//------------------------------------------------------------------------------------------------
//------------ ESD---------------------------------------------------------------


//--------------------------------------------------------------

app.get("/BadHead", (req, res) => {
  let mysql = `
  select Linha, Equipamento,
case when Equipamento = 'NPM-1' and TBL = '1' then '1'
	 when Equipamento = 'NPM-1' and TBL = '2' then '2'
	 when Equipamento = 'NPM-2' and TBL = '1' then '3'
     when Equipamento = 'NPM-2' and TBL = '2' then '4'
     when Equipamento = 'NPM-3' and TBL = '1' then '5'
     when Equipamento = 'NPM-3' and TBL = '2' then '6'
     when Equipamento = 'NPM-4' and TBL = '1' then '7'
     when Equipamento = 'NPM-4' and TBL = '2' then '8'
     when Equipamento = 'NPM-5' and TBL = '1' then '9'
     when Equipamento = 'NPM-5' and TBL = '2' then '10'
	 when Equipamento = 'NPM-6' and TBL = '1' then '11'
     when Equipamento = 'NPM-6' and TBL = '2' then '12'
	 when Equipamento = 'NPM-7' and TBL = '1' then '13'
     when Equipamento = 'NPM-7' and TBL = '2' then '14'
     when Equipamento = 'NPM-8' and TBL = '1' then '15'
     when Equipamento = 'NPM-8' and TBL = '2' then '16'
     when Equipamento = 'NPM-9' and TBL = '1' then '17'
     when Equipamento = 'NPM-9' and TBL = '2' then '18'
else TBL end as TBL,
Head, Status,
  DATE_FORMAT(SUBSTR(Periodo, 1, 8), '%Y/%m/%d') AS Data, 
  DATE_FORMAT(SUBSTR(Periodo, 1, 14), '%H:%i:%s') AS Hora, 
  SUBSTR(TIMEDIFF(NOW(), Periodo), 1, 8) AS Tempo
 from bad_head order by linha, Equipamento asc;
  `;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.send(result);
    }
  });
});


app.get("/BadHead_graf1", (req, res) => {
  let mysql = `
SELECT a.Linha,
  COUNT(b.linha) AS Total_Defeitos,
  concat(round((1-(COUNT(a.id) / b.qty)) * 100,2),'%') AS Eficiencia
FROM bad_head a
left JOIN (SELECT linha, SUM(head) AS qty 
  FROM heads 
  GROUP BY linha) b ON a.Linha = b.linha 
GROUP BY a.Linha ORDER BY a.Linha ASC;
  `;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/BadHead_graf2", (req, res) => {
  let mysql = `
SELECT b.linha, 
  concat(round((1-(COUNT(a.id) / b.qty)) * 100,2),'%') AS Eficiencia 
FROM 
  (SELECT linha, SUM(head) AS qty 
   FROM mydb.heads 
   GROUP BY linha) b 
 left JOIN mydb.bad_head a ON a.linha = b.linha
GROUP BY b.linha;
  `;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.send(result);
    }
  });
});


//////////---------------Salvar Itens de BadHead
app.post("/Bad_headCom", (req, res) => {
  const { linha, equipamento, tbl, head, status, data, hora, tempo, observacao } = req.body;
  let mysql = `
  INSERT INTO bad_head_comments (Linha, Equipamento, TBL, Head, Status, Data, Hora, Tempo, Observacao)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(mysql, [linha, equipamento, tbl, head, status, data, hora, tempo, observacao], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send(err);
      } else {
          res.send(result);
      }
  });
});

app.get("/Bad_headComm", (req, res) => {
  const { date } = req.query;

  let mysql = `
SELECT id, Linha, Equipamento, TBL, Head,
        Status, Data, Hora, Tempo, Observacao,
        Date_Format(Periodo, '%Y/%m/%d %H:%i:%s') AS Periodo 
        FROM mydb.bad_head_comments order by id desc
      --  WHERE DATE(Periodo) = CURDATE();
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

//-----------------------------------------------*************************************====================================================================================================

//---------------------------------------------------------------------------------------------------
//------------------------------ Drop Worst Data Collection -----------------------------------------
//---------------------------------------------------------------------------------------------------

// Função para criar nome de tabela temporária único
const generateTempTableName = () => {
  return `temp_drop_worst_data_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

// Função para fazer requisição com retry
const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Tentativa ${i + 1} falhou, tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Endpoint para obter dados processados do Drop Worst com preços reais
app.get("/drop_worst/current", async (req, res) => {
  let tempTableName = null;
  
  try {
    // Obter as datas da query string ou usar a data de hoje
    const startDate = req.query.startDate ? req.query.startDate.replace(/-/g, '') : new Date().toISOString().replace(/-/g, '').slice(0, 8);
    const endDate = req.query.endDate ? req.query.endDate.replace(/-/g, '') : startDate;
    
    // URL da API com as datas especificadas
    const apiUrl = `http://105.103.2.25/json/smd-material-tracking/?context=mxsmd-worstdrop&from=${startDate}&to=${endDate}`;
    
   // console.log(`Fetching drop worst data from: ${apiUrl}`);
    
    // Fazer requisição para a API com retry
    let response;
    try {
      response = await fetchWithRetry(apiUrl);
    } catch (error) {
      console.error('Erro de conexão com a API:', error.message);
      return res.status(503).json({
        success: false,
        message: 'Erro de conexão com a API de dados',
        error: error.message
      });
    }
    
    // Verificar se a resposta tem o formato esperado
    if (response.data && Array.isArray(response.data)) {
      // Criar tabela temporária com nome único para evitar conflitos em ambiente multiusuário
      tempTableName = generateTempTableName();
      const createTempTableQuery = `
        CREATE TEMPORARY TABLE ${tempTableName} (
          PLANT_CODE VARCHAR(255),
          LINE_NM VARCHAR(255),
          MODEL_CODE VARCHAR(255),
          LINE_EQSEQ VARCHAR(255),
          LOC VARCHAR(255),
          MATR_CODE VARCHAR(255),
          FEEDER VARCHAR(255),
          DROP_ERR INT,
          SUMR_YMD DATE
        )
      `;
      
      try {
        await db.promise().query(createTempTableQuery);
      } catch (error) {
        console.error('Erro ao criar tabela temporária:', error.message);
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar tabela temporária',
          error: error.message
        });
      }
      
      // Inserir dados da API na tabela temporária
      if (response.data.length > 0) {
        const values = response.data.map(item => [
          item.PLANT_CODE || '',
          item.LINE_NM || '',
          item.MODEL_CODE || '',
          item.LINE_EQSEQ || '',
          item.LOC || '',
          item.MATR_CODE || '',
          item.FEEDER || '',
          item.DROP_ERR || 0,
          item.SUMR_YMD || new Date().toISOString().replace(/-/g, '').slice(0, 8)
        ]);
        
        // Construir query de inserção
        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
        const insertQuery = `INSERT INTO ${tempTableName} (PLANT_CODE, LINE_NM, MODEL_CODE, LINE_EQSEQ, LOC, MATR_CODE, FEEDER, DROP_ERR, SUMR_YMD) VALUES ${placeholders}`;
        
        // Achatar o array de valores
        const flatValues = values.flat();
        try {
          await db.promise().query(insertQuery, flatValues);
        } catch (error) {
          console.error('Erro ao inserir dados na tabela temporária:', error.message);
          // Tentar dropar a tabela temporária em caso de erro
          try {
            await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
          } catch (dropError) {
            console.error('Erro ao dropar tabela temporária:', dropError.message);
          }
          return res.status(500).json({
            success: false,
            message: 'Erro ao inserir dados na tabela temporária',
            error: error.message
          });
        }
      }
      
      // Obter o limite dos parâmetros da query ou usar 50 como padrão
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const validLimits = [50, 100, 500, 1000, 999999]; // 999999 representa "tudo"
      const actualLimit = validLimits.includes(limit) ? limit : 50;
      
      // Fazer JOIN com a tabela de preços para obter os valores
      let joinQuery = `
        SELECT 
          a.PLANT_CODE,
          a.LINE_NM as Line,
          a.MODEL_CODE as Model,
          a.LINE_EQSEQ as Equipment,
          a.LOC as Slot,
          a.MATR_CODE as PartCode,
          a.FEEDER as Feeder,
          CASE 
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) >= 5.00 THEN 'A'
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 2.00 AND 4.99 THEN 'B'
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 0.00 AND 1.99 THEN 'C'
            ELSE 'Outra Classe' 
          END AS Classe,
          SUM(a.DROP_ERR) as Errors,
          ROUND(b.price_decimal/b.price_unit_decimal, 2) AS valor,
          ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS Total,
          ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS TotalNumerico
        FROM ${tempTableName} a
        LEFT JOIN (
          SELECT DISTINCT material, plant, price_decimal, price_unit_decimal
          FROM price_comp_convertido
        ) b ON a.MATR_CODE = b.material AND a.PLANT_CODE = b.plant
        GROUP BY a.PLANT_CODE, a.LINE_NM, a.MODEL_CODE, a.LINE_EQSEQ, a.LOC, a.MATR_CODE, a.FEEDER, b.price_decimal, b.price_unit_decimal
        ORDER BY Total DESC
      `;
      
      // Adicionar limite apenas se não for "tudo" (999999)
      if (actualLimit !== 999999) {
        joinQuery += ` LIMIT ${actualLimit}`;
      }
      
      let processedData;
      try {
        [processedData] = await db.promise().query(joinQuery);
      } catch (error) {
        console.error('Erro ao executar query de JOIN:', error.message);
        // Tentar dropar a tabela temporária em caso de erro
        try {
          await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
        } catch (dropError) {
          console.error('Erro ao dropar tabela temporária:', dropError.message);
        }
        return res.status(500).json({
          success: false,
          message: 'Erro ao processar dados',
          error: error.message
        });
      }
      
      // Calcular o total geral
      const totalGeral = processedData.reduce((sum, item) => sum + (parseFloat(item.TotalNumerico) || 0), 0);
      
      // Adicionar linha de total
      const finalData = [
        ...processedData,
        {
          PLANT_CODE: null,
          Line: null,
          Model: null,
          Equipment: null,
          Slot: null,
          PartCode: null,
          Feeder: null,
          Classe: 'TOTAL',
          Errors: null,
          valor: null,
          Total: totalGeral.toFixed(2),
          TotalNumerico: totalGeral
        }
      ];
      
      // Dropar tabela temporária
      try {
        await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
      } catch (error) {
        console.error('Erro ao dropar tabela temporária:', error.message);
        // Não retornar erro aqui pois os dados já foram processados com sucesso
      }
      
      res.json({
        success: true,
        data: finalData,
        count: finalData.length - 1 // Excluir a linha de total
      });
    } else {
      console.error('Formato de dados inesperado da API:', response.data);
      // Tentar dropar a tabela temporária em caso de erro
      if (tempTableName) {
        try {
          await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
        } catch (dropError) {
          console.error('Erro ao dropar tabela temporária:', dropError.message);
        }
      }
      res.status(500).json({
        success: false,
        message: 'Formato de dados inesperado da API'
      });
    }
  } catch (error) {
    console.error('Erro ao buscar dados atuais do Drop Worst:', error.message);
    // Tentar dropar a tabela temporária em caso de erro
    if (tempTableName) {
      try {
        await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
      } catch (dropError) {
        console.error('Erro ao dropar tabela temporária:', dropError.message);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados atuais do Drop Worst',
      error: error.message
    });
  }
});

// Endpoint para obter dados históricos do Drop Worst (entre datas)
app.get("/drop_worst/history", async (req, res) => {
  try {
    const { from, to } = req.query;
    
    // Validar datas
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros "from" e "to" são obrigatórios'
      });
    }
    
    // Formatar datas removendo traços
    const fromDate = from.replace(/-/g, '');
    const toDate = to.replace(/-/g, '');
    
    // Verificar se a data final é maior ou igual à data inicial
    if (toDate < fromDate) {
      return res.status(400).json({
        success: false,
        message: 'A data final deve ser maior ou igual à data inicial'
      });
    }
    
    // URL da API com as datas especificadas
    const apiUrl = `http://105.103.2.25/json/smd-material-tracking/?context=mxsmd-worstdrop&from=${fromDate}&to=${toDate}`;
    
    console.log(`Fetching historical drop worst data from: ${apiUrl}`);
    
    // Fazer requisição para a API
    const response = await axios.get(apiUrl);
    
    // Verificar se a resposta tem o formato esperado
    if (response.data && Array.isArray(response.data)) {
      // Criar tabela temporária para armazenar os dados da API
      const createTempTableQuery = `
        CREATE TEMPORARY TABLE temp_drop_worst_data (
          PLANT_CODE VARCHAR(255),
          LINE_NM VARCHAR(255),
          MODEL_CODE VARCHAR(255),
          LINE_EQSEQ VARCHAR(255),
          LOC VARCHAR(255),
          MATR_CODE VARCHAR(255),
          FEEDER VARCHAR(255),
          DROP_ERR INT,
          SUMR_YMD DATE
        )
      `;
      
      await db.promise().query(createTempTableQuery);
      
      // Inserir dados da API na tabela temporária
      if (response.data.length > 0) {
        const values = response.data.map(item => [
          item.PLANT_CODE || '',
          item.LINE_NM || '',
          item.MODEL_CODE || '',
          item.LINE_EQSEQ || '',
          item.LOC || '',
          item.MATR_CODE || '',
          item.FEEDER || '',
          item.DROP_ERR || 0,
          item.SUMR_YMD || new Date().toISOString().replace(/-/g, '').slice(0, 8)
        ]);
        
        // Construir query de inserção
        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
        const insertQuery = `INSERT INTO temp_drop_worst_data (PLANT_CODE, LINE_NM, MODEL_CODE, LINE_EQSEQ, LOC, MATR_CODE, FEEDER, DROP_ERR, SUMR_YMD) VALUES ${placeholders}`;
        
        // Achatar o array de valores
        const flatValues = values.flat();
        await db.promise().query(insertQuery, flatValues);
      }
      
      // Fazer JOIN com a tabela de preços para obter os valores
      const joinQuery = `
        SELECT 
          a.PLANT_CODE,
          a.LINE_NM as Line,
          a.MODEL_CODE as Model,
          a.LINE_EQSEQ as Equipment,
          a.LOC as Slot,
          a.MATR_CODE as PartCode,
          a.FEEDER as Feeder,
          CASE 
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) >= 5.00 THEN 'A'
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 2.00 AND 4.99 THEN 'B'
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 0.00 AND 1.99 THEN 'C'
            ELSE 'Outra Classe' 
          END AS Classe,
          SUM(a.DROP_ERR) as Errors,
          ROUND(b.price_decimal/b.price_unit_decimal, 2) AS valor,
          ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS Total,
          ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS TotalNumerico
        FROM temp_drop_worst_data a
        LEFT JOIN (
          SELECT DISTINCT material, plant, price_decimal, price_unit_decimal
          FROM price_comp_convertido
        ) b ON a.MATR_CODE = b.material AND a.PLANT_CODE = b.plant
        GROUP BY a.PLANT_CODE, a.LINE_NM, a.MODEL_CODE, a.LINE_EQSEQ, a.LOC, a.MATR_CODE, a.FEEDER, b.price_decimal, b.price_unit_decimal
        ORDER BY Total DESC
        LIMIT 50
      `;
      
      const [processedData] = await db.promise().query(joinQuery);
      
      // Calcular o total geral
      const totalGeral = processedData.reduce((sum, item) => sum + (parseFloat(item.TotalNumerico) || 0), 0);
      
      // Adicionar linha de total
      const finalData = [
        ...processedData,
        {
          PLANT_CODE: null,
          Line: null,
          Model: null,
          Equipment: null,
          Slot: null,
          PartCode: null,
          Feeder: null,
          Classe: 'TOTAL',
          Errors: null,
          valor: null,
          Total: totalGeral.toFixed(2),
          TotalNumerico: totalGeral
        }
      ];
      
      // Dropar tabela temporária
      await db.promise().query('DROP TEMPORARY TABLE temp_drop_worst_data');
      
      res.json({
        success: true,
        data: finalData,
        count: finalData.length - 1 // Excluir a linha de total
      });
    } else {
      console.error('Formato de dados inesperado da API:', response.data);
      res.status(500).json({
        success: false,
        message: 'Formato de dados inesperado da API'
      });
    }
  } catch (error) {
    console.error('Erro ao buscar dados históricos do Drop Worst:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados históricos do Drop Worst',
      error: error.message
    });
  }
});

// ===================== DROP WORST - POR HORA ENDPOINT =======================

// Endpoint para buscar dados do Drop Worst por hora (para tela HoraDropW - aba Por Hora)
// Nova estrutura: cada part tem 1 registro por dia com colunas h00-h23
app.get('/drop_worst/por_hora', async (req, res) => {
  try {
    const { startDate, endDate, data } = req.query;
    
    // Suporta tanto o novo formato (startDate/endDate) quanto o antigo (data)
    let dateCondition;
    let queryParams = [];
    
    if (startDate && endDate) {
      // Novo formato: período de datas
      dateCondition = `WHERE data_coleta BETWEEN ? AND ?`;
      queryParams = [startDate, endDate];
    } else {
      // Formato antigo: data única (para retrocompatibilidade)
      const dataFilter = data || new Date().toISOString().split('T')[0];
      dateCondition = `WHERE data_coleta = ?`;
      queryParams = [dataFilter];
    }
    
    // Query direta na nova estrutura (um registro por part por dia)
    // TTL (valor_total) = soma de todas as horas * valor_unitario
    const query = `
      SELECT 
        line,
        model,
        equipment,
        slot,
        part_code,
        feeder,
        classe,
        total_erros,
        valor_unitario,
        total,
        total_numerico,
        -- Calcula TTL (valor_total) = soma das horas * valor_unitario
        (COALESCE(h00, 0) + COALESCE(h01, 0) + COALESCE(h02, 0) + COALESCE(h03, 0) + 
         COALESCE(h04, 0) + COALESCE(h05, 0) + COALESCE(h06, 0) + COALESCE(h07, 0) + 
         COALESCE(h08, 0) + COALESCE(h09, 0) + COALESCE(h10, 0) + COALESCE(h11, 0) + 
         COALESCE(h12, 0) + COALESCE(h13, 0) + COALESCE(h14, 0) + COALESCE(h15, 0) + 
         COALESCE(h16, 0) + COALESCE(h17, 0) + COALESCE(h18, 0) + COALESCE(h19, 0) + 
         COALESCE(h20, 0) + COALESCE(h21, 0) + COALESCE(h22, 0) + COALESCE(h23, 0)) 
         * COALESCE(valor_unitario, 0) as valor_total,
        -- Retorna cada hora individualmente
        COALESCE(h00, 0) as h00,
        COALESCE(h01, 0) as h01,
        COALESCE(h02, 0) as h02,
        COALESCE(h03, 0) as h03,
        COALESCE(h04, 0) as h04,
        COALESCE(h05, 0) as h05,
        COALESCE(h06, 0) as h06,
        COALESCE(h07, 0) as h07,
        COALESCE(h08, 0) as h08,
        COALESCE(h09, 0) as h09,
        COALESCE(h10, 0) as h10,
        COALESCE(h11, 0) as h11,
        COALESCE(h12, 0) as h12,
        COALESCE(h13, 0) as h13,
        COALESCE(h14, 0) as h14,
        COALESCE(h15, 0) as h15,
        COALESCE(h16, 0) as h16,
        COALESCE(h17, 0) as h17,
        COALESCE(h18, 0) as h18,
        COALESCE(h19, 0) as h19,
        COALESCE(h20, 0) as h20,
        COALESCE(h21, 0) as h21,
        COALESCE(h22, 0) as h22,
        COALESCE(h23, 0) as h23
      FROM drop_class_a_worst
      ${dateCondition}
      ORDER BY total_numerico DESC
    `;
    
    const [rows] = await db.promise().query(query, queryParams);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erro ao buscar dados por hora:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// COLETOR DROP WORST - INSERT/UPDATE (ESTRATÉGIA DE ACUMULADO POR HORA)
// ============================================================================
// CONCEITO:
// - API retorna valor ACUMULADO do dia (ex: 100 erros até agora)
// - Cada part tem 1 ÚNICO registro por dia (INSERT/UPDATE)
// - Quando muda a hora: calcula diferença e salva na coluna da hora
// - Exemplo:
//   * 7h: part=123abc, API=4 → UPDATE: total=4, h07=4
//   * 7h: part=123abc, API=6 → UPDATE: total=6, h07=6 (ainda na mesma hora)
//   * 10h: part=123abc, API=8 → UPDATE: total=8, h07=6, h10=2 (8-6=2)
// ============================================================================

const DROP_API_URL = 'http://105.103.2.25/json/smd-material-tracking/';
let dropTimerId = null;

// Armazena último valor acumulado de cada item (para calcular diferença)
// Chave: "line|model|equipment|slot|part_code|feeder"
// Valor: { errors: numero, hora: numero }
const ultimoSnapshot = new Map();

// Gera chave única para identificar um item
function gerarChaveItem(item) {
  return `${item.Line||''}|${item.Model||''}|${item.Equipment||''}|${item.Slot||''}|${item.PartCode||''}|${item.Feeder||''}`;
}

// Busca dados da API - MESMO ENDPOINT da tela drop_worst/current
async function dropWorstFetch() {
  const data = new Date().toISOString().split('T')[0].replace(/-/g, '');
  try {
    const response = await axios.get(`${DROP_API_URL}?context=mxsmd-worstdrop&from=${data}&to=${data}`, { timeout: 30000 });
    return response.data && Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    return [];
  }
}

// Processa dados com preços - EXATAMENTE como a tela drop_worst/current
async function dropWorstProcessar(dados) {
  if (!dados || dados.length === 0) return [];
  const tempTable = `temp_drop_${Date.now()}`;
  await db.promise().query(`CREATE TEMPORARY TABLE ${tempTable} (PLANT_CODE VARCHAR(255), LINE_NM VARCHAR(255), MODEL_CODE VARCHAR(255), LINE_EQSEQ VARCHAR(255), LOC VARCHAR(255), MATR_CODE VARCHAR(255), FEEDER VARCHAR(255), DROP_ERR INT, SUMR_YMD DATE)`);
  
  // Inserir dados brutos da API
  const values = dados.map(i => [
    i.PLANT_CODE||'', 
    i.LINE_NM||'', 
    i.MODEL_CODE||'', 
    i.LINE_EQSEQ||'', 
    i.LOC||'', 
    i.MATR_CODE||'', 
    i.FEEDER||'', 
    i.DROP_ERR||0,
    i.SUMR_YMD || new Date().toISOString().replace(/-/g, '').slice(0, 8)
  ]);
  
  await db.promise().query(`INSERT INTO ${tempTable} VALUES ${values.map(()=> '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',')}`, values.flat());
  
  // Query EXATA da tela drop_worst/current - com JOIN na tabela de preços
  const [result] = await db.promise().query(`
    SELECT 
      a.PLANT_CODE,
      a.LINE_NM as Line,
      a.MODEL_CODE as Model,
      a.LINE_EQSEQ as Equipment,
      a.LOC as Slot,
      a.MATR_CODE as PartCode,
      a.FEEDER as Feeder,
      CASE 
        WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) >= 5.00 THEN 'A'
        WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 2.00 AND 4.99 THEN 'B'
        WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 0.00 AND 1.99 THEN 'C'
        ELSE 'Outra Classe' 
      END AS Classe,
      SUM(a.DROP_ERR) as Errors,
      ROUND(b.price_decimal/b.price_unit_decimal, 2) AS valor,
      ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS Total,
      ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS TotalNumerico
    FROM ${tempTable} a
    LEFT JOIN (
      SELECT DISTINCT material, plant, price_decimal, price_unit_decimal
      FROM price_comp_convertido
    ) b ON a.MATR_CODE = b.material AND a.PLANT_CODE = b.plant
    GROUP BY a.PLANT_CODE, a.LINE_NM, a.MODEL_CODE, a.LINE_EQSEQ, a.LOC, a.MATR_CODE, a.FEEDER, b.price_decimal, b.price_unit_decimal
    ORDER BY Total DESC
  `);
  
  await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTable}`);
  return result;
}

// Salva com estratégia INSERT/UPDATE - um registro por part por dia
// LÓGICA CORRETA:
// - API retorna valor ACUMULADO do dia (ex: 100 erros até agora)
// - PRIMEIRA coleta da HORA: salva o acumulado na coluna da hora
// - Coletas subsequentes na MESMA hora: NÃO atualiza a coluna da hora (mantém primeiro valor)
// - HORA DIFERENTE: calcula diferença (atual - ultimo_acumulado) e salva na nova coluna
// Exemplo:
//   7h00: API=5 → h07=5, total=5
//   7h30: API=5 → h07=5, total=5 (não muda)
//   8h00: API=7 → h07=5, h08=2, total=7 (7-5=2)
async function dropWorstSalvar(dados) {
  if (!dados || dados.length === 0) return { inseridos: 0, atualizados: 0 };
  
  const dataColeta = new Date().toISOString().split('T')[0];
  const horaColeta = new Date().getHours();
  const agora = new Date();
  let inseridos = 0, atualizados = 0;
  
  for (const item of dados) {
    const chave = gerarChaveItem(item);
    const errorsAcumulado = parseInt(item.Errors) || 0;
    
    // Busca último snapshot deste item na memória
    const ultimo = ultimoSnapshot.get(chave);
    
    let errorsParaSalvar = 0;  // Valor que vai na coluna da hora (h00-h23)
    let deveAtualizarHora = false;
    
    if (!ultimo) {
      // PRIMEIRA coleta do dia: salva valor acumulado na coluna da hora
      errorsParaSalvar = errorsAcumulado;
      deveAtualizarHora = true;
    } else if (ultimo.hora !== horaColeta) {
      // MUDOU A HORA: calcula diferença entre acumulado atual e último acumulado
      errorsParaSalvar = Math.max(0, errorsAcumulado - ultimo.errors);
      deveAtualizarHora = true;
    } else {
      // MESMA HORA: NÃO atualiza a coluna da hora (mantém o primeiro valor da hora)
      // Apenas o total_erros será atualizado com valor mais recente
      errorsParaSalvar = 0;
      deveAtualizarHora = false;
    }
    
    // Atualiza snapshot com valor acumulado atual
    ultimoSnapshot.set(chave, {
      errors: errorsAcumulado,
      hora: horaColeta,
      data: dataColeta
    });
    
    const horaFormatada = String(horaColeta).padStart(2, '0');
    
    try {
      let query = 'INSERT INTO drop_class_a_worst SET ';
      query += 'data_coleta = ?, plant_code = ?, line = ?, model = ?, equipment = ?, slot = ?, part_code = ?, feeder = ?, classe = ?, ';
      query += 'total_erros = ?, ' + 'h' + horaFormatada + ' = ?, valor_unitario = ?, total = ?, total_numerico = ?, ';
      query += 'ultima_hora_atualizada = ?, ultimo_total_acumulado = ?, horario_atualizacao = ? ';
      query += 'ON DUPLICATE KEY UPDATE ';
      query += 'total_erros = VALUES(total_erros), ';
      
      // Só atualiza a coluna da hora se mudou a hora OU é primeira coleta
      if (deveAtualizarHora) {
        query += 'h' + horaFormatada + ' = VALUES(h' + horaFormatada + '), ';
      } else {
        // Mantém valor existente da hora (não sobrescreve)
        query += 'h' + horaFormatada + ' = h' + horaFormatada + ', ';
      }
      
      query += 'valor_unitario = VALUES(valor_unitario), total = VALUES(total), total_numerico = VALUES(total_numerico), ';
      query += 'ultima_hora_atualizada = VALUES(ultima_hora_atualizada), ultimo_total_acumulado = VALUES(ultimo_total_acumulado), horario_atualizacao = VALUES(horario_atualizacao)';
      
      const params = [
        dataColeta,
        item.PLANT_CODE||'',
        item.Line||'',
        item.Model||'',
        item.Equipment||'',
        item.Slot||'',
        item.PartCode||'',
        item.Feeder||'',
        item.Classe||'',
        errorsAcumulado,      // total_erros = valor EXATO da API
        errorsParaSalvar,     // hXX = primeiro valor da hora OU diferença (hora nova)
        item.valor||0,
        item.Total||0,
        item.Total||0,
        horaColeta,
        errorsAcumulado,
        agora
      ];
      
      await db.promise().query(query, params);
      
      if (errorsParaSalvar > 0) atualizados++;
    } catch (err) {
      // Erro silencioso
    }
  }
  
  return { inseridos, atualizados };
}

// Coleta principal
async function dropWorstColetar() {
  const dadosBrutos = await dropWorstFetch();
  const processados = await dropWorstProcessar(dadosBrutos);
  const resultado = await dropWorstSalvar(processados);
  return resultado;
}

// Inicia coletor automático (a cada 1 minuto)
function dropWorstIniciar() {
  if (dropTimerId) clearInterval(dropTimerId);
  ultimoSnapshot.clear();
  dropWorstColetar();
  dropTimerId = setInterval(dropWorstColetar, 60000);
}

// Para coletor
function dropWorstParar() {
  if (dropTimerId) { 
    clearInterval(dropTimerId); 
    dropTimerId = null; 
  }
}

// Inicia automaticamente ao carregar servidor
dropWorstIniciar();

// Endpoints
app.get('/drop_worst/coletar', async (req, res) => { 
  res.json(await dropWorstColetar()); 
});

app.get('/drop_worst/status', (req, res) => { 
  res.json({ 
    ativo: dropTimerId !== null,
    snapshotsMemoria: ultimoSnapshot.size
  }); 
});

app.post('/drop_worst/toggle', (req, res) => { 
  const { ativo } = req.body; 
  if (ativo) dropWorstIniciar(); 
  else dropWorstParar(); 
  res.json({ success: true, message: ativo ? 'Coletor iniciado' : 'Coletor parado' }); 
});

// Endpoint para LIMPAR snapshots e começar do zero (útil para testes)
app.get('/drop_worst/reset', (req, res) => {
  ultimoSnapshot.clear();
  res.json({ success: true, message: 'Snapshots limpos. Próxima coleta inicia do zero.' });
});










// [Rotas migradas para backend/routes/Quality/]






//////////---------------------------------------------------------------------
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

//------------------------------------------------
//------------------------------------------------
//------------------------------------------------
 //------------------------------------------------         TELA DE PM --------------------------------------


// GET PMs
// GET PMs
app.get('/pms', async (req, res) => {
  try {
    const { year } = req.query;
    let query = 'SELECT * FROM pm_records';
    let params = [];
    
    if (year) {
      query += ' WHERE year = ?';
      params.push(year);
    }
    
    console.log('Consulta SQL:', query, 'Parâmetros:', params); // Log para debug
    
    const [rows] = await db.promise().query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Tower Lamps
app.get('/tower-lamps', async (req, res) => {
  try {
    const { year } = req.query;
    let query = 'SELECT * FROM tower_lamp_records';
    let params = [];
    
    if (year) {
      query += ' WHERE year = ?';
      params.push(year);
    }
    
    const [rows] = await db.promise().query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Tower Lamp by ID
app.get('/tower-lamps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.promise().query('SELECT * FROM tower_lamp_records WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tower Lamp not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE Tower Lamp
app.post('/tower-lamps', async (req, res) => {
  try {
    const { production_line, month, year, justification, is_delayed, is_scheduled, scheduled_week } = req.body;
    const [result] = await db.promise().query(
      'INSERT INTO tower_lamp_records (production_line, month, year, justification, is_delayed, is_scheduled, scheduled_week) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [production_line, month, year, justification, is_delayed, is_scheduled, scheduled_week]
    );
    
    // Retornar o registro recém-criado
    const [rows] = await db.promise().query('SELECT * FROM tower_lamp_records WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE Tower Lamp
app.put('/tower-lamps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { justification, is_delayed, is_scheduled, scheduled_week } = req.body;
    
    // Verificar se o registro existe
    const [existing] = await db.promise().query('SELECT * FROM tower_lamp_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Tower Lamp not found' });
    }
    
    // Atualizar o registro
    await db.promise().query(
      'UPDATE tower_lamp_records SET justification = ?, is_delayed = ?, is_scheduled = ?, scheduled_week = ? WHERE id = ?',
      [justification, is_delayed, is_scheduled, scheduled_week, id]
    );
    
    // Retornar o registro atualizado
    const [rows] = await db.promise().query('SELECT * FROM tower_lamp_records WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar Tower Lamp:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Tower Lamp
app.delete('/tower-lamps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o registro existe
    const [existing] = await db.promise().query('SELECT * FROM tower_lamp_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Tower Lamp not found' });
    }
    
    // Deletar o registro
    await db.promise().query('DELETE FROM tower_lamp_records WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Tower Lamp Stats
app.get('/tower-lamp-stats', async (req, res) => {
  try {
    const { year } = req.query;
    let yearCondition = '';
    let params = [];
    
    if (year) {
      yearCondition = ' AND year = ?';
      params.push(year);
    }
    
    // Total de Tower Lamps realizadas (não agendadas e não atrasadas)
    const [completedTowerLamps] = await db.promise().query(`
      SELECT COUNT(*) as completed_tower_lamps FROM tower_lamp_records WHERE is_scheduled = 0 AND is_delayed = 0${yearCondition}
    `, params);
    
    // Total de Tower Lamps atrasadas
    const [delayedTowerLamps] = await db.promise().query(`
      SELECT COUNT(*) as delayed_tower_lamps FROM tower_lamp_records WHERE is_delayed = 1${yearCondition}
    `, params);
    
    // Porcentagem de conclusão (com base em 96 Tower Lamps totais)
    const totalCompleted = completedTowerLamps[0].completed_tower_lamps;
    const completionPercentage = Math.round((totalCompleted / 96) * 100);
    
    const stats = {
      completed_tower_lamps: totalCompleted,
      total_tower_lamps: 96, // Total predefinido
      delayed_tower_lamps: delayedTowerLamps[0].delayed_tower_lamps,
      completion_percentage: completionPercentage
    };
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PM by ID
app.get('/pms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.promise().query('SELECT * FROM pm_records WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'PM not found' });
    }
    
    // Buscar os dados dos equipamentos
    const [equipmentStatus] = await db.promise().query(
      'SELECT * FROM pm_equipment_status WHERE pm_id = ?',
      [id]
    );
    rows[0].equipment_status = equipmentStatus;
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE PM
app.post('/pms', async (req, res) => {
  try {
    const { production_line, month, year, justification, is_delayed, is_scheduled, scheduled_week } = req.body;
    const [result] = await db.promise().query(
      'INSERT INTO pm_records (production_line, month, year, justification, is_delayed, is_scheduled, scheduled_week) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [production_line, month, year, justification, is_delayed, is_scheduled, scheduled_week]
    );
    
    // Retornar o registro recém-criado
    const [rows] = await db.promise().query('SELECT * FROM pm_records WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PM
app.put('/pms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { justification, is_delayed, is_scheduled, scheduled_week } = req.body;
    
    // Verificar se o registro existe
    const [existing] = await db.promise().query('SELECT * FROM pm_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'PM not found' });
    }
    
    // Atualizar o registro
    await db.promise().query(
      'UPDATE pm_records SET justification = ?, is_delayed = ?, is_scheduled = ?, scheduled_week = ? WHERE id = ?',
      [justification, is_delayed, is_scheduled, scheduled_week, id]
    );
    
    // Retornar o registro atualizado
    const [rows] = await db.promise().query('SELECT * FROM pm_records WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar PM:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE PM
app.delete('/pms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o registro existe
    const [existing] = await db.promise().query('SELECT * FROM pm_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'PM not found' });
    }
    
    // Deletar o registro
    await db.promise().query('DELETE FROM pm_records WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Available Years
app.get('/available-years', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    const [rows] = await db.promise().query('SELECT DISTINCT year FROM pm_records ORDER BY year DESC');
    const years = rows.map(row => row.year);
    // Garantir que o ano atual esteja na lista
    if (!years.includes(currentYear)) {
      years.push(currentYear);
      years.sort((a, b) => b - a); // Ordenar em ordem decrescente
    }
    res.json({ years });
  } catch (err) {
    console.error('Erro ao buscar anos disponíveis:', err);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    // Fallback: retornar anos do ano atual até 5 anos atrás
    const fallbackYears = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      fallbackYears.push(i);
    }
    res.json({ years: fallbackYears });
  }
});

// GET PM Stats
app.get('/stats', async (req, res) => {
  try {
    const { year } = req.query;
    let yearCondition = '';
    let params = [];
    
    if (year) {
      yearCondition = ' AND year = ?';
      params.push(year);
    }
    
    // Primeiro verificar se a tabela existe, se não existir, criá-la
    try {
      // Criar tabela pm_records se não existir
      await db.promise().query(`
        CREATE TABLE IF NOT EXISTS pm_records (
          id INT AUTO_INCREMENT PRIMARY KEY,
          production_line VARCHAR(50),
          month VARCHAR(10),
          year INT,
          justification TEXT,
          is_delayed BOOLEAN DEFAULT FALSE,
          is_scheduled BOOLEAN DEFAULT FALSE,
          scheduled_week INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Criar tabela tower_lamp_records se não existir (estrutura idêntica à pm_records)
      await db.promise().query(`
        CREATE TABLE IF NOT EXISTS tower_lamp_records (
          id INT AUTO_INCREMENT PRIMARY KEY,
          production_line VARCHAR(50),
          month VARCHAR(10),
          year INT,
          justification TEXT,
          is_delayed BOOLEAN DEFAULT FALSE,
          is_scheduled BOOLEAN DEFAULT FALSE,
          scheduled_week INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Verificar se o índice já existe antes de criá-lo para pm_records
      try {
        await db.promise().query(`
          CREATE INDEX idx_production_line_month_year ON pm_records (production_line, month, year)
        `);
      } catch (indexErr) {
        // Índice pode já existir, então ignoramos o erro
        console.log('Índice idx_production_line_month_year para pm_records pode já existir');
      }
      
      // Verificar se o índice já existe antes de criá-lo para tower_lamp_records
      try {
        await db.promise().query(`
          CREATE INDEX idx_tower_lamp_line_month_year ON tower_lamp_records (production_line, month, year)
        `);
      } catch (indexErr) {
        // Índice pode já existir, então ignoramos o erro
        console.log('Índice idx_tower_lamp_line_month_year para tower_lamp_records pode já existir');
      }
    } catch (createTableErr) {
      console.log('Erro ao criar tabelas:', createTableErr);
    }
    
    // Total de PMs realizadas (não agendadas e não atrasadas)
    const [completedPMs] = await db.promise().query(`
      SELECT COUNT(*) as completed_pms FROM pm_records WHERE is_scheduled = 0 AND is_delayed = 0${yearCondition}
    `, params);
    
    // Total de PMs atrasadas
    const [delayedPMs] = await db.promise().query(`
      SELECT COUNT(*) as delayed_pms FROM pm_records WHERE is_delayed = 1${yearCondition}
    `, params);
    
    // Porcentagem de conclusão (com base em 96 PMs totais)
    const totalCompleted = completedPMs[0].completed_pms;
    const completionPercentage = Math.round((totalCompleted / 96) * 100);
    
    const stats = {
      completed_pms: totalCompleted,
      total_pms: 96, // Total predefinido
      delayed_pms: delayedPMs[0].delayed_pms,
      completion_percentage: completionPercentage
    };
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE PM Schedule
app.post('/schedule', async (req, res) => {
  try {
    const { production_line, month, year, schedule_date, observations } = req.body;

    const [result] = await db.promise().query(
      'INSERT INTO pm_schedules (production_line, month, year, schedule_date, observations) VALUES (?, ?, ?, ?, ?)',
      [production_line, month, year, schedule_date, observations]
    );

    res.status(201).json({ id: result.insertId, message: 'Agendamento criado com sucesso!' });
  } catch (err) {
    console.error('Erro ao criar agendamento:', err);
    res.status(500).json({ error: err.message });
  }
});

// Função para verificar e atualizar registros atrasados
async function checkAndUpdateOverdueRecords() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zerar horas, minutos, segundos e milissegundos para comparar apenas a data

    // Atualizar PMs atrasadas
    await db.promise().query(
      `UPDATE pm_records 
       SET is_delayed = 1, is_scheduled = 0 
       WHERE is_scheduled = 1 AND scheduled_week < ?`,
      [getWeekNumber(today)]
    );

    // Atualizar Tower Lamps atrasadas
    await db.promise().query(
      `UPDATE tower_lamp_records 
       SET is_delayed = 1, is_scheduled = 0 
       WHERE is_scheduled = 1 AND scheduled_week < ?`,
      [getWeekNumber(today)]
    );

    // console.log('Verificação de registros atrasados concluída.');
  } catch (err) {
    console.error('Erro ao verificar registros atrasados:', err);
  }
}

// Função para calcular o número da semana do ano
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Executar a verificação de registros atrasados a cada hora
setInterval(checkAndUpdateOverdueRecords, 60 * 60 * 1000); // 60 minutos * 60 segundos * 1000 milissegundos

// Executar a verificação de registros atrasados assim que o servidor iniciar
checkAndUpdateOverdueRecords();



//------------------------------------
// **-----------Gravacao QRCODE --------------------
// Gravação CN - 1T
// Gravação CN - 1T
app.get("/GravacaoCN", (req, res) => {
  const {data} = req.query;
 
   let mysql = `
 SELECT 
    CASE 
        WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END AS 'Data',
    g.machine_name AS Maquina,

    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END AS Modelo,
-- CASE 
 --       WHEN a.modelo LIKE 'Model[%' THEN
  --          CONCAT(
  -- SUBSTRING(a.modelo, 11, 4),
 --               '_',
  --              SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
   --         )
    --    ELSE
  --          CONCAT(
  --              SUBSTRING(a.modelo, 5, 4),
 --               '_',
 --               RIGHT(a.modelo, 3)
 --           )
 --   END as ModeloT,
 a.target as Meta,
    
    COALESCE(pcb.Array, 0) AS 'array',
    
    -- Multiplicação por Array para 1T
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '06:55:00' AND '07:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_1,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '07:55:00' AND '08:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_2,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '08:55:00' AND '09:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_3,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '09:55:00' AND '10:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_4,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '10:55:00' AND '11:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_5,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '11:55:00' AND '12:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_6,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '12:55:00' AND '13:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_7,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '13:55:00' AND '14:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_8,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '14:55:00' AND '15:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_9,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '15:55:00' AND '16:43:00' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_10,
    
   -- COUNT(*) AS total_qty,
    COUNT(*) * COALESCE(pcb.Array, 0) AS total
    
FROM gravacao_cn g
LEFT JOIN (
    -- Subq pra pegar apenas um modelo de cada tipo da tabela pcb_qty_array
    SELECT 
        p1.*,
        ROW_NUMBER() OVER (
            PARTITION BY 
                CASE 
                    WHEN p1.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(p1.Modelo, 1, 7)
                    WHEN p1.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(p1.Modelo, 1, 8)
                    ELSE SUBSTRING(p1.Modelo, 1, 8)
                END 
            ORDER BY p1.id
        ) as rn
    FROM pcb_qty_array p1
) pcb ON (
    -- filtro do nome dos modelos
    CASE 
        WHEN g.model_name LIKE 'Model[BSM-X____%' THEN
            SUBSTRING(g.model_name, 7, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'Model[BSM-A____%' THEN
            SUBSTRING(g.model_name, 7, 8)  -- Extrai "BSM-A075"
        WHEN g.model_name LIKE 'BSM-X____%' THEN
            SUBSTRING(g.model_name, 1, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'BSM-A____%' THEN
            SUBSTRING(g.model_name, 1, 8)  -- Extrai "BSM-A075"
        ELSE ''
    END = 
    CASE 
        WHEN pcb.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(pcb.Modelo, 1, 7)
        WHEN pcb.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(pcb.Modelo, 1, 8)
        ELSE SUBSTRING(pcb.Modelo, 1, 8)
    END
    AND pcb.rn = 1  -- Pegar apenas o primeiro registro de cada modelo
) 
 left join gravacao_cn_target a ON (
     CASE 
        WHEN a.modelo LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(a.modelo, 11, 4),
                '_',
                SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(a.modelo, 5, 4),
                '_',
                RIGHT(a.modelo, 3)
            )
    END) =
    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END

where 
-- where para a data
CASE 
        WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END = ?
GROUP BY 
    data,
    Maquina,
    Modelo,
    pcb.Modelo,
    COALESCE(pcb.Array, 0)
ORDER BY 
    data,
    Maquina,
    Modelo;
   `;
   
   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
       res.status(500).send(err);
     } else {
       res.json(result);
     }
   });
 });


// Gravação CN - 2T
app.get("/GravacaoCN2T", (req, res) => {
  const {data} = req.query;
 
   let mysql = `
 SELECT 
    CASE 
  WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END AS 'Data',
    g.machine_name AS Maquina,

    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END AS Modelo,
-- CASE 
 --       WHEN a.modelo LIKE 'Model[%' THEN
  --          CONCAT(
  -- SUBSTRING(a.modelo, 11, 4),
 --               '_',
  --              SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
   --         )
    --    ELSE
  --          CONCAT(
  --              SUBSTRING(a.modelo, 5, 4),
 --               '_',
 --               RIGHT(a.modelo, 3)
 --           )
 --   END as ModeloT,
 a.target as Meta,
    
    COALESCE(pcb.Array, 0) AS 'array',
    
    -- Multiplicação por Array para 2T
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '16:43:01' AND '17:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_1,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '17:55:00' AND '18:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_2,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '18:55:00' AND '19:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_3,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '19:55:00' AND '20:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_4,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '20:55:00' AND '21:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_5,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '21:55:00' AND '22:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_6,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '22:55:00' AND '23:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_7,
    SUM(CASE WHEN (TIME(g.log_time) BETWEEN '23:55:00' AND '23:59:59') OR (TIME(g.log_time) BETWEEN '00:00:00' AND '00:54:59') THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_8,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '00:55:00' AND '02:12:00' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_9,
    
   -- COUNT(*) AS total_qty,
    COUNT(*) * COALESCE(pcb.Array, 0) AS total
    
FROM gravacao_cn g
LEFT JOIN (
    -- Subq pra pegar apenas um modelo de cada tipo da tabela pcb_qty_array
    SELECT 
        p1.*,
        ROW_NUMBER() OVER (
            PARTITION BY 
                CASE 
                    WHEN p1.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(p1.Modelo, 1, 7)
                    WHEN p1.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(p1.Modelo, 1, 8)
                    ELSE SUBSTRING(p1.Modelo, 1, 8)
                END 
            ORDER BY p1.id
        ) as rn
    FROM pcb_qty_array p1
) pcb ON (
    -- filtro do nome dos modelos
    CASE 
        WHEN g.model_name LIKE 'Model[BSM-X____%' THEN
            SUBSTRING(g.model_name, 7, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'Model[BSM-A____%' THEN
            SUBSTRING(g.model_name, 7, 8)  -- Extrai "BSM-A075"
        WHEN g.model_name LIKE 'BSM-X____%' THEN
            SUBSTRING(g.model_name, 1, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'BSM-A____%' THEN
            SUBSTRING(g.model_name, 1, 8)  -- Extrai "BSM-A075"
        ELSE ''
    END = 
    CASE 
        WHEN pcb.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(pcb.Modelo, 1, 7)
        WHEN pcb.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(pcb.Modelo, 1, 8)
        ELSE SUBSTRING(pcb.Modelo, 1, 8)
    END
    AND pcb.rn = 1  -- Pegar apenas o primeiro registro de cada modelo
) 
 left join gravacao_cn_target a ON (
     CASE 
        WHEN a.modelo LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(a.modelo, 11, 4),
                '_',
                SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(a.modelo, 5, 4),
                '_',
                RIGHT(a.modelo, 3)
            )
    END) =
    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END

where 
-- where para a data
CASE 
        WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END = ?
GROUP BY 
    data,
    Maquina,
    Modelo,
    pcb.Modelo,
    COALESCE(pcb.Array, 0)
ORDER BY 
    data,
    Maquina,
    Modelo;
   `;
   
   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
       res.status(500).send(err);
     } else {
       res.json(result);
     }
   });
 });


// Gravação CN - 3T
app.get("/GravacaoCN3T", (req, res) => {
  const {data} = req.query;
 
   let mysql = `
  SELECT 
    CASE 
		WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END AS 'Data',
    g.machine_name AS Maquina,

    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END AS Modelo,
-- CASE 
 --       WHEN a.modelo LIKE 'Model[%' THEN
  --          CONCAT(
  -- SUBSTRING(a.modelo, 11, 4),
 --               '_',
  --              SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
   --         )
    --    ELSE
  --          CONCAT(
  --              SUBSTRING(a.modelo, 5, 4),
 --               '_',
 --               RIGHT(a.modelo, 3)
 --           )
 --   END as ModeloT,
 a.target as Meta,
    
    COALESCE(pcb.Array, 0) AS 'array',
    
    -- Multiplicação por Array para 3T
SUM(CASE WHEN TIME(g.log_time) BETWEEN '02:12:01' AND '03:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS '3T_1',
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '03:55:00' AND '04:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS '3T_2',
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '04:55:00' AND '05:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS '3T_3',
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '05:55:00' AND '06:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS '3T_4',
    
   -- COUNT(*) AS total_qty,
    COUNT(*) * COALESCE(pcb.Array, 0) AS total
    
FROM gravacao_cn g
LEFT JOIN (
    -- Subq pra pegar apenas um modelo de cada tipo da tabela pcb_qty_array
    SELECT 
        p1.*,
        ROW_NUMBER() OVER (
            PARTITION BY 
                CASE 
                    WHEN p1.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(p1.Modelo, 1, 7)
                    WHEN p1.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(p1.Modelo, 1, 8)
                    ELSE SUBSTRING(p1.Modelo, 1, 8)
                END 
            ORDER BY p1.id
        ) as rn
    FROM pcb_qty_array p1
) pcb ON (
    -- filtro do nome dos modelos
    CASE 
        WHEN g.model_name LIKE 'Model[BSM-X____%' THEN
            SUBSTRING(g.model_name, 7, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'Model[BSM-A____%' THEN
            SUBSTRING(g.model_name, 7, 8)  -- Extrai "BSM-A075"
        WHEN g.model_name LIKE 'BSM-X____%' THEN
            SUBSTRING(g.model_name, 1, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'BSM-A____%' THEN
            SUBSTRING(g.model_name, 1, 8)  -- Extrai "BSM-A075"
        ELSE ''
    END = 
    CASE 
        WHEN pcb.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(pcb.Modelo, 1, 7)
        WHEN pcb.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(pcb.Modelo, 1, 8)
        ELSE SUBSTRING(pcb.Modelo, 1, 8)
    END
    AND pcb.rn = 1  -- Pegar apenas o primeiro registro de cada modelo
) 
 left join gravacao_cn_target a ON (
     CASE 
        WHEN a.modelo LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(a.modelo, 11, 4),
                '_',
                SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(a.modelo, 5, 4),
                '_',
                RIGHT(a.modelo, 3)
            )
    END) =
    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END

where 
-- where para a data
CASE 
     WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END = ?
GROUP BY 
    data,
    Maquina,
    Modelo,
    pcb.Modelo,
    COALESCE(pcb.Array, 0)
ORDER BY 
    data,
    Maquina,
    Modelo;
   `;
   
   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
       res.status(500).send(err);
     } else {
       res.json(result);
     }
   });
 });

// GET para buscar comentários da Gravação CN
app.get("/gravacaoCN_comments", (req, res) => {
  const { data, linha, modelo, horario } = req.query;
  
  const sql = `
    SELECT * FROM gravacao_cn_comments 
    WHERE data = ? 
    AND linha = ? 
    AND modelo = ? 
    AND horario = ?
  `;
  
  db.query(sql, [data, linha, modelo, horario], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar comentário' });
    }
    res.json(result[0] || null);
  });
});

// POST/PUT para salvar/atualizar comentários da Gravação CN
app.post("/gravacaoCNUp_comments", (req, res) => {
  const { 
    data, 
    linha, 
    modelo, 
    horario, 
    comentario,
    target,      
    actual,       
    difference,   
    loss_minutes  
  } = req.body;
  
  const sql = `
    INSERT INTO gravacao_cn_comments 
    (data, linha, modelo, horario, comentario, target, actual, difference, loss_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    comentario = VALUES(comentario),
    target = VALUES(target),
    actual = VALUES(actual),
    difference = VALUES(difference),
    loss_minutes = VALUES(loss_minutes),
    data_atualizacao = CURRENT_TIMESTAMP
  `;
  
  db.query(sql, [
    data, 
    linha, 
    modelo, 
    horario, 
    comentario,
    target,
    actual,
    difference,
    loss_minutes
  ], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao salvar comentário' });
    }
    res.json({ success: true, message: 'Comentário salvo com sucesso!' });
  });
});


//---------------------------------------------------------------------
///*////----------------------------

// Definir metas como constantes para fácil manutenção
const METAS_QUALIDADE = {
  'P-AOI': 635,
  'M-AOI': 377,
  'S-AOI': 112,
  'FT': 1309,
  'TEACHING M': 2.0,
  'TEACHING S': 2.0
};

app.get("/kpi_aoi_historico", (req, res) => {
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

app.get("/kpi_aoi_atual", (req, res) => {
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



////----------------------------------------------------------------------------------------*********
// Nova Tela de Entrada e saida de material para o WIP
// ********

// Função para determinar o turno com base no horário atual
function determinarTurno() {
  const agora = new Date();
  const horas = agora.getHours();
  const minutos = agora.getMinutes();
  const segundos = agora.getSeconds();
  
  // Converter para segundos para facilitar a comparação
  const totalSegundos = horas * 3600 + minutos * 60 + segundos;
  
  // Definir os limites dos turnos em segundos
  const limite1TInicio = 6 * 3600 + 55 * 60; // 06:55:00 = 24900 segundos
  const limite1TFim = 16 * 3600 + 42 * 60 + 59; // 16:42:59 = 60179 segundos
  const limite2TInicio = 16 * 3600 + 43 * 60; // 16:43:00 = 60180 segundos
  const limite2TFim = 2 * 3600 + 11 * 60 + 55; // 02:11:55 = 7915 segundos (do dia seguinte)
  const limite3TInicio = 2 * 3600 + 12 * 60; // 02:12:00 = 7920 segundos
  const limite3TFim = 6 * 3600 + 54 * 60 + 59; // 06:54:59 = 24899 segundos
  
  // Determinar o turno com base nos horários
  if (totalSegundos >= limite1TInicio && totalSegundos <= limite1TFim) {
    return '1T';
  } else if (totalSegundos >= limite3TInicio && totalSegundos <= limite3TFim) {
    return '3T';
  } else {
    // Para o turno 2T, que cruza a meia-noite
    // Se for antes das 02:11:55 da manhã, é 2T do dia anterior
    // Se for depois das 16:43:00, é 2T do mesmo dia
    if (totalSegundos <= limite2TFim || totalSegundos >= limite2TInicio) {
      return '2T';
    }
  }
  
  // Padrão para 1T caso não se encaixe em nenhuma condição (não deve acontecer)
  return '1T';
}

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


 
  //---------------------------------------/**************////////////////////////////////////////////////////////////// */
 // Endpoint para salvar verificação de feeder
app.post("/saveNoSplicingFeederCheck", (req, res) => {
  const { data, feeder, matricula } = req.body;
  
  // Primeiro verificar se a matrícula existe na tabela de pessoas
  const checkMatriculaQuery = `SELECT funcionarios FROM mydb.pessoas WHERE matricula = ?`;
  
  db.query(checkMatriculaQuery, [matricula], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao verificar matrícula" });
    }
    
    if (result.length === 0) {
      return res.status(400).json({ success: false, message: "Matrícula não encontrada" });
    }
    
    // Se a matrícula existe, salvar o check
    const saveCheckQuery = `
      INSERT INTO mydb.no_splicing_feeder (data, feeder, matricula, nome)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      matricula = VALUES(matricula),
      nome = VALUES(nome),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    db.query(saveCheckQuery, [data, feeder, matricula, result[0].funcionarios], (err, insertResult) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Erro ao salvar verificação" });
      }
      
      res.json({ success: true, message: "Verificação salva com sucesso", nome: result[0].funcionarios, motivo: motivo });
    });
  });
});

// Endpoint para buscar verificações de feeder
app.get("/getNoSplicingFeederChecks", (req, res) => {
  const { data } = req.query;
  
  const getChecksQuery = `
    SELECT data, feeder, matricula, nome, motivo, created_at
    FROM mydb.no_splicing_feeder
    WHERE data = ?
    ORDER BY created_at DESC
  `;
  
  db.query(getChecksQuery, [data], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao buscar verificações" });
    }
    
    res.json({ success: true, data: result });
  });
});

// Endpoint para criar tabela de checks se não existir
app.get("/initNoSplicingFeederTable", (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS mydb.no_splicing_feeder (
      id INT AUTO_INCREMENT PRIMARY KEY,
      data DATE NOT NULL,
      feeder VARCHAR(50) NOT NULL,
      matricula VARCHAR(20) NOT NULL,
      nome VARCHAR(100) NOT NULL,
      motivo VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_check (data, feeder)
    )
  `;
  
  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao criar tabela" });
    }
    
    res.json({ success: true, message: "Tabela criada com sucesso" });
  });
});

// Endpoint para salvar verificação de feeder com motivo
app.post("/saveNoSplicingFeederCheckWithMotivo", (req, res) => {
  const { data, feeder, matricula, motivo, linha, equipamento, lado } = req.body;
  
  // Primeiro verificar se a matrícula existe na tabela de pessoas
  const checkMatriculaQuery = `SELECT funcionarios FROM mydb.pessoas WHERE matricula = ?`;
  
  db.query(checkMatriculaQuery, [matricula], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao verificar matrícula" });
    }
    
    if (result.length === 0) {
      return res.status(400).json({ success: false, message: "Matrícula não encontrada" });
    }
    
    // Se a matrícula existe, salvar o check
    const saveCheckQuery = `
      INSERT INTO mydb.no_splicing_feeder (data, feeder, matricula, nome, motivo, linha, equipamento, lado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      matricula = VALUES(matricula),
      nome = VALUES(nome),
      motivo = VALUES(motivo),
      linha = VALUES(linha),
      equipamento = VALUES(equipamento),
      lado = VALUES(lado),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    db.query(saveCheckQuery, [data, feeder, matricula, result[0].funcionarios, motivo, linha, equipamento, lado], (err, insertResult) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Erro ao salvar verificação" });
      }
      
      res.json({ success: true, message: "Verificação salva com sucesso", nome: result[0].funcionarios, motivo: motivo });
    });
  });
});

// Endpoint para verificar matrícula
app.get("/verifyMatricula/:matricula", (req, res) => {
  const { matricula } = req.params;
  
  // Remover espaços em branco e converter para string
  const cleanMatricula = matricula.toString().trim();
  
  const checkMatriculaQuery = `SELECT funcionarios FROM mydb.pessoas WHERE matricula = ?`;
  
  db.query(checkMatriculaQuery, [cleanMatricula], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao verificar matrícula" });
    }
    
    if (result.length === 0) {
      return res.json({ exists: false });
    }
    
    res.json({ exists: true, nome: result[0].funcionarios });
  });
});

// Endpoint para salvar indicadores diários do Splicing No Check
app.post('/splicing-nocheck-indicators', async (req, res) => {
  try {
    const {
      data,
      total_por_turno,
      worst_line,
      worst_line_qty,
      worst_feeder,
      worst_feeder_qty,
      itens_checados,
      total_registros,
      worst_motivo,
      worst_motivo_qty
    } = req.body;

    // Usar INSERT ... ON DUPLICATE KEY UPDATE para lidar com registros duplicados
    const query = `
      INSERT INTO no_splicingcheck_indicator 
      (data, total_por_turno, worst_line, worst_line_qty, worst_feeder, worst_feeder_qty, 
       itens_checados, total_registros, worst_motivo, worst_motivo_qty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      total_por_turno = VALUES(total_por_turno),
      worst_line = VALUES(worst_line),
      worst_line_qty = VALUES(worst_line_qty),
      worst_feeder = VALUES(worst_feeder),
      worst_feeder_qty = VALUES(worst_feeder_qty),
      itens_checados = VALUES(itens_checados),
      total_registros = VALUES(total_registros),
      worst_motivo = VALUES(worst_motivo),
      worst_motivo_qty = VALUES(worst_motivo_qty),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    await db.promise().query(query, [
      data,
      total_por_turno,
      worst_line,
      worst_line_qty,
      worst_feeder,
      worst_feeder_qty,
      itens_checados,
      total_registros,
      worst_motivo,
      worst_motivo_qty
    ]);

    res.status(200).json({ success: true, message: 'Indicadores salvos com sucesso' });
  } catch (err) {
    console.error('Erro ao salvar indicadores:', err);
    res.status(500).json({ success: false, message: 'Erro ao salvar indicadores' });
  }
});

// Endpoint para buscar indicadores do dashboard
app.get('/splicing-nocheck-dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM no_splicingcheck_indicator';
    let params = [];
    
    if (startDate && endDate) {
      query += ' WHERE data BETWEEN ? AND ? ORDER BY data DESC';
      params = [startDate, endDate];
    } else {
      query += ' ORDER BY data DESC LIMIT 30'; // Últimos 30 dias por padrão
    }
    
    const [rows] = await db.promise().query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar indicadores do dashboard:', err);
    res.status(500).json({ error: 'Erro ao buscar indicadores do dashboard' });
  }
});

////------------------
// Endpoint para buscar verificações de feeder
app.get("/NoSplicingRPA", (req, res) => {
  const { data } = req.query;
  
  const getChecksQuery = `
  select WORK_YMD as Data, EQUIP as Mounter, LINE_NM as Linha, SIDE as Lado, 
  date_format(WORK_DT, '%H:%i:%s') as Hora , FEEDER from mounter_eff 
  -- SELECT 
-- WORK_YMD as Data, EQUIP as Mounter, LINE_NM as Linha, SIDE as Lado, ERR_DESC as Erro, date_format(WORK_DT, '%H:%i:%s') as Hora, a.FEEDER,
-- date_format(b.updated_at, '%H:%i:%s') as Hora_check, matricula, nome, motivo
 -- FROM mydb.mounter_eff a left join no_splicing_feeder b on a.feeder = b.feeder
 -- where data = ?
 ;
  `;
  
  db.query(getChecksQuery, [data], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao buscar verificações" });
    }
    
    res.json({ success: true, data: result });
  });
});//-----------------


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
//////////////////////*---------------------------------------------------------------------------------------------------------------******------------------
//////////////////////*----------------------------------------------------------------------------------------------------------------------------------------
//////////////////////*---------------------------------------------------------------------------------*-///////////////////////*------------------------------
//////////////////////*--------------------------------------------------------------------------------

// Rota para buscar dados da tabela FT Skip Monitoring
// Pega apenas o registro MAIS RECENTE de cada linha (evita duplicados do dia)
app.get("/getFTSkipData", (req, res) => {
  const { date } = req.query;
  
  let mysql;
  if (date) {
    // Buscar dados de uma data específica - apenas o mais recente de cada linha
    mysql = `SELECT 
      a.id,
      a.line_name,
      a.building_test_count,
      a.function_test_count,
      a.model_name,
      date_format(a.collection_datetime, '%Y-%m-%d') as date,
      time_format(a.collection_datetime, '%H:%i:%s') as time,
      date_format(a.created_at, '%Y-%m-%d %H:%i:%s') as created_at
    FROM mydb.ft_skip a
    INNER JOIN (
      SELECT line_name, MAX(collection_datetime) as max_datetime
      FROM mydb.ft_skip
      WHERE date_format(collection_datetime, '%Y-%m-%d') = ?
      GROUP BY line_name
    ) b ON a.line_name = b.line_name AND a.collection_datetime = b.max_datetime
    ORDER BY a.line_name ASC;`;
    db.query(mysql, [date], (err, result) => {
      if (err) {
        console.error("Erro ao buscar dados FT Skip:", err);
        res.status(500).json({ error: "Erro ao buscar dados" });
      } else {
        res.json(result);
      }
    });
  } else {
    // Buscar dados do dia atual - apenas o mais recente de cada linha
    mysql = `SELECT 
      a.id,
      a.line_name,
      a.building_test_count,
      a.function_test_count,
      a.model_name,
      date_format(a.collection_datetime, '%Y-%m-%d') as date,
      time_format(a.collection_datetime, '%H:%i:%s') as time,
      date_format(a.created_at, '%Y-%m-%d %H:%i:%s') as created_at
    FROM mydb.ft_skip a
    INNER JOIN (
      SELECT line_name, MAX(collection_datetime) as max_datetime
      FROM mydb.ft_skip
      WHERE date_format(collection_datetime, '%Y-%m-%d') = CURDATE()
      GROUP BY line_name
    ) b ON a.line_name = b.line_name AND a.collection_datetime = b.max_datetime
    ORDER BY a.line_name ASC;`;
    db.query(mysql, (err, result) => {
      if (err) {
        console.error("Erro ao buscar dados FT Skip:", err);
        res.status(500).json({ error: "Erro ao buscar dados" });
      } else {
        res.json(result);
      }
    });
  }
});



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



















//---------------------------------------------------------------------
// Endpoint LobMounter - Busca dados da tabela lob_npm para monitoramento de LOB
// Parâmetros: data (YYYY-MM-DD), shift (turno), line_name (nome da linha)
//---------------------------------------------------------------------

// Endpoint otimizado LobMounter - Busca dados da tabela lob_npm para monitoramento de LOB
// Parâmetros: data (YYYY-MM-DD), shift (turno), line_name (nome da linha)
// OTIMIZAÇÃO: Usa índice composto (log_date, shift, line_name) para busca rápida
app.get("/LobMounter", (req, res) => {
  const { data, shift, line_name } = req.query;
  
  // Query otimizada com uso de índices
  let mysql = `
    SELECT 
      mc_no, 
      CAST(ctime AS DECIMAL(10,2)) as ctime, 
      line_name, 
      lane, 
      bneck, 
      lot_name 
    FROM mydb.lob_npm 
    WHERE 1=1
  `;
  const params = [];
  
  // Ordem dos filtros é importante para usar o índice composto
  if (data) {
    mysql += " AND log_date = ?";
    params.push(data);
  }
  
  if (shift) {
    mysql += " AND shift = ?";
    params.push(shift);
  }
  
  if (line_name) {
    mysql += " AND line_name = ?";
    params.push(line_name);
  }
  
  // Ordenação otimizada
  mysql += " ORDER BY line_name, mc_no";
  
  // Usar query com promise para melhor performance
  db.query(mysql, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dados do LobMounter:", err);
      res.status(500).json({ error: "Erro ao buscar dados", message: err.message });
    } else {
      res.json(result);
    }
  });
});


// ==========================================

app.get("/LobMounter/init-indexes", (req, res) => {
  const createIndexQueries = [
    // Índice composto para otimizar as buscas principais
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_date_shift_line ON mydb.lob_npm (log_date, shift, line_name)`,
    // Índice para busca apenas por data
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_date ON mydb.lob_npm (log_date)`,
    // Índice para busca por data e turno
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_date_shift ON mydb.lob_npm (log_date, shift)`,
    // Índice para ordenação
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_line_mc ON mydb.lob_npm (line_name, mc_no)`
  ];
  
  let completed = 0;
  const results = [];
  
  createIndexQueries.forEach((query, index) => {
    db.query(query, (err, result) => {
      if (err) {
        console.error(`Erro ao criar índice ${index + 1}:`, err);
        results.push({ index: index + 1, success: false, error: err.message });
      } else {
        console.log(`Índice ${index + 1} criado/atualizado com sucesso`);
        results.push({ index: index + 1, success: true });
      }
      completed++;
      
      if (completed === createIndexQueries.length) {
        res.json({ 
          message: "Processo de criação de índices concluído",
          results: results
        });
      }
    });
  });
});


///-----------------******************---------------------------------------------------------------------------------------
// ============================================================================
// ======================== ROTAS REPARO TNP IA COMPLETAS =======================
// ============================================================================

// ============================================================================
// ======================== ROTAS REPARO TNP IA (APENAS LEITURA) ===============
// ============================================================================

// Função auxiliar para gerar resposta fallback rica (sem IA)
const gerarRespostaFallback = (cases, totalCases, goodCount, ngCount, scrapCount, modelosUnicos, tecnicosUnicos, message = '') => {
  // Detectar tipo de pergunta
  const isQuantityQuestion = /(?:quantos|quantas|qual quantidade|quantidade|total de|número de|contagem)/i.test(message);
  const isTechQuestion = /(?:tecnicos|técnicos|tecnico|técnico)/i.test(message);
  const isMonthQuestion = /(?:janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i.test(message);
  
  // Extrair mês mencionado (se houver)
  const monthNames = {
    'janeiro': 1, 'fevereiro': 2, 'marco': 3, 'março': 3,
    'abril': 4, 'maio': 5, 'junho': 6,
    'julho': 7, 'agosto': 8, 'setembro': 9,
    'outubro': 10, 'novembro': 11, 'dezembro': 12
  };
  
  let monthFilter = null;
  Object.keys(monthNames).forEach(month => {
    if (message.toLowerCase().includes(month)) {
      monthFilter = monthNames[month];
    }
  });
  
  // Filtrar casos por mês se necessário
  let filteredCases = cases;
  if (monthFilter) {
    filteredCases = cases.filter(c => c.mes_numero === monthFilter);
  }
  
  // Recalcular estatísticas com filtro
  const filteredTotal = filteredCases.length;
  const filteredGood = filteredCases.filter(c => c.resultado && c.resultado.toLowerCase().includes('good')).length;
  const filteredNg = filteredCases.filter(c => c.resultado && c.resultado.toLowerCase().includes('ng')).length;
  const filteredScrap = filteredCases.filter(c => c.resultado && c.resultado.toLowerCase().includes('scrap')).length;
  const filteredTecnicos = [...new Set(filteredCases.map(c => c.tecnico).filter(t => t))];
  
  // Respostas para perguntas de quantidade
  if (isQuantityQuestion) {
    if (isTechQuestion) {
      return `Foram encontrados **${filteredTecnicos.length} técnicos** diferentes no período.${monthFilter ? ` Em ${Object.keys(monthNames).find(k => monthNames[k] === monthFilter)}: **${filteredTecnicos.length} técnicos**.` : ''}

**Técnicos registrados:**
${filteredTecnicos.map(t => `- ${t}`).join('\n')}

**Distribuição por técnico:**
${filteredTecnicos.map(t => {
  const techCases = filteredCases.filter(c => c.tecnico === t);
  const techGood = techCases.filter(c => c.resultado && c.resultado.toLowerCase().includes('good')).length;
  return `- **${t}**: ${techCases.length} casos (${techGood} good, ${techCases.length - techGood} pendentes)`;
}).join('\n')}`;
    }
    
    if (message.toLowerCase().includes('good') || message.toLowerCase().includes('ok')) {
      return `Foram **${filteredGood} placas** com resultado Good no período.${monthFilter ? ` (${filteredTotal} total no mês)` : ''}`;
    }
    
    if (message.toLowerCase().includes('ng')) {
      return `Foram **${filteredNg} placas** com resultado NG no período.${monthFilter ? ` (${filteredTotal} total no mês)` : ''}`;
    }
    
    if (message.toLowerCase().includes('scrap')) {
      return `Foram **${filteredScrap} placas** com resultado Scrap no período.${monthFilter ? ` (${filteredTotal} total no mês)` : ''}`;
    }
    
    // Pergunta genérica de quantidade
    return `Foram encontrados **${filteredTotal} casos** no total.${monthFilter ? ` no período de ${Object.keys(monthNames).find(k => monthNames[k] === monthFilter)}` : ''}

**Distribuição por resultado:**
- Good: **${filteredGood}**
- NG: **${filteredNg}**
- Scrap: **${filteredScrap}**
- Pendentes: **${filteredTotal - filteredGood - filteredNg - filteredScrap}**`;
  }
  
  // Resposta fallback padrão
  let reply = `Encontrei **${filteredTotal} casos** no histórico de reparos.${monthFilter ? ` (${Object.keys(monthNames).find(k => monthNames[k] === monthFilter)})` : ''}

**Estatísticas:**
- Total: **${filteredTotal} casos**
- Good: **${filteredGood}** (${filteredTotal > 0 ? Math.round((filteredGood / filteredTotal) * 100) : 0}%)
- NG: **${filteredNg}**
- Scrap: **${filteredScrap}**

**Modelos relacionados:** ${modelosUnicos.slice(0, 5).join(', ') || 'N/A'}
**Técnicos:** ${filteredTecnicos.slice(0, 5).join(', ') || 'N/A'}

**Principais defeitos encontrados:**
${[...new Set(filteredCases.map(c => c.defeito).filter(d => d))].slice(0, 5).map(d => `- ${d}`).join('\n') || '- Nenhum defeito registrado'}

**Componentes mais trocados:**
${[...new Set(filteredCases.map(c => c.componente).filter(c => c))].slice(0, 5).map(c => `- ${c}`).join('\n') || '- Nenhuma troca registrada'}

Veja os casos históricos na tabela para mais detalhes.`;

  return reply;
};

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

// ///--------- 
//---------------- Plan vs Result Hourly
app.get("/planVsResultHourly", (req, res) => {
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
 