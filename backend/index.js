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

//---------------------------------------------------------------------




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
 