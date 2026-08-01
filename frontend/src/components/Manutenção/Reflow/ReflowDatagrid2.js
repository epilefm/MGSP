import React, { useState } from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "react-bootstrap";


const senhas = {
  "Harison Vieira": "123",
  default: "123"
}

const ApproverSelect2 = ({ aprovador2, aprovadorAtivo2, setAprovador2, index}) => {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");

  const handleChange = (event) => {
    console.log(event.target.value);
    setAprovador2({name: event.target.value, index});
    handleOpen();
  };

  const handleClose = (skipReset = false) => {
    setShowModal(false);
    if (!skipReset) setAprovador2({name: null, index: null})
  };

  const handleOpen = () => {
    setShowModal(true);
  };

  const validatePassword = (event) => {
    const senhaAprovador = senhas[aprovador2];
    if (senhaAprovador ? password === senhas[aprovador2] : password === senhas.default) {console.log(password)
      // handleChange(aprovador);
      handleClose(true);

    } else { console.log(password)
      alert("Senha incorreta");
    }
  };

   return (
    <div>
      <form>
      <select value={aprovadorAtivo2.index === index ? aprovadorAtivo2.name : aprovador2 ?? ""} 
      onChange={(e) => handleChange(e)}>
        <option value="">Selecione</option>
        <option value='Harison Vieira'>Harison Vieira</option>
                    <option value='Leandro Goes'>Leandro Goes</option>
                    <option value='Ayala Costa'>Ayala Costa</option>
                    <option value='Wilson Fogaça'>Wilson Fogaça</option>
                    <option value='Mauro Concy'>Mauro Concy</option>
      </select>
      </form>
    
      <Modal show={showModal} onHide={handleClose} onBackdropClick={() => handleClose()}>
        <ModalHeader closeButton>Aprovação</ModalHeader>
        <ModalBody>
          Insira a senha para aprovar:{" "}
          <form>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}/>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => handleClose()}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={validatePassword}>
            Confirmar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ApproverSelect2;