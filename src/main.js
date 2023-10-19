import './index.css'
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import {CSS2DRenderer, CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';

// SETUP
const scene = new THREE.Scene();
const container = document.getElementById("container");
const canvas = document.querySelector('#canvas');
const camera = setupCamera(container);
const renderer = setupRenderer();
container.appendChild(renderer.domElement);

setupControls();
addAxes();
const labelRenderer = addAxesLabels();

// OBJECTS
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({color: 0xff0000});
const main = new THREE.Mesh(geometry, material);
const edges = new THREE.EdgesGeometry(geometry);
const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0x000000}));
main.add(line);
let mainY = 20;
main.position.set(0, mainY, 10);
scene.add(main);

const mirroredMainMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
const mirroredMain = new THREE.Mesh(geometry, mirroredMainMaterial);
const edgesMirroredMain = new THREE.EdgesGeometry(geometry);
const lineMirroredMain = new THREE.LineSegments(edgesMirroredMain, new THREE.LineBasicMaterial({color: 0x000000}));
mirroredMain.add(lineMirroredMain);
mirroredMain.position.set(0, -mainY, 10);
scene.add(mirroredMain);

let subLocationX = 1.5;
const subDimensions = {depth: 1, width: 1, height: 1};
const subGeometry = new THREE.BoxGeometry(subDimensions.width, subDimensions.height, subDimensions.depth);
const subMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff});
const sub = new THREE.Mesh(subGeometry, subMaterial);
const edgesSub = new THREE.EdgesGeometry(geometry);
const lineSub = new THREE.LineSegments(edgesSub, new THREE.LineBasicMaterial({color: 0x000000}));
sub.add(lineSub);
sub.position.set(-subDimensions.depth / 2 + subLocationX, 0, subDimensions.height / 2);
scene.add(sub);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

if (WebGL.isWebGLAvailable()) {

    animate();

} else {

    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);

}

window.addEventListener('resize', onWindowResize, false);

function setupCamera(container) {
    const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.up.set(0, 0, 1);
    camera.position.set(20, -10, 15);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    return camera;
}

function setupRenderer() {
    const renderer = new THREE.WebGLRenderer({canvas: canvas});
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    return renderer;
}

function setupControls() {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.object.up.set(0, 0, 1);
    controls.update();
}

function addAxes() {
    const axesHelper = new THREE.AxesHelper(30);
    scene.add(axesHelper);
}

function addAxesLabels() {
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.offsetWidth, container.offsetHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    let xLabelDiv = document.createElement('div');
    xLabelDiv.className = 'text-red-600 text-base p-1 m-1';
    xLabelDiv.textContent = 'X';
    let yLabelDiv = document.createElement('div');

    yLabelDiv.className = 'text-axes-green text-base p-1 m-1';
    yLabelDiv.textContent = 'Y';
    let zLabelDiv = document.createElement('div');

    zLabelDiv.className = 'text-blue-600 text-base p-1 m-1';
    zLabelDiv.textContent = 'Z';

    let xLabel = new CSS2DObject(xLabelDiv);
    let yLabel = new CSS2DObject(yLabelDiv);
    let zLabel = new CSS2DObject(zLabelDiv);

    const labelOffset = 1;
    xLabel.position.set(labelOffset, 0, 0);
    yLabel.position.set(0, labelOffset, 0);
    zLabel.position.set(0, 0, labelOffset);

    scene.add(xLabel);
    scene.add(yLabel);
    scene.add(zLabel);
    return labelRenderer;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}