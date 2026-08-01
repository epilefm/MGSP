import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import jpIMG from "../../jp.svg";
import { useAuth } from "../../auth/AuthContext";
import "../../styles.css";

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
    <div variant="dark">
      <style>{"body { background-color: white; }"}</style>
      <div className="container-login">
        <div className="wrap-login">
          <img src={jpIMG} alt="Logo" />

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="text-center" style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
              Informe sua matrícula. Um administrador vai ser avisado e vai
              redefinir sua senha e entrar em contato com você.
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

            {erro && <div className="text-center" style={{ color: "#c62828", marginBottom: 10 }}>{erro}</div>}
            {mensagem && <div className="text-center" style={{ color: "#2e7d32", marginBottom: 10 }}>{mensagem}</div>}

            <div className="container-login-form-btn">
              <Button
                type="submit"
                className="login-form-btn"
                disabled={carregando}
                style={{ fontSize: "larger", width: "100%" }}
              >
                {carregando ? "Enviando..." : "Solicitar redefinição"}
              </Button>
            </div>

            <div className="text-center" style={{ marginTop: 12 }}>
              <Link className="txt2" to="/Login">Voltar para o login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
