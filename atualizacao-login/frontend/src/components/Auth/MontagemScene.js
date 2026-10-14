import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { criarRng } from "../Layout/pcbUtil";

/**
 * MontagemScene - linha de montagem SMT em miniatura (painel de marca do login).
 *
 * Ciclo: placa verde com os encaixes dourados vazios -> o cabeçote da
 * pick-and-place busca e encaixa os componentes um a um -> passada de reflow
 * (laranja) -> inspeção AOI (azul) -> a placa é desmontada e recomeça.
 *
 * Mesma interface da LoginScene:
 * - pulso(): digitar acelera a montagem por um instante.
 * - estado('ok' | 'erro' | null): inspeção verde / placa pisca vermelho.
 * - ligar(): a placa se completa de uma vez, os LEDs acendem e a câmera
 *   mergulha nela. Devolve uma Promise.
 *
 * É decoração (aria-hidden). Pausa com a aba oculta; com "reduzir movimento"
 * mostra a placa montada parada e ligar() resolve na hora; sem WebGL, nada.
 */

const LARG_PLACA = 8;
const PROF_PLACA = 5.4;
const ALT_PLACA = 0.16;
const TOPO = ALT_PLACA / 2;
const Y_CABECOTE = 2.4;
const ORIGEM_PECAS = { x: LARG_PLACA / 2 + 1.6, z: -0.4 }; // "feeder" à direita
const RAIO_ENQUADRAMENTO = 5.4;

// Componentes da placa: [tipo, x, z, largura, altura, profundidade]
function montarLista(rand) {
  const lista = [
    ["ci", -1.9, -0.4, 2.0, 0.28, 2.0],
    ["ci", 1.2, -1.3, 1.2, 0.24, 1.2],
    ["ci", 1.2, 0.9, 1.2, 0.24, 1.2],
    ["conector", -0.2, 2.05, 2.6, 0.5, 0.55],
    ["capacitor", 3.2, -1.7, 0.36, 0.75, 0.36],
    ["capacitor", 3.2, -0.7, 0.36, 0.75, 0.36],
    ["capacitor", -3.4, 1.7, 0.36, 0.75, 0.36],
  ];
  // resistores/capacitores SMD em fileiras
  for (let i = 0; i < 6; i++) lista.push(["smd", -0.6 + i * 0.42, -2.05, 0.3, 0.16, 0.5]);
  for (let i = 0; i < 4; i++) lista.push(["smd", 2.9, 0.4 + i * 0.42, 0.5, 0.16, 0.3]);
  for (let i = 0; i < 4; i++) lista.push(["smd", -3.4, -1.9 + i * 0.5, 0.5, 0.16, 0.3]);
  // LEDs na borda
  for (let i = 0; i < 5; i++) lista.push(["led", -3.2 + i * 0.55, 2.35, 0.28, 0.18, 0.28]);
  // embaralha um pouco a ordem de montagem (como numa máquina real, por tipo de bico)
  return lista
    .map((c, i) => ({ c, ordem: i < 4 ? i : 4 + rand() * 10 }))
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ c }) => ({ tipo: c[0], x: c[1], z: c[2], w: c[3], h: c[4], d: c[5] }));
}

