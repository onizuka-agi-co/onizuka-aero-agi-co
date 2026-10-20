import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

const EXPECTED_COORDINATES = Object.freeze({ forward: '+X', span: 'Y', up: '+Z' });
const EXPECTED_MODEL_REVISION = 'r3';
const STUDIO_BACKGROUND = '#bcbec0';
const STUDIO_FLOOR = '#bcbec0';
const FLIGHT_BACKGROUND = '#0d1b25';
const FLIGHT_FLOOR = '#10212a';
const HANGAR_FORWARD_LENGTH = 18;
const HANGAR_FRAME_FILL = 0.82;
const HANGAR_FLOOR_CLEARANCE = 0.55;
const HANGAR_CAMERA_DIRECTION = new THREE.Vector3(0.82, 0.56, 0.59).normalize();
const HANGAR_CAMERA_FORWARD = HANGAR_CAMERA_DIRECTION.clone().negate();
const HANGAR_CAMERA_RIGHT = HANGAR_CAMERA_FORWARD.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
const HANGAR_CAMERA_UP = HANGAR_CAMERA_RIGHT.clone().cross(HANGAR_CAMERA_FORWARD).normalize();
const DEFAULT_PART_FINISH = Object.freeze({ metalness: 0.24, roughness: 0.28 });
const PART_FINISHES = Object.freeze([
  Object.freeze({ match: /teardropcanopy|canopyglass|transparentcanopy/i, finish: Object.freeze({ metalness: 0, roughness: 0.12, transmission: 0.42, thickness: 0.22, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.06 }) }),
  Object.freeze({ match: /ivory|leading.?edge|canopybasetrim/i, finish: Object.freeze({ metalness: 0.04, roughness: 0.31 }) }),
  Object.freeze({ match: /gold|trim|tip|chevron|collar/i, finish: Object.freeze({ metalness: 0.58, roughness: 0.24 }) }),
  Object.freeze({ match: /pod|nozzle|exhaust|graphite|charcoal|intake/i, finish: Object.freeze({ metalness: 0.08, roughness: 0.42 }) }),
]);

function assertMeshDocument(document, variant) {
  if (!document || document.schemaVersion !== 1 || document.designId !== 'AX-01' || document.displayName !== 'AX-01 SUZAKU' || document.revision !== EXPECTED_MODEL_REVISION) {
    throw new Error('AX-01のメッシュ識別情報が契約と一致しません。');
  }
  if (document.variant !== variant || document.units !== 'arbitrary-design-unit') {
    throw new Error(`${variant}のメッシュバリアントまたは設計単位が契約と一致しません。`);
  }
  if (!document.coordinateSystem ||
    document.coordinateSystem.forward !== EXPECTED_COORDINATES.forward ||
    document.coordinateSystem.span !== EXPECTED_COORDINATES.span ||
    document.coordinateSystem.up !== EXPECTED_COORDINATES.up) {
    throw new Error('AX-01の座標定義が契約と一致しません。');
  }
  if (!Array.isArray(document.parts) || document.parts.length === 0) {
    throw new Error('AX-01のメッシュにパーツがありません。');
  }

  const names = new Set();
  for (const part of document.parts) {
    if (!part || typeof part.name !== 'string' || names.has(part.name)) {
      throw new Error('AX-01のメッシュに空のパーツ名または重複名があります。');
    }
    names.add(part.name);
    if (!/^#[0-9a-f]{6}$/i.test(part.color)) throw new Error(`${part.name}の色指定が不正です。`);
    if (!Array.isArray(part.positions) || part.positions.length < 9 || part.positions.length % 3 !== 0 || !part.positions.every(Number.isFinite)) {
      throw new Error(`${part.name}の頂点座標が不正です。`);
    }
    const vertexCount = part.positions.length / 3;
    if (!Array.isArray(part.indices) || part.indices.length < 3 || part.indices.length % 3 !== 0 ||
      !part.indices.every(index => Number.isInteger(index) && index >= 0 && index < vertexCount)) {
      throw new Error(`${part.name}の三角形インデックスが不正です。`);
    }
  }
}

function getPartFinish(partName) {
  return PART_FINISHES.find(({ match }) => match.test(partName))?.finish ?? DEFAULT_PART_FINISH;
}

export async function loadAircraftAsset(variant) {
  const baseUrl = new URL(import.meta.env.BASE_URL, document.baseURI);
  const meshUrl = new URL(`assets/ax01/${variant}/mesh.json`, baseUrl);
  const response = await fetch(meshUrl);
  if (!response.ok) throw new Error(`メッシュを取得できませんでした（HTTP ${response.status}）。`);

  const meshDocument = await response.json();
  assertMeshDocument(meshDocument, variant);
  const aircraft = new THREE.Group();
  aircraft.name = `${meshDocument.designId}-SUZAKU-${variant}`;

  for (const part of meshDocument.parts) {
    const coordinates = new Float32Array(part.positions.length);
    for (let source = 0, target = 0; source < part.positions.length; source += 3, target += 3) {
      coordinates[target] = part.positions[source + 1];
      coordinates[target + 1] = part.positions[source + 2];
      coordinates[target + 2] = part.positions[source];
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(coordinates, 3));
    geometry.setIndex(part.indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    const finish = getPartFinish(part.name);
    const materialOptions = { color: part.color, ...finish, side: THREE.DoubleSide };
    const material = /teardropcanopy|canopyglass|transparentcanopy/i.test(part.name)
      ? new THREE.MeshPhysicalMaterial(materialOptions)
      : new THREE.MeshStandardMaterial(materialOptions);
    const shadedGeometry = toCreasedNormals(geometry, THREE.MathUtils.degToRad(38));
    geometry.dispose();
    const piece = new THREE.Mesh(shadedGeometry, material);
    piece.name = part.name;
    piece.castShadow = true;
    piece.receiveShadow = true;
    aircraft.add(piece);
  }

  const bounds = new THREE.Box3().setFromObject(aircraft);
  const size = bounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.z) || size.z <= 0) throw new Error('AX-01 SUZAKUの前後方向サイズが不正です。');
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = HANGAR_FORWARD_LENGTH / size.z;
  aircraft.scale.setScalar(scale);
  aircraft.traverse(object => {
    if (object.isMesh) object.geometry.translate(-center.x, -center.y, -center.z);
  });
  aircraft.userData = {
    designId: meshDocument.designId,
    displayName: meshDocument.displayName,
    revision: meshDocument.revision,
    variant: meshDocument.variant,
    units: meshDocument.units,
    partCount: meshDocument.parts.length,
    frameHalfExtents: { x: size.x * scale / 2, y: size.y * scale / 2, z: size.z * scale / 2 },
  };
  return aircraft;
}

