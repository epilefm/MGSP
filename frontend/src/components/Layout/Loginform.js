import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jpIMG from "../../jp.svg";
import { Button } from "react-bootstrap";
import { BsFillArrowLeftCircleFill } from 'react-icons/bs';
import { useAuth } from "../../auth/AuthContext";
import "../../styles.css";

function App() {
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
      setErro(
        err.response?.data?.message || "Não foi possível entrar. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>

<div>
<Button href="/Home"
  style={{
  backgroundColor:'transparent',
  borderColor:'transparent',
  marginLeft:'5%',
  marginTop:20,
  }}>
  <BsFillArrowLeftCircleFill
  style={{width:40, height:40, color:'#1d44aa'}} />
  </Button>
</div>

    <div variant='dark'>
      <style>{"body { background-color: white; }"}</style>
      <div className="container-login">
        <div className="wrap-login">

              <img src={jpIMG} alt="Samsung Logo" />

          <form className="login-form" onSubmit={handleSubmit}>

            <div className="wrap-input">
              <input
                className={matricula !== "" ? "has-val input" : "input"}
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
              />
              <span className="focus-input" data-placeholder="Knox ID"></span>
            </div>

            <div className="wrap-input">
              <input
                className={senha !== "" ? "has-val input" : "input"}
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <span className="focus-input" data-placeholder="Password"></span>
            </div>

            {erro && (
              <div className="text-center" style={{ color: '#c62828', marginBottom: 10 }}>
                {erro}
              </div>
            )}

            <div className="container-login-form-btn">
              <Button
                type="submit"
                className="login-form-btn"
                disabled={carregando}
                style={{fontSize:'larger', width:'100%'}}
              >
                {carregando ? "Entrando..." : "Login"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>

  );
}

export default App;
