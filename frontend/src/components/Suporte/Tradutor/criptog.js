import { API_URL } from '../../../config/api';
import React, { useState, useCallback } from 'react';
import axios from 'axios';

// API_URL aponta para o proprio servidor (mesma origem)

function Tradutor() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [selectedDir, setSelectedDir] = useState(null);
  const [dirName, setDirName] = useState('');
  const [decryptedBlob, setDecryptedBlob] = useState(null);


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setSuccess('');
      setDownloadUrl('');
      setFileInfo({
        name: selectedFile.name,
        size: formatFileSize(selectedFile.size),
        type: selectedFile.type || 'Desconhecido'
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUploadAndDecrypt = useCallback(async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo primeiro.');
      return;
    }

    setUploading(true);
    setDecrypting(true);
    setProgress('Enviando arquivo...');
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload e descriptografia em uma única requisição
      const response = await axios.post(`${API_URL}/criptografia/decrypt-direct`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(`Enviando: ${percentCompleted}%`);
        },
      });

      // Cria blob e armazena para salvar depois
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      setDecryptedBlob(blob);
      
      // Cria URL temporária para preview/download alternativo
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      // Extrai nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'arquivo_decrypted';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      setSuccess(`Arquivo descriptografado com sucesso!`);
      setFileInfo(prev => ({
        ...prev,
        decryptedName: filename
      }));
      setProgress('Descriptografia concluída!');
      
      // Download automático após descriptografia
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporária após alguns segundos
      setTimeout(() => window.URL.revokeObjectURL(url), 100);



    } catch (err) {
      console.error('Erro:', err);
      setError(err.response?.data?.error || 'Erro ao processar arquivo. Verifique se o backend está rodando.');
    } finally {
      setUploading(false);
      setDecrypting(false);
    }
  }, [file]);

  const handleSelectDir = async () => {
    try {
      // Verifica se a API File System Access está disponível (Chrome/Edge)
      if (window.showDirectoryPicker) {
        const dirHandle = await window.showDirectoryPicker();
        setSelectedDir(dirHandle);
        setDirName(dirHandle.name);
        setSuccess(`Pasta selecionada: ${dirHandle.name}`);
      } else {
        // Fallback: usa input webkitdirectory para navegadores sem suporte
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = (e) => {
          if (e.target.files.length > 0) {
            const fakePath = e.target.files[0].webkitRelativePath;
            const folderName = fakePath.split('/')[0];
            setDirName(folderName);
            setSelectedDir({ fallback: true, folderName });
            setSuccess(`Pasta selecionada: ${folderName}`);
          }
        };
        input.click();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao selecionar pasta:', err);
        setError('Não foi possível selecionar a pasta.');
      }
    }
  };

  const handleSaveToDir = async () => {
    if (!decryptedBlob || !fileInfo?.decryptedName) {
      setError('Nenhum arquivo descriptografado para salvar.');
      return;
    }

    try {
      // Se a API File System Access está disponível
      if (selectedDir && !selectedDir.fallback) {
        const fileHandle = await selectedDir.getFileHandle(fileInfo.decryptedName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(decryptedBlob);
        await writable.close();
        setSuccess(`✅ Arquivo salvo em: ${selectedDir.name}/${fileInfo.decryptedName}`);
      } else {
        // Fallback: download normal (navegadores sem File System Access)
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', fileInfo.decryptedName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSuccess('Arquivo baixado! (Seu navegador não suporta seleção de pasta, usando download padrão.)');
      }
    } catch (err) {
      console.error('Erro ao salvar arquivo:', err);
      setError('Erro ao salvar arquivo na pasta selecionada.');
    }
  };

  const handleDownload = () => {
    if (downloadUrl && fileInfo?.decryptedName) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileInfo.decryptedName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClear = () => {
    setFile(null);
    setError('');
    setSuccess('');
    setDownloadUrl('');
    setProgress('');
    setFileInfo(null);
    setSelectedDir(null);
    setDirName('');
    setDecryptedBlob(null);
  };


  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <header style={styles.header}>
          <div style={styles.icon}>🔓</div>
          <h1 style={styles.title}>FTP Decryptor</h1>
          <p style={styles.subtitle}>Remova a criptografia NASCA de seus arquivos</p>
        </header>

        <div style={styles.uploadSection}>
          <label style={styles.uploadLabel}>
            <input
              type="file"
              onChange={handleFileChange}
              style={styles.fileInput}
              disabled={uploading}
            />
            <div style={styles.uploadBox}>
              <span style={styles.uploadIcon}>📁</span>
              <span style={styles.uploadText}>
                {file ? file.name : 'Clique ou arraste um arquivo aqui'}
              </span>
            </div>
          </label>

          {fileInfo && (
            <div style={styles.fileInfo}>
              <div style={styles.fileInfoRow}>
                <span style={styles.fileInfoLabel}>Arquivo:</span>
                <span style={styles.fileInfoValue}>{fileInfo.name}</span>
              </div>
              <div style={styles.fileInfoRow}>
                <span style={styles.fileInfoLabel}>Tamanho:</span>
                <span style={styles.fileInfoValue}>{fileInfo.size}</span>
              </div>
              {fileInfo.decryptedName && (
                <div style={styles.fileInfoRow}>
                  <span style={styles.fileInfoLabel}>Saída:</span>
                  <span style={styles.fileInfoValue}>{fileInfo.decryptedName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seção de seleção de pasta para salvar */}
        <div style={styles.dirSection}>
          <button
            onClick={handleSelectDir}
            style={{...styles.button, ...styles.dirButton}}
          >
            📂 Selecionar pasta para salvar
          </button>
          {dirName && (
            <div style={styles.dirInfo}>
              <span style={styles.dirIcon}>📁</span>
              <span style={styles.dirName}>{dirName}</span>
            </div>
          )}
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={handleUploadAndDecrypt}
            disabled={!file || uploading}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              ...((!file || uploading) ? styles.buttonDisabled : {})
            }}
          >
            {uploading ? '⏳ Processando...' : '🔓 Descriptografar Arquivo'}
          </button>
          
          {downloadUrl && selectedDir && (
            <button
              onClick={handleSaveToDir}
              style={{...styles.button, ...styles.successButton}}
            >
              💾 Salvar na pasta selecionada
            </button>
          )}
          
          {downloadUrl && !selectedDir && (
            <button
              onClick={handleDownload}
              style={{...styles.button, ...styles.successButton}}
            >
              ⬇️ Baixar Arquivo
            </button>
          )}
          
          <button
            onClick={handleClear}
            style={{...styles.button, ...styles.secondaryButton}}
          >
            🗑️ Limpar
          </button>
        </div>


        {progress && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div style={styles.progressFill}></div>
            </div>
            <p style={styles.progressText}>{progress}</p>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            <span style={styles.successIcon}>✅</span>
            <span>{success}</span>
          </div>
        )}

        <footer style={styles.footer}>
          <p>Baseado no protocolo FTP - Conversão CRLF ↔ LF</p>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: 'linear-gradient(145deg, #1e1e2f 0%, #2d2d44 100%)',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  title: {
    color: '#fff',
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#888',
    fontSize: '14px',
  },
  uploadSection: {
    marginBottom: '25px',
  },
  uploadLabel: {
    display: 'block',
    cursor: 'pointer',
  },
  fileInput: {
    display: 'none',
  },
  uploadBox: {
    border: '2px dashed #444',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  uploadIcon: {
    fontSize: '32px',
    display: 'block',
    marginBottom: '10px',
  },
  uploadText: {
    color: '#888',
    fontSize: '14px',
  },
  fileInfo: {
    marginTop: '15px',
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
  },
  fileInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '13px',
  },
  fileInfoLabel: {
    color: '#888',
  },
  fileInfoValue: {
    color: '#fff',
    fontWeight: '500',
  },
  dirSection: {
    marginBottom: '20px',
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
    border: '1px dashed rgba(255, 255, 255, 0.2)',
  },
  dirButton: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#fff',
    width: '100%',
  },
  dirInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '12px',
    padding: '10px',
    background: 'rgba(76, 175, 80, 0.1)',
    borderRadius: '6px',
  },
  dirIcon: {
    fontSize: '18px',
  },
  dirName: {
    color: '#4caf50',
    fontWeight: '500',
    fontSize: '14px',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },

  button: {
    padding: '14px 24px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
  },
  successButton: {
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    color: '#fff',
  },
  secondaryButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  progressContainer: {
    marginBottom: '15px',
  },
  progressBar: {
    height: '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    animation: 'pulse 1.5s infinite',
  },
  progressText: {
    color: '#888',
    fontSize: '12px',
    textAlign: 'center',
    marginTop: '8px',
  },
  errorBox: {
    background: 'rgba(244, 67, 54, 0.1)',
    border: '1px solid rgba(244, 67, 54, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#f44336',
    fontSize: '13px',
  },
  errorIcon: {
    fontSize: '16px',
  },
  successBox: {
    background: 'rgba(76, 175, 80, 0.1)',
    border: '1px solid rgba(76, 175, 80, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#4caf50',
    fontSize: '13px',
  },
  successIcon: {
    fontSize: '16px',
  },
  footer: {
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
};

export default Tradutor;
