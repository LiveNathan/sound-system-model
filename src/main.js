import './index.css'
import './updated-alignment-position-fields'
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import {CSS2DObject, CSS2DRenderer} from 'three/addons/renderers/CSS2DRenderer.js';

class Location {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Dimensions {
    constructor(height, width, depth) {
        this.height = height;
        this.width = width;
        this.depth = depth;
    }
}

const AUDIENCE_LOCATION_Z_IF_SEATED_METERS = 1.26;
const AUDIENCE_LOCATION_Z_IF_SEATED_OTHER = 1.623;
const AUDIENCE_LOCATION_Z_NOT_SEATED_METERS = 4.13;
const AUDIENCE_LOCATION_Z_NOT_SEATED_OTHER = 5.32;
const AUDIENCE_DIMENSION_WIDTH_FACTOR = 4;

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
const arraySpanInput = document.getElementById("as");
const arrayBottomHeightInput = document.getElementById("abz");
const subDistanceFromCenterInput = document.getElementById("sy");
const subDepthInput = document.getElementById("sx");
const audienceDepthFirstRowInput = document.getElementById("axf");
const audienceDepthLastRowInput = document.getElementById("axl");
const distanceReferencedFromBelowArrayCheckbox = document.getElementById("xoff");
const arrayDepthInput = document.getElementById("ad");
const audienceSeatedRadio = document.getElementById("seated-radio");
const audienceStandingRadio = document.getElementById("standing-radio");
const metersRadio = document.getElementById("meters-radio");
const feetRadio = document.getElementById("feet-radio");

// OBJECTS
let mainDimensions = new Dimensions(1, 1, 1);
setMainDimensionHeight(arraySpanInput.value);
setMainDimensionDepth(arrayDepthInput.value);

let mainLocation = setMainLocation();
let main = createCube(mainLocation, 0xff0000, mainDimensions);
setMainZFromBottom(arrayBottomHeightInput.value);
setMainYFromSub(subDistanceFromCenterInput.value);

let mainMirrorLocation = new Location(main.position.x, -main.position.y, main.position.z);
let mainMirror = createCube(mainMirrorLocation, 0xff0000, mainDimensions);

const subDimensions = new Dimensions(1, 1, 1);
let subLocation = setSubLocation();
let sub = createCube(subLocation, 0x0000ff);
let subMirror;
setSubLocationY(subConfigCheckbox.checked, subDistanceFromCenterInput.value);

addSubMirror();

let audienceDimensions = new Dimensions(0.1, main.position.y * 4, main.position.y * 4);
let audienceLocation = new Location(audienceDimensions.depth / 2 + 5, 0, 1.2);
let audience = createCube(audienceLocation, 0x00ff00, audienceDimensions, 0.2);
updateAudience(audienceDepthFirstRowInput.value, audienceDepthLastRowInput.value, subDistanceFromCenterInput.value, distanceReferencedFromBelowArrayCheckbox.checked,
    audienceSeatedRadio.checked, metersRadio.checked);

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
    camera.position.set(70, -40, 15);
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

function createCube(location, color, dimensions = new Dimensions(1, 1, 1), opacity = 1) {
    const geometry = new THREE.BoxGeometry(dimensions.depth, dimensions.width, dimensions.height);
    const material = new THREE.MeshBasicMaterial({color: color, transparent: true, opacity: opacity});
    const mesh = new THREE.Mesh(geometry, material);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0x000000}));
    mesh.add(line);
    mesh.position.set(location.x, location.y, location.z);
    scene.add(mesh);
    return mesh;
}

function setSubLocationY(subConfigurationLR, distanceFromCenter) {
    if (subConfigurationLR) {
        if (distanceFromCenter !== "") {
            subLocation.y = Number(distanceFromCenter) + (subDimensions.width / 2);
        } else {
            subLocation.y = main.position.y;
        }
    } else {
        subLocation.y = 0;
    }
    sub.position.y = subLocation.y;
    if (subMirror) {
        subMirror.position.y = -sub.position.y;
    }
}

function setMainDimensionHeight(height) {
    if (height > 0) {
        mainDimensions.height = Number(height);
    } else {
        mainDimensions.height = 1;
    }
}

