import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-three-background',
  standalone: true,
  templateUrl: './three-background.component.html',
  styleUrl: './three-background.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreeBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private animationFrameId = 0;
  private resizeObserver?: ResizeObserver;
  private floatingGroup?: THREE.Group;
  private coreMesh?: THREE.Mesh;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;

    if (!parent) {
      return;
    }

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x020617, 12, 40);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0.5, 16);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio ?? 1, 2));
    this.renderer.setClearColor(0x020617, 0);

    const ambientLight = new THREE.AmbientLight(0x9be7ff, 2.6);
    const keyLight = new THREE.DirectionalLight(0x8b5cf6, 3.2);
    keyLight.position.set(4, 5, 8);
    const fillLight = new THREE.PointLight(0x22d3ee, 22, 40);
    fillLight.position.set(-8, -2, 6);

    this.scene.add(ambientLight, keyLight, fillLight);

    const coreGeometry = new THREE.IcosahedronGeometry(3.4, 1);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.75,
      roughness: 0.2,
      emissive: 0x083344,
      emissiveIntensity: 0.7,
      wireframe: true
    });
    this.coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.scene.add(this.coreMesh);

    this.floatingGroup = new THREE.Group();
    this.scene.add(this.floatingGroup);

    const bubbleGeometry = new THREE.SphereGeometry(0.35, 32, 32);
    const bubbleMaterials = [0x67e8f9, 0x818cf8, 0x22d3ee, 0x38bdf8].map(
      (color) =>
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.55,
          roughness: 0.3,
          metalness: 0.8
        })
    );

    for (let index = 0; index < 8; index += 1) {
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterials[index % bubbleMaterials.length]);
      const radius = 5 + index * 0.35;
      const angle = (index / 8) * Math.PI * 2;

      bubble.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.3) * 1.4, Math.sin(angle) * 2.8);
      bubble.scale.setScalar(0.8 + (index % 3) * 0.18);
      this.floatingGroup.add(bubble);
    }

    const points: number[] = [];
    for (let index = 0; index < 2400; index += 1) {
      const radius = 22 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

      points.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.045,
      transparent: true,
      opacity: 0.68,
      depthWrite: false
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(particles);

    const resizeCanvas = (): void => {
      if (!this.renderer || !this.camera) {
        return;
      }

      const { clientWidth, clientHeight } = parent;
      this.camera.aspect = clientWidth / clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(clientWidth, clientHeight, false);
    };

    this.resizeObserver = new ResizeObserver(resizeCanvas);
    this.resizeObserver.observe(parent);
    resizeCanvas();

    const animate = (): void => {
      if (!this.renderer || !this.scene || !this.camera || !this.coreMesh || !this.floatingGroup) {
        return;
      }

      this.animationFrameId = globalThis.requestAnimationFrame(animate);
      this.coreMesh.rotation.x += 0.0025;
      this.coreMesh.rotation.y += 0.0035;
      this.floatingGroup.rotation.y -= 0.0018;
      this.floatingGroup.rotation.x += 0.001;
      particles.rotation.y += 0.0008;

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== 0) {
      globalThis.cancelAnimationFrame(this.animationFrameId);
    }

    this.resizeObserver?.disconnect();
    this.renderer?.dispose();
  }
}
