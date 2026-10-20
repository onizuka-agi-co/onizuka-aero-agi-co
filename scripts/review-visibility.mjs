import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as THREE from 'three';

const bytes = await readFile(new URL('../public/assets/ax01/standard/mesh.json', import.meta.url));
const asset = JSON.parse(bytes);
const meshes = asset.parts.map(part => {
  const positions = part.positions.flatMap((_, index, values) => index % 3 === 0 ? [values[index + 1], values[index + 2], values[index]] : []);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(part.indices);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  mesh.name = part.name;
  mesh.updateMatrixWorld();
  return mesh;
});
const direction = new THREE.Vector3(0.82, 0.56, 0.59).normalize();
const ray = new THREE.Raycaster();
const checks = meshes.filter(mesh => /IntakeGraphite/.test(mesh.name)).map(mesh => {
  const counts = {};
  const positions = mesh.geometry.getAttribute('position');
  const indices = mesh.geometry.index;
  for (let index = 0; index < indices.count; index += 3) {
    const center = new THREE.Vector3();
    for (let corner = 0; corner < 3; corner += 1) center.add(new THREE.Vector3().fromBufferAttribute(positions, indices.getX(index + corner)));
    center.divideScalar(3);
    ray.set(center.clone().addScaledVector(direction, 100), direction.clone().negate());
    const first = ray.intersectObjects(meshes, false)[0]?.object.name ?? 'no-hit';
    counts[first] = (counts[first] ?? 0) + 1;
  }
  return { part: mesh.name, triangleCenterSamples: indices.count / 3, unoccludedSamples: counts[mesh.name] ?? 0, firstHitParts: counts };
});
const report = {
  schemaVersion: 1,
  recordType: 'observed-mesh-occlusion-review',
  designId: asset.designId,
  displayName: asset.displayName,
  variant: asset.variant,
  revision: asset.revision,
  checkedAt: new Date().toISOString(),
  license: 'CC-BY-4.0',
  attribution: 'ONIZUKA AERO AGI Co., SUZAKU mesh visibility review',
  meshSha256: createHash('sha256').update(bytes).digest('hex'),
  method: 'Orthographic ray casts from the studio direction to each target triangle center; geometric occlusion samples, not pixels or a concept similarity score.',
  direction: direction.toArray(),
  checks,
};
const output = process.argv[2];
if (output) await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
