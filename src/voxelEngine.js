import * as THREE from 'three';

export class VoxelWorld {
  constructor(scene) {
    this.scene = scene;
    this.blockSize = 1;
    this.blocks = new Map();

    // Shifted cube so (x,y,z) is its min corner
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.geometry.translate(0.5, 0.5, 0.5);

    this.material = new THREE.MeshLambertMaterial({ color: 0x55aa55 });
  }

  _toGrid(v) {
    return Math.floor(v + 1e-6);
  }
  _posKey(x, y, z) {
    return `${x}|${y}|${z}`;
  }

  addBlock(x, y, z) {
    const gx = this._toGrid(x),
          gy = this._toGrid(y),
          gz = this._toGrid(z),
          key = this._posKey(gx, gy, gz);
    if (this.blocks.has(key)) return;
    const mesh = new THREE.Mesh(this.geometry, this.material);
    mesh.position.set(gx, gy, gz);
    this.scene.add(mesh);
    this.blocks.set(key, mesh);
  }

  removeBlock(x, y, z) {
    const gx = this._toGrid(x),
          gy = this._toGrid(y),
          gz = this._toGrid(z),
          key = this._posKey(gx, gy, gz),
          mesh = this.blocks.get(key);
    if (!mesh) return;
    this.scene.remove(mesh);
    this.blocks.delete(key);
  }

  hasBlock(x, y, z) {
    const gx = this._toGrid(x),
          gy = this._toGrid(y),
          gz = this._toGrid(z);
    return this.blocks.has(this._posKey(gx, gy, gz));
  }

  createTerrain(width = 64, depth = 64, maxHeight = 16, scale = 16) {
    const halfW = Math.floor(width / 2),
          halfD = Math.floor(depth / 2);
    for (let ix = -halfW; ix < halfW; ix++) {
      for (let iz = -halfD; iz < halfD; iz++) {
        // simple height via sine+cos waves
        const sx = ix / scale,
              sz = iz / scale;
        const height =
          Math.floor(
            ((Math.sin(sx) + Math.cos(sz) + Math.sin(sx*0.5)*0.5 + 2) / 4)  // normalize to [0..1]
            * maxHeight
          );
        for (let y = 0; y < height; y++) {
          this.addBlock(ix, y, iz);
        }
      }
    }
  }

  // convenience flat world
  createFlatWorld(size = 16) {
    const half = Math.floor(size / 2);
    for (let x = -half; x < half; x++) {
      for (let z = -half; z < half; z++) {
        this.addBlock(x, 0, z);
      }
    }
  }

  getBlocksInAABB(min, max) {
    const blocks = [];
    const x0 = this._toGrid(min.x), x1 = this._toGrid(max.x);
    const y0 = this._toGrid(min.y), y1 = this._toGrid(max.y);
    const z0 = this._toGrid(min.z), z1 = this._toGrid(max.z);

    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          const mesh = this.blocks.get(this._posKey(x, y, z));
          if (mesh) blocks.push(mesh);
        }
      }
    }
    return blocks;
  }
}
