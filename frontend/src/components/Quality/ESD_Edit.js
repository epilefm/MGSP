import { API_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper, TableContainer, Table, TableHead, TableBody, TableRow,
  TableCell, TablePagination, TextField, Button, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Typography, Box, Snackbar, Alert
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import NavbarComp from '../Layout/NavbarComp';

const CrudTable = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'funcionarios', label: 'Funcionário' },
    { id: 'matricula', label: 'Matrícula' },
    { id: 'turno', label: 'Turno' },
    { id: 'ESD', label: 'ESD' },
    { id: 'actions', label: 'Ações' }
  ];

  const [newItem, setNewItem] = useState({
    funcionarios: '',
    matricula: '',
    turno: '',
    ESD: ''
  });

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/ESD_Edit`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      showSnackbar('Erro ao carregar dados', 'error');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = async () => {
    try {
      const response = await axios.post(`${API_URL}/ESD_Edit`, newItem);
      if (response.data.success) {
        showSnackbar('Registro criado com sucesso!');
        setOpenDialog(false);
        setNewItem({ funcionarios: '', matricula: '', turno: '', ESD: '' });
        fetchData();
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Erro ao criar registro', 'error');
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.put(`${API_URL}/ESD_Edit/${editingItem.id}`, editingItem);
      if (response.data.success) {
        showSnackbar('Registro atualizado com sucesso!');
        setOpenDialog(false);
        setEditingItem(null);
        fetchData();
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Erro ao atualizar registro', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`${API_URL}/ESD_Edit/${itemToDelete}`);
      if (response.data.success) {
        showSnackbar('Registro excluído com sucesso!');
        setConfirmationOpen(false);
        fetchData();
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Erro ao excluir registro', 'error');
    }
  };

  return (
    <>
      <NavbarComp />
      <Paper sx={{ margin: 3, padding: 2 }}>
        {/* Cabeçalho e Botão de Adicionar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Gerenciamento ESD</Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => {
              setEditingItem(null);
              setOpenDialog(true);
            }}
          >
            Adicionar
          </Button>
        </Box>

      {/* Tabela Principal */}
      <TableContainer>
        <Table>
          <TableHead style={{backgroundColor:'transparent'}}>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} sx={{ fontWeight: 'bold' }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => {
                  if (col.id === 'actions') {
                    return (
                      <TableCell key="actions">
                        <IconButton 
                          onClick={() => {
                            setEditingItem(row);
                            setOpenDialog(true);
                          }}
                        >
                          <Edit color="primary" />
                        </IconButton>
                        <IconButton 
                          onClick={() => {
                            setItemToDelete(row.id);
                            setConfirmationOpen(true);
                          }}
                        >
                          <Delete color="error" />
                        </IconButton>
                      </TableCell>
                    );
                  }
                  return <TableCell key={col.id}>{row[col.id]}</TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Componentes de Diálogo e Notificação */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingItem ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            <TextField
              label="Funcionário"
              fullWidth
              value={editingItem?.funcionarios || newItem.funcionarios}
              onChange={(e) => editingItem 
                ? setEditingItem({...editingItem, funcionarios: e.target.value})
                : setNewItem({...newItem, funcionarios: e.target.value})}
            />
            
            <TextField
              label="Matrícula"
              fullWidth
              value={editingItem?.matricula || newItem.matricula}
              onChange={(e) => editingItem 
                ? setEditingItem({...editingItem, matricula: e.target.value})
                : setNewItem({...newItem, matricula: e.target.value})}
            />
            
            <TextField
              select
              label="Turno"
              fullWidth
              SelectProps={{ native: true }}
              value={editingItem?.turno || newItem.turno}
              onChange={(e) => editingItem 
                ? setEditingItem({...editingItem, turno: e.target.value})
                : setNewItem({...newItem, turno: e.target.value})}
            >
              <option value=""></option>
              <option value="1T">1T</option>
              <option value="1T Especial">1T Especial</option>
              <option value="2T">2T</option>
              <option value="2T Especial">2T Especial</option>
              <option value="3T">3T</option>
            </TextField>

            <TextField
              select
              label="ESD"
              fullWidth
              SelectProps={{ native: true }}
              value={editingItem?.ESD || newItem.ESD}
              onChange={(e) => editingItem 
                ? setEditingItem({...editingItem, ESD: e.target.value})
                : setNewItem({...newItem, ESD: e.target.value})}
            >
              <option value=""></option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditingItem(null);
          }}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={editingItem ? handleUpdate : handleCreate}
            disabled={
              !(editingItem?.funcionarios || newItem.funcionarios) ||
              !(editingItem?.matricula || newItem.matricula) ||
              !(editingItem?.turno || newItem.turno) ||
              !(editingItem?.ESD || newItem.ESD)
            }
          >
            {editingItem ? 'Salvar Alterações' : 'Criar Registro'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmationOpen} onClose={() => setConfirmationOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja excluir este registro permanentemente?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Confirmar Exclusão
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
    </>
  );
};

export default CrudTable;
