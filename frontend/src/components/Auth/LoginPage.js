import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import AuthLayout from "./AuthLayout";
import AuthField from "./AuthField";
import AuthFooterLinks from "./AuthFooterLinks";

export default function LoginPage() {
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await login(matricula, senha);
      const destino = location.state?.from?.pathname || "/";
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(err.response?.data?.message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Entre com sua matrícula para continuar">
      <form onSubmit={handleSubmit}>
        <AuthField
          label="Matrícula"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          autoFocus
          required
        />
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

        <button
          type="submit"
          disabled={carregando}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#1428A0] hover:bg-[#0f1f7a] disabled:opacity-60 text-white font-semibold text-[15px] px-5 py-3 transition-colors"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <AuthFooterLinks>
          <Link to="/EsqueciSenha" className="text-[#1428A0] hover:underline">
            Esqueci minha senha
          </Link>
          <span className="text-slate-400 dark:text-slate-500">
            Não tem conta?{" "}
            <Link to="/Registrar" className="text-[#1428A0] font-semibold hover:underline">
              Criar conta
            </Link>
          </span>
        </AuthFooterLinks>
      </form>
    </AuthLayout>
  );
}
