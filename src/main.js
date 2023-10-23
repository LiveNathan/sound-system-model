import './index.css'
import './updated-alignment-position-fields'
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import {CSS2DRenderer, CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
class Location {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

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

// PAGE ELEMENTS
const subConfigCheckbox = document.getElementById("subConfigCheckbox");
const subDepthInput = document.getElementById("sx");

// OBJECTS
let mainLocation = new Location(0, 20, 10);
createCube(mainLocation, 0xff0000);

let mainMirrorLocation  = new Location(0, -20, 10);
createCube(mainMirrorLocation, 0xff0000);

let subConfigurationLR = subConfigCheckbox.checked;
const subDimensions = {depth: 1, width: 1, height: 1};
let subLocation = new Location(-subDimensions.depth / 2, 0, subDimensions.height / 2)
setSubLocationY(subConfigurationLR);
let sub = createCube(subLocation, 0x0000ff);

// FUNCTIONS
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

function createCube(location, color) {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({color: color});
    const mesh = new THREE.Mesh(geometry, material);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0x000000}));
    mesh.add(line);
    mesh.position.set(location.x, location.y, location.z);
    scene.add(mesh);
    return mesh;
}

function setSubLocationY(subConfigurationLR) {
    if (subConfigurationLR) {
        return mainLocation.y;
    } else {
        return 0;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// EVENT LISTENERS
window.addEventListener('resize', onWindowResize, false);

subConfigCheckbox.addEventListener('change', (event) => {
    subConfigurationLR = event.target.checked;
    sub.position.y = setSubLocationY(subConfigurationLR);
    animate();
});

subDepthInput.addEventListener('input', (event) => {
     let subLocationX = Number(event.target.value);
    sub.position.x = -subDimensions.depth / 2 + subLocationX;  // Update sub's x position here.
    animate();
});