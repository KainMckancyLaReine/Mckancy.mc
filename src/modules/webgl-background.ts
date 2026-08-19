import * as THREE from 'three';
import { ScrollTrigger } from './motion';

export function initWebglBackground(isTouch: boolean): void {
  const canvas = document.getElementById('webgl') as HTMLCanvasElement | null;
  if (!canvas) return;

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 4000);
    camera.position.z = 500;

    const mouseT = { x: 0, y: 0 };
    let scrollProgress = 0;

    window.addEventListener('mousemove', (e) => {
      mouseT.x = (e.clientX / innerWidth) * 2 - 1;
      mouseT.y = -(e.clientY / innerHeight) * 2 + 1;
    });

    const N = isTouch ? 600 : 1200;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const sz = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = 500 + Math.random() * 1600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi) - 300;
      sz[i] = Math.random() * 1.4 + 0.3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));

    const dustMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: Math.min(devicePixelRatio, 2) } },
      vertexShader: `
        attribute float aSize;
        uniform float uTime;
        uniform float uPR;
        varying float vB;
        void main() {
          vec3 p = position;
          p.x += sin(uTime*0.0003 + position.y*0.001) * 6.0;
          p.y += cos(uTime*0.0002 + position.x*0.001) * 6.0;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * uPR * (220.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
          vB = 0.5 + aSize * 0.25;
        }`,
      fragmentShader: `
        varying float vB;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.0, d) * vB;
          gl_FragColor = vec4(vec3(0.04), a * 0.45);
        }`,
      transparent: true,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, dustMat);
    scene.add(points);

    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (s) => {
        scrollProgress = s.progress;
      },
    });

    function tick(time: number) {
      dustMat.uniforms.uTime.value = time;
      points.rotation.y = time * 0.000012;
      points.rotation.x = time * 0.000007;

      const tx = mouseT.x * 50;
      const ty = mouseT.y * 30;
      camera.position.x += (tx - camera.position.x) * 0.04;
      camera.position.y += (ty - camera.position.y) * 0.04;
      camera.position.z = 500 - scrollProgress * 800;
      camera.lookAt(0, 0, -300);
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    window.addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });
  } catch (err) {
    console.warn('WebGL background failed', err);
  }
}
