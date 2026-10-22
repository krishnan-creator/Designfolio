import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const MAX_TRAIL = 128;

// Mouse-trail wave displacement injected into standard material vertex shader
function overrideVertexShader(vertexShader) {
  return vertexShader
    .replace(
      "#include <common>",
      `#include <common>
      varying float vHeight;
      attribute vec2 aOffset;
      uniform sampler2D uTrailTexture;
      uniform int       uTrailCount;
      uniform float     uWaveSpeed;
      uniform float     uWaveFreq;
      uniform float     uWaveWidth;
      uniform float     uFadeTime;
      uniform float     uAmplitude;
      uniform float     uJitter;
      uniform float     uMaxHeight;

      vec2 hash2( vec2 p ) {
        p = vec2( dot( p, vec2( 127.1, 311.7 ) ), dot( p, vec2( 269.5, 183.3 ) ) );
        return fract( sin( p ) * 43758.5453123 ) - 0.5;
      }`
    )
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>

      vHeight = 0.0;

      if ( position.y > 0.0 ) {
        vec2 jitter  = hash2( aOffset ) * uJitter;
        vec2 worldXZ = aOffset + jitter;
        float waveHeight  = 0.0;
        float totalWeight = 0.0;

        for ( int i = 0; i < uTrailCount; i++ ) {
          vec4 td = texture2D( uTrailTexture, vec2( ( float(i) + 0.5 ) / 128.0, 0.5 ) );
          float dist      = length( worldXZ - td.rg );
          float wavefront = uWaveSpeed * td.b;
          float relDist   = dist - wavefront;

          float window = exp( -( relDist * relDist ) / ( uWaveWidth * uWaveWidth ) );
          float fade   = exp( -td.b / uFadeTime );
          float atten  = 1.0 / ( 1.0 + dist * 0.1 );
          float weight = fade * window * atten * td.a;

          waveHeight  += weight * cos( uWaveFreq * relDist );
          totalWeight += weight;
        }

        waveHeight /= max( totalWeight, 1.0 );

        float displacement = clamp( waveHeight * uAmplitude, -uMaxHeight, uMaxHeight );
        transformed.y += displacement;
        vHeight = displacement;
      }`
    );
}

export default function WaveGridBackground({
  gridSize = 40,
  colorBase = "#F2F1EE",
  colorHigh = "#74767B",
  waveAmplitude = 0.18,
  waveSpeed = 4.2,
  waveFrequency = 1.1,
  waveWidth = 3.0,
  waveMaxHeight = 0.22,
  waveJitter = 0.08,
  autoAnimate = true,
  vignette = false,
  className = "",
  style = {}
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const propsRef = useRef({
    colorBase,
    colorHigh,
    waveAmplitude,
    waveSpeed,
    waveFrequency,
    waveWidth,
    waveMaxHeight,
    waveJitter,
    autoAnimate,
  });

  useEffect(() => {
    propsRef.current = {
      colorBase,
      colorHigh,
      waveAmplitude,
      waveSpeed,
      waveFrequency,
      waveWidth,
      waveMaxHeight,
      waveJitter,
      autoAnimate,
    };
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const cubeWidth = 0.8;
    const cubeHeight = 3;
    const gap = 0.01;
    const bounds = gridSize * (cubeWidth + gap);

    const getSize = () => ({
      width: container.clientWidth || window.innerWidth || 1,
      height: container.clientHeight || window.innerHeight || 1,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    });
    let size = getSize();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colorBase).multiplyScalar(0.7);

    const alphaRange = Math.PI * 0.03;
    const betaRange = Math.PI * 0.05;
    const mouse = new THREE.Vector2(0, 0);
    const lerpedMouse = new THREE.Vector2(0, 0);

    const camera = new THREE.PerspectiveCamera(40, size.width / size.height, 0.1, 500);
    let cameraRadius = 12;
    const fitCamera = () => {
      const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov) / 2;
      const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect);
      const halfBounds = bounds / 2;
      cameraRadius = Math.min(
        halfBounds / Math.tan(verticalHalfFov),
        halfBounds / Math.tan(horizontalHalfFov)
      ) * 0.9 + cubeHeight * 0.5;
    };
    const positionCamera = (mx, my) => {
      const alpha = my * alphaRange;
      const beta = mx * betaRange;
      camera.position.set(
        -cameraRadius * Math.cos(alpha) * Math.sin(beta),
        cameraRadius * Math.cos(alpha) * Math.cos(beta),
        cameraRadius * Math.sin(alpha)
      );
      camera.up.set(0, 0, -1);
      camera.lookAt(0, 0, 0);
    };
    fitCamera();
    positionCamera(0, 0);
    scene.add(camera);

    const ambientLight = new THREE.AmbientLight("#ffffff", 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight("#ffffff", 3.2);
    keyLight.position.set(-20, 10, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.radius = 6;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#ffffff", 0.8);
    fillLight.position.set(10, 5, -3);
    scene.add(fillLight);

    const trailData = new Float32Array(MAX_TRAIL * 4);
    const trailTexture = new THREE.DataTexture(
      trailData,
      MAX_TRAIL,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    trailTexture.needsUpdate = true;

    const trailUniforms = {
      uTrailTexture: { value: trailTexture },
      uTrailCount: { value: 0 },
      uFadeTime: { value: 2.0 },
      uWaveSpeed: { value: waveSpeed },
      uWaveFreq: { value: waveFrequency },
      uWaveWidth: { value: waveWidth },
      uAmplitude: { value: waveAmplitude },
      uJitter: { value: waveJitter },
      uMaxHeight: { value: waveMaxHeight },
    };
    const colorUniforms = {
      uColorBase: { value: new THREE.Color(colorBase) },
      uColorHigh: { value: new THREE.Color(colorHigh) },
    };

    const trail = [];
    let lastPoint = null;
    let timeSinceLastMove = 0;
    let randomPointTimer = 0;
    let placingRandom = true;
    const fadeTime = 2.0;
    const trailSpacing = 0.12;

    const rayPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(bounds, bounds),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false })
    );
    rayPlane.rotation.x = -Math.PI / 2;
    rayPlane.updateMatrixWorld(true);

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    // Check Hero isolation: if pointer is in hero section, DO NOT create ripples
    const isOverHero = (e) => {
      const hero = document.getElementById("hero-section");
      if (!hero) return false;
      const rect = hero.getBoundingClientRect();
      return e.clientY <= rect.bottom;
    };

    const onPointerMove = (e) => {
      if (isOverHero(e)) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerNDC.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      mouse.copy(pointerNDC);
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObject(rayPlane);
      if (hits.length === 0) return;
      const { x, z } = hits[0].point;

      let distDelta = 0;
      if (lastPoint) {
        const dx = x - lastPoint.x;
        const dz = z - lastPoint.z;
        distDelta = Math.sqrt(dx * dx + dz * dz);
        if (distDelta < trailSpacing) return;
      }
      if (trail.length >= MAX_TRAIL) trail.shift();
      trail.push({ x, z, age: 0, distDelta });
      lastPoint = { x, z };
      timeSinceLastMove = 0;
      placingRandom = false;
      randomPointTimer = 0;
    };

    // Use window listener with hero check so it never blocks page clicks
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const addRandomPoint = () => {
      const x = (Math.random() * 0.5 - 0.25) * bounds;
      const z = (Math.random() * 0.5 - 0.25) * bounds;
      const distDelta = 0.8 + Math.random() * 0.2;
      if (trail.length >= MAX_TRAIL) trail.shift();
      trail.push({ x, z, age: 0, distDelta });
    };

    const updateTrail = (delta) => {
      const expiry = fadeTime * 4;
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age += delta;
        if (trail[i].age > expiry) trail.splice(i, 1);
      }

      timeSinceLastMove += delta;
      if (timeSinceLastMove >= 3.0 && !placingRandom && propsRef.current.autoAnimate) {
        placingRandom = true;
        randomPointTimer = 0;
      }
      if (placingRandom && propsRef.current.autoAnimate) {
        randomPointTimer += delta;
        if (randomPointTimer >= 1.8) {
          addRandomPoint();
          randomPointTimer = 0;
        }
      }

      const count = Math.min(trail.length, MAX_TRAIL);
      if (count > 0 || trailUniforms.uTrailCount.value > 0) {
        for (let i = 0; i < count; i++) {
          const ti = i * 4;
          trailData[ti] = trail[i].x;
          trailData[ti + 1] = trail[i].z;
          trailData[ti + 2] = trail[i].age;
          trailData[ti + 3] = trail[i].distDelta;
        }
        trailTexture.needsUpdate = true;
        trailUniforms.uTrailCount.value = count;
      }
    };

    const count = gridSize * gridSize;
    const geometry = new THREE.BoxGeometry(cubeWidth, cubeHeight, cubeWidth);
    const offsetAttribute = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
    geometry.setAttribute("aOffset", offsetAttribute);

    const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, trailUniforms, colorUniforms);
      shader.vertexShader = overrideVertexShader(shader.vertexShader);
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          varying float vHeight;
          uniform vec3  uColorBase;
          uniform vec3  uColorHigh;
          uniform float uMaxHeight;`
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float t = clamp( vHeight / uMaxHeight, 0.0, 1.0 );
          diffuseColor.rgb = mix( uColorBase, uColorHigh, t );`
        );
    };

    const depthMaterial = new THREE.MeshDepthMaterial();
    depthMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, trailUniforms);
      shader.vertexShader = overrideVertexShader(shader.vertexShader);
    };

    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.customDepthMaterial = depthMaterial;
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    scene.add(instancedMesh);

    const dummy = new THREE.Object3D();
    const spacing = cubeWidth + gap;
    const offset = ((gridSize - 1) * spacing) / 2;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const index = i * gridSize + j;
        const x = i * spacing - offset;
        const z = j * spacing - offset;
        dummy.position.set(x, 0, z);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(index, dummy.matrix);
        offsetAttribute.setXY(index, x, z);
      }
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    offsetAttribute.needsUpdate = true;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) {
      return;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(colorBase, 0.7);
    renderer.setSize(size.width, size.height);
    renderer.setPixelRatio(size.pixelRatio);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());
    composer.setSize(size.width, size.height);
    composer.setPixelRatio(size.pixelRatio);

    const applySize = () => {
      size = getSize();
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
      fitCamera();
      positionCamera(lerpedMouse.x, lerpedMouse.y);
      renderer.setSize(size.width, size.height);
      renderer.setPixelRatio(size.pixelRatio);
      composer.setSize(size.width, size.height);
      composer.setPixelRatio(size.pixelRatio);
    };

    const resizeObserver = new ResizeObserver(applySize);
    resizeObserver.observe(container);
    window.addEventListener("resize", applySize);

    const clock = new THREE.Clock();
    let animId = null;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const delta = clock.getDelta();
      const p = propsRef.current;

      trailUniforms.uWaveSpeed.value = p.waveSpeed;
      trailUniforms.uWaveFreq.value = p.waveFrequency;
      trailUniforms.uWaveWidth.value = p.waveWidth;
      trailUniforms.uAmplitude.value = p.waveAmplitude;
      trailUniforms.uJitter.value = p.waveJitter;
      trailUniforms.uMaxHeight.value = p.waveMaxHeight;
      colorUniforms.uColorBase.value.set(p.colorBase);
      colorUniforms.uColorHigh.value.set(p.colorHigh);
      scene.background = new THREE.Color(p.colorBase).multiplyScalar(0.7);

      updateTrail(delta);
      lerpedMouse.x += (mouse.x - lerpedMouse.x) * 0.04;
      lerpedMouse.y += (mouse.y - lerpedMouse.y) * 0.04;
      positionCamera(lerpedMouse.x, lerpedMouse.y);
      composer.render();
    };

    renderLoop();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", applySize);
      window.removeEventListener("pointermove", onPointerMove);
      resizeObserver.disconnect();

      geometry.dispose();
      material.dispose();
      depthMaterial.dispose();
      rayPlane.geometry.dispose();
      rayPlane.material.dispose();
      trailTexture.dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, [gridSize]);

  return (
    <div
      ref={containerRef}
      className={`wave-grid-bg-wrap ${className}`.trim()}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        opacity: 0.72, // Reduced intensity by ~30% per Requirement 10.1
        ...style
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          pointerEvents: "none"
        }}
      />
    </div>
  );
}
