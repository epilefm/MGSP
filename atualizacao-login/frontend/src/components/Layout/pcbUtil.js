// Utilitários das cenas 3D de placa de circuito (hero da Home e tela de login).

// Gerador pseudoaleatório com semente (mulberry32): a placa sai igual a cada
// carregamento, em vez de mudar de desenho a cada visita.
export function criarRng(semente) {
  let s = semente;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// As 8 direções de uma trilha de PCB (retas e diagonais de 45°)
export const DIRECOES = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];
