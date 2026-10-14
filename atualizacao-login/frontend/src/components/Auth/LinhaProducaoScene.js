import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { criarRng } from "../Layout/pcbUtil";

/**
 * LinhaProducaoScene - linha SMT completa numa esteira (painel de marca do login).
 *
 * Da esquerda para a direita: carregador (magazine) -> impressora de pasta
 * (rodo) -> montadora 1 (CIs e conector) -> montadora 2 (passivos e LEDs) ->
 * forno de refusão -> inspeção AOI (torre de luz) -> saída. Várias placas
 * andam juntas; a esteira avança um passo, cada estação trabalha a placa que
 * está debaixo dela e o ciclo repete. De vez em quando a AOI reprova uma placa
 * (marcador vermelho) e ela é empurrada para a caixa de NG.
 *
 * Mesma interface da LoginScene / MontagemScene:
 * - pulso(): digitar acelera a linha por um instante.
 * - estado('ok' | 'erro' | null): trilhos da esteira acendem verde / piscam vermelho.
 * - ligar(): todas as placas se completam, os LEDs acendem e a câmera mergulha
 *   na placa pronta da saída. Devolve uma Promise.
 *
 * É decoração (aria-hidden). Pausa com a aba oculta; com "reduzir movimento"
 * mostra a linha parada e ligar() resolve na hora; sem WebGL, nada.
 */

const PASSO = 3.1; // distância entre estações
const X0 = -3 * PASSO; // estação 0 (carregador); a 3 fica no centro
const N_PLACAS = 8; // posições 0..6 visíveis + 1 saindo da linha
const slotX = (s) => X0 + s * PASSO;

const LARG_PLACA = 2.4;
const PROF_PLACA = 1.7;
const ALT_PLACA = 0.08;
const TOPO = ALT_PLACA; // a esteira fica em y = 0
const Y_CABECOTE = 1.15;
const BICO = 0.5; // do centro do cabeçote até a ponta do bico
const LARG_MAQ = 2.7;
const Z_FUNDO = -1.45;
const Z_FRENTE = 1.45;

const EST = { carregador: 0, impressora: 1, montadora1: 2, montadora2: 3, forno: 4, aoi: 5, saida: 6 };

// Componentes de uma placa: [tipo, x, z, largura, altura, profundidade]
// "grandes" vão na montadora 1; o resto na montadora 2.
const GRANDES = [
  ["ci", -0.55, -0.1, 0.75, 0.12, 0.75],
  ["ci", 0.42, -0.36, 0.42, 0.1, 0.42],
  ["ci", 0.42, 0.3, 0.42, 0.1, 0.42],
  ["conector", -0.15, 0.62, 1.0, 0.2, 0.24],
].map(([tipo, x, z, w, h, d]) => ({ tipo, x, z, w, h, d }));

const PEQUENOS = [
  ["capacitor", 0.98, -0.5, 0.2, 0.28, 0.2],
  ["capacitor", 0.98, -0.05, 0.2, 0.28, 0.2],
  ...[0, 1, 2, 3].map((i) => ["smd", -0.95 + i * 0.24, -0.68, 0.12, 0.06, 0.2]),
  ...[0, 1, 2].map((i) => ["smd", -1.02, -0.32 + i * 0.25, 0.2, 0.06, 0.12]),
  ...[0, 1, 2].map((i) => ["led", 0.62 + i * 0.2, 0.66, 0.12, 0.08, 0.12]),
].map(([tipo, x, z, w, h, d]) => ({ tipo, x, z, w, h, d }));

const TODOS = [...GRANDES, ...PEQUENOS];

// Caixa que precisa caber na tela (o resto da esteira sai pelas bordas, que
// esmaecem com a máscara CSS)
const VISTA = { min: [-9.9, -0.95, -2.5], max: [10.0, 2.05, 1.6] };

