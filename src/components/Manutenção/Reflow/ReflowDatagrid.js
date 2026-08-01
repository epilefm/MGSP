import React, { useState } from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "react-bootstrap";


const senhas = {
  "Thiago Moreira": "123",
  default: "123"
}

const ApproverSelect = ({ aprovador, aprovadorAtivo, setAprovador, index}) => {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");

  const handleChange = (event) => {
    console.log(event.target.value);
    setAprovador({name: event.target.value, index});
    handleOpen();
  };

  const handleClose = (skipReset = false) => {
    setShowModal(false);
    if (!skipReset) setAprovador({name: null, index: null})
  };

  const handleOpen = () => {
    setShowModal(true);
  };

  const validatePassword = (event) => {
    const senhaAprovador = senhas[aprovador];
    if (senhaAprovador ? password === senhas[aprovador] : password === senhas.default) {console.log(password)
      // handleChange(aprovador);
      handleClose(true);

    } else { console.log(password)
      alert("Senha incorreta");
    }
  };

   return (
    <div>
      <form>
      <select value={aprovadorAtivo.index === index ? aprovadorAtivo.name : aprovador ?? ""} 
      onChange={(e) => handleChange(e)}>
        <option value="">Selecione</option>
        <option value="Thiago Moreira">Thiago Moreira</option>
        <option value="Kellen Cristina">Kellen Cristina</option>
        <option value="Paula Aguiar">Paula Aguiar</option>
        <option value="Francis Jarlen">Francis Jarlen</option>
        <option value="Danielma Alencar">Danielma Alencar</option>
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

export default ApproverSelect;