import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { VoxelWorld } from './voxelEngine.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { BlockInteraction } from './blockInteraction.js';

const scene    = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const maxHeight = 16;
const spawnY = maxHeight + 2;    // 2 blocks above the tallest point

const camera   = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, spawnY, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
// Smooth pixel ratio & responsive resizing
renderer.setPixelRatio(window.devicePixelRatio);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light    = new THREE.DirectionalLight(0xffffff,1);
light.position.set(10,20,10);
scene.add(light);

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());
document.body.addEventListener('click',() => controls.lock());

const input        = new Input();
const voxelWorld   = new VoxelWorld(scene);
voxelWorld.createTerrain(16, 16, maxHeight, 16);

const player       = new Player(controls, voxelWorld, input);
const interaction  = new BlockInteraction(camera, voxelWorld, scene, controls);

window.addEventListener('keydown', e => {
  if (e.code === 'Space' && controls.isLocked) player.tryJump();
});

// ——— Debug Overlay ———
const debugDiv = document.createElement('div');
debugDiv.style.position = 'fixed';
debugDiv.style.top = '8px';
debugDiv.style.left = '8px';
debugDiv.style.padding = '4px 8px';
debugDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
debugDiv.style.color = '#0f0';
debugDiv.style.fontFamily = 'monospace';
debugDiv.style.zIndex = '999';
document.body.appendChild(debugDiv);

let lastTime = performance.now();
function animate(now=performance.now()) {
  requestAnimationFrame(animate);
  const deltaSec = (now - lastTime)/1000;
  lastTime = now;

  player.update(deltaSec);
  interaction.update();

  // Update debug overlay
  const pos = controls.getObject().position;
  debugDiv.textContent = 
    `X: ${pos.x.toFixed(2)}\n` +
    `Y: ${pos.y.toFixed(2)}\n` +
    `Z: ${pos.z.toFixed(2)}`;

  renderer.render(scene, camera);
}

animate();
