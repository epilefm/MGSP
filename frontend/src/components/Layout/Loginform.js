import { useState } from "react";
import jpIMG from "../../jp.svg";
import { Button } from "react-bootstrap";
import { BsFillArrowLeftCircleFill } from 'react-icons/bs';
import "../../styles.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        
          <form className="login-form">
        
            <div className="wrap-input">
              <input
                className={email !== "" ? "has-val input" : "input"}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="focus-input" data-placeholder="Knox ID"></span>
            </div>

            <div className="wrap-input">
              <input
                className={password !== "" ? "has-val input" : "input"}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="focus-input" data-placeholder="Password"></span>
            </div>
{/* expression-session */}
            <div className="container-login-form-btn">
              <Button className="login-form-btn" href="Material_Analysis" style={{fontSize:'larger', width:'100%'}}>Login</Button>
            </div>

            <div className="text-center">
              <span className="txt1">Não possui conta? </span>
              <a className="txt2" href="Register">
                Criar conta
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>

  );
}

export default App;
