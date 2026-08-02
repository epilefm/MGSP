import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useTema, CORES } from "../../theme/ThemeContext";
import AuthLayout from "./AuthLayout";
import AuthField from "./AuthField";
import AuthFooterLinks from "./AuthFooterLinks";

const ERRO = { light: { bg: "#fef2f2", texto: "#b91c1c" }, dark: { bg: "#3f1a1e", texto: "#f87171" } };
const SUCESSO = { light: { bg: "#f0fdf4", texto: "#15803d" }, dark: { bg: "#132e1e", texto: "#4ade80" } };

export default function RegisterPage() {
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { tema } = useTema();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setCarregando(true);
    try {
      const data = await register(matricula, senha, nome);
      setSucesso(data.message || "Conta criada com sucesso.");
      setTimeout(() => navigate("/Login", { replace: true }), 2000);
    } catch (err) {
      setErro(err.response?.data?.message || "Não foi possível criar a conta. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <AuthLayout title="Criar conta" subtitle="Leva menos de um minuto">
      <form onSubmit={handleSubmit}>
        <AuthField label="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus required />
        <AuthField label="Matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} required />
        <AuthField
          label="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        {erro && (
          <div
            className="text-[13px] px-3 py-2 rounded-lg mb-3.5"
            style={{ background: ERRO[tema].bg, color: ERRO[tema].texto }}
          >
            {erro}
          </div>
        )}
        {sucesso && (
          <div
            className="text-[13px] px-3 py-2 rounded-lg mb-3.5"
            style={{ background: SUCESSO[tema].bg, color: SUCESSO[tema].texto }}
          >
            {sucesso}
          </div>
        )}

        <p className="text-[12.5px] leading-relaxed mb-3.5" style={{ color: CORES[tema].textoMuted }}>
          Sua conta é criada na hora, mas as telas só ficam disponíveis
          depois que um administrador liberar o acesso.
        </p>

        <button
          type="submit"
          disabled={carregando}
          className="w-full mt-1 flex items-center justify-center gap-2 rounded-lg bg-[#1428A0] hover:bg-[#0f1f7a] disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 transition-colors"
        >
          {carregando ? "Criando..." : "Criar conta"}
        </button>

        <AuthFooterLinks>
          <span style={{ color: CORES[tema].textoMuted }}>
            Já tem conta?{" "}
            <Link to="/Login" className="text-[#1428A0] font-semibold hover:underline">
              Entrar
            </Link>
          </span>
        </AuthFooterLinks>
      </form>
    </AuthLayout>
  );
}
