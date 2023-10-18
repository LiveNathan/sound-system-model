import './index.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

const scene = new THREE.Scene();
const container = document.getElementById("container");
const camera = new THREE.PerspectiveCamera( 75, container.offsetWidth / container.offsetHeight, 0.1, 1000 );
const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setSize(container.offsetWidth, container.offsetHeight);
const controls = new OrbitControls( camera, renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

camera.position.z = 5;

const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );


var labelRenderer = new CSS3DRenderer();
labelRenderer.setSize(container.offsetWidth, container.offsetHeight);
container.appendChild(renderer.domElement);

function makeTextSprite(message) {
    var element = document.createElement('div');
    element.style.width = '100px';
    element.style.height = '100px';
    element.style.backgroundColor = 'rgba(0,0,0,0)';
    element.style.color = 'red';
    element.innerHTML = message;
    return element;
}

var labels = ['X', 'Y', 'Z'];

for (var i = 0; i < 3; ++i) {
    var sprite = makeTextSprite(labels[i]);
    var sprite3D = new CSS3DObject(sprite);
    sprite3D.position.set((i==0) ? 6 : 0, (i==1) ? 6 : 0, (i==2) ? 6 : 0); // position labels
    scene.add(sprite3D);
}




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