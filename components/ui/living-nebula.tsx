"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type NebulaColors = {
  gasColor1: [number, number, number];
  gasColor2: [number, number, number];
  backgroundColor: [number, number, number];
};

const LivingNebulaShader = ({ colors }: { colors?: NebulaColors }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  
  // Default colors
  const defaultColors: NebulaColors = {
    gasColor1: [0.8, 0.2, 0.5],
    gasColor2: [0.2, 0.3, 0.9],
    backgroundColor: [0.0, 0.0, 0.05],
  };
  
  const currentColors = colors || defaultColors;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1) Renderer, Scene, Camera, Clock - optimized settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: false,
    });
    // Limit pixel ratio for better performance on high-DPI displays
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    // 2) Shaders
    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      uniform vec3 uGasColor1;
      uniform vec3 uGasColor2;
      uniform vec3 uDeepSpace;

      float random(vec2 st) {
        return fract(
          sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123
        );
      }

      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(random(i), random(i + vec2(1.0, 0.0)), u.x),
          mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 6; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        // Normalize to −1..1 on the shorter side
        vec2 uv    = (gl_FragCoord.xy - 0.5 * iResolution.xy)
                     / iResolution.y;
        vec2 mouse = (iMouse      - 0.5 * iResolution.xy)
                     / iResolution.y;
        float t    = iTime * 0.1;

        // Warp around mouse
        float md = length(uv - mouse);
        vec2 offset = normalize(uv - mouse) / (md * 50.0);
        uv += offset * smoothstep(0.3, 0.0, md);

        // Rotate flow
        float angle = t * 0.3;
        mat2 rot = mat2(
          cos(angle), -sin(angle),
          sin(angle),  cos(angle)
        );
        vec2 p = rot * uv;

        // Two-layered cloud patterns
        float c1 = fbm(p * 2.0 + vec2(t, -t));
        float c2 = fbm(p * 4.0 - vec2(-t, t));

        // Colors
        vec3 color = uDeepSpace;

        color = mix(color, uGasColor1, smoothstep(0.4, 0.6, c1));
        color = mix(color, uGasColor2, smoothstep(0.5, 0.7, c2) * 0.5);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // 3) Build Mesh
    const uniforms = {
      iTime:       { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse:      { value: new THREE.Vector2(-100, -100) },
      uGasColor1:  { value: new THREE.Vector3(...currentColors.gasColor1) },
      uGasColor2:  { value: new THREE.Vector3(...currentColors.gasColor2) },
      uDeepSpace:  { value: new THREE.Vector3(...currentColors.backgroundColor) }
    };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const mesh     = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // 4) Resize Handler - debounced for performance
    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const width  = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        uniforms.iResolution.value.set(width, height);
      }, 150);
    };
    window.addEventListener('resize', onResize, { passive: true });
    onResize();

    // 5) Mouse Handler - throttled for performance
    let mouseUpdatePending = false;
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseUpdatePending) {
        mouseUpdatePending = true;
        requestAnimationFrame(() => {
          const x = e.clientX;
          const y = container.clientHeight - e.clientY;
          uniforms.iMouse.value.set(x, y);
          setMousePos({ x: e.clientX, y: e.clientY });
          mouseUpdatePending = false;
        });
      }
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // 6) Animation Loop - optimized with frame limiting
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    
    renderer.setAnimationLoop((time) => {
      const elapsed = time - lastFrameTime;
      if (elapsed >= frameInterval) {
        uniforms.iTime.value = clock.getElapsedTime();
        renderer.render(scene, camera);
        lastFrameTime = time - (elapsed % frameInterval);
      }
    });

    // Update colors when they change
    uniforms.uGasColor1.value.set(...currentColors.gasColor1);
    uniforms.uGasColor2.value.set(...currentColors.gasColor2);
    uniforms.uDeepSpace.value.set(...currentColors.backgroundColor);

    // 7) Cleanup
    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.setAnimationLoop(null);

      const canvas = renderer.domElement;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }

      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    };
  }, [currentColors.gasColor1, currentColors.gasColor2, currentColors.backgroundColor]);

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         '100vw',
          height:        '100vh',
          zIndex:        -1,
          pointerEvents: 'none'
        }}
        aria-label="Living Nebula animated background"
      />
      <div
        className="cursor-aura"
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         '20px',
          height:        '20px',
          borderRadius:  '50%',
          background:    'rgba(255,255,255,0.3)',
          transform:     `translate(${mousePos.x}px, ${mousePos.y}px)`,
          pointerEvents: 'none'
        }}
      />
    </>
  );
};

export default LivingNebulaShader;

