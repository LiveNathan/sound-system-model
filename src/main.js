import './index.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import {CSS2DRenderer, CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';

const scene = new THREE.Scene();
const container = document.getElementById("container");
const camera = new THREE.PerspectiveCamera( 75, container.offsetWidth / container.offsetHeight, 0.1, 1000 );
const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setSize(container.offsetWidth, container.offsetHeight);
container.appendChild(renderer.domElement);

// camera.position.z = 5;
camera.up.set(0, 0, 1);
camera.position.set(40, -20, 20);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const controls = new OrbitControls( camera, renderer.domElement );
controls.object.up.set(0, 0, 1);
controls.update();

const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(container.offsetWidth, container.offsetHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.pointerEvents = 'none';
// labelRenderer.domElement.style.top = '0px';
container.appendChild(labelRenderer.domElement);

const positiveAxisLength = 5;  // Ending point of axes from center
const labelOffsets = [0.5, 0.5, 0];  // To fine-tune the exact position of labels if needed

// Create HTML elements for each label
let xLabelDiv = document.createElement('div');
xLabelDiv.className = 'text-red-600 text-base p-1 m-1';
xLabelDiv.textContent = 'X';

let yLabelDiv = document.createElement('div');
yLabelDiv.className = 'text-axes-green text-base p-1 m-1';
yLabelDiv.textContent = 'Y';

let zLabelDiv = document.createElement('div');
zLabelDiv.className = 'text-blue-600 text-base p-1 m-1';
zLabelDiv.textContent = 'Z';

// Create CSS2DObject for each label
let xLabel = new CSS2DObject(xLabelDiv);
let yLabel = new CSS2DObject(yLabelDiv);
let zLabel = new CSS2DObject(zLabelDiv);

// Position labels at ends of the axes
xLabel.position.set(0.6, 0, 0);
yLabel.position.set(0, 0.6, 0);
zLabel.position.set(0, 0, 0.6);

// Add labels to the scene
scene.add(xLabel);
scene.add(yLabel);
scene.add(zLabel);





const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
const sphere = new THREE.Mesh( geometry, material );
sphere.position.set(0, 20, 10);
scene.add( sphere );







function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    labelRenderer.render(scene, camera);
}


if ( WebGL.isWebGLAvailable() ) {

    animate();

} else {

    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById( 'container' ).appendChild( warning );

}

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}