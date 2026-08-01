import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "react-bootstrap";
import jpIMG from "../../jp.svg";
import { useAuth } from "../../auth/AuthContext";
import "../../styles.css";

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
    <div variant="dark">
      <style>{"body { background-color: white; }"}</style>
      <div className="container-login">
        <div className="wrap-login">
          <img src={jpIMG} alt="Logo" />

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="wrap-input">
              <input
                className={matricula !== "" ? "has-val input" : "input"}
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
              />
              <span className="focus-input" data-placeholder="Matrícula"></span>
            </div>

            <div className="wrap-input">
              <input
                className={senha !== "" ? "has-val input" : "input"}
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <span className="focus-input" data-placeholder="Senha"></span>
            </div>

            {erro && (
              <div className="text-center" style={{ color: "#c62828", marginBottom: 10 }}>
                {erro}
              </div>
            )}

            <div className="container-login-form-btn">
              <Button
                type="submit"
                className="login-form-btn"
                disabled={carregando}
                style={{ fontSize: "larger", width: "100%" }}
              >
                {carregando ? "Entrando..." : "Entrar"}
              </Button>
            </div>

            <div className="text-center" style={{ marginTop: 12 }}>
              <span className="txt1">Não tem conta? </span>
              <Link className="txt2" to="/Registrar">Criar conta</Link>
            </div>
            <div className="text-center" style={{ marginTop: 6 }}>
              <Link className="txt2" to="/EsqueciSenha">Esqueci minha senha</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
