import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Table, Button, Modal, Form, Badge, Container, Row, Col } from "react-bootstrap";
import { API_URL } from "../../config/api";

const NOME_GRUPO = {
  material: "Material",
  quality: "Qualidade",
  repair: "Reparo",
  production: "Produção",
  maintenance: "Manutenção",
  support: "Suporte",
  inovacao: "Inovação",
};

export default function AdminPanel() {
  const [usuarios, setUsuarios] = useState([]);
  const [telas, setTelas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [selecionadas, setSelecionadas] = useState(new Set());
  const [salvando, setSalvando] = useState(false);

  const [usuarioResetando, setUsuarioResetando] = useState(null);
  const [novaSenha, setNovaSenha] = useState("");

  const carregarDados = async () => {
    setCarregando(true);
    setErro("");
    try {
      const [resUsuarios, resTelas] = await Promise.all([
        axios.get(`${API_URL}/admin/usuarios`),
        axios.get(`${API_URL}/admin/telas`),
      ]);
      setUsuarios(resUsuarios.data);
      setTelas(resTelas.data);
    } catch (err) {
      setErro(err.response?.data?.message || "Erro ao carregar dados do painel");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const telasPorGrupo = useMemo(() => {
    const grupos = {};
    telas.forEach((tela) => {
      if (!grupos[tela.grupo]) grupos[tela.grupo] = [];
      grupos[tela.grupo].push(tela);
    });
    return grupos;
  }, [telas]);

  const abrirEdicaoTelas = (usuario) => {
    const idsAtuais = telas
      .filter((t) => usuario.telas_liberadas.includes(t.slug))
      .map((t) => t.id);
    setUsuarioEditando(usuario);
    setSelecionadas(new Set(idsAtuais));
  };

  const alternarTela = (screenId) => {
    setSelecionadas((prev) => {
      const novo = new Set(prev);
      if (novo.has(screenId)) novo.delete(screenId);
      else novo.add(screenId);
      return novo;
    });
  };

  const salvarTelas = async () => {
    setSalvando(true);
    try {
      await axios.post(`${API_URL}/admin/usuarios/${usuarioEditando.id}/telas`, {
        screenIds: Array.from(selecionadas),
      });
      setUsuarioEditando(null);
      await carregarDados();
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao salvar telas");
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (usuario) => {
    try {
      await axios.post(`${API_URL}/admin/usuarios/${usuario.id}/ativo`, { ativo: !usuario.ativo });
      await carregarDados();
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao atualizar usuário");
    }
  };

  const confirmarResetSenha = async () => {
    if (!novaSenha || novaSenha.length < 4) {
      alert("Informe uma senha com pelo menos 4 caracteres");
      return;
    }
    try {
      await axios.post(`${API_URL}/admin/usuarios/${usuarioResetando.id}/reset-senha`, { novaSenha });
      setUsuarioResetando(null);
      setNovaSenha("");
      await carregarDados();
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao redefinir senha");
    }
  };

  if (carregando) {
    return <Container className="text-center" style={{ marginTop: 60 }}>Carregando painel administrativo...</Container>;
  }

  return (
    <Container fluid style={{ padding: "30px 40px" }}>
      <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Administração de Usuários</h3>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Escolha quais telas cada pessoa pode acessar. Contas novas começam sem nenhuma tela liberada.
      </p>

      {erro && <div style={{ color: "#c62828", marginBottom: 16 }}>{erro}</div>}

      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Matrícula</th>
            <th>Status</th>
            <th>Telas liberadas</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td>
                {usuario.nome}
                {usuario.is_admin && <Badge bg="primary" style={{ marginLeft: 8 }}>admin</Badge>}
                {usuario.reset_solicitado && <Badge bg="warning" text="dark" style={{ marginLeft: 8 }}>pediu redefinir senha</Badge>}
              </td>
              <td>{usuario.matricula}</td>
              <td>
                <Badge bg={usuario.ativo ? "success" : "secondary"}>
                  {usuario.ativo ? "ativo" : "desativado"}
                </Badge>
              </td>
              <td>
                {usuario.is_admin ? (
                  <span style={{ color: "#666" }}>acesso total</span>
                ) : (
                  <span>{usuario.telas_liberadas.length} tela(s)</span>
                )}
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                <Button size="sm" variant="outline-primary" onClick={() => abrirEdicaoTelas(usuario)} disabled={usuario.is_admin} style={{ marginRight: 6 }}>
                  Telas
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setUsuarioResetando(usuario)} style={{ marginRight: 6 }}>
                  Redefinir senha
                </Button>
                <Button size="sm" variant={usuario.ativo ? "outline-danger" : "outline-success"} onClick={() => alternarAtivo(usuario)}>
                  {usuario.ativo ? "Desativar" : "Ativar"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal de concessão de telas */}
      <Modal show={!!usuarioEditando} onHide={() => setUsuarioEditando(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Telas de {usuarioEditando?.nome}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {Object.keys(telasPorGrupo).map((grupo) => (
            <div key={grupo} style={{ marginBottom: 18 }}>
              <h6 style={{ color: "#1d44aa", fontWeight: 700 }}>{NOME_GRUPO[grupo] || grupo}</h6>
              <Row>
                {telasPorGrupo[grupo].map((tela) => (
                  <Col md={6} key={tela.id}>
                    <Form.Check
                      type="checkbox"
                      id={`tela-${tela.id}`}
                      label={tela.is_public ? `${tela.nome} (pública)` : tela.nome}
                      checked={tela.is_public || selecionadas.has(tela.id)}
                      disabled={tela.is_public}
                      onChange={() => alternarTela(tela.id)}
                    />
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setUsuarioEditando(null)}>Cancelar</Button>
          <Button variant="primary" onClick={salvarTelas} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de redefinir senha */}
      <Modal show={!!usuarioResetando} onHide={() => setUsuarioResetando(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Redefinir senha de {usuarioResetando?.nome}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nova senha</Form.Label>
            <Form.Control
              type="text"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Digite a nova senha"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setUsuarioResetando(null)}>Cancelar</Button>
          <Button variant="primary" onClick={confirmarResetSenha}>Redefinir</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
