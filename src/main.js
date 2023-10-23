import './index.css'
import './updated-alignment-position-fields'
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import {CSS2DObject, CSS2DRenderer} from 'three/addons/renderers/CSS2DRenderer.js';

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

// PAGE ELEMENTS
const pageElements = {
    container: document.getElementById("container"),
    canvas: document.querySelector('#canvas'),
    subConfigCheckbox: document.getElementById("subConfigCheckbox"),
    arraySpanInput: document.getElementById("as"),
    arrayBottomHeightInput: document.getElementById("abz"),
    subDistanceFromCenterInput: document.getElementById("sy"),
    subDepthInput: document.getElementById("sx"),
    audienceDepthFirstRowInput: document.getElementById("axf"),
    audienceDepthLastRowInput: document.getElementById("axl"),
    distanceReferencedFromBelowArrayCheckbox: document.getElementById("xoff"),
    arrayDepthInput: document.getElementById("ad"),
    audienceSeatedRadio: document.getElementById("seated-radio"),
    audienceStandingRadio: document.getElementById("standing-radio"),
    metersRadio: document.getElementById("meters-radio"),
    feetRadio: document.getElementById("feet-radio")
};

// SETUP
const scene = new THREE.Scene();
const camera = setupCamera(pageElements.container);
const renderer = setupRenderer();
pageElements.container.appendChild(renderer.domElement);

let controls;
setupControls();
addAxes();
const labelRenderer = addAxesLabels();

// OBJECTS
let mainDimensions = new Dimensions(1, 1, 1);
setMainDimensionHeight(pageElements.arraySpanInput.value);
setMainDimensionDepth(pageElements.arrayDepthInput.value);

let mainLocation = setMainLocation();
let main = createCube(mainLocation, 0xff0000, mainDimensions);
setMainZFromBottom(pageElements.arrayBottomHeightInput.value);
setMainYFromSub(pageElements.arrayBottomHeightInput.value);

let mainMirrorLocation = new THREE.Vector3(main.position.x, -main.position.y, main.position.z);
let mainMirror = createCube(mainMirrorLocation, 0xff0000, mainDimensions);

const subDimensions = new Dimensions(1, 2, 1);
let subLocation = setSubLocation();
let sub = createCube(subLocation, 0x0000ff, subDimensions);
let subMirror;
setSubLocationY(pageElements.subConfigCheckbox.checked, pageElements.arrayBottomHeightInput.value);

addSubMirror();

let audienceDimensions = new Dimensions(0.1, main.position.y * 4, main.position.y * 4);
let audienceLocation = new THREE.Vector3(audienceDimensions.depth / 2 + 5, 0, 1.2);
let audience = createCube(audienceLocation, 0x00ff00, audienceDimensions, 0.15);
updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.arrayBottomHeightInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
    pageElements.audienceSeatedRadio.checked, pageElements.metersRadio.checked);

fitCameraToSelection();

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
    const renderer = new THREE.WebGLRenderer({canvas: pageElements.canvas});
    renderer.setSize(pageElements.container.offsetWidth, pageElements.container.offsetHeight);
    return renderer;
}

function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.object.up.set(0, 0, 1);
    controls.update();
}

function addAxes() {
    const axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);
}

function addAxesLabels() {
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(pageElements.container.offsetWidth, pageElements.container.offsetHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.pointerEvents = 'none';
    pageElements.container.appendChild(labelRenderer.domElement);

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

    const labelOffset = 15;
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

    const edgeColor = new THREE.Color(color);
    edgeColor.offsetHSL(0, 0, 0.2);  // Increase lightness by 20%

    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: edgeColor.getHex()}));

    mesh.add(line);
    mesh.position.set(location.x, location.y, location.z);
    scene.add(mesh);
    return mesh;
}

function changeCubeDimensions(cube, dimensions) {
    // Remove existing edges
    cube.children.forEach(child => {
        if (child instanceof THREE.LineSegments) {
            cube.remove(child);
        }
    });

    const geometry = new THREE.BoxGeometry(dimensions.depth, dimensions.width, dimensions.height);
    const edges = new THREE.EdgesGeometry(geometry);

    cube.geometry.dispose();
    cube.geometry = geometry;

    const edgeColor = new THREE.Color(cube.material.color.getHex());
    edgeColor.offsetHSL(0, 0, 0.2);  // Increase lightness by 20%

    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: edgeColor.getHex()}));
    cube.add(line);
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
    let mainLocation = new THREE.Vector3(-mainDimensions.depth / 2, 20, mainDimensions.height / 2 + 10);

    if (pageElements.distanceReferencedFromBelowArrayCheckbox.checked) {
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
    let subLocation = new THREE.Vector3(-subDimensions.depth / 2, 0, subDimensions.height / 2)
    if (pageElements.distanceReferencedFromBelowArrayCheckbox.checked) {
        subLocation.x = 0;
    }
    return subLocation;
}

