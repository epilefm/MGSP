import React, { useState } from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { Box, Typography } from '@mui/material';

const API_BASE_URL = 'http://105.103.39.102:8080';

export default function DescriptN() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedMode, setSelectedMode] = useState('BINARY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setMessage({ text: '', type: '' });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files[0]);
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('mode', selectedMode);

    try {
      const response = await fetch(`${API_BASE_URL}/api/process`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Baixar o arquivo como blob para permitir escolha de destino
        const downloadResponse = await fetch(`${API_BASE_URL}/api/download/${data.filename}`);
        const blob = await downloadResponse.blob();
        
        // Criar link para download com escolha de destino
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        
        setMessage({ 
          text: '✅ Arquivo processado com sucesso! Download iniciado.', 
          type: 'success' 
        });
        resetForm();
      } else {
        setMessage({ text: `❌ Erro: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: `❌ Erro na conexão: ${error.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedMode('BINARY');
    setMessage({ text: '', type: '' });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Container fluid style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #ffffff 0%, #bbbbbb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card style={{
        maxWidth: '500px',
        width: '100%',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: 'none'
      }}>
        <Card.Body style={{ padding: '40px' }}>
          <Box sx={{ textAlign: 'center', marginBottom: '30px' }}>
            <Typography variant="h4" sx={{ color: '#333', fontWeight: 'bold', marginBottom: '10px' }}>
              🔐 Descriptografador FTP
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Processe seus arquivos encriptografados
            </Typography>
          </Box>

          {/* Upload Area */}
          <div
            onClick={() => document.getElementById('fileInput').click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${isDragging ? '#764ba2' : '#667eea'}`,
              borderRadius: '8px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: isDragging ? '#ddd6ff' : '#f8f9ff',
              opacity: selectedFile ? 0.6 : 1
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📁</div>
            <div style={{ color: '#333', fontWeight: '600', marginBottom: '5px' }}>
              {selectedFile ? selectedFile.name : 'Arraste seu arquivo aqui ou clique para selecionar'}
            </div>
            {!selectedFile && (
              <div style={{ color: '#999', fontSize: '12px' }}>
                Qualquer tipo de arquivo é suportado
              </div>
            )}
            {selectedFile && (
              <div style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                📄 {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </div>
            )}
            <input
              type="file"
              id="fileInput"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Mode Selector */}
          {selectedFile && (
            <>
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginTop: '20px' 
              }}>
                <button
                  onClick={() => handleModeSelect('BINARY')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: `2px solid ${selectedMode === 'BINARY' ? '#667eea' : '#ddd'}`,
                    background: selectedMode === 'BINARY' ? '#667eea' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    color: selectedMode === 'BINARY' ? 'white' : '#666'
                  }}
                >
                  BINARY
                </button>
                <button
                  onClick={() => handleModeSelect('ASCII')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: `2px solid ${selectedMode === 'ASCII' ? '#667eea' : '#ddd'}`,
                    background: selectedMode === 'ASCII' ? '#667eea' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    color: selectedMode === 'ASCII' ? 'white' : '#666'
                  }}
                >
                  ASCII
                </button>
              </div>

              {/* Process Button */}
              <Button
                onClick={handleProcess}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '14px',
                  marginTop: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  opacity: isProcessing ? 0.6 : 1,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessing ? (
                  <>
                    <span 
                      style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '50%',
                        borderTopColor: 'white',
                        animation: 'spin 0.8s linear infinite',
                        marginRight: '8px',
                        verticalAlign: 'middle'
                      }}
                    />
                    Processando...
                  </>
                ) : (
                  'Processar Arquivo'
                )}
              </Button>
            </>
          )}

          {/* Message */}
          {message.text && (
            <Alert 
              variant={message.type === 'success' ? 'success' : 'danger'}
              style={{ 
                marginTop: '20px',
                animation: 'slideIn 0.3s ease'
              }}
            >
              {message.text}
            </Alert>
          )}

          {/* Reset Button */}
          {selectedFile && !isProcessing && (
            <Button
              onClick={resetForm}
              variant="outline-secondary"
              style={{
                marginTop: '10px',
                padding: '10px',
                width: '100%',
                backgroundColor: '#f0f0f0',
                border: 'none',
                borderRadius: '6px',
                color: '#666',
                fontSize: '14px'
              }}
            >
              Nova Operação
            </Button>
          )}
        </Card.Body>
      </Card>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Container>
  );
}