const MontagemScene = forwardRef(function MontagemScene(_, ref) {
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
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    const direcaoCamera = new THREE.Vector3(0, 6.5, 7.5).normalize();
    const cameraBase = new THREE.Vector3();
    const alvo = new THREE.Vector3(0, 0, 0.2);

    // Enquadra a placa inteira em qualquer proporção da área
    const ajustar = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const meiaV = THREE.MathUtils.degToRad(camera.fov / 2);
      const meiaH = Math.atan(Math.tan(meiaV) * camera.aspect);
      const distancia = RAIO_ENQUADRAMENTO / Math.sin(Math.min(meiaV, meiaH));
      cameraBase.copy(direcaoCamera).multiplyScalar(distancia).add(alvo);
      if (!api.current?.mergulhando) camera.position.copy(cameraBase);
      camera.lookAt(alvo);
    };

    scene.add(new THREE.HemisphereLight(0xdbe8ff, 0x0b1640, 1.1));
    const luz = new THREE.DirectionalLight(0xffffff, 1.4);
    luz.position.set(-4, 9, 6);
    scene.add(luz);

    const descartaveis = [];
    const caixa = (w, h, d) => {
      const g = new THREE.BoxGeometry(w, h, d);
      descartaveis.push(g);
      return g;
    };
    const mat = (cor, extra = {}) => {
      const m = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.5, metalness: 0.15, ...extra });
      descartaveis.push(m);
      return m;
    };

    const placaGrupo = new THREE.Group();
    scene.add(placaGrupo);

    // Placa verde (máscara de solda) com contorno que acende
    const placa = new THREE.Mesh(caixa(LARG_PLACA, ALT_PLACA, PROF_PLACA), mat(0x0f5c3a, { roughness: 0.35 }));
    placaGrupo.add(placa);
    const matContorno = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    descartaveis.push(matContorno);
    const contorno = new THREE.Mesh(caixa(LARG_PLACA + 0.18, ALT_PLACA + 0.02, PROF_PLACA + 0.18), matContorno);
    placaGrupo.add(contorno);

    const rand = criarRng(20261013);
    const lista = montarLista(rand);

    // Encaixes (pads) dourados: aparecem vazios antes de cada peça chegar
    const matPad = mat(0xd4a93c, { metalness: 0.8, roughness: 0.3 });
    lista.forEach((c) => {
      const pad = new THREE.Mesh(caixa(c.w + 0.12, 0.02, c.d + 0.12), matPad);
      pad.position.set(c.x, TOPO + 0.01, c.z);
      placaGrupo.add(pad);
    });

    // Trilhas da serigrafia ligando os encaixes (linhas retas com cotovelo)
    const linhas = [];
    for (let i = 0; i < lista.length - 1; i++) {
      if (rand() < 0.45) continue;
      const a = lista[i];
      const b = lista[Math.min(lista.length - 1, i + 1 + Math.floor(rand() * 3))];
      const y = TOPO + 0.005;
      linhas.push(a.x, y, a.z, b.x, y, a.z, b.x, y, a.z, b.x, y, b.z);
    }
    const geoLinhas = new THREE.BufferGeometry();
    geoLinhas.setAttribute("position", new THREE.Float32BufferAttribute(linhas, 3));
    const matLinhas = new THREE.LineBasicMaterial({ color: 0x5fd39a, transparent: true, opacity: 0.55 });
    descartaveis.push(geoLinhas, matLinhas);
    placaGrupo.add(new THREE.LineSegments(geoLinhas, matLinhas));

    // Componentes
    const matCI = mat(0x161b26, { roughness: 0.4 });
    const matSMD = mat(0x2b2f3a);
    const matConector = mat(0xe8ecf2);
    const matCap = mat(0xb9c2cf, { metalness: 0.6, roughness: 0.35 });
    const matPino = mat(0xc9d2de, { metalness: 0.7 });
    const geoCilindro = new THREE.CylinderGeometry(0.18, 0.18, 0.75, 20);
    descartaveis.push(geoCilindro);

    const pecas = lista.map((c) => {
      const grupo = new THREE.Group();
      if (c.tipo === "capacitor") {
        const corpo = new THREE.Mesh(geoCilindro, matCap);
        corpo.position.y = c.h / 2;
        grupo.add(corpo);
      } else if (c.tipo === "led") {
        const matLed = new THREE.MeshBasicMaterial({ color: 0x1f3d2c });
        descartaveis.push(matLed);
        const led = new THREE.Mesh(caixa(c.w, c.h, c.d), matLed);
        led.position.y = c.h / 2;
        grupo.add(led);
        grupo.userData.led = matLed;
      } else {
        const material = c.tipo === "ci" ? matCI : c.tipo === "conector" ? matConector : matSMD;
        const corpo = new THREE.Mesh(caixa(c.w, c.h, c.d), material);
        corpo.position.y = c.h / 2;
        grupo.add(corpo);
        if (c.tipo === "ci") {
          // perninhas nas quatro bordas
          const n = Math.round(c.w / 0.22);
          const geoPino = caixa(0.07, 0.05, 0.18);
          for (let k = 0; k < n; k++) {
            const t = -c.w / 2 + 0.15 + (k * (c.w - 0.3)) / Math.max(n - 1, 1);
            [[t, c.d / 2 + 0.06], [t, -c.d / 2 - 0.06]].forEach(([x, z]) => {
              const p = new THREE.Mesh(geoPino, matPino);
              p.position.set(x, 0.03, z);
              grupo.add(p);
            });
            [[c.w / 2 + 0.06, t], [-c.w / 2 - 0.06, t]].forEach(([x, z]) => {
              const p = new THREE.Mesh(geoPino, matPino);
              p.position.set(x, 0.03, z);
              p.rotation.y = Math.PI / 2;
              grupo.add(p);
            });
          }
        }
      }
      grupo.position.set(c.x, TOPO, c.z);
      grupo.visible = !!reduzir;
      placaGrupo.add(grupo);
      return grupo;
    });

    // Cabeçote da pick-and-place (corpo + bico)
    const cabecote = new THREE.Group();
    const corpoCab = new THREE.Mesh(caixa(0.7, 0.45, 0.7), mat(0x2563eb, { metalness: 0.3 }));
    cabecote.add(corpoCab);
    const geoBico = new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10);
    descartaveis.push(geoBico);
    const bico = new THREE.Mesh(geoBico, matCap);
    bico.position.y = -0.65;
    cabecote.add(bico);
    cabecote.position.set(ORIGEM_PECAS.x, Y_CABECOTE, ORIGEM_PECAS.z);
    cabecote.visible = !reduzir;
    placaGrupo.add(cabecote);

    // Barras de luz das passadas de reflow (laranja) e inspeção AOI (azul/verde)
    const criarBarra = (cor) => {
      const m = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      descartaveis.push(m);
      const barra = new THREE.Mesh(caixa(0.35, 0.6, PROF_PLACA + 0.3), m);
      barra.position.set(-LARG_PLACA / 2, TOPO + 0.3, 0);
      placaGrupo.add(barra);
      return barra;
    };
    const reflow = criarBarra(0xff8a3d);
    const aoi = criarBarra(0x22d3ee);

    const varrer = (barra, cor) => {
      if (cor) barra.material.color.setHex(cor);
      return gsap
        .timeline()
        .set(barra.position, { x: -LARG_PLACA / 2 })
        .to(barra.material, { opacity: 0.75, duration: 0.2 })
        .to(barra.position, { x: LARG_PLACA / 2, duration: 1.2, ease: "power1.inOut" }, 0)
        .to(barra.material, { opacity: 0, duration: 0.25 }, 0.95);
    };

    // --- Ciclo de montagem
    let ciclo = null;
    const montarCiclo = () => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, defaults: { ease: "power2.inOut" } });
      tl.call(() => pecas.forEach((p) => (p.visible = false)));
      lista.forEach((c, i) => {
        const peca = pecas[i];
        tl.to(cabecote.position, { x: c.x, z: c.z, duration: 0.32 })
          .call(() => {
            peca.visible = true;
            peca.position.y = TOPO + 0.9;
            peca.scale.setScalar(1);
          })
          .to(cabecote.position, { y: Y_CABECOTE - 0.7, duration: 0.1, ease: "power1.in" })
          .to(peca.position, { y: TOPO, duration: 0.18, ease: "bounce.out" }, "<")
          .to(cabecote.position, { y: Y_CABECOTE, duration: 0.1, ease: "power1.out" });
      });
      tl.to(cabecote.position, { x: ORIGEM_PECAS.x, z: ORIGEM_PECAS.z, duration: 0.45 })
        .add(varrer(reflow, 0xff8a3d))
        .add(varrer(aoi, 0x22d3ee), "-=0.3")
        .to({}, { duration: 0.8 })
        // desmonta para o próximo ciclo
        .to(pecas.map((p) => p.scale), { x: 0.001, y: 0.001, z: 0.001, duration: 0.35, stagger: 0.015, ease: "power2.in" });
      return tl;
    };

    // --- Parallax e balanço suave da placa
    const parallax = new THREE.Vector2();
    const onPointerMove = (e) => parallax.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);

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
      placaGrupo.rotation.y = THREE.MathUtils.damp(placaGrupo.rotation.y, Math.sin(tempo * 0.35) * 0.12 + parallax.x * 0.15, 3, dt);
      if (!api.current.mergulhando) {
        camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraBase.y - parallax.y * 0.6, 3, dt);
        camera.lookAt(alvo);
      }
      renderizar();
    };

    const animacoes = [];
    api.current = {
      mergulhando: false,
      pulso: () => {
        // digitar acelera a montagem por um instante
        if (!ciclo || reduzir) return;
        gsap.killTweensOf(ciclo, "timeScale");
        gsap.fromTo(ciclo, { timeScale: 3 }, { timeScale: 1, duration: 0.7, ease: "power2.out" });
      },
      estado: (tipo) => {
        if (api.current.mergulhando) return; // a entrada já começou
        if (reduzir) {
          matContorno.color.setHex(tipo === "erro" ? 0xf87171 : 0x34d399);
          matContorno.opacity = tipo ? 0.6 : 0;
          renderizar();
          return;
        }
        if (tipo === "ok") {
          matContorno.color.setHex(0x34d399);
          gsap.to(matContorno, { opacity: 0.55, duration: 0.4, overwrite: true });
          animacoes.push(varrer(aoi, 0x34d399));
        } else if (tipo === "erro") {
          matContorno.color.setHex(0xf87171);
          gsap.fromTo(matContorno, { opacity: 0.95 }, { opacity: 0.35, duration: 0.6, repeat: 1, yoyo: true, overwrite: true });
        } else {
          gsap.to(matContorno, { opacity: 0, duration: 0.4, overwrite: true });
        }
      },
      ligar: () => {
        if (reduzir) return Promise.resolve();
        api.current.mergulhando = true;
        ciclo?.kill();
        const tl = gsap.timeline();
        // completa a placa de uma vez
        pecas.forEach((p, i) => {
          if (!p.visible || p.scale.x < 0.5) {
            p.visible = true;
            p.scale.setScalar(1);
            tl.fromTo(p.position, { y: TOPO + 1.2 }, { y: TOPO, duration: 0.3, ease: "bounce.out" }, i * 0.015);
          }
        });
        tl.to(cabecote.position, { y: Y_CABECOTE + 3, duration: 0.4, ease: "power2.in" }, 0);
        // LEDs e contorno acendem
        pecas.forEach((p) => {
          if (p.userData.led) tl.to(p.userData.led.color, { r: 0.55, g: 1, b: 0.75, duration: 0.25 }, 0.3);
        });
        matContorno.color.setHex(0x67e8f9);
        tl.to(matContorno, { opacity: 1, duration: 0.3 }, 0.3)
          .add(varrer(aoi, 0x67e8f9), 0.3)
          .to(placaGrupo.rotation, { y: 0, duration: 0.5 }, 0.2)
          .to(camera.position, {
            x: alvo.x,
            y: 1.6,
            z: alvo.z + 1.1,
            duration: 1.05,
            ease: "power3.in",
            onUpdate: () => camera.lookAt(alvo),
          }, 0.4);
        animacoes.push(tl);
        return tl.then();
      },
    };

    ajustar();
    if (reduzir) {
      renderizar();
    } else {
      // entrada: a placa sobe girando e o ciclo começa
      animacoes.push(
        gsap.from(placaGrupo.position, { y: -2.5, duration: 0.9, ease: "back.out(1.6)" }),
        gsap.from(placaGrupo.rotation, { y: -0.9, duration: 1.1, ease: "power3.out" })
      );
      ciclo = montarCiclo();
      ciclo.delay(0.9);
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
      ciclo?.kill();
      animacoes.forEach((a) => a.kill());
      gsap.killTweensOf([matContorno, camera.position, placaGrupo.rotation, placaGrupo.position, cabecote.position]);
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

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0 pointer-events-none" />;
});

export default MontagemScene;
