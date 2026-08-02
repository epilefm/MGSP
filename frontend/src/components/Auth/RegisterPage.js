import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import AuthLayout from "./AuthLayout";
import AuthField from "./AuthField";
import AuthFooterLinks from "./AuthFooterLinks";

export default function RegisterPage() {
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

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
          <div className="bg-red-50 text-red-700 text-[13px] px-3 py-2.5 rounded-lg mb-4 dark:bg-red-500/10 dark:text-red-400">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="bg-green-50 text-green-700 text-[13px] px-3 py-2.5 rounded-lg mb-4 dark:bg-green-500/10 dark:text-green-400">
            {sucesso}
          </div>
        )}

        <p className="text-[12.5px] text-slate-400 dark:text-slate-500 leading-relaxed mb-5">
          Sua conta é criada na hora, mas as telas só ficam disponíveis
          depois que um administrador liberar o acesso.
        </p>

        <button
          type="submit"
          disabled={carregando}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#1428A0] hover:bg-[#0f1f7a] disabled:opacity-60 text-white font-semibold text-[15px] px-5 py-3 transition-colors"
        >
          {carregando ? "Criando..." : "Criar conta"}
        </button>

        <AuthFooterLinks>
          <span className="text-slate-400 dark:text-slate-500">
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
