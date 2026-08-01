import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import jpIMG from "../../jp.svg";
import { useAuth } from "../../auth/AuthContext";
import "../../styles.css";

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
    <div variant="dark">
      <style>{"body { background-color: white; }"}</style>
      <div className="container-login">
        <div className="wrap-login">
          <img src={jpIMG} alt="Logo" />

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="wrap-input">
              <input
                className={nome !== "" ? "has-val input" : "input"}
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <span className="focus-input" data-placeholder="Nome completo"></span>
            </div>

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

            {erro && <div className="text-center" style={{ color: "#c62828", marginBottom: 10 }}>{erro}</div>}
            {sucesso && <div className="text-center" style={{ color: "#2e7d32", marginBottom: 10 }}>{sucesso}</div>}

            <div className="text-center" style={{ color: "#666", fontSize: 13, marginBottom: 14 }}>
              Sua conta é criada na hora, mas as telas só ficam disponíveis
              depois que um administrador liberar o acesso.
            </div>

            <div className="container-login-form-btn">
              <Button
                type="submit"
                className="login-form-btn"
                disabled={carregando}
                style={{ fontSize: "larger", width: "100%" }}
              >
                {carregando ? "Criando..." : "Criar conta"}
              </Button>
            </div>

            <div className="text-center" style={{ marginTop: 12 }}>
              <span className="txt1">Já tem conta? </span>
              <Link className="txt2" to="/Login">Entrar</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
