import * as THREE from 'three';

export const materials = () => {
  const mat = (color, roughness = .5, metalness = .1) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    suit: mat('#e5dfcc', .62), trim: mat('#b8b9af', .5, .35), graphite: mat('#323d42', .42, .3),
    orange: mat('#d77926', .48), visor: new THREE.MeshPhysicalMaterial({ color: '#0a2338', roughness: .14, metalness: .62, clearcoat: 1 }),
    robot: mat('#475456', .36, .45), screen: mat('#0a161c', .24, .45),
    eye: new THREE.MeshStandardMaterial({ color: '#d8faff', emissive: '#9be8f2', emissiveIntensity: 1.2 }),
    green: new THREE.MeshStandardMaterial({ color: '#85c8ad', emissive: '#4c9f8a', emissiveIntensity: .7 }),
    amber: new THREE.MeshStandardMaterial({ color: '#e8b95d', emissive: '#a86e27', emissiveIntensity: .3 }),
    red: new THREE.MeshStandardMaterial({ color: '#f38b75', emissive: '#ba4737', emissiveIntensity: .7 }),
    hull: mat('#b1bcba', .46, .45), frame: mat('#5b6e74', .35, .6), dark: mat('#202e37', .58, .35),
    floor: mat('#50636b', .68, .35), tile: mat('#62757b', .62, .35), rubber: mat('#1f2a30', .9),
    gold: mat('#bc9753', .4, .65), white: mat('#e7e9e1', .5),
    light: new THREE.MeshStandardMaterial({ color: '#c3f4ef', emissive: '#93d5d8', emissiveIntensity: 1.1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#77b6c9', roughness: .08, metalness: .2, transparent: true, opacity: .17, side: THREE.DoubleSide }),
  };
};