function setMaterialOpacity(material, opacity) {
  const materials = Array.isArray(material) ? material : [material];
  for (const item of materials) {
    item.transparent = opacity < 1;
    item.opacity = opacity;
    item.depthWrite = opacity >= 1;
  }
}

function seededValue(seed, index) {
  let value = (Math.trunc(seed) + index * 48_271) % 2_147_483_647;
  value = value * 48_271 % 2_147_483_647;
  return value / 2_147_483_647;
}

export class FlightScene {
  constructor(canvas, stage) {
    this.canvas = canvas;
    this.stage = stage;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(STUDIO_BACKGROUND);
    this.scene.fog = new THREE.FogExp2(FLIGHT_BACKGROUND, 0.00072);
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.5, 2_200);
    this.camera.position.set(21, 17, -24);
    this.cameraTarget = new THREE.Vector3(0, 0, 4);
    this.hangarTarget = new THREE.Vector3(0, 0, 4);
    this.hangarCameraGoal = new THREE.Vector3();
    this.hangarFrameHalfExtents = null;
    this.clock = new THREE.Clock();
    this.viewMode = 'hangar';
    this.courseKey = '';
    this.gateMeshes = [];
    this.lastState = null;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.environment = new RoomEnvironment();
    this.environmentGenerator = new THREE.PMREMGenerator(this.renderer);
    this.environmentTexture = this.environmentGenerator.fromScene(this.environment, 0.04).texture;
    this.environment.dispose();
    this.environmentGenerator.dispose();
    this.scene.environment = this.environmentTexture;
    this.scene.environmentIntensity = 0.55;

