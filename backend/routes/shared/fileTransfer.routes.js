const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { Transform, Readable } = require("stream");
const upload = require("../../shared/upload");

///----------------- Aplicação Anti Nasca ------------------
// Configuração do multer para upload de arquivos em memória (sem salvar em disco)

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

router.post('/api/process', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
  }

  const mode = req.body.mode || 'BINARY';
  const originalName = req.file.originalname;
  const destPath = path.join(__dirname, '..', '..', 'downloads', `processed_${Date.now()}${path.extname(originalName)}`);

  const downloadDir = path.join(__dirname, '..', '..', 'downloads');
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

router.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, '..', '..', 'downloads', filename);

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

module.exports = router;