const LinhaProducaoScene = forwardRef(function LinhaProducaoScene(_, ref) {
  const containerRef = useRef(null);
  const api = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      pulso: (n) => api.current?.pulso(n),
      estado: (tipo) => api.current?.estado(tipo),
      ligar: () => (api.current ? api.current.ligar() : Promise.resolve()),
    }),
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0", transition: "opacity 700ms ease-out" });
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    const alvo = new THREE.Vector3(0, 0.2, -0.3);
    const cameraBase = new THREE.Vector3();
    // Área larga: vista de frente; área estreita: vista diagonal (a linha encurta)
    const DIR_LARGA = new THREE.Vector3(-0.1, 0.8, 1).normalize();
    const DIR_ESTREITA = new THREE.Vector3(-1.1, 1.05, 1).normalize();
    const direcao = new THREE.Vector3();
    const cantos = [];
    for (let i = 0; i < 8; i++) {
      cantos.push(new THREE.Vector3(VISTA[i & 1 ? "max" : "min"][0], VISTA[i & 2 ? "max" : "min"][1], VISTA[i & 4 ? "max" : "min"][2]));
    }
    const ndc = new THREE.Vector3();

    // Enquadra a linha inteira: busca binária da distância em que todos os
    // cantos da caixa VISTA cabem na tela
    const ajustar = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const k = THREE.MathUtils.clamp((1.9 - camera.aspect) / 0.9, 0, 1);
      direcao.copy(DIR_LARGA).lerp(DIR_ESTREITA, k).normalize();
      // durante o mergulho a câmera é do GSAP: a busca não pode deixá-la em outro lugar
      const posAntes = camera.position.clone();
      const rotAntes = camera.quaternion.clone();
      let perto = 2;
      let longe = 120;
      for (let i = 0; i < 24; i++) {
        const d = (perto + longe) / 2;
        camera.position.copy(direcao).multiplyScalar(d).add(alvo);
        camera.lookAt(alvo);
        camera.updateMatrixWorld();
        const cabe = cantos.every((c) => {
          ndc.copy(c).project(camera);
          return Math.abs(ndc.x) <= 0.97 && Math.abs(ndc.y) <= 0.92;
        });
        if (cabe) longe = d;
        else perto = d;
      }
      cameraBase.copy(direcao).multiplyScalar(longe).add(alvo);
      if (api.current?.mergulhando) {
        camera.position.copy(posAntes);
        camera.quaternion.copy(rotAntes);
      } else {
        camera.position.copy(cameraBase);
        camera.lookAt(alvo);
      }
    };

    scene.add(new THREE.HemisphereLight(0xdbe8ff, 0x0b1640, 1.15));
    const luz = new THREE.DirectionalLight(0xffffff, 1.35);
    luz.position.set(-5, 10, 7);
    scene.add(luz);

    const descartaveis = [];
    const guardar = (x) => {
      descartaveis.push(x);
      return x;
    };
    const caixa = (w, h, d) => guardar(new THREE.BoxGeometry(w, h, d));
    const cilindro = (r, h, seg = 16) => guardar(new THREE.CylinderGeometry(r, r, h, seg));
    const mat = (cor, extra = {}) => guardar(new THREE.MeshStandardMaterial({ color: cor, roughness: 0.5, metalness: 0.15, ...extra }));
    const brilho = (cor, opacidade = 0) =>
      guardar(new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: opacidade, blending: THREE.AdditiveBlending, depthWrite: false }));
    const vidro = (cor, opacidade) => guardar(new THREE.MeshStandardMaterial({ color: cor, transparent: true, opacity: opacidade, roughness: 0.1, metalness: 0.1, depthWrite: false }));

    const linha = new THREE.Group();
    scene.add(linha);
    const peca = (geo, material, x, y, z, pai = linha) => {
      const m = new THREE.Mesh(geo, material);
      m.position.set(x, y, z);
      pai.add(m);
      return m;
    };

    // ------------------------------------------------------------- esteira
    const COMP_ESTEIRA = 9 * PASSO;
    const matEsteira = guardar(
      new THREE.ShaderMaterial({
        uniforms: { uDesloc: { value: 0 } },
        vertexShader: `
          varying vec3 vP;
          varying vec3 vN;
          void main() {
            vP = position;
            vN = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform float uDesloc;
          varying vec3 vP;
          varying vec3 vN;
          void main() {
            float f = fract((vP.x - uDesloc) * 2.0);
            float faixa = smoothstep(0.80, 0.86, f) * (1.0 - smoothstep(0.92, 0.98, f));
            vec3 cor = vec3(0.075, 0.085, 0.12) + faixa * vec3(0.09, 0.11, 0.16);
            float lado = abs(vN.y) < 0.5 ? 0.6 : 1.0;
            gl_FragColor = vec4(cor * lado, 1.0);
          }`,
      })
    );
    peca(caixa(COMP_ESTEIRA, 0.14, 2.1), matEsteira, PASSO * 0.5, -0.07, 0);
    const matTrilho = mat(0xc4ccd8, { metalness: 0.7, roughness: 0.3 });
    [-1.1, 1.1].forEach((z) => peca(caixa(COMP_ESTEIRA, 0.16, 0.08), matTrilho, PASSO * 0.5, 0, z));
    // trilhos que acendem com o estado da matrícula
    const matTrilhoLuz = brilho(0x34d399);
    [-1.1, 1.1].forEach((z) => peca(caixa(COMP_ESTEIRA, 0.03, 0.1), matTrilhoLuz, PASSO * 0.5, 0.095, z));
    const matPe = mat(0x334155);
    for (let s = -1; s <= 8; s++) {
      [-0.85, 0.85].forEach((z) => peca(caixa(0.12, 0.8, 0.12), matPe, slotX(s) + PASSO / 2, -0.54, z));
    }

    // ------------------------------------------------------------- máquinas
    const matCarcaca = mat(0xe6ebf3, { roughness: 0.6 });
    const matAzul = mat(0x1428a0, { roughness: 0.4 });
    const matVidro = vidro(0xbfdbfe, 0.16);
    const matTela = guardar(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    const matLampada = guardar(new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    const matPrata = mat(0xc9d2de, { metalness: 0.75, roughness: 0.3 });
    const matEscuro = mat(0x1e293b, { roughness: 0.45 });

    // Carcaça comum: base, parede do fundo com faixa azul e tela, frente baixa
    // com vidro (deixa ver a placa lá dentro) e lâmpada de status
    const maquina = (s, larg = LARG_MAQ) => {
      const x = slotX(s);
      peca(caixa(larg, 0.75, 3.1), matCarcaca, x, -0.53, 0);
      peca(caixa(larg, 1.45, 0.3), matCarcaca, x, 0.58, Z_FUNDO);
      peca(caixa(larg + 0.01, 0.12, 0.31), matAzul, x, 1.12, Z_FUNDO);
      peca(caixa(0.6, 0.32, 0.01), matTela, x + larg / 2 - 0.55, 0.62, Z_FUNDO + 0.16);
      peca(caixa(larg, 0.24, 0.3), matCarcaca, x, 0.0, Z_FRENTE);
      peca(caixa(larg, 0.83, 0.03), matVidro, x, 0.535, Z_FRENTE);
      peca(caixa(0.12, 0.1, 0.12), matLampada, x - larg / 2 + 0.2, 1.36, Z_FUNDO);
    };

    // Carregador: magazine com placas empilhadas sobre a estação 0
    const matPCB = mat(0x0f5c3a, { roughness: 0.35 });
    [[-1.3, -1.0], [1.3, -1.0], [-1.3, 1.0], [1.3, 1.0]].forEach(([dx, z]) => peca(caixa(0.08, 1.9, 0.08), matPrata, slotX(0) + dx, 0.85, z));
    [1.25, 1.45, 1.65].forEach((y) => peca(caixa(LARG_PLACA, ALT_PLACA, PROF_PLACA), matPCB, slotX(0), y, 0));

    // Impressora de pasta: rodo que varre a placa
    maquina(EST.impressora);
    const rodo = peca(caixa(0.07, 0.25, 1.95), matPrata, slotX(EST.impressora) - 1.15, 0.75, 0);

    // Montadoras: pórtico (barra que segue o cabeçote em x) + cabeçote com bico + bobinas
    const matBobina = [mat(0x111827), mat(0x1f2937), mat(0xf8fafc), mat(0x111827)];
    const matCabecote = mat(0x2563eb, { metalness: 0.3 });
    const geoBico = cilindro(0.025, 0.36, 8);
    const geoBobina = cilindro(0.24, 0.05, 24);
    const montadora = (s) => {
      maquina(s);
      matBobina.forEach((m, i) => {
        const b = peca(geoBobina, m, slotX(s) - 0.95 + i * 0.36, 0.5, Z_FUNDO + 0.22);
        b.rotation.x = Math.PI / 2;
      });
      const barra = peca(caixa(0.16, 0.12, 2.9), matEscuro, slotX(s), Y_CABECOTE + 0.32, 0);
      const cab = new THREE.Group();
      peca(caixa(0.32, 0.3, 0.32), matCabecote, 0, 0, 0, cab);
      peca(geoBico, matPrata, 0, -0.32, 0, cab);
      cab.position.set(slotX(s) - 0.8, Y_CABECOTE, -1.0);
      linha.add(cab);
      return { cab, barra, casa: { x: slotX(s) - 0.8, z: -1.0 } };
    };
    const mont1 = montadora(EST.montadora1);
    const mont2 = montadora(EST.montadora2);

    // Forno de refusão: túnel com teto de vidro escuro, resistências e brilho laranja
    const xForno = slotX(EST.forno);
    peca(caixa(2.95, 0.75, 3.1), matCarcaca, xForno, -0.53, 0);
    peca(caixa(2.95, 1.1, 0.3), matCarcaca, xForno, 0.4, Z_FUNDO);
    peca(caixa(2.96, 0.12, 0.31), matAzul, xForno, 0.9, Z_FUNDO);
    peca(caixa(2.95, 0.24, 0.3), matCarcaca, xForno, 0.0, Z_FRENTE);
    peca(caixa(2.95, 0.85, 0.03), vidro(0xff9a5a, 0.14), xForno, 0.55, Z_FRENTE);
    peca(caixa(2.95, 0.04, 3.1), vidro(0x1a1f2e, 0.5), xForno, 0.98, 0);
    const matResist = guardar(new THREE.MeshBasicMaterial({ color: 0xff7a2f }));
    [-0.6, 0, 0.6].forEach((z) => peca(caixa(2.6, 0.03, 0.08), matResist, xForno, 0.93, z));
    const matCalor = brilho(0xff8a3d, 0.14);
    peca(caixa(2.8, 0.85, 2.6), matCalor, xForno, 0.45, 0);

    // AOI: câmera que varre a placa com uma lâmina de luz + torre de sinalização
    const xAoi = slotX(EST.aoi);
    maquina(EST.aoi);
    const camAoi = new THREE.Group();
    peca(cilindro(0.15, 0.32, 20), matEscuro, 0, 0, 0, camAoi);
    const matLente = brilho(0x22d3ee, 0.9);
    peca(cilindro(0.1, 0.02, 20), matLente, 0, -0.17, 0, camAoi);
    camAoi.position.set(xAoi - 1.15, Y_CABECOTE, 0);
    linha.add(camAoi);
    peca(caixa(2.6, 0.1, 0.14), matEscuro, xAoi, Y_CABECOTE + 0.22, 0);
    const matLamina = brilho(0x22d3ee);
    const lamina = peca(caixa(0.05, Y_CABECOTE - TOPO - 0.15, 1.85), matLamina, xAoi - 1.15, (Y_CABECOTE + TOPO - 0.15) / 2, 0);
    const matFlash = brilho(0x34d399);
    peca(caixa(LARG_PLACA + 0.12, 0.05, PROF_PLACA + 0.12), matFlash, xAoi, TOPO + 0.02, 0);
    const torre = { x: xAoi + 1.05, base: 1.31 };
    peca(cilindro(0.025, 0.25, 8), matPrata, torre.x, torre.base + 0.12, Z_FUNDO);
    const lampadas = [0xef4444, 0xf59e0b, 0x22c55e].map((cor, i) => {
      const m = guardar(new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(0.25) }));
      peca(cilindro(0.075, 0.13, 16), m, torre.x, torre.base + 0.32 + (2 - i) * 0.14, Z_FUNDO);
      return { m, cor: new THREE.Color(cor), apagada: new THREE.Color(cor).multiplyScalar(0.25) };
    });
    const sinal = (qual) => lampadas.forEach((l, i) => l.m.color.copy(i === qual ? l.cor : l.apagada));
    sinal(1);

    // Caixa de NG atrás da saída
    const xSaida = slotX(EST.saida);
    peca(caixa(2.3, 0.08, 1.0), matEscuro, xSaida, -0.32, -2.15);
    const matNG = mat(0xdc2626, { roughness: 0.4 });
    peca(caixa(2.3, 0.3, 0.06), matNG, xSaida, -0.18, -1.65);
    peca(caixa(2.3, 0.3, 0.06), matNG, xSaida, -0.18, -2.65);
    [-1.15, 1.15].forEach((dx) => peca(caixa(0.06, 0.3, 1.0), matNG, xSaida + dx, -0.18, -2.15));

    // ------------------------------------------------------------- placas
    const rand = criarRng(20261013);

    // Pads de todos os componentes numa geometria só (uma chamada de desenho por placa)
    const geoPads = (() => {
      const pos = [];
      const nor = [];
      TODOS.forEach((c) => {
        const g = new THREE.BoxGeometry(c.w + 0.08, 0.012, c.d + 0.08).toNonIndexed();
        g.translate(c.x, TOPO + 0.006, c.z);
        pos.push(...g.attributes.position.array);
        nor.push(...g.attributes.normal.array);
        g.dispose();
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
      return guardar(g);
    })();
    const matCobre = mat(0xc98b3a, { metalness: 0.7, roughness: 0.35 });
    const matPasta = mat(0x9aa3ad, { metalness: 0.2, roughness: 0.85 });
    const matSolda = mat(0xe8edf3, { metalness: 0.9, roughness: 0.18 });

    // Serigrafia ligando os pads (a mesma em todas as placas)
    const geoSerigrafia = (() => {
      const v = [];
      const y = TOPO + 0.003;
      for (let i = 0; i < TODOS.length - 1; i++) {
        if (rand() < 0.4) continue;
        const a = TODOS[i];
        const b = TODOS[i + 1 + Math.floor(rand() * Math.min(2, TODOS.length - i - 1))];
        v.push(a.x, y, a.z, b.x, y, a.z, b.x, y, a.z, b.x, y, b.z);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
      return guardar(g);
    })();
    const matSerigrafia = guardar(new THREE.LineBasicMaterial({ color: 0x5fd39a, transparent: true, opacity: 0.5 }));

    const matCI = mat(0x161b26, { roughness: 0.4 });
    const matSMD = mat(0x2b2f3a);
    const matConector = mat(0xe8ecf2);
    const matCap = mat(0xb9c2cf, { metalness: 0.6, roughness: 0.35 });
    const geoCap = cilindro(0.1, 0.28, 14);
    const geoPlaca = caixa(LARG_PLACA, ALT_PLACA, PROF_PLACA);
    const geoComp = new Map();
    const geoDe = (w, h, d) => {
      const chave = `${w}|${h}|${d}`;
      if (!geoComp.has(chave)) geoComp.set(chave, caixa(w, h, d));
      return geoComp.get(chave);
    };
    const LED_APAGADO = new THREE.Color(0x1f3d2c);
    const LED_ACESO = new THREE.Color(0x8dffc0);
    const matMarcador = brilho(0xef4444);

    const placas = Array.from({ length: N_PLACAS }, () => {
      const grupo = new THREE.Group();
      peca(geoPlaca, matPCB, 0, ALT_PLACA / 2, 0, grupo);
      const pads = peca(geoPads, matCobre, 0, 0, 0, grupo);
      grupo.add(new THREE.LineSegments(geoSerigrafia, matSerigrafia));
      const matLed = guardar(new THREE.MeshBasicMaterial({ color: LED_APAGADO.clone() }));
      const comps = TODOS.map((c) => {
        const g = new THREE.Group();
        if (c.tipo === "capacitor") {
          peca(geoCap, matCap, 0, c.h / 2, 0, g);
        } else {
          const material = c.tipo === "ci" ? matCI : c.tipo === "conector" ? matConector : c.tipo === "led" ? matLed : matSMD;
          peca(geoDe(c.w, c.h, c.d), material, 0, c.h / 2, 0, g);
          // "perninhas" dos CIs: uma lâmina prateada um pouco maior por baixo
          if (c.tipo === "ci") peca(geoDe(c.w + 0.12, 0.03, c.d + 0.12), matPrata, 0, 0.015, 0, g);
        }
        g.position.set(c.x, TOPO, c.z);
        grupo.add(g);
        return g;
      });
      const marcador = peca(geoDe(GRANDES[0].w + 0.2, 0.3, GRANDES[0].d + 0.2), matMarcador, GRANDES[0].x, TOPO + 0.12, GRANDES[0].z, grupo);
      linha.add(grupo);
      return { grupo, pads, comps, matLed, marcador, slot: 0, ng: false };
    });

    const grandes = (p) => p.comps.slice(0, GRANDES.length);
    const pequenos = (p) => p.comps.slice(GRANDES.length);

    // Estado de uma placa ao chegar na estação s (já passou pelas anteriores)
    const prepararPlaca = (p, s, podeNG) => {
      p.slot = s;
      p.ng = podeNG && rand() < 0.16;
      p.grupo.visible = true;
      p.grupo.position.set(slotX(s), 0, 0);
      p.grupo.scale.setScalar(1);
      p.pads.material = s > EST.forno ? matSolda : s > EST.impressora ? matPasta : matCobre;
      grandes(p).forEach((c) => (c.visible = s > EST.montadora1));
      pequenos(p).forEach((c) => (c.visible = s > EST.montadora2));
      p.comps.forEach((c) => (c.position.y = TOPO));
      p.matLed.color.copy(s > EST.aoi ? LED_ACESO : LED_APAGADO);
      p.marcador.visible = false;
    };
    placas.forEach((p, i) => prepararPlaca(p, i, false));
    const naEstacao = (s) => placas.find((p) => p.slot === s);

    // ------------------------------------------------------------- ciclo
    const esteira = { avanco: 0, total: 0 };
    const ritmo = { v: 1 };
    let atual = null;

    const avancar = () => {
      atual = gsap.timeline({ onComplete: trabalhar });
      atual.call(() => sinal(1)).to(esteira, { avanco: 1, duration: 0.9, ease: "power2.inOut" });
    };

    // A esteira para e cada estação trabalha a placa que está debaixo dela
    const trabalhar = () => {
      esteira.avanco = 0;
      esteira.total += 1;
      placas.forEach((p) => (p.slot += 1));
      const nova = naEstacao(N_PLACAS);
      if (nova) prepararPlaca(nova, 0, true);

      const tl = gsap.timeline({ onComplete: avancar });
      atual = tl;
      tl.addLabel("t", 0);

      // carregador: a placa desce do magazine
      const p0 = naEstacao(EST.carregador);
      if (p0) tl.fromTo(p0.grupo.position, { y: 1.05 }, { y: 0, duration: 0.55, ease: "bounce.out" }, "t");

      // impressora: o rodo desce, varre e deixa a pasta nos pads
      const p1 = naEstacao(EST.impressora);
      const xi = slotX(EST.impressora);
      tl.to(rodo.position, { y: TOPO + 0.14, duration: 0.2 }, "t+=0.1")
        .to(rodo.position, { x: xi + 1.15, duration: 1.0, ease: "power1.inOut" }, "t+=0.3")
        .call(() => p1 && (p1.pads.material = matPasta), null, "t+=0.95")
        .to(rodo.position, { y: 0.75, duration: 0.2 }, "t+=1.3")
        .to(rodo.position, { x: xi - 1.15, duration: 0.5 }, "t+=1.5");

      // montadoras: busca nas bobinas e encaixa um componente por vez
      const montar = (m, placa, comps, tempo) => {
        if (!placa) return;
        const xs = slotX(placa.slot);
        const sub = gsap.timeline({ defaults: { ease: "power2.inOut" } });
        comps.forEach((c, i) => {
          const dados = TODOS[placa.comps.indexOf(c)];
          sub.to(m.cab.position, { x: xs + dados.x, z: dados.z, duration: tempo })
            .call(() => {
              c.visible = true;
              c.position.y = TOPO + 0.45;
            })
            .to(m.cab.position, { y: TOPO + dados.h + BICO, duration: tempo * 0.45, ease: "power1.in" })
            .to(c.position, { y: TOPO, duration: tempo * 0.5, ease: "bounce.out" }, "<")
            .to(m.cab.position, { y: Y_CABECOTE, duration: tempo * 0.45, ease: "power1.out" });
          if (i === comps.length - 1) sub.to(m.cab.position, { x: m.casa.x, z: m.casa.z, duration: 0.3 });
        });
        tl.add(sub, "t+=0.05");
      };
      const p2 = naEstacao(EST.montadora1);
      const p3 = naEstacao(EST.montadora2);
      montar(mont1, p2, p2 ? grandes(p2) : [], 0.24);
      montar(mont2, p3, p3 ? pequenos(p3) : [], 0.1);

      // forno: a solda derrete e fica brilhante
      const p4 = naEstacao(EST.forno);
      if (p4) tl.call(() => (p4.pads.material = matSolda), null, "t+=1.4");

      // AOI: a lâmina de luz varre a placa; aprovada -> verde e LEDs acendem,
      // reprovada -> vermelho e marcador no componente
      const p5 = naEstacao(EST.aoi);
      if (p5) {
        tl.set(matLamina.color, { r: 0.13, g: 0.83, b: 0.93 }, "t")
          .to(matLamina, { opacity: 0.35, duration: 0.2 }, "t+=0.1")
          .fromTo([camAoi.position, lamina.position], { x: xAoi - 1.15 }, { x: xAoi + 1.15, duration: 1.3, ease: "power1.inOut" }, "t+=0.1")
          .to(matLamina, { opacity: 0, duration: 0.2 }, "t+=1.25")
          .call(() => {
            sinal(p5.ng ? 0 : 2);
            matFlash.color.setHex(p5.ng ? 0xef4444 : 0x34d399);
            if (p5.ng) p5.marcador.visible = true;
          }, null, "t+=1.4")
          .fromTo(matFlash, { opacity: 0.7 }, { opacity: 0, duration: 0.6 }, "t+=1.4")
          .to(camAoi.position, { x: xAoi - 1.15, duration: 0.5 }, "t+=1.5")
          .set(lamina.position, { x: xAoi - 1.15 }, "t+=2.0");
        if (!p5.ng) tl.to(p5.matLed.color, { r: LED_ACESO.r, g: LED_ACESO.g, b: LED_ACESO.b, duration: 0.3 }, "t+=1.5");
        if (p5.ng) tl.fromTo(matMarcador, { opacity: 0.9 }, { opacity: 0.35, duration: 0.25, repeat: 3, yoyo: true }, "t+=1.4");
      }

      // saída: a placa reprovada vai para a caixa de NG
      const p6 = naEstacao(EST.saida);
      if (p6?.ng) {
        // sobe acima do trilho, vai para trás e cai na caixa
        tl.to(p6.grupo.position, { y: 0.2, duration: 0.15 }, "t+=0.3")
          .to(p6.grupo.position, { z: -2.15, duration: 0.55, ease: "power2.inOut" }, "t+=0.4")
          .to(p6.grupo.position, { y: -0.27, duration: 0.25, ease: "power2.in" }, "t+=0.95")
          .to(p6.grupo.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.3, ease: "power2.in" }, "t+=1.7")
          .set(p6.grupo, { visible: false }, "t+=2.0");
      }

      tl.to({}, { duration: 0.1 }); // garante a parada mínima
    };

    // ------------------------------------------------------------- render
    const parallax = new THREE.Vector2();
    const onPointerMove = (e) => parallax.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);

    const posicionarPlacas = () => {
      placas.forEach((p) => (p.grupo.position.x = slotX(p.slot + esteira.avanco)));
      matEsteira.uniforms.uDesloc.value = (esteira.total + esteira.avanco) * PASSO;
      mont1.barra.position.x = mont1.cab.position.x;
      mont2.barra.position.x = mont2.cab.position.x;
    };

    const renderizar = () => {
      renderer.render(scene, camera);
      canvas.style.opacity = "1";
    };

    let animId;
    let visivel = true;
    let tempo = 0;
    let ultimo = performance.now();
    const loop = (agora) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((agora - ultimo) / 1000, 0.05);
      ultimo = agora;
      if (!visivel || document.hidden) return;
      tempo += dt;
      atual?.timeScale(ritmo.v);
      posicionarPlacas();
      matCalor.opacity = 0.12 + Math.sin(tempo * 3) * 0.04;
      matLampada.color.setHex(api.current.erro ? 0xef4444 : Math.sin(tempo * 4) > -0.3 ? 0x22c55e : 0x14532d);
      if (!api.current.mergulhando) {
        linha.rotation.y = THREE.MathUtils.damp(linha.rotation.y, Math.sin(tempo * 0.3) * 0.025 + parallax.x * 0.05, 3, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraBase.y - parallax.y * 0.8, 3, dt);
        camera.lookAt(alvo);
      }
      renderizar();
    };

    const animacoes = [];
    api.current = {
      mergulhando: false,
      erro: false,
      pulso: () => {
        // digitar acelera a linha por um instante
        if (reduzir) return;
        gsap.fromTo(ritmo, { v: 3 }, { v: 1, duration: 0.8, ease: "power2.out", overwrite: true });
      },
      estado: (tipo) => {
        if (api.current.mergulhando) return; // a entrada já começou
        api.current.erro = tipo === "erro";
        matTrilhoLuz.color.setHex(tipo === "erro" ? 0xf87171 : 0x34d399);
        if (reduzir) {
          matTrilhoLuz.opacity = tipo ? 0.7 : 0;
          renderizar();
          return;
        }
        if (tipo === "ok") gsap.to(matTrilhoLuz, { opacity: 0.75, duration: 0.4, overwrite: true });
        else if (tipo === "erro") {
          gsap.fromTo(matTrilhoLuz, { opacity: 1 }, { opacity: 0.4, duration: 0.5, repeat: 1, yoyo: true, overwrite: true });
          animacoes.push(gsap.delayedCall(1.4, () => api.current && (api.current.erro = false)));
        } else gsap.to(matTrilhoLuz, { opacity: 0, duration: 0.4, overwrite: true });
      },
      ligar: () => {
        if (reduzir) return Promise.resolve();
        api.current.mergulhando = true;
        api.current.erro = false;
        atual?.kill();
        const tl = gsap.timeline();
        // todas as placas da linha ficam prontas e aprovadas de uma vez
        placas.forEach((p, i) => {
          if (p.slot >= N_PLACAS - 1) return;
          p.ng = false;
          p.marcador.visible = false;
          p.grupo.visible = true;
          gsap.killTweensOf([p.grupo.position, p.grupo.scale]);
          p.grupo.scale.setScalar(1);
          tl.to(p.grupo.position, { y: 0, z: 0, duration: 0.3 }, 0);
          p.pads.material = matSolda;
          p.comps.forEach((c, j) => {
            if (c.visible) return;
            c.visible = true;
            tl.fromTo(c.position, { y: TOPO + 0.9 }, { y: TOPO, duration: 0.35, ease: "bounce.out" }, (i + j) * 0.012);
          });
          tl.to(p.matLed.color, { r: LED_ACESO.r, g: LED_ACESO.g, b: LED_ACESO.b, duration: 0.25 }, 0.3 + i * 0.04);
        });
        sinal(2);
        [mont1.cab, mont2.cab, camAoi].forEach((c) => tl.to(c.position, { y: Y_CABECOTE + 0.4, duration: 0.4 }, 0));
        matTrilhoLuz.color.setHex(0x67e8f9);
        tl.to(matTrilhoLuz, { opacity: 1, duration: 0.3 }, 0.2)
          .to(linha.rotation, { y: 0, duration: 0.5 }, 0.1);
        // mergulho da câmera na placa pronta da saída
        const final = naEstacao(EST.saida) || naEstacao(EST.aoi);
        const fx = final ? final.grupo.position.x : 0;
        const olhar = alvo.clone();
        tl.to(olhar, { x: fx, y: 0.05, z: 0, duration: 1.05, ease: "power3.in" }, 0.4).to(
          camera.position,
          { x: fx, y: 1.5, z: 1.3, duration: 1.05, ease: "power3.in", onUpdate: () => camera.lookAt(olhar) },
          0.4
        );
        animacoes.push(tl);
        return tl.then();
      },
    };

    ajustar();
    posicionarPlacas();
    if (reduzir) {
      renderizar();
    } else {
      // entrada: a linha sobe e começa a trabalhar
      animacoes.push(
        gsap.from(linha.position, { y: -1.6, duration: 0.9, ease: "back.out(1.5)" }),
        gsap.from(linha.rotation, { y: -0.35, duration: 1.1, ease: "power3.out" }),
        gsap.delayedCall(0.8, () => {
          esteira.total = -1;
          placas.forEach((p) => (p.slot -= 1));
          trabalhar();
        })
      );
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      animId = requestAnimationFrame(loop);
    }

    // Redimensionar o canvas apaga o desenho, e o ResizeObserver roda depois do
    // quadro já desenhado: redesenha na hora para não piscar em branco (ex.: o
    // formulário se fechando no login)
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      ajustar();
      renderizar();
    }) : null;
    ro?.observe(container);
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => (visivel = e.isIntersecting)) : null;
    io?.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      atual?.kill();
      animacoes.forEach((a) => a.kill());
      gsap.killTweensOf([ritmo, esteira, matTrilhoLuz, matLamina, matFlash, matMarcador, camera.position, linha.rotation, linha.position, rodo.position, mont1.cab.position, mont2.cab.position, camAoi.position]);
      placas.forEach((p) => gsap.killTweensOf([p.grupo.position, p.grupo.scale, p.matLed.color, ...p.comps.map((c) => c.position)]));
      window.removeEventListener("pointermove", onPointerMove);
      ro?.disconnect();
      io?.disconnect();
      descartaveis.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      api.current = null;
    };
  }, []);

  // As pontas da esteira esmaecem nas bordas da área
  const mascara = "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)";
  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ WebkitMaskImage: mascara, maskImage: mascara }} />;
});

export default LinhaProducaoScene;
