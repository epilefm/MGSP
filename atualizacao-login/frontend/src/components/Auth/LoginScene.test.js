import React, { createRef } from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import LoginScene from "./LoginScene";

// Sem WebGL (jsdom): a placa não aparece, o login continua funcionando e
// ligar() resolve na hora (não pode segurar a entrada no sistema).
// Função comum (não jest.fn): o resetMocks do CRA apagaria a implementação.
jest.mock("three", () => ({
  WebGLRenderer: function WebGLRenderer() {
    throw new Error("WebGL não disponível no jsdom");
  },
}));

describe("LoginScene", () => {
  beforeEach(() => {
    window.matchMedia = () => ({ matches: false });
  });

  it("sem WebGL: não renderiza canvas e os comandos não quebram", async () => {
    const ref = createRef();
    const { container, unmount } = render(<LoginScene ref={ref} />);

    expect(container.querySelector("canvas")).toBeNull();
    expect(() => ref.current.pulso(3)).not.toThrow();
    expect(() => ref.current.estado("ok")).not.toThrow();
    await expect(ref.current.ligar()).resolves.toBeUndefined();
    expect(() => unmount()).not.toThrow();
  });
});
