import * as THREE from 'three';

export function createPaperCut(opts = {}) {
  const { reliefTexture, isMobile = false } = opts;
  const group = new THREE.Group();

  // Darker warm background so the relief pops
  const bgMat = new THREE.MeshBasicMaterial({ color: 0xe8dfd5 });
  const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), bgMat);
  bgMesh.position.z = -1;
  group.add(bgMesh);

  // Shadow drop behind relief
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0xc8bfb5, transparent: true, opacity: 0.35,
  });
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), shadowMat);
  shadowMesh.position.set(0.06, -0.06, -0.1);
  group.add(shadowMesh);

  // Relief texture
  if (reliefTexture) {
    reliefTexture.colorSpace = THREE.SRGBColorSpace;
    reliefTexture.minFilter = THREE.LinearFilter;
    reliefTexture.magFilter = THREE.LinearFilter;
  }
  const mat = new THREE.MeshBasicMaterial({
    map: reliefTexture,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), mat);
  group.add(mesh);

  // Tiny floating motes
  const pCount = isMobile ? 30 : 60;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  const pPh = new Float32Array(pCount);
  for (let i = 0; i < pCount; i++) {
    pPos[i*3] = (Math.random() - 0.5) * 14;
    pPos[i*3+1] = (Math.random() - 0.5) * 8;
    pPos[i*3+2] = Math.random() * 2 - 0.5;
    pPh[i] = Math.random() * 6.28;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.015, sizeAttenuation: true, color: 0x8b7355,
    transparent: true, opacity: 0.15, depthWrite: false,
  });
  group.add(new THREE.Points(pGeo, pMat));

  const update = (time) => {
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < pCount; i++)
      arr[i*3+1] += Math.sin(time * 0.2 + pPh[i]) * 0.0003;
    pGeo.attributes.position.needsUpdate = true;
    const b = Math.sin(time * 0.35) * 0.002;
    mesh.scale.set(1 + b, 1 + b, 1);
    shadowMesh.scale.set(1 + b, 1 + b, 1);
  };

  const reveal = () => {};

  const resize = (w, h) => {
    const s = (w / h) > (16 / 9) ? (w / h) / (16 / 9) : 1;
    bgMesh.scale.set(s, s, 1);
    mesh.scale.set(s, s, 1);
    shadowMesh.scale.set(s, s, 1);
  };

  return { group, update, reveal, resize };
}
