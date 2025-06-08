import * as THREE from 'three';

export class Player {
  constructor(controls, voxelWorld, input) {
    this.controls    = controls;
    this.voxelWorld  = voxelWorld;
    this.input       = input;
    this.position    = controls.getObject().position;
    this.velocity    = new THREE.Vector3(0, 0, 0);

    this.speed            = 0.1;
    this.gravity          = 0.004;
    this.jumpImpulse      = 0.102;
    this.playerHeight     = 1.9;
    this.playerRadius     = 0.45;
    this.groundGraceTime  = 0.15;
    this.groundGraceTimer = 0;
  }

  isOnGround() {
    const footY = this.position.y - this.playerHeight - 0.05;
    // Query just below your feet
    const min = new THREE.Vector3(
      this.position.x - this.playerRadius,
      footY - 0.01,
      this.position.z - this.playerRadius
    );
    const max = new THREE.Vector3(
      this.position.x + this.playerRadius,
      footY + 0.01,
      this.position.z + this.playerRadius
    );

    const meshes = this.voxelWorld.getBlocksInAABB(min, max);
    return meshes.length > 0;
  }

  moveAxis(axis, delta) {
    if (delta === 0) return;
    // First, move
    this.position[axis] += delta;

    // Build AABB of player in world space
    const pMin = new THREE.Vector3(
      this.position.x - this.playerRadius,
      this.position.y - this.playerHeight,
      this.position.z - this.playerRadius
    );
    const pMax = new THREE.Vector3(
      this.position.x + this.playerRadius,
      this.position.y,
      this.position.z + this.playerRadius
    );

    // Fetch only blocks overlapping that box
    const blocks = this.voxelWorld.getBlocksInAABB(pMin, pMax);
    const eps = 0.001;

    for (let mesh of blocks) {
      const bMin = mesh.position.clone();
      const bMax = bMin.clone().addScalar(1);

      // Overlap test on the two other axes
      let overlap = false;
      if (axis === 'x') {
        overlap =
          pMax.y > bMin.y && pMin.y < bMax.y &&
          pMax.z > bMin.z && pMin.z < bMax.z;
      } else if (axis === 'z') {
        overlap =
          pMax.y > bMin.y && pMin.y < bMax.y &&
          pMax.x > bMin.x && pMin.x < bMax.x;
      } else if (axis === 'y') {
        overlap =
          pMax.x > bMin.x && pMin.x < bMax.x &&
          pMax.z > bMin.z && pMin.z < bMax.z;
      }

      if (!overlap) continue;

      // Now clamp along the moved axis
      if (delta > 0) {
        // moving positive → clamp to block's min face
        if (axis === 'x') this.position.x = bMin.x - this.playerRadius - eps;
        if (axis === 'z') this.position.z = bMin.z - this.playerRadius - eps;
        if (axis === 'y') {
          this.position.y = bMin.y - eps;
          this.velocity.y = 0;
          this.groundGraceTimer = 0;
        }
      } else {
        // moving negative → clamp to block's max face
        if (axis === 'x') this.position.x = bMax.x + this.playerRadius + eps;
        if (axis === 'z') this.position.z = bMax.z + this.playerRadius + eps;
        if (axis === 'y') {
          this.position.y = bMax.y + this.playerHeight + eps;
          this.velocity.y = 0;
          this.groundGraceTimer = this.groundGraceTime;
        }
      }
      // After handling first collision, break
      break;
    }
  }

  tryJump() {
    if (this.groundGraceTimer > 0 && Math.abs(this.velocity.y) < 0.01) {
      this.velocity.y = this.jumpImpulse;
      this.groundGraceTimer = 0;
    }
  }

  update(deltaSec) {
    if (!this.controls.isLocked) return;

    // Read input & build move deltas
    let f = 0, r = 0;
    if (this.input.isDown('KeyW')) f++;
    if (this.input.isDown('KeyS')) f--;
    if (this.input.isDown('KeyD')) r++;
    if (this.input.isDown('KeyA')) r--;
    const len = Math.hypot(f, r);
    if (len > 0) { f /= len; r /= len; }

    const forward = this.controls.getDirection(new THREE.Vector3()).setY(0).normalize();
    const right   = forward.clone().cross(new THREE.Vector3(0,1,0)).normalize();

    const dx = (forward.x * f + right.x * r) * this.speed;
    const dz = (forward.z * f + right.z * r) * this.speed;

    // X, then Z, then Y (gravity)
    this.moveAxis('x', dx);
    this.moveAxis('z', dz);

    // Gravity
    this.velocity.y -= this.gravity;
    this.moveAxis('y', this.velocity.y);

    // Ground snapping
    if (this.isOnGround()) {
      this.groundGraceTimer = this.groundGraceTime;
    } else {
      this.groundGraceTimer = Math.max(0, this.groundGraceTimer - deltaSec);
    }
  }
}