function setMainDimensionDepth(depth) {
    if (depth > 0) {
        mainDimensions.depth = Number(depth);
    } else {
        mainDimensions.depth = 1;
    }
}

function setMainLocation() {
    let mainLocation = new Location(-mainDimensions.depth / 2, 20, mainDimensions.height / 2 + 10);

    if (distanceReferencedFromBelowArrayCheckbox.checked) {
        mainLocation.x = 0;
    }
    return mainLocation;
}

function setMainZFromBottom(bottomHeight) {
    if (bottomHeight !== "") {
        main.position.z = Number(bottomHeight) + (mainDimensions.height / 2);
        mainMirror.position.z = main.position.z;
    }
}

function setMainYFromSub(distanceFromCenter) {
    if (distanceFromCenter !== "") {
        main.position.y = Number(distanceFromCenter) + (mainDimensions.width / 2);
        mainMirror.position.y = -main.position.y;
    }
}

function setSubLocation() {
    let subLocation = new Location(-subDimensions.depth / 2, 0, subDimensions.height / 2)
    if (distanceReferencedFromBelowArrayCheckbox.checked) {
        subLocation.x = 0;
    }
    return subLocation;
}

function addSubMirror() {
    if (!subMirror) {
        let subMirrorLocation = new Location(sub.position.x, -sub.position.y, sub.position.z);
        subMirror = createCube(subMirrorLocation, 0x0000ff);
    }

    if (subConfigCheckbox.checked) {
        if (!scene.children.includes(subMirror)) {
            scene.add(subMirror);
        }
    } else {
        if (scene.children.includes(subMirror)) {
            scene.remove(subMirror);
        }
    }
}

function updateAudience(
    audienceDepthFirstRow = audienceDepthFirstRowInput.value,
    audienceDepthLastRow = audienceDepthLastRowInput.value,
    subY = subDistanceFromCenterInput.value,
    distancedReferencedFromBelowArray = distanceReferencedFromBelowArrayCheckbox.checked,
    audienceSeated = audienceSeatedRadio.checked,
    meters = metersRadio.checked
) {
    updateAudienceLocationX(audienceDepthFirstRow, audienceDepthLastRow, distancedReferencedFromBelowArray);
    updateAudienceDimensionWidth(subY);
    updateAudienceLocationZ(audienceSeated, meters);
    audience.geometry = new THREE.BoxGeometry(audienceDimensions.depth, audienceDimensions.width, audienceDimensions.height);
}

// Method to update the location x
function updateAudienceLocationX(audienceDepthFirstRow, audienceDepthLastRow, distancedReferencedFromBelowArray) {
    if (audienceDepthFirstRow !== "" && audienceDepthLastRow !== "") {
        let depth = Number(audienceDepthLastRow) - Number(audienceDepthFirstRow);
        audienceDimensions.depth = depth;
        audienceLocation.x = depth / 2 + Number(audienceDepthFirstRow);
        if (distancedReferencedFromBelowArray) {
            audienceLocation.x += mainDimensions.depth / 2;
        }
        audience.position.x = audienceLocation.x;
    }
}

// Method to update the dimensions width
function updateAudienceDimensionWidth(subY) {
    if (subY !== "") {
        audienceDimensions.width = Number(subY) * AUDIENCE_DIMENSION_WIDTH_FACTOR;
    }
}

