import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import AuthLayout from "./AuthLayout";
import AuthField from "./AuthField";
import AuthFooterLinks from "./AuthFooterLinks";

export default function ForgotPasswordPage() {
  const [matricula, setMatricula] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { solicitarReset } = useAuth();

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
        <p className="text-[12.5px] text-slate-400 dark:text-slate-500 leading-relaxed mb-5">
          Informe sua matrícula. Um administrador vai ser avisado e vai
          redefinir sua senha e entrar em contato com você.
        </p>

        <AuthField label="Matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} autoFocus required />

        {erro && (
          <div className="bg-red-50 text-red-700 text-[13px] px-3 py-2.5 rounded-lg mb-4 dark:bg-red-500/10 dark:text-red-400">
            {erro}
          </div>
        )}
        {mensagem && (
          <div className="bg-green-50 text-green-700 text-[13px] px-3 py-2.5 rounded-lg mb-4 dark:bg-green-500/10 dark:text-green-400">
            {mensagem}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#1428A0] hover:bg-[#0f1f7a] disabled:opacity-60 text-white font-semibold text-[15px] px-5 py-3 transition-colors"
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
