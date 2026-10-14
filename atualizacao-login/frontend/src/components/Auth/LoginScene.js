import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { criarRng, DIRECOES } from "../Layout/pcbUtil";

/**
 * LoginScene - placa de circuito 3D do painel de marca do login.
 *
 * - Ao abrir: o chip central (com o logo do MGSP) desce no lugar, as trilhas se
 *   desenham do centro para as bordas e os componentes aparecem conforme a
 *   "corrente" chega.
 * - pulso(): cada tecla digitada solta pulsos de luz do chip pelas trilhas.
 * - estado('ok' | 'erro' | null): anel verde/vermelho em volta do chip.
 * - ligar(): a placa liga inteira e a câmera mergulha no chip (transição para
 *   a Home, cujo hero também é uma placa). Devolve uma Promise.
 *
 * É decoração (aria-hidden). Pausa com a aba oculta; com "reduzir movimento"
 * fica estática e ligar() resolve na hora; sem WebGL não renderiza nada.
 */

const COR_BASE = 0x3b6fd8;
const COR_ACESA = 0x8ff3ff;
const COR_OK = 0x34d399;
const COR_ERRO = 0xf87171;
const RAIO_MAX = 14;
const LADO_CHIP = 3.2;
const PINOS_POR_LADO = 9;
const PASSO = 0.6;
const QTD_PULSOS = 90;
const RASTRO = 3;
const MEIA_LARGURA_VISIVEL = 7.5; // quanto da placa aparece na horizontal

const traceVertex = `
  attribute float aDist;
  varying float vDist;
  void main() {
    vDist = aDist;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const traceFragment = `
  uniform float uRevela;
  uniform float uLuz;
  uniform float uOnda;
  uniform vec3 uBase;
  uniform vec3 uAcesa;
  varying float vDist;
  void main() {
    if (vDist > uRevela) discard;
    float cabeca = exp(-pow(uRevela - vDist, 2.0) * 1.2);
    float onda = exp(-pow(uOnda - vDist, 2.0) * 0.6);
    float acesa = clamp(cabeca + onda + uLuz * 0.8, 0.0, 1.0);
    float bordas = 1.0 - smoothstep(10.5, ${RAIO_MAX.toFixed(1)}, vDist);
    gl_FragColor = vec4(mix(uBase, uAcesa, acesa), (0.45 + 0.55 * acesa) * bordas);
  }