    this.configureLights();
    this.configureFloor();
    this.configureCourseDecor();
    this.configureClouds();
    this.configureGates();
    this.activeAircraft = null;
    this.resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.resize()) : null;
    this.resizeObserver?.observe(stage);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  configureLights() {
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#74777a', 0.55));
    this.keyLight = new THREE.DirectionalLight('#ffffff', 2.2);
    this.keyLight.position.set(-32, 48, 24);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 260;
    this.keyLight.shadow.camera.left = -40;
    this.keyLight.shadow.camera.right = 40;
    this.keyLight.shadow.camera.top = 40;
    this.keyLight.shadow.camera.bottom = -40;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.06;
    this.scene.add(this.keyLight);
    this.fillLight = new THREE.DirectionalLight('#eef5ff', 0.55);
    this.fillLight.position.set(28, 20, 36);
    this.scene.add(this.fillLight);
    this.rimLight = new THREE.DirectionalLight('#ffffff', 1.8);
    this.rimLight.position.set(-24, 18, -30);
    this.scene.add(this.rimLight);
    this.boostLight = new THREE.PointLight('#ff7955', 0, 48, 1.6);
    this.scene.add(this.boostLight);
  }

  configureFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1_800, 2_500),
      new THREE.MeshStandardMaterial({ color: STUDIO_FLOOR, roughness: 0.92, metalness: 0.02 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -7;
    floor.position.z = 4;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.floor = floor;

    this.gridSections = [];
    for (let index = 0; index < 3; index += 1) {
      const grid = new THREE.GridHelper(420, 28, '#5f9b9b', '#294955');
      const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
      for (const material of materials) setMaterialOpacity(material, 0.34);
      grid.position.set(0, -47.6, index * 420);
      this.scene.add(grid);
      this.gridSections.push(grid);
    }
  }

  configureCourseDecor() {
    this.courseDecor = new THREE.Group();
    const ridgeMaterials = [
      new THREE.MeshStandardMaterial({ color: '#152d37', roughness: 0.78, metalness: 0.12 }),
      new THREE.MeshStandardMaterial({ color: '#193844', roughness: 0.7, metalness: 0.18 }),
    ];
    for (let index = 0; index < 20; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(96 + index % 3 * 14, 5 + index % 4 * 5, 120), ridgeMaterials[index % ridgeMaterials.length]);
      ridge.position.set(side * (105 + seededValue(54, index) * 35), -39 - index % 2 * 8, 24 + index * 76);
      ridge.rotation.y = side * (0.08 + seededValue(24, index) * 0.1);
      ridge.receiveShadow = true;
      this.courseDecor.add(ridge);
    }
    this.scene.add(this.courseDecor);
  }

  configureClouds() {
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: '#83aeb2', roughness: 0.95, transparent: true, opacity: 0.18, depthWrite: false });
    const cloudGeometry = new THREE.SphereGeometry(1, 10, 7);
    this.cloudLayer = new THREE.Group();
    for (let index = 0; index < 30; index += 1) {
      const cluster = new THREE.Group();
      const side = index % 2 === 0 ? -1 : 1;
      const centerX = side * (76 + seededValue(78, index) * 74);
      for (let puff = 0; puff < 3; puff += 1) {
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.set((puff - 1) * 7, seededValue(index + 21, puff) * 4, 0);
        cloud.scale.set(15 + seededValue(index + 7, puff) * 10, 4 + puff * 0.8, 11 + seededValue(index + 11, puff) * 7);
        cluster.add(cloud);
      }
      cluster.position.set(centerX, -5 + seededValue(13, index) * 24, 20 + index * 56);
      this.cloudLayer.add(cluster);
    }
    this.scene.add(this.cloudLayer);
  }

  configureGates() {
    this.route = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({ color: '#59c7bd', dashSize: 5, gapSize: 7, transparent: true, opacity: 0.45 }),
    );
    this.scene.add(this.route);
    this.gateGeometry = new THREE.TorusGeometry(1, 0.042, 8, 64);
    this.gatesRoot = new THREE.Group();
    this.scene.add(this.gatesRoot);
    this.gateMaterial = new THREE.MeshStandardMaterial({ color: '#72d6c8', emissive: '#247d76', emissiveIntensity: 0.5, metalness: 0.28, roughness: 0.3 });
    this.activeGateMaterial = new THREE.MeshStandardMaterial({ color: '#ff875f', emissive: '#a5422d', emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.28 });
  }

  setAircraft(variant, source, familyFrameHalfExtents = source.userData.frameHalfExtents) {
    if (this.activeAircraft) this.scene.remove(this.activeAircraft);
    this.activeAircraft = source.clone(true);
    this.activeAircraft.userData.variant = variant;
    this.activeAircraft.traverse(object => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    this.scene.add(this.activeAircraft);
    this.hangarFrameHalfExtents = familyFrameHalfExtents;
    this.updateHangarCameraGoal();
    this.boostLight.position.set(0, 0, -12);
  }

  updateHangarCameraGoal() {
    if (!this.activeAircraft) return;
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
    const horizontalSlope = Math.tan(horizontalFov / 2) * HANGAR_FRAME_FILL;
    const verticalSlope = Math.tan(verticalFov / 2) * HANGAR_FRAME_FILL;
    const point = new THREE.Vector3();
    let distance = 0;
    this.activeAircraft.traverse(object => {
      if (!object.isMesh) return;
      const positions = object.geometry.getAttribute('position');
      for (let index = 0; index < positions.count; index += 1) {
        point.fromBufferAttribute(positions, index).multiply(this.activeAircraft.scale);
        const depth = point.dot(HANGAR_CAMERA_DIRECTION);
        distance = Math.max(distance,
          depth + Math.abs(point.dot(HANGAR_CAMERA_RIGHT)) / horizontalSlope,
          depth + Math.abs(point.dot(HANGAR_CAMERA_UP)) / verticalSlope);
      }
    });
    this.hangarCameraGoal.copy(this.hangarTarget).addScaledVector(HANGAR_CAMERA_DIRECTION, distance);
  }

  setCourse(course, seed) {
    const key = `${seed}:${course.map(gate => `${gate.x},${gate.y},${gate.distance}`).join(';')}`;
    if (key === this.courseKey) return;
    this.courseKey = key;
    for (const gate of this.gateMeshes) this.gatesRoot.remove(gate);
    this.gateMeshes = course.map(gate => {
      const ring = new THREE.Mesh(this.gateGeometry, this.gateMaterial);
      ring.position.set(gate.x, gate.y, gate.distance);
      ring.scale.setScalar(gate.radius);
      ring.castShadow = true;
      ring.userData.index = gate.index;
      this.gatesRoot.add(ring);
      return ring;
    });

    const routePoints = [new THREE.Vector3(0, 0, 0), ...course.map(gate => new THREE.Vector3(gate.x, gate.y, gate.distance))];
    this.route.geometry.dispose();
    this.route.geometry = new THREE.BufferGeometry().setFromPoints(routePoints);
    this.route.computeLineDistances();
  }

  resize = () => {
    const width = Math.max(1, this.stage.clientWidth);
    const height = Math.max(1, this.stage.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.updateHangarCameraGoal();
  };

  update(state, input = {}) {
    this.lastState = state;
    this.setCourse(state.course, state.seed);
    this.viewMode = state.phase === 'ready' ? 'hangar' : 'flight';
    const inHangar = this.viewMode === 'hangar';
    this.scene.background.set(inHangar ? STUDIO_BACKGROUND : FLIGHT_BACKGROUND);
    this.scene.fog.color.set(inHangar ? STUDIO_BACKGROUND : FLIGHT_BACKGROUND);
    this.scene.fog.density = inHangar ? 0 : 0.00072;
    this.floor.material.color.set(inHangar ? STUDIO_FLOOR : FLIGHT_FLOOR);
    this.floor.position.y = inHangar
      ? -(this.hangarFrameHalfExtents?.y ?? 2.8) - HANGAR_FLOOR_CLEARANCE
      : -48;
    this.floor.position.z = inHangar ? this.hangarTarget.z : 520;
    for (const grid of this.gridSections) grid.visible = !inHangar;
    this.gatesRoot.visible = this.viewMode !== 'hangar';
    this.route.visible = this.viewMode !== 'hangar';
    this.courseDecor.visible = this.viewMode !== 'hangar';
    this.cloudLayer.visible = this.viewMode !== 'hangar';
    const time = this.clock.getElapsedTime();
    const aircraft = this.activeAircraft;

    if (aircraft) {
      if (inHangar) {
        aircraft.position.set(0, 0, 4);
        aircraft.rotation.set(0.025, Math.sin(time * 0.12) * 0.12, Math.sin(time * 0.38) * 0.025);
        this.cameraTarget.copy(this.hangarTarget);
        this.camera.position.copy(this.hangarCameraGoal);
      } else {
        aircraft.position.set(state.x, state.y, state.distance);
        aircraft.rotation.order = 'YXZ';
        aircraft.rotation.set(-input.steerY * 0.12, input.steerX * 0.06, -input.steerX * 0.24);
        const cameraPosition = new THREE.Vector3(state.x + input.steerX * 3, state.y + 14, state.distance - 54);
        this.camera.position.lerp(cameraPosition, 0.18);
        this.cameraTarget.set(state.x, state.y + 1, state.distance + 42);
      }
      this.boostLight.position.set(state.x, state.y + 1, state.distance - 11);
      this.boostLight.intensity = state.boosting ? 7.5 : 0;
      this.boostLight.distance = state.boosting ? 46 : 0;
    }

    for (const [index, grid] of this.gridSections.entries()) {
      const segment = 420;
      grid.position.z = state.distance - segment + index * segment;
    }
    for (const gate of this.gateMeshes) {
      const active = gate.userData.index === state.nextGateIndex;
      gate.material = active ? this.activeGateMaterial : this.gateMaterial;
      const pulse = active ? 1 + Math.sin(time * 3.4) * 0.018 : 1;
      const radius = state.course[gate.userData.index].radius * pulse;
      gate.scale.setScalar(radius);
    }

    if (inHangar) {
      this.keyLight.position.set(-32, 48, 24);
      this.fillLight.position.set(28, 20, 36);
      this.rimLight.position.set(-24, 18, -30);
    } else {
      this.keyLight.position.set(state.x - 42, state.y + 74, state.distance - 24);
      this.fillLight.position.set(state.x + 32, state.y + 18, state.distance + 28);
      this.rimLight.position.set(state.x + 48, state.y + 22, state.distance + 60);
    }
    this.camera.lookAt(this.cameraTarget);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
    this.environmentTexture.dispose();
  }
}
