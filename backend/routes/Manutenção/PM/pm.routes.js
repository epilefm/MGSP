const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('PM');

//------------------------------------------------
//------------------------------------------------
//------------------------------------------------
 //------------------------------------------------         TELA DE PM --------------------------------------

// GET PMs
router.get('/pms', requireScreen, async (req, res) => {
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
router.get('/tower-lamps', requireScreen, async (req, res) => {
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
router.get('/tower-lamps/:id', requireScreen, async (req, res) => {
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
router.post('/tower-lamps', requireScreen, async (req, res) => {
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
router.put('/tower-lamps/:id', requireScreen, async (req, res) => {
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
router.delete('/tower-lamps/:id', requireScreen, async (req, res) => {
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
router.get('/tower-lamp-stats', requireScreen, async (req, res) => {
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
router.get('/pms/:id', requireScreen, async (req, res) => {
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
router.post('/pms', requireScreen, async (req, res) => {
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
router.put('/pms/:id', requireScreen, async (req, res) => {
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
router.delete('/pms/:id', requireScreen, async (req, res) => {
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
router.get('/available-years', requireScreen, async (req, res) => {
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
router.get('/stats', requireScreen, async (req, res) => {
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
router.post('/schedule', requireScreen, async (req, res) => {
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

module.exports = router;
