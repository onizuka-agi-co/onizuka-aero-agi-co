import * as THREE from 'three';

const EXPECTED_COORDINATES = Object.freeze({ forward: '+X', span: 'Y', up: '+Z' });

function assertMeshDocument(document, variant) {
  if (!document || document.schemaVersion !== 1 || document.designId !== 'AX-01' || document.revision !== 'r1') {
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

export async function loadAircraftAsset(variant) {
  const baseUrl = new URL(import.meta.env.BASE_URL, document.baseURI);
  const meshUrl = new URL(`assets/ax01/${variant}/mesh.json`, baseUrl);
  const response = await fetch(meshUrl);
  if (!response.ok) throw new Error(`メッシュを取得できませんでした（HTTP ${response.status}）。`);

  const meshDocument = await response.json();
  assertMeshDocument(meshDocument, variant);
  const aircraft = new THREE.Group();
  aircraft.name = `${meshDocument.designId}-${variant}`;

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

    const material = new THREE.MeshStandardMaterial({
      color: part.color,
      metalness: 0.38,
      roughness: 0.36,
      side: THREE.DoubleSide,
    });
    const piece = new THREE.Mesh(geometry, material);
    piece.name = part.name;
    piece.castShadow = true;
    piece.receiveShadow = true;
    aircraft.add(piece);
  }

  const bounds = new THREE.Box3().setFromObject(aircraft);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 18 / Math.max(size.x, size.y, size.z);
  aircraft.scale.setScalar(scale);
  aircraft.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  aircraft.userData = {
    designId: meshDocument.designId,
    revision: meshDocument.revision,
    variant: meshDocument.variant,
    units: meshDocument.units,
    partCount: meshDocument.parts.length,
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
    this.scene.background = new THREE.Color('#0d1b25');
    this.scene.fog = new THREE.FogExp2('#0d1b25', 0.00072);
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.5, 2_200);
    this.camera.position.set(31, 23, -54);
    this.cameraTarget = new THREE.Vector3(0, 0, 42);
    this.clock = new THREE.Clock();
    this.viewMode = 'hangar';
    this.courseKey = '';
    this.gateMeshes = [];
    this.lastState = null;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
    this.scene.add(new THREE.HemisphereLight('#cde9ed', '#111c25', 1.65));
    this.keyLight = new THREE.DirectionalLight('#fff2de', 4.2);
    this.keyLight.position.set(-45, 74, -30);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 260;
    this.keyLight.shadow.camera.left = -45;
    this.keyLight.shadow.camera.right = 45;
    this.keyLight.shadow.camera.top = 45;
    this.keyLight.shadow.camera.bottom = -45;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.12;
    this.scene.add(this.keyLight);
    this.rimLight = new THREE.DirectionalLight('#5bd8ce', 2.1);
    this.rimLight.position.set(50, 18, 72);
    this.scene.add(this.rimLight);
    this.boostLight = new THREE.PointLight('#ff7955', 0, 48, 1.6);
    this.scene.add(this.boostLight);
  }

  configureFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1_500, 2_500),
      new THREE.MeshStandardMaterial({ color: '#10212a', roughness: 0.58, metalness: 0.2 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -48;
    floor.position.z = 520;
    floor.receiveShadow = true;
    this.scene.add(floor);

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

  setAircraft(variant, source) {
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
    this.boostLight.position.set(0, 0, -12);
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
  };

  update(state, input = {}) {
    this.lastState = state;
    this.setCourse(state.course, state.seed);
    this.viewMode = state.phase === 'ready' ? 'hangar' : 'flight';
    this.gatesRoot.visible = this.viewMode !== 'hangar';
    this.route.visible = this.viewMode !== 'hangar';
    this.courseDecor.visible = this.viewMode !== 'hangar';
    this.cloudLayer.visible = this.viewMode !== 'hangar';
    const time = this.clock.getElapsedTime();
    const aircraft = this.activeAircraft;

    if (aircraft) {
      if (this.viewMode === 'hangar') {
        aircraft.position.set(0, 0, 4);
        aircraft.rotation.set(0.025, Math.sin(time * 0.12) * 0.12, Math.sin(time * 0.38) * 0.025);
        this.cameraTarget.set(0, 0, 4);
        this.camera.position.lerp(new THREE.Vector3(21, 17, -24), 0.055);
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

    this.keyLight.position.set(state.x - 42, state.y + 74, state.distance - 24);
    this.rimLight.position.set(state.x + 48, state.y + 22, state.distance + 60);
    this.camera.lookAt(this.cameraTarget);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
  }
}