// Method to update the location z
function updateAudienceLocationZ(audienceSeated, meters) {
    if (audienceSeated) {
        audienceLocation.z = meters ? AUDIENCE_LOCATION_Z_IF_SEATED_METERS : AUDIENCE_LOCATION_Z_IF_SEATED_OTHER;
    } else {
        audienceLocation.z = meters ? AUDIENCE_LOCATION_Z_NOT_SEATED_METERS : AUDIENCE_LOCATION_Z_NOT_SEATED_OTHER;
    }
    audience.position.z = audienceLocation.z;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// EVENT LISTENERS
window.addEventListener('resize', onWindowResize, false);

subConfigCheckbox.addEventListener('change', (event) => {
    setSubLocationY(event.target.checked, subDistanceFromCenterInput.value);
    addSubMirror();
    animate();
});

distanceReferencedFromBelowArrayCheckbox.addEventListener('change', (event) => {
    if (event.target.checked) {
        mainLocation.x = 0;
        subLocation.x = (-subDimensions.depth / 2) + (mainDimensions.depth / 2) + Number(subDepthInput.value);
    } else {
        mainLocation.x = -mainDimensions.depth / 2;
        subLocation.x = -subDimensions.depth / 2 + Number(subDepthInput.value);
    }
    mainMirrorLocation.x = mainLocation.x;
    main.position.x = mainLocation.x;
    mainMirror.position.x = mainMirrorLocation.x;
    sub.position.x = subLocation.x;
    subMirror.position.x = sub.position.x;

    updateAudience(audienceDepthFirstRowInput.value, audienceDepthLastRowInput.value, subDistanceFromCenterInput.value, event.target.checked);

    animate();
});

subDepthInput.addEventListener('input', (event) => {
    let x = Number(event.target.value);

    if (distanceReferencedFromBelowArrayCheckbox.checked) {
        sub.position.x = -subDimensions.depth / 2 + x + mainDimensions.depth / 2;
    } else {
        sub.position.x = -subDimensions.depth / 2 + x;
    }

    subMirror.position.x = sub.position.x;
    animate();
});

arrayDepthInput.addEventListener('input', (event) => {
    let x = Number(event.target.value);
    setMainDimensionDepth(x);
    main.geometry = new THREE.BoxGeometry(mainDimensions.depth, mainDimensions.width, mainDimensions.height);
    if (!distanceReferencedFromBelowArrayCheckbox.checked) {
        main.position.x = -mainDimensions.depth / 2;
        mainMirror.position.x = main.position.x;
    }
    mainMirror.geometry = main.geometry;

    animate();
});

arraySpanInput.addEventListener('input', (event) => {
    setMainDimensionHeight(event.target.value);
    main.geometry = new THREE.BoxGeometry(mainDimensions.depth, mainDimensions.width, mainDimensions.height);
    mainMirror.geometry = main.geometry;
    animate();
});

arrayBottomHeightInput.addEventListener('input', (event) => {
    setMainZFromBottom(event.target.value);
    animate();
});

subDistanceFromCenterInput.addEventListener('input', (event) => {
    setMainYFromSub(event.target.value);
    setSubLocationY(subConfigCheckbox.checked, event.target.value);
    updateAudience(audienceDepthFirstRowInput.value, audienceDepthLastRowInput.value, event.target.value);
    animate();
});

audienceDepthFirstRowInput.addEventListener('input', (event) => {
    updateAudience(event.target.value);
    animate();
});

audienceDepthLastRowInput.addEventListener('input', (event) => {
    updateAudience(audienceDepthFirstRowInput.value, event.target.value);
    animate();
});

audienceSeatedRadio.addEventListener('change', (event) => {
    updateAudience(audienceDepthFirstRowInput.value, audienceDepthLastRowInput.value, subDistanceFromCenterInput.value, distanceReferencedFromBelowArrayCheckbox.checked,
        event.target.checked);
    animate();
});

audienceStandingRadio.addEventListener('change', () => {
    updateAudience(audienceDepthFirstRowInput.value, audienceDepthLastRowInput.value, subDistanceFromCenterInput.value, distanceReferencedFromBelowArrayCheckbox.checked,
        false);
    animate();
});

metersRadio.addEventListener('change', (event) => {
    updateAudience(audienceDepthFirstRowInput.value, audienceDepthLastRowInput.value, subDistanceFromCenterInput.value, distanceReferencedFromBelowArrayCheckbox.checked,
        audienceSeatedRadio.checked, event.target.checked);
    animate();
});

feetRadio.addEventListener('change', () => {
    updateAudience(audienceDepthFirstRowInput.value, audienceDepthLastRowInput.value, subDistanceFromCenterInput.value, distanceReferencedFromBelowArrayCheckbox.checked,
        audienceSeatedRadio.checked, false);
    animate();
});