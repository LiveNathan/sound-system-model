import './index.css'
import './updated-alignment-position-fields'
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import {CSS2DObject, CSS2DRenderer} from 'three/addons/renderers/CSS2DRenderer.js';
import {
    AUDIENCE_LOCATION_Z_IF_SEATED_METERS,
    AUDIENCE_LOCATION_Z_IF_SEATED_OTHER,
    AUDIENCE_LOCATION_Z_NOT_SEATED_METERS,
    AUDIENCE_LOCATION_Z_NOT_SEATED_OTHER,
    AUDIENCE_DIMENSION_WIDTH_FACTOR,
    MAIN_COLOR,
    SUB_COLOR,
    AUDIENCE_COLOR
} from './constants.js';
import {pageElements} from "./htmlPageElements";

class Dimensions {
    constructor(height, width, depth) {
        this.height = height;
        this.width = width;
        this.depth = depth;
    }
}

class Cube {
    constructor(position, color, dimensions = new Dimensions(1, 1, 1), opacity = 1) {
        const geometry = new THREE.BoxGeometry(dimensions.depth, dimensions.width, dimensions.height);
        const material = new THREE.MeshBasicMaterial({color: color, transparent: true, opacity: opacity});
        this.mesh = new THREE.Mesh(geometry, material);
        const edges = new THREE.EdgesGeometry(geometry);
        const edgeColor = new THREE.Color(color);
        edgeColor.offsetHSL(0, 0, 0.2); // Increase lightness by 20%
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: edgeColor.getHex()}));
        this.mesh.add(line);
        this.mesh.position.set(position.x, position.y, position.z);
    }

    changeDimensions(dimensions) {
        this.mesh.children.forEach(child => {
            if (child instanceof THREE.LineSegments) {
                this.mesh.remove(child);
            }
        });

        const geometry = new THREE.BoxGeometry(dimensions.depth, dimensions.width, dimensions.height);
        const edges = new THREE.EdgesGeometry(geometry);

        this.mesh.geometry.dispose();
        this.mesh.geometry = geometry;

        const edgeColor = new THREE.Color(this.mesh.material.color.getHex());
        edgeColor.offsetHSL(0, 0, 0.2);  // Increase lightness by 20%

        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: edgeColor.getHex()}));
        this.mesh.add(line);
    }

    setDepth(depth) {
        let dimensions = this.getDimensions();
        this.changeDimensions(new Dimensions(depth, dimensions.width, dimensions.height));
    }

    setWidth(width) {
        let dimensions = this.getDimensions();
        this.changeDimensions(new Dimensions(dimensions.depth, width, dimensions.height));
    }

    setHeight(height) {
        let dimensions = this.getDimensions();
        this.changeDimensions(new Dimensions(dimensions.depth, dimensions.width, height));
    }

    getDimensions() {
        return this.mesh.geometry.parameters;
    }

    // setPosition(position) {
    //     this.mesh.position.set(position.x, position.y, position.z);
    // }

    getPosition() {
        return this.mesh.position;
    }

    setX(xCoordinate) {
        if (xCoordinate !== "") {
            // this.mesh.position.x = Number(xCoordinate) + (this.mesh.geometry.parameters.depth / 2);
            this.mesh.position.x = Number(xCoordinate);
        }
    }

    setY(yCoordinate) {
        if (yCoordinate !== "") {
            this.mesh.position.y = Number(yCoordinate) + (this.mesh.geometry.parameters.width / 2);
        }
    }

    setZ(zCoordinate) {
        if (zCoordinate !== "") {
            this.mesh.position.z = Number(zCoordinate);
        }
    }

    flipY() {
        this.mesh.position.y = -this.mesh.position.y;
    }

    setZFromBottom(bottomHeight) {
        if (bottomHeight) {
            this.mesh.position.z = Number(bottomHeight) + (this.mesh.geometry.parameters.height / 2);
        }
    }

    getColor() {
        return this.mesh.material.color;
    }
}

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

let main = new Cube(setMainLocation(), MAIN_COLOR, mainDimensions);
main.setZFromBottom(pageElements.arrayBottomHeightInput.value);
setMainYFromSub(pageElements.arrayBottomHeightInput.value);
scene.add(main.mesh);

let mainMirror = new Cube(main.getPosition(), main.getColor(), main.getDimensions());
mainMirror.flipY();
scene.add(mainMirror.mesh);

let sub = new Cube(setSubLocation(), SUB_COLOR, new Dimensions(1, 2, 1));
scene.add(sub.mesh);

let subMirror;
setSubLocationY(pageElements.subConfigCheckbox.checked, pageElements.arrayBottomHeightInput.value);
addSubMirror();

let audienceDimensions = new Dimensions(0.1, main.getPosition().y * AUDIENCE_DIMENSION_WIDTH_FACTOR, main.getPosition().y * AUDIENCE_DIMENSION_WIDTH_FACTOR);
let audienceLocation = new THREE.Vector3(audienceDimensions.depth / 2 + 5, 0, 1.2);
let audience = new Cube(audienceLocation, AUDIENCE_COLOR, audienceDimensions, 0.15);
scene.add(audience.mesh);
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

function setSubLocationY(subConfigurationLR, distanceFromCenter) {
    if (subConfigurationLR) {
        if (distanceFromCenter !== "") {
            sub.setY(Number(distanceFromCenter) + (sub.getDimensions().width / 2));
        } else {
            sub.setY(main.getPosition().y);
        }
    }

    if (subMirror) {
        subMirror.setY(-sub.getPosition().y);
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

function setMainYFromSub(distanceFromCenter) {
    if (distanceFromCenter !== "") {
        main.setY(Number(distanceFromCenter) + (mainDimensions.width / 2));
        mainMirror.setY(-main.getPosition().y);
    }
}

function setSubLocation() {
    let subLocation = new THREE.Vector3(-0.5, 0, 0.5);
    if (pageElements.distanceReferencedFromBelowArrayCheckbox.checked) {
        subLocation.x = 0;
    }
    return subLocation;
}

function addSubMirror() {
    if (!subMirror) {
        subMirror = new Cube(sub.getPosition(), sub.getColor(), sub.getDimensions());
        subMirror.flipY();
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
}

function updateAudienceLocationX(audienceDepthFirstRow, audienceDepthLastRow, distancedReferencedFromBelowArray) {
    if (audienceDepthFirstRow !== "" && audienceDepthLastRow !== "") {
        let depth = Number(audienceDepthLastRow) - Number(audienceDepthFirstRow);
        audience.setDepth(depth)
        audience.setX(depth / 2 + Number(audienceDepthFirstRow));
        if (distancedReferencedFromBelowArray) {
            // audienceLocation.x += mainDimensions.depth / 2;
            audience.setX(audience.getPosition().x + mainDimensions.depth / 2);
        }
    }
}

function updateAudienceDimensionWidth(subY) {
    if (subY !== "") {
        // audienceDimensions.width = Number(subY) * AUDIENCE_DIMENSION_WIDTH_FACTOR;
        audience.setWidth(Number(subY) * AUDIENCE_DIMENSION_WIDTH_FACTOR);
    }
}

function updateAudienceLocationZ(audienceSeated, meters) {
    if (audienceSeated) {
        // audienceLocation.z = meters ? AUDIENCE_LOCATION_Z_IF_SEATED_METERS : AUDIENCE_LOCATION_Z_IF_SEATED_OTHER;
        audience.setZ(meters ? AUDIENCE_LOCATION_Z_IF_SEATED_METERS : AUDIENCE_LOCATION_Z_IF_SEATED_OTHER);
    } else {
        audience.setZ(meters ? AUDIENCE_LOCATION_Z_NOT_SEATED_METERS : AUDIENCE_LOCATION_Z_NOT_SEATED_OTHER);
    }
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
        main.setX(0);
        sub.setX((-sub.getDimensions().depth / 2) + (main.getDimensions().depth / 2) + Number(pageElements.arrayBottomHeightInput.value));
    } else {
        main.setX(-mainDimensions.depth / 2);
        sub.setX(-sub.getDimensions().depth / 2 + Number(pageElements.arrayBottomHeightInput.value));
    }
    mainMirror.setX(main.getPosition().x);
    subMirror.setX(sub.getPosition().x);

    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.arrayBottomHeightInput.value, event.target.checked);

    animate();
});

pageElements.arrayBottomHeightInput.addEventListener('input', (event) => {
    let x = Number(event.target.value);

    if (pageElements.distanceReferencedFromBelowArrayCheckbox.checked) {
        sub.setX(-sub.getDimensions().depth / 2 + x + main.getDimensions().depth / 2);
    } else {
        sub.setX(-sub.getDimensions().depth / 2 + x);
    }

    subMirror.setX(sub.getPosition().x);
    fitCameraToSelection();
    animate();
});

pageElements.arrayDepthInput.addEventListener('input', (event) => {
    main.setDepth(Number(event.target.value));
    if (!pageElements.distanceReferencedFromBelowArrayCheckbox.checked) {
        main.setX(-main.getDimensions().depth / 2);
        mainMirror.setDepth(main.getPosition().x);
    }

    animate();
});

pageElements.arraySpanInput.addEventListener('input', (event) => {
    main.setHeight(event.target.value);
    mainMirror.setHeight(main.getDimensions().height);

    fitCameraToSelection();
    animate();
});

pageElements.arrayBottomHeightInput.addEventListener('input', (event) => {
    main.setZFromBottom(event.target.value);
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
