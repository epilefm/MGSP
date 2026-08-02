import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Table, Modal, Button, Tag, Checkbox, Input, Space, Typography, message } from "antd";
import { ArrowLeft, KeyRound, ShieldCheck, History } from "lucide-react";
import { API_URL } from "../../config/api";
import { useTema, CORES } from "../../theme/ThemeContext";
import ThemeToggle from "../../theme/ThemeToggle";

const { Title, Text } = Typography;

const NOME_GRUPO = {
  material: "Material",
  quality: "Qualidade",
  repair: "Reparo",
  production: "Produção",
  maintenance: "Manutenção",
  support: "Suporte",
  inovacao: "Inovação",
};

const ONLINE_LIMITE_MS = 3 * 60 * 1000; // considera "online agora" se acessou nos últimos 3 min

function formatarQuando(dataIso) {
  if (!dataIso) return "nunca acessou";
  const data = new Date(dataIso);
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function estaOnline(dataIso) {
  if (!dataIso) return false;
  return Date.now() - new Date(dataIso).getTime() < ONLINE_LIMITE_MS;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { tema } = useTema();
  const cores = CORES[tema];

  const [usuarios, setUsuarios] = useState([]);
  const [telas, setTelas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

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
      message.success("Telas atualizadas");
    } catch (err) {
      message.error(err.response?.data?.message || "Erro ao salvar telas");
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (usuario) => {
    try {
      await axios.post(`${API_URL}/admin/usuarios/${usuario.id}/ativo`, { ativo: !usuario.ativo });
      await carregarDados();
    } catch (err) {
      message.error(err.response?.data?.message || "Erro ao atualizar usuário");
    }
  };

  const alternarHistorico = async () => {
    const vaiAbrir = !mostrarHistorico;
    setMostrarHistorico(vaiAbrir);
    if (vaiAbrir && historico.length === 0) {
      setCarregandoHistorico(true);
      try {
        const { data } = await axios.get(`${API_URL}/admin/historico-acessos`);
        setHistorico(data);
      } catch (err) {
        message.error(err.response?.data?.message || "Erro ao carregar histórico de acessos");
      } finally {
        setCarregandoHistorico(false);
      }
    }
  };

  const confirmarResetSenha = async () => {
    if (!novaSenha || novaSenha.length < 4) {
      message.warning("Informe uma senha com pelo menos 4 caracteres");
      return;
    }
    try {
      await axios.post(`${API_URL}/admin/usuarios/${usuarioResetando.id}/reset-senha`, { novaSenha });
      setUsuarioResetando(null);
      setNovaSenha("");
      await carregarDados();
      message.success("Senha redefinida");
    } catch (err) {
      message.error(err.response?.data?.message || "Erro ao redefinir senha");
    }
  };

  const colunas = [
    {
      title: "Nome",
      dataIndex: "nome",
      render: (nome, usuario) => (
        <div>
          <div className="flex items-center gap-1.5">
            <Text strong style={{ color: cores.texto }}>{nome}</Text>
            {usuario.is_admin && <Tag color="blue">admin</Tag>}
            {usuario.reset_solicitado && <Tag color="orange">pediu redefinir senha</Tag>}
          </div>
          <Text style={{ fontSize: 12, color: cores.textoMuted }}>{usuario.matricula}</Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "ativo",
      render: (ativo) => <Tag color={ativo ? "success" : "default"}>{ativo ? "ativo" : "desativado"}</Tag>,
    },
    {
      title: "Telas",
      dataIndex: "telas_liberadas",
      render: (telasLiberadas, usuario) =>
        usuario.is_admin ? (
          <Text style={{ color: cores.textoMuted }}>acesso total</Text>
        ) : (
          <Text style={{ color: cores.texto }}>{telasLiberadas.length} tela(s)</Text>
        ),
    },
    {
      title: "Último acesso",
      dataIndex: "ultimo_acesso",
      render: (valor, usuario) => (
        <div>
          {estaOnline(valor) && <Tag color="success">online agora</Tag>}
          <div style={{ fontSize: 12, color: cores.texto }}>{formatarQuando(valor)}</div>
          {usuario.ultimo_ip && <div style={{ fontSize: 11, color: cores.textoMuted }}>{usuario.ultimo_ip}</div>}
        </div>
      ),
    },
    {
      title: "Ações",
      render: (_, usuario) => (
        <Space wrap>
          <Button size="small" onClick={() => abrirEdicaoTelas(usuario)} disabled={usuario.is_admin}>
            Telas
          </Button>
          <Button size="small" icon={<KeyRound size={13} />} onClick={() => setUsuarioResetando(usuario)}>
            Redefinir senha
          </Button>
          <Button size="small" danger={usuario.ativo} onClick={() => alternarAtivo(usuario)}>
            {usuario.ativo ? "Desativar" : "Ativar"}
          </Button>
        </Space>
      ),
    },
  ];

  const colunasHistorico = [
    { title: "Quando", dataIndex: "criado_em", render: formatarQuando },
    { title: "Nome", dataIndex: "nome" },
    { title: "Matrícula", dataIndex: "matricula" },
    { title: "IP", dataIndex: "ip" },
  ];

  return (
    <div className="min-h-screen" style={{ background: cores.fundo }}>
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm font-medium hover:underline"
            style={{ color: tema === "dark" ? "#7c93e6" : "#1428A0" }}
          >
            <ArrowLeft size={15} /> Início
          </button>
          <ThemeToggle variant="ghost" />
        </div>

        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "#1428A022", color: "#1428A0" }}>
            <ShieldCheck size={20} />
          </span>
          <div>
            <Title level={4} style={{ margin: 0, color: cores.texto }}>Gestão de Usuários</Title>
            <Text style={{ color: cores.textoMuted }}>
              Escolha quais telas cada pessoa pode acessar. Contas novas começam sem nenhuma tela liberada.
            </Text>
          </div>
        </div>

        {erro && (
          <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: "#fef2f2", color: "#b91c1c" }}>
            {erro}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl" style={{ background: cores.superficie }}>
          <Table
            dataSource={usuarios}
            columns={colunas}
            rowKey="id"
            loading={carregando}
            pagination={false}
          />
        </div>

        <Button className="mt-4" icon={<History size={14} />} onClick={alternarHistorico}>
          {mostrarHistorico ? "Ocultar histórico de acessos" : "Ver histórico de acessos"}
        </Button>

        {mostrarHistorico && (
          <div className="mt-3 overflow-hidden rounded-2xl" style={{ background: cores.superficie }}>
            <Table
              dataSource={historico}
              columns={colunasHistorico}
              rowKey="id"
              loading={carregandoHistorico}
              size="small"
              pagination={{ pageSize: 15 }}
            />
          </div>
        )}
      </div>

      {/* Modal de concessão de telas */}
      <Modal
        title={`Telas de ${usuarioEditando?.nome || ""}`}
        open={!!usuarioEditando}
        onCancel={() => setUsuarioEditando(null)}
        onOk={salvarTelas}
        confirmLoading={salvando}
        okText="Salvar"
        cancelText="Cancelar"
        width={640}
      >
        <div style={{ maxHeight: "55vh", overflowY: "auto" }} className="pr-1">
          {Object.keys(telasPorGrupo).map((grupo) => (
            <div key={grupo} className="mb-4">
              <div className="mb-2 text-sm font-bold" style={{ color: "#1428A0" }}>
                {NOME_GRUPO[grupo] || grupo}
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {telasPorGrupo[grupo].map((tela) => (
                  <Checkbox
                    key={tela.id}
                    checked={tela.is_public || selecionadas.has(tela.id)}
                    disabled={tela.is_public}
                    onChange={() => alternarTela(tela.id)}
                  >
                    {tela.nome}
                    {tela.is_public && <Text style={{ color: cores.textoMuted }}> (pública)</Text>}
                  </Checkbox>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal de redefinir senha */}
      <Modal
        title={`Redefinir senha de ${usuarioResetando?.nome || ""}`}
        open={!!usuarioResetando}
        onCancel={() => {
          setUsuarioResetando(null);
          setNovaSenha("");
        }}
        onOk={confirmarResetSenha}
        okText="Redefinir"
        cancelText="Cancelar"
      >
        <Text style={{ display: "block", marginBottom: 8, color: cores.textoMuted }}>Nova senha</Text>
        <Input
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          placeholder="Digite a nova senha"
        />
      </Modal>
    </div>
  );
}
