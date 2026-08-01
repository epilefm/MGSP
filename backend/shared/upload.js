const multer = require('multer');

// Configuração do multer para upload de arquivos em memória (sem salvar em disco)
const upload = multer({ storage: multer.memoryStorage() });

module.exports = upload;