`;

const pulseVertex = `
  attribute float aAlpha;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vAlpha = aAlpha;
    gl_PointSize = (3.0 + 5.0 * aAlpha) * uPixelRatio * (16.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const pulseFragment = `
  varying float vAlpha;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    gl_FragColor = vec4(0.62, 0.95, 1.0, (1.0 - r * 2.0) * vAlpha);
  }
`;

// Trilhas saindo dos pinos do chip para fora, com curvas de 45°
function gerarTrilhas(rand) {
  const trilhas = [];
  const meio = LADO_CHIP / 2;
  const lados = [
    { dir: 0, pos: (t) => [meio + 0.25, t] }, // direita
    { dir: 4, pos: (t) => [-meio - 0.25, t] }, // esquerda
    { dir: 2, pos: (t) => [t, meio + 0.25] }, // frente
    { dir: 6, pos: (t) => [t, -meio - 0.25] }, // trás
  ];
  for (const lado of lados) {
    for (let p = 0; p < PINOS_POR_LADO; p++) {
      const t = -meio + 0.3 + (p * (LADO_CHIP - 0.6)) / (PINOS_POR_LADO - 1);
      let [x, z] = lado.pos(t);
      let dir = lado.dir;
      const pontos = [new THREE.Vector3(x, 0.03, z)];
      const passos = 12 + Math.floor(rand() * 14);
      for (let k = 0; k < passos; k++) {
        const diagonal = dir % 2 === 1;
        if (k > 2 && (diagonal ? rand() < 0.4 : rand() < 0.16)) dir = (dir + (rand() < 0.5 ? 1 : 7)) % 8;
        // nunca volta na direção do chip
        const [dx, dz] = DIRECOES[dir];
        const nx = x + dx * PASSO;
        const nz = z + dz * PASSO;
        if (Math.hypot(nx, nz) < Math.hypot(x, z) || Math.hypot(nx, nz) > RAIO_MAX) break;
        x = nx;
        z = nz;
        pontos.push(new THREE.Vector3(x, 0.03, z));
      }
      if (pontos.length < 4) continue;
      const acumulado = [0];
      for (let k = 1; k < pontos.length; k++) acumulado.push(acumulado[k - 1] + pontos[k].distanceTo(pontos[k - 1]));
      trilhas.push({ pontos, acumulado, total: acumulado[acumulado.length - 1] });
    }
  }
  return trilhas;
}

function pontoNaTrilha(trilha, distancia, destino) {
  const { pontos, acumulado } = trilha;
  const d = Math.max(0, Math.min(distancia, trilha.total));
  let k = 1;
  while (k < acumulado.length - 1 && acumulado[k] < d) k++;
  const inicio = acumulado[k - 1];
  return destino.lerpVectors(pontos[k - 1], pontos[k], (d - inicio) / Math.max(acumulado[k] - inicio, 1e-6));
}

const LoginScene = forwardRef(function LoginScene(_, ref) {
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
      return undefined; // sem WebGL: fica só o gradiente do painel
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0", transition: "opacity 700ms ease-out" });
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const cameraBase = new THREE.Vector3(0, 16, 10);
    // olha para trás do chip: ele fica no terço de baixo do painel, longe do texto
    const alvo = new THREE.Vector3(0, 0, -3.5);
    camera.position.copy(cameraBase);

    const ajustar = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const metade = Math.atan(MEIA_LARGURA_VISIVEL / cameraBase.length());
      camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(metade) / camera.aspect)), 30, 72);
      camera.updateProjectionMatrix();
    };
    ajustar();
    camera.lookAt(alvo);

    scene.add(new THREE.AmbientLight(0x9db7ff, 0.95));
    const luz = new THREE.DirectionalLight(0xffffff, 1.3);
    luz.position.set(4, 10, 6);
    scene.add(luz);

    const descartaveis = [];
    const rand = criarRng(20261013);
    const trilhas = gerarTrilhas(rand);
    const raioMaximo = Math.max(...trilhas.map((t) => t.pontos[t.pontos.length - 1].length()));

    // --- Trilhas (um LineSegments, revelado pelo shader conforme a distância do centro)
    const posicoes = [];
    const distancias = [];
    trilhas.forEach(({ pontos }) => {
      for (let k = 1; k < pontos.length; k++) {
        posicoes.push(pontos[k - 1].x, pontos[k - 1].y, pontos[k - 1].z, pontos[k].x, pontos[k].y, pontos[k].z);
        distancias.push(pontos[k - 1].length(), pontos[k].length());
      }
    });
    const geoTrilhas = new THREE.BufferGeometry();
    geoTrilhas.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3));
    geoTrilhas.setAttribute("aDist", new THREE.Float32BufferAttribute(distancias, 1));
    const uniforms = {
      uRevela: { value: reduzir ? RAIO_MAX + 2 : 0 },
      uLuz: { value: 0 },
      uOnda: { value: -10 },
      uBase: { value: new THREE.Color(COR_BASE) },
      uAcesa: { value: new THREE.Color(COR_ACESA) },
    };
    const matTrilhas = new THREE.ShaderMaterial({ uniforms, vertexShader: traceVertex, fragmentShader: traceFragment, transparent: true, depthWrite: false });
    scene.add(new THREE.LineSegments(geoTrilhas, matTrilhas));
    descartaveis.push(geoTrilhas, matTrilhas);

    // --- Chip central com o logo do MGSP no topo
    const chip = new THREE.Group();
    const geoCorpo = new THREE.BoxGeometry(LADO_CHIP, 0.5, LADO_CHIP);
    const matCorpo = new THREE.MeshLambertMaterial({ color: 0x0b1640 });
    const corpo = new THREE.Mesh(geoCorpo, matCorpo);
    corpo.position.y = 0.25;
    chip.add(corpo);
    const geoTopo = new THREE.PlaneGeometry(2.3, 2.3);
    geoTopo.rotateX(-Math.PI / 2);
    const matFundo = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const fundoLogo = new THREE.Mesh(geoTopo, matFundo);
    fundoLogo.position.y = 0.51;
    chip.add(fundoLogo);
    const texturaLogo = new THREE.TextureLoader().load("/images/icones/MGSP.png", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      if (reduzir) renderizar();
    });
    const geoLogo = new THREE.PlaneGeometry(1.9, 1.9);
    geoLogo.rotateX(-Math.PI / 2);
    const matLogo = new THREE.MeshBasicMaterial({ map: texturaLogo, transparent: true });
    const logo = new THREE.Mesh(geoLogo, matLogo);
    logo.position.y = 0.52;
    chip.add(logo);
    // pinos nas quatro bordas
    const geoPino = new THREE.BoxGeometry(0.14, 0.08, 0.4);
    const matPino = new THREE.MeshLambertMaterial({ color: 0xb8c4d9 });
    const pinos = new THREE.InstancedMesh(geoPino, matPino, PINOS_POR_LADO * 4);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let ip = 0;
    for (let lado = 0; lado < 4; lado++) {
      for (let p = 0; p < PINOS_POR_LADO; p++) {
        const t = -LADO_CHIP / 2 + 0.3 + (p * (LADO_CHIP - 0.6)) / (PINOS_POR_LADO - 1);
        const fora = LADO_CHIP / 2 + 0.12;
        const pos = [[fora, 0.05, t], [-fora, 0.05, t], [t, 0.05, fora], [t, 0.05, -fora]][lado];
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), lado < 2 ? Math.PI / 2 : 0);
        m4.compose(new THREE.Vector3(...pos), q, new THREE.Vector3(1, 1, 1));
        pinos.setMatrixAt(ip++, m4);
      }
    }
    chip.add(pinos);
    chip.position.y = reduzir ? 0 : 7;
    scene.add(chip);
    descartaveis.push(geoCorpo, matCorpo, geoTopo, matFundo, texturaLogo, geoLogo, matLogo, geoPino, matPino);

    // --- Anel de estado em volta do chip
    const geoAnel = new THREE.RingGeometry(2.55, 2.75, 72);
    geoAnel.rotateX(-Math.PI / 2);
    const matAnel = new THREE.MeshBasicMaterial({ color: COR_OK, transparent: true, opacity: 0, depthWrite: false });
    const anel = new THREE.Mesh(geoAnel, matAnel);
    anel.position.y = 0.04;
    scene.add(anel);
    descartaveis.push(geoAnel, matAnel);

    // --- Componentes SMD no fim das trilhas (aparecem quando a "corrente" chega)
    const componentes = [];
    trilhas.forEach((t) => {
      if (rand() < 0.55) {
        const fim = t.pontos[t.pontos.length - 1];
        const grande = rand() < 0.2;
        componentes.push({
          pos: new THREE.Vector3(fim.x, 0, fim.z),
          tam: grande ? [1.1, 0.35, 0.9] : [0.45, 0.2, 0.28],
          giro: rand() < 0.5 ? 0 : Math.PI / 2,
          dist: fim.length(),
          escala: reduzir ? 1 : 0,
        });
      }
    });
    const geoComp = new THREE.BoxGeometry(1, 1, 1);
    const matComp = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const comps = new THREE.InstancedMesh(geoComp, matComp, componentes.length);
    const tons = [0x13235c, 0x1a3170, 0x24418a, 0x0e1b4a];
    componentes.forEach((c, i) => comps.setColorAt(i, new THREE.Color(tons[i % tons.length])));
    if (comps.instanceColor) comps.instanceColor.needsUpdate = true;
    scene.add(comps);
    descartaveis.push(geoComp, matComp);

    const atualizarComponentes = () => {
      const revela = uniforms.uRevela.value;
      componentes.forEach((c, i) => {
        if (!reduzir) c.escala = THREE.MathUtils.clamp((revela - c.dist + 0.6) / 1.2, 0, 1);
        const s = c.escala;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), c.giro);
        m4.compose(
          new THREE.Vector3(c.pos.x, (c.tam[1] * s) / 2, c.pos.z),
          q,
          new THREE.Vector3(c.tam[0] * Math.max(s, 0.001), c.tam[1] * Math.max(s, 0.001), c.tam[2] * Math.max(s, 0.001))
        );
        comps.setMatrixAt(i, m4);
      });
      comps.instanceMatrix.needsUpdate = true;
    };
    atualizarComponentes();

    // --- Pulsos de luz pelas trilhas
    const pulsos = Array.from({ length: QTD_PULSOS }, () => ({ ativo: false, trilha: trilhas[0], s: 0, vel: 0 }));
    const posPulsos = new Float32Array(QTD_PULSOS * RASTRO * 3);
    const alfaPulsos = new Float32Array(QTD_PULSOS * RASTRO);
    const geoPulsos = new THREE.BufferGeometry();
    const atrPos = new THREE.BufferAttribute(posPulsos, 3).setUsage(THREE.DynamicDrawUsage);
    const atrAlfa = new THREE.BufferAttribute(alfaPulsos, 1).setUsage(THREE.DynamicDrawUsage);
    geoPulsos.setAttribute("position", atrPos);
    geoPulsos.setAttribute("aAlpha", atrAlfa);
    const matPulsos = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: pixelRatio } },
      vertexShader: pulseVertex,
      fragmentShader: pulseFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pontosPulsos = new THREE.Points(geoPulsos, matPulsos);
    pontosPulsos.frustumCulled = false;
    scene.add(pontosPulsos);
    descartaveis.push(geoPulsos, matPulsos);

    const soltarPulsos = (n) => {
      let soltos = 0;
      for (const p of pulsos) {
        if (soltos >= n) break;
        if (p.ativo) continue;
        p.ativo = true;
        p.trilha = trilhas[Math.floor(Math.random() * trilhas.length)];
        p.s = 0;
        p.vel = 6 + Math.random() * 6;
        soltos++;
      }
    };

    const tmp = new THREE.Vector3();
    const atualizarPulsos = (dt) => {
      pulsos.forEach((p, i) => {
        if (p.ativo) {
          p.s += p.vel * dt;
          if (p.s > p.trilha.total + 1) p.ativo = false;
        }
        for (let r = 0; r < RASTRO; r++) {
          const idx = i * RASTRO + r;
          if (!p.ativo) {
            alfaPulsos[idx] = 0;
            continue;
          }
          pontoNaTrilha(p.trilha, p.s - r * 0.35, tmp);
          posPulsos[idx * 3] = tmp.x;
          posPulsos[idx * 3 + 1] = 0.1;
          posPulsos[idx * 3 + 2] = tmp.z;
          alfaPulsos[idx] = (1 - r / RASTRO) * (1 - THREE.MathUtils.smoothstep(p.s / Math.max(p.trilha.total, 1), 0.85, 1));
        }
      });
      atrPos.needsUpdate = true;
      atrAlfa.needsUpdate = true;
    };

    // --- Parallax do mouse
    const parallax = new THREE.Vector2();
    const onPointerMove = (e) => {
      parallax.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };

    const renderizar = () => {
      renderer.render(scene, camera);
      canvas.style.opacity = "1";
    };

    // --- Montagem inicial: chip desce, trilhas se desenham, componentes aparecem
    const animacoes = [];
    if (!reduzir) {
      const intro = gsap.timeline({ delay: 0.15 });
      intro
        .to(chip.position, { y: 0, duration: 0.8, ease: "bounce.out" })
        .to(uniforms.uRevela, { value: raioMaximo + 2, duration: 1.6, ease: "power2.inOut" }, "-=0.35")
        .call(() => soltarPulsos(8), null, "-=0.4");
      animacoes.push(intro);
    }

    let animId;
    let ultimo = performance.now();
    let proximoPulso = 1.8;
    let tempo = 0;
    let visivel = true;
    const loop = (agora) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((agora - ultimo) / 1000, 0.05);
      ultimo = agora;
      if (!visivel || document.hidden) return;
      tempo += dt;
      // pulsos ocasionais mesmo sem digitar
      if (tempo > proximoPulso) {
        soltarPulsos(1);
        proximoPulso = tempo + 0.5 + Math.random() * 0.7;
      }
      atualizarComponentes();
      atualizarPulsos(dt);
      if (!api.current.mergulhando) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraBase.x + parallax.x * 1.2, 3, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraBase.z + parallax.y * 0.8, 3, dt);
        camera.lookAt(alvo);
      }
      renderizar();
    };

    api.current = {
      mergulhando: false,
      pulso: (n = 3) => {
        if (!reduzir) soltarPulsos(n);
      },
      estado: (tipo) => {
        if (api.current.mergulhando) return; // a entrada já começou
        if (tipo === "ok" || tipo === "erro") matAnel.color.setHex(tipo === "ok" ? COR_OK : COR_ERRO);
        const alvoOpacidade = tipo ? 0.9 : 0;
        if (reduzir) {
          matAnel.opacity = alvoOpacidade;
          renderizar();
          return;
        }
        gsap.to(matAnel, { opacity: alvoOpacidade, duration: 0.35, overwrite: true });
        if (tipo === "erro") {
          gsap.fromTo(anel.scale, { x: 1.15, z: 1.15 }, { x: 1, z: 1, duration: 0.5, ease: "elastic.out(1, 0.4)", overwrite: true });
        }
      },
      ligar: () => {
        if (reduzir) return Promise.resolve();
        api.current.mergulhando = true;
        soltarPulsos(QTD_PULSOS);
        matAnel.color.setHex(0xffffff);
        const tl = gsap.timeline();
        tl.to(uniforms.uLuz, { value: 1, duration: 0.35, ease: "power2.out" })
          .fromTo(uniforms.uOnda, { value: 0 }, { value: RAIO_MAX + 4, duration: 0.95, ease: "power1.out" }, 0)
          .to(matAnel, { opacity: 1, duration: 0.2 }, 0)
          .to(anel.scale, { x: 2.4, z: 2.4, duration: 0.9, ease: "power2.out" }, 0)
          .to(matAnel, { opacity: 0, duration: 0.6 }, 0.35)
          .to(camera.position, {
            x: 0,
            y: 4.2,
            z: 2.6,
            duration: 1.1,
            ease: "power3.in",
            onUpdate: () => camera.lookAt(0, 0, 0),
          }, 0.25);
        animacoes.push(tl);
        return tl.then();
      },
    };

    if (reduzir) {
      renderizar();
    } else {
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
      animacoes.forEach((a) => a.kill());
      gsap.killTweensOf([matAnel, anel.scale, uniforms.uLuz, uniforms.uOnda, uniforms.uRevela, chip.position, camera.position]);
      window.removeEventListener("pointermove", onPointerMove);
      ro?.disconnect();
      io?.disconnect();
      pinos.dispose();
      comps.dispose();
      descartaveis.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      api.current = null;
    };
  }, []);

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0 pointer-events-none" />;
});

export default LoginScene;
