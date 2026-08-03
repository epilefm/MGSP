import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

const ThemeContext = createContext(null);
const STORAGE_KEY = "mts_theme";

// Paleta única do app, em camadas (fundo -> superfície -> superfície clara),
// tipo Spotify/apps modernos: cada camada fica um tom mais claro que a
// anterior, em vez de tudo na mesma cor.
export const CORES = {
  light: {
    fundo: "#f8fafc",
    superficie: "#ffffff",
    superficieClara: "#f1f5f9",
    borda: "#e2e8f0",
    texto: "#0f172a",
    textoTitulo: "#0a1e5c",
    textoMuted: "#94a3b8",
  },
  dark: {
    fundo: "#0a0e1a",
    superficie: "#161b2e",
    superficieClara: "#232a45",
    borda: "#2a3252",
    texto: "#f1f5f9",
    textoTitulo: "#ffffff",
    textoMuted: "#8891ac",
  },
};

function temaInicial() {
  const salvo = localStorage.getItem(STORAGE_KEY);
  if (salvo === "light" || salvo === "dark") return salvo;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Deixa o tema disponível pro app inteiro (classe "dark" no <html>, pra
// funcionar com o dark: do Tailwind nas telas que eu redesenhei).
//
// IMPORTANTE: o ConfigProvider do antd (tema escuro pro antd) NÃO fica aqui
// no nível raiz de propósito. Se ficasse, ele re-tematizaria os componentes
// antd de TODAS as ~250 telas legadas do sistema original (Table, Input,
// Card etc.) sempre que alguém ligasse o modo escuro - mesmo em telas que
// nunca foram desenhadas pra isso, deixando o visual quebrado/diferente do
// original (foi exatamente o que aconteceu com a InspecMX). O tema escuro
// do antd só deve valer dentro das telas que eu de fato redesenhei - ver
// <TemaAntd> abaixo, usado em Home.js/AdminPanel.js/FloatingNav.js.
export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "dark");
    localStorage.setItem(STORAGE_KEY, tema);
  }, [tema]);

  const alternarTema = () => setTema((t) => (t === "dark" ? "light" : "dark"));

  const value = useMemo(() => ({ tema, alternarTema }), [tema]);

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm, token: { colorPrimary: "#1428A0" } }}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTema() {
  return useContext(ThemeContext);
}

// Escopo local do tema escuro pro antd - só usar dentro de telas novas
// (não-legadas). Aninhar ConfigProvider funciona no antd: este aqui vale só
// pra essa subárvore, sem afetar o resto do app.
export function TemaAntd({ children }) {
  const { tema } = useTema();
  return (
    <ConfigProvider
      theme={{
        algorithm: tema === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { colorPrimary: "#1428A0" },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
