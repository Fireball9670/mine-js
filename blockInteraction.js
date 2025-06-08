import * as THREE from 'three';

export class BlockInteraction {
  constructor(camera, voxelWorld, scene, controls) {
    this.camera     = camera;
    this.voxelWorld = voxelWorld;
    this.scene      = scene;
    this.controls   = controls;
    this.raycaster  = new THREE.Raycaster();

    const highlightGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    highlightGeo.translate(0.5, 0.5, 0.5);
    this.highlight = new THREE.Mesh(
      highlightGeo,
      new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true })
    );
    this.highlight.visible = false;
    this.scene.add(this.highlight);

    window.addEventListener('mousedown', e => this.onMouseDown(e));
    window.addEventListener('contextmenu', e => e.preventDefault());
  }

  getTarget() {
    this.raycaster.setFromCamera({ x:0,y:0 }, this.camera);
    const hits = this.raycaster.intersectObjects(Array.from(this.voxelWorld.blocks.values()));
    if (!hits.length) return null;
    const h = hits[0];
    return {
      pos:    h.object.position.clone(),
      normal: h.face.normal.clone()
    };
  }

  onMouseDown(e) {
    if (!this.controls.isLocked) return;
    const t = this.getTarget();
    if (!t) return;
    if (e.button === 0) {
      this.voxelWorld.removeBlock(t.pos.x, t.pos.y, t.pos.z);
    } else if (e.button === 2) {
      this.voxelWorld.addBlock(
        t.pos.x + t.normal.x,
        t.pos.y + t.normal.y,
        t.pos.z + t.normal.z
      );
    }
  }

  update() {
    const t = this.getTarget();
    if (t) {
      this.highlight.position.copy(t.pos);
      this.highlight.visible = true;
    } else {
      this.highlight.visible = false;
    }
  }
}
