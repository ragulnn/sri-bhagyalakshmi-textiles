import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface SareeCanvasHeroProps {
  onExploreClick: () => void;
  onSelectCategory: (categoryId?: string) => void;
}

export const SareeCanvasHero: React.FC<SareeCanvasHeroProps> = ({
  onExploreClick,
  onSelectCategory
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGLFailed, setWebGLFailed] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;

    try {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 9.2);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.45;
      container.appendChild(renderer.domElement);

      // Warm temple lighting for silk and gold zari luster
      const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.8);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 2.9);
      mainLight.position.set(6, 8, 8);
      scene.add(mainLight);

      const zariGoldLight = new THREE.DirectionalLight(0xffd54f, 2.6);
      zariGoldLight.position.set(-8, -4, 6);
      scene.add(zariGoldLight);

      const centerWarmth = new THREE.PointLight(0xffc107, 2.8, 25);
      centerWarmth.position.set(0, 1.5, 5);
      scene.add(centerWarmth);

      const sareeGroup = new THREE.Group();
      scene.add(sareeGroup);

      function createSareeTexture(bodyColor: string, borderColor: string, zariColor: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.Texture();

        // Body weave
        ctx.fillStyle = bodyColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        for (let x = 0; x < canvas.width; x += 3) {
          ctx.fillRect(x, 0, 1.2, canvas.height);
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let y = 0; y < canvas.height; y += 3) {
          ctx.fillRect(0, y, canvas.width, 1.2);
        }

        // Borders
        const borderH = 105;
        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, canvas.width, borderH);
        ctx.fillRect(0, canvas.height - borderH, canvas.width, borderH);

        // Zari border stripes
        ctx.fillStyle = zariColor;
        ctx.fillRect(0, 8, canvas.width, 9);
        ctx.fillRect(0, 24, canvas.width, 15);
        ctx.fillRect(0, borderH - 16, canvas.width, 11);
        ctx.fillRect(0, canvas.height - borderH + 6, canvas.width, 11);
        ctx.fillRect(0, canvas.height - 38, canvas.width, 15);
        ctx.fillRect(0, canvas.height - 16, canvas.width, 9);

        // Chevron temple korvai peaks
        const step = 38;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += step) {
          ctx.moveTo(x, borderH);
          ctx.lineTo(x + step / 2, borderH - 32);
          ctx.lineTo(x + step, borderH);
        }
        ctx.fill();

        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += step) {
          ctx.moveTo(x, canvas.height - borderH);
          ctx.lineTo(x + step / 2, canvas.height - borderH + 32);
          ctx.lineTo(x + step, canvas.height - borderH);
        }
        ctx.fill();

        // Border floral motifs
        for (let x = 16; x < canvas.width; x += 32) {
          ctx.beginPath();
          ctx.arc(x, 52, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, canvas.height - 52, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Body paisley buttas
        const startY = borderH + 35;
        const endY = canvas.height - borderH - 35;
        for (let bx = 40; bx < canvas.width - 450; bx += 80) {
          for (let by = startY; by <= endY; by += 70) {
            ctx.beginPath();
            ctx.arc(bx, by, 8.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(bx + 5, by - 5);
            ctx.quadraticCurveTo(bx + 12, by - 14, bx + 4, by - 16);
            ctx.quadraticCurveTo(bx - 2, by - 10, bx, by - 6);
            ctx.fill();
          }
        }

        // Brocade Pallu
        const palluX = canvas.width - 440;
        ctx.fillStyle = borderColor;
        ctx.fillRect(palluX, 0, 440, canvas.height);

        ctx.fillStyle = zariColor;
        ctx.fillRect(palluX + 15, 0, 16, canvas.height);
        ctx.fillRect(palluX + 42, 0, 30, canvas.height);
        ctx.fillRect(palluX + 85, 0, 14, canvas.height);
        ctx.fillRect(palluX + 115, 0, 65, canvas.height);
        ctx.fillRect(palluX + 195, 0, 16, canvas.height);
        ctx.fillRect(palluX + 225, 0, 75, canvas.height);
        ctx.fillRect(palluX + 315, 0, 24, canvas.height);
        ctx.fillRect(palluX + 350, 0, 42, canvas.height);
        ctx.fillRect(canvas.width - 22, 0, 22, canvas.height);

        // Silk tassels
        ctx.fillStyle = '#ffe082';
        for (let ty = 14; ty < canvas.height; ty += 26) {
          ctx.beginPath();
          ctx.arc(canvas.width - 5, ty, 5.5, 0, Math.PI * 2);
          ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1.2, 1);
        return texture;
      }

      function createSareeMesh(
        baseY: number,
        ampY: number,
        freqY: number,
        loopRadius: number,
        zOffset: number,
        phase: number,
        texture: THREE.Texture,
        width = 1.85
      ) {
        const segmentsX = 180;
        const segmentsY = 24;
        const geom = new THREE.PlaneGeometry(34, width, segmentsX, segmentsY);
        const pos = geom.attributes.position;

        const origPoints = [];
        for (let i = 0; i < pos.count; i++) {
          origPoints.push({
            x: pos.getX(i),
            y: pos.getY(i),
            z: pos.getZ(i)
          });
        }

        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.3,
          metalness: 0.32,
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.userData = { baseY, ampY, freqY, loopRadius, zOffset, phase, origPoints };
        return mesh;
      }

      // 4 iconic South Indian silk sarees
      const texCrimson = createSareeTexture('#9e0b24', '#590311', '#ffd700');
      const texPeacock = createSareeTexture('#005b7f', '#003347', '#ffdf78');
      const texMint = createSareeTexture('#2e8563', '#8f143a', '#ffe885');
      const texMustard = createSareeTexture('#bf8a0a', '#6e1422', '#ffea88');

      const saree1 = createSareeMesh(-0.4, 1.35, 2.2, 2.2, 0.4, 0.0, texCrimson, 1.85);
      const saree2 = createSareeMesh(0.35, 1.2, 2.0, 2.0, -0.4, 2.1, texPeacock, 1.75);
      const saree3 = createSareeMesh(-0.15, 1.45, 2.5, 2.4, 0.85, 4.1, texMint, 1.8);
      const saree4 = createSareeMesh(0.55, 1.1, 1.8, 1.8, -1.0, 5.4, texMustard, 1.7);

      sareeGroup.add(saree1);
      sareeGroup.add(saree2);
      sareeGroup.add(saree3);
      sareeGroup.add(saree4);

      // Floating zari sparkles
      const zariCount = 280;
      const zariGeo = new THREE.BufferGeometry();
      const zariPos = new Float32Array(zariCount * 3);
      const zariData: { vx: number; origY: number; phase: number }[] = [];

      for (let i = 0; i < zariCount; i++) {
        zariPos[i * 3] = (Math.random() - 0.5) * 34;
        zariPos[i * 3 + 1] = (Math.random() - 0.5) * 7.5;
        zariPos[i * 3 + 2] = (Math.random() - 0.5) * 7.5;
        zariData.push({
          vx: 0.045 + Math.random() * 0.065,
          origY: zariPos[i * 3 + 1],
          phase: Math.random() * Math.PI * 2
        });
      }

      zariGeo.setAttribute('position', new THREE.BufferAttribute(zariPos, 3));
      const zariMat = new THREE.PointsMaterial({
        color: 0xffdf78,
        size: 0.1,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
      });
      const zariPoints = new THREE.Points(zariGeo, zariMat);
      scene.add(zariPoints);

      let mouseX = 0;
      let mouseY = 0;
      let targetMouseX = 0;
      let targetMouseY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener('mousemove', handleMouseMove);

      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      const clock = new THREE.Clock();

      function updateSareeGeometry(mesh: THREE.Mesh, time: number) {
        const { baseY, ampY, freqY, loopRadius, zOffset, phase, origPoints } = mesh.userData;
        const pos = mesh.geometry.attributes.position;

        for (let i = 0; i < origPoints.length; i++) {
          const p = origPoints[i];
          const x = p.x;
          const normalizedU = (x + 17) / 34;
          const flowT = x * 0.36 - time * 1.85 + phase;

          const centerFactor = Math.exp(-Math.pow(x / 4.5, 2));
          const theta = x * 1.1 + flowT * 0.55;
          const swirlY = Math.sin(theta) * loopRadius * centerFactor;
          const swirlZ = Math.cos(theta) * (loopRadius * 1.35) * centerFactor;

          const waveY = Math.sin(normalizedU * freqY * Math.PI * 2 + flowT) * ampY;
          const waveZ = Math.cos(normalizedU * 3.4 + flowT * 0.8) * 0.8;

          const widthOffset = p.y;
          const pleatCreases = Math.sin(widthOffset * 8.5 + flowT * 0.7) * 0.045;
          const twistAngle = Math.sin(x * 0.3 + flowT * 0.4) * 0.78;
          const fabricRoll = Math.sin(widthOffset * 2.0) * 0.15;

          const finalY =
            baseY + waveY + swirlY + Math.cos(twistAngle) * widthOffset + fabricRoll + pleatCreases;
          const finalZ = zOffset + waveZ + swirlZ + Math.sin(twistAngle) * widthOffset;

          pos.setXYZ(i, x, finalY, finalZ);
        }

        mesh.geometry.computeVertexNormals();
        pos.needsUpdate = true;
      }

      function animate() {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        targetMouseX += (mouseX * 0.5 - targetMouseX) * 0.05;
        targetMouseY += (mouseY * 0.3 - targetMouseY) * 0.05;
        camera.position.x = targetMouseX * 1.5;
        camera.position.y = targetMouseY * 1.2;
        camera.lookAt(0, 0, 0);

        [saree1, saree2, saree3, saree4].forEach((s) => updateSareeGeometry(s, elapsedTime));

        const pArr = zariGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < zariCount; i++) {
          const zd = zariData[i];
          pArr[i * 3] += zd.vx;
          pArr[i * 3 + 1] = zd.origY + Math.sin(elapsedTime * 2.2 + zd.phase) * 0.35;
          if (pArr[i * 3] > 17) {
            pArr[i * 3] = -17;
            pArr[i * 3 + 1] = (Math.random() - 0.5) * 7.5;
            zd.origY = pArr[i * 3 + 1];
          }
        }
        zariGeo.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
      }

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch {
      setWebGLFailed(true);
    }
  }, []);

  return (
    <section className="relative w-full h-screen min-h-[700px] bg-[#0a0908] flex items-center justify-center overflow-hidden border-b border-[#2A2621]">
      {/* 3D Moving Saree Simulation Canvas or Fallback */}
      {!webGLFailed ? (
        <div ref={mountRef} className="absolute inset-0 w-full h-full bg-transparent" />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#120508] via-[#0a0908] to-[#1a1207] opacity-90" />
      )}

      {/* Ambient Contrast Vignette & Soft Gradient Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(10,9,8,0.25)_0%,rgba(10,9,8,0.7)_70%,#0a0908_100%)] z-[1]" />

      {/* Center Stage Brand Typography */}
      <div className="relative z-10 text-center flex flex-col items-center justify-center px-4 max-w-5xl mx-auto">

        {/* Main Title Radiance */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[0.16em] uppercase text-white font-medium select-none text-center drop-shadow-[0_4px_30px_rgba(255,255,255,0.45)]">
          SRI BHAGYALAKSHMI
        </h1>
        <p className="font-serif italic text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0.25em] uppercase text-[#f7e7ce] font-normal mt-3 sm:mt-5 opacity-95 select-none text-center drop-shadow-[0_2px_18px_rgba(255,255,255,0.3)]">
          TEXTILES
        </p>

        {/* Navigation CTAs */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onExploreClick}
            className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#dfb15b]/70 bg-black/50 backdrop-blur-md text-[#f7e7ce] text-[11px] uppercase tracking-luxury hover:bg-[#dfb15b] hover:text-[#050404] transition-all duration-300 font-medium group cursor-pointer"
          >
            <span>Explore</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-y-0.5 transition-transform">
              arrow_downward
            </span>
          </button>

          <button
            onClick={() => onSelectCategory(undefined)}
            className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/20 bg-white/5 backdrop-blur-md text-white/90 text-[11px] uppercase tracking-luxury hover:bg-white/15 hover:text-white transition-all duration-300 font-medium cursor-pointer"
          >
            <span>All Sarees</span>
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
          </button>
        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <button
        onClick={onExploreClick}
        aria-label="Scroll to collection"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white transition-colors flex flex-col items-center cursor-pointer"
      >
        <span className="material-symbols-outlined text-2xl animate-bounce">expand_more</span>
      </button>
    </section>
  );
};
