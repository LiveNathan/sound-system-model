import * as THREE from 'three';

export function setupCamera(container) {
    const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.up.set(0, 0, 1);
    camera.position.set(70, -40, 15);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    return camera;
}

export function setupRenderer(pageElements) {
    const renderer = new THREE.WebGLRenderer({canvas: pageElements.canvas});
    renderer.setSize(pageElements.container.offsetWidth, pageElements.container.offsetHeight);
    return renderer;
}