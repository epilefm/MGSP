import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useTema, CORES } from "../../theme/ThemeContext";
import AuthLayout from "./AuthLayout";
import AuthField from "./AuthField";
import AuthFooterLinks from "./AuthFooterLinks";

const ERRO = { light: { bg: "#fef2f2", texto: "#b91c1c" }, dark: { bg: "#3f1a1e", texto: "#f87171" } };
const SUCESSO = { light: { bg: "#f0fdf4", texto: "#15803d" }, dark: { bg: "#132e1e", texto: "#4ade80" } };

export default function ForgotPasswordPage() {
  const [matricula, setMatricula] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { solicitarReset } = useAuth();
  const { tema } = useTema();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setCarregando(true);
    try {
      const data = await solicitarReset(matricula);
      setMensagem(data.message || "Solicitação registrada.");
    } catch (err) {
      setErro(err.response?.data?.message || "Não foi possível registrar a solicitação.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <AuthLayout title="Esqueci minha senha" subtitle="Um administrador vai redefinir pra você">
      <form onSubmit={handleSubmit}>
        <p className="text-[12.5px] leading-relaxed mb-3.5" style={{ color: CORES[tema].textoMuted }}>
          Informe sua matrícula. Um administrador vai ser avisado e vai
          redefinir sua senha e entrar em contato com você.
        </p>

        <AuthField label="Matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} autoFocus required />

        {erro && (
          <div
            className="text-[13px] px-3 py-2 rounded-lg mb-3.5"
            style={{ background: ERRO[tema].bg, color: ERRO[tema].texto }}
          >
            {erro}
          </div>
        )}
        {mensagem && (
          <div
            className="text-[13px] px-3 py-2 rounded-lg mb-3.5"
            style={{ background: SUCESSO[tema].bg, color: SUCESSO[tema].texto }}
          >
            {mensagem}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="w-full mt-1 flex items-center justify-center gap-2 rounded-lg bg-[#1428A0] hover:bg-[#0f1f7a] disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 transition-colors"
        >
          {carregando ? "Enviando..." : "Solicitar redefinição"}
        </button>

        <AuthFooterLinks>
          <Link to="/Login" className="text-[#1428A0] hover:underline">
            Voltar para o login
          </Link>
        </AuthFooterLinks>
      </form>
    </AuthLayout>
  );
}
