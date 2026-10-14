import React, { createRef } from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import MontagemScene from "./MontagemScene";

// Sem WebGL (jsdom): a montagem não aparece, o login continua funcionando e
// ligar() resolve na hora (não pode segurar a entrada no sistema).
// Função comum (não jest.fn): o resetMocks do CRA apagaria a implementação.
jest.mock("three", () => ({
  WebGLRenderer: function WebGLRenderer() {
    throw new Error("WebGL não disponível no jsdom");
  },
}));

describe("MontagemScene", () => {
  beforeEach(() => {
    window.matchMedia = () => ({ matches: false });
  });

  it("sem WebGL: não renderiza canvas e os comandos não quebram", async () => {
    const ref = createRef();
    const { container, unmount } = render(<MontagemScene ref={ref} />);

    expect(container.querySelector("canvas")).toBeNull();
    expect(() => ref.current.pulso(3)).not.toThrow();
    expect(() => ref.current.estado("ok")).not.toThrow();
    await expect(ref.current.ligar()).resolves.toBeUndefined();
    expect(() => unmount()).not.toThrow();
  });
});