function addSubMirror() {
    if (!subMirror) {
        let subMirrorLocation = new THREE.Vector3(sub.position.x, -sub.position.y, sub.position.z);
        subMirror = createCube(subMirrorLocation, 0x0000ff, subDimensions);
    }

    if (pageElements.subConfigCheckbox.checked) {
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
    audienceDepthFirstRow = pageElements.audienceDepthFirstRowInput.value,
    audienceDepthLastRow = pageElements.audienceDepthLastRowInput.value,
    subY = pageElements.arrayBottomHeightInput.value,
    distancedReferencedFromBelowArray = pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
    audienceSeated = pageElements.audienceSeatedRadio.checked,
    meters = pageElements.metersRadio.checked
) {
    updateAudienceLocationX(audienceDepthFirstRow, audienceDepthLastRow, distancedReferencedFromBelowArray);
    updateAudienceDimensionWidth(subY);
    updateAudienceLocationZ(audienceSeated, meters);
    changeCubeDimensions(audience, audienceDimensions);
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

function updateAudienceDimensionWidth(subY) {
    if (subY !== "") {
        audienceDimensions.width = Number(subY) * AUDIENCE_DIMENSION_WIDTH_FACTOR;
    }
}

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

function fitCameraToSelection(offset = 1) {
    const box = new THREE.Box3();

    scene.traverse(child => {
        if (child instanceof THREE.Mesh) {
            box.expandByObject(child);
        }
    });

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = offset * Math.max(fitHeightDistance, fitWidthDistance);

    const direction = controls.target.clone().sub(camera.position).normalize().multiplyScalar(distance);

    controls.maxDistance = distance * 2;
    controls.target = center;

    camera.near = distance / 10;
    camera.far = distance * 10;
    camera.updateProjectionMatrix();

    camera.position.copy(controls.target).sub(direction);

    controls.update();
}

// EVENT LISTENERS
window.addEventListener('resize', onWindowResize, false);

pageElements.subConfigCheckbox.addEventListener('change', (event) => {
    setSubLocationY(event.target.checked, pageElements.arrayBottomHeightInput.value);
    addSubMirror();
    fitCameraToSelection();
    animate();
});

pageElements.distanceReferencedFromBelowArrayCheckbox.addEventListener('change', (event) => {
    if (event.target.checked) {
        mainLocation.x = 0;
        subLocation.x = (-subDimensions.depth / 2) + (mainDimensions.depth / 2) + Number(pageElements.arrayBottomHeightInput.value);
    } else {
        mainLocation.x = -mainDimensions.depth / 2;
        subLocation.x = -subDimensions.depth / 2 + Number(pageElements.arrayBottomHeightInput.value);
    }
    mainMirrorLocation.x = mainLocation.x;
    main.position.x = mainLocation.x;
    mainMirror.position.x = mainMirrorLocation.x;
    sub.position.x = subLocation.x;
    subMirror.position.x = sub.position.x;

    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.arrayBottomHeightInput.value, event.target.checked);

    animate();
});

pageElements.arrayBottomHeightInput.addEventListener('input', (event) => {
    let x = Number(event.target.value);

    if (pageElements.distanceReferencedFromBelowArrayCheckbox.checked) {
        sub.position.x = -subDimensions.depth / 2 + x + mainDimensions.depth / 2;
    } else {
        sub.position.x = -subDimensions.depth / 2 + x;
    }

    subMirror.position.x = sub.position.x;
    fitCameraToSelection();
    animate();
});

pageElements.arrayDepthInput.addEventListener('input', (event) => {
    let x = Number(event.target.value);
    setMainDimensionDepth(x);
    // main.geometry = new THREE.BoxGeometry(mainDimensions.depth, mainDimensions.width, mainDimensions.height);
    changeCubeDimensions(main, mainDimensions);
    if (!pageElements.distanceReferencedFromBelowArrayCheckbox.checked) {
        main.position.x = -mainDimensions.depth / 2;
        mainMirror.position.x = main.position.x;
    }
    changeCubeDimensions(mainMirror, mainDimensions);

    animate();
});

pageElements.arraySpanInput.addEventListener('input', (event) => {
    setMainDimensionHeight(event.target.value);
    changeCubeDimensions(main, mainDimensions);
    changeCubeDimensions(mainMirror, mainDimensions);

    fitCameraToSelection();
    animate();
});

pageElements.arrayBottomHeightInput.addEventListener('input', (event) => {
    setMainZFromBottom(event.target.value);
    fitCameraToSelection();
    animate();
});

pageElements.arrayBottomHeightInput.addEventListener('input', (event) => {
    setMainYFromSub(event.target.value);
    setSubLocationY(pageElements.subConfigCheckbox.checked, event.target.value);
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, event.target.value);
    fitCameraToSelection();
    animate();
});

pageElements.audienceDepthFirstRowInput.addEventListener('input', (event) => {
    updateAudience(event.target.value);
    fitCameraToSelection();
    animate();
});

pageElements.audienceDepthLastRowInput.addEventListener('input', (event) => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, event.target.value);
    fitCameraToSelection();
    animate();
});

pageElements.audienceSeatedRadio.addEventListener('change', (event) => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.arrayBottomHeightInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        event.target.checked);
    animate();
});

pageElements.audienceStandingRadio.addEventListener('change', () => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.arrayBottomHeightInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        false);
    animate();
});

pageElements.metersRadio.addEventListener('change', (event) => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.arrayBottomHeightInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        pageElements.audienceSeatedRadio.checked, event.target.checked);
    animate();
});

pageElements.feetRadio.addEventListener('change', () => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.arrayBottomHeightInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        pageElements.audienceSeatedRadio.checked, false);
    animate();
});
