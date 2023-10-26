import './index.css'
import './updated-alignment-position-fields'
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import {
    AUDIENCE_LOCATION_Z_IF_SEATED_METERS,
    AUDIENCE_LOCATION_Z_IF_SEATED_OTHER,
    AUDIENCE_LOCATION_Z_NOT_SEATED_METERS,
    AUDIENCE_LOCATION_Z_NOT_SEATED_OTHER,
    AUDIENCE_DIMENSION_WIDTH_FACTOR,
    MAIN_COLOR,
    SUB_COLOR,
    AUDIENCE_COLOR,
    timeline
} from './constants.js';
import {pageElements} from "./htmlPageElements";
import {Dimensions} from "./dimensions";
import {Cube} from "./cube";
import {setupCamera, setupRenderer, setupControls, addAxesLabels} from "./setup";

// SETUP
THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
const scene = new THREE.Scene();
const renderer = setupRenderer(pageElements);
const camera = setupCamera(pageElements.container);
pageElements.container.appendChild(renderer.domElement);

let controls = setupControls(camera, renderer);
addAxes();
const {xLabel, yLabel, zLabel, labelRenderer} = addAxesLabels(pageElements);
scene.add(xLabel);
scene.add(yLabel);
scene.add(zLabel);

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
setSubLocationY(pageElements.subConfigCheckbox.checked, pageElements.arrayBottomHeightInput.value);
scene.add(sub.mesh);

let subMirror;
addSubMirror(pageElements.subConfigCheckbox);

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

function addAxes() {
    const axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);
}

function setSubLocationY(subConfigurationLR, distanceFromCenter) {
    if (subConfigurationLR) {
        if (distanceFromCenter !== "") {
            sub.setY(Number(distanceFromCenter) + (sub.getDimensions().width / 2));
        } else {
            sub.setY(main.getPosition().y);
        }
    } else {
        sub.setY(0);
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

function addSubMirror(subConfigCheckbox) {
    if (!subMirror) {
        subMirror = new Cube(mainMirror.getPosition(), sub.getColor(), new Dimensions(1, 2, 1));
        subMirror.setZ(sub.getPosition().z);
    }

    if (subConfigCheckbox.checked) {
        if (!scene.children.includes(subMirror.mesh)) {
            scene.add(subMirror.mesh);
            subMirror.setPosition(sub.getPosition());
            subMirror.flipY();
        }
    } else {
        if (scene.children.includes(subMirror.mesh)) {
            scene.remove(subMirror.mesh);
        }
    }
}

function updateAudience(
    audienceDepthFirstRow = pageElements.audienceDepthFirstRowInput.value,
    audienceDepthLastRow = pageElements.audienceDepthLastRowInput.value,
    subY = pageElements.subDistanceFromCenterInput.value,
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
            audience.setX(audience.getPosition().x + main.getDimensions().depth / 2);
        }
    }
}

function updateAudienceDimensionWidth(subY) {
    if (subY !== "") {
        console.log("updating audience width")
        audience.setWidth(Number(subY) * AUDIENCE_DIMENSION_WIDTH_FACTOR);
    }
}

function updateAudienceLocationZ(audienceSeated, meters) {
    if (audienceSeated) {
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

function fitCameraToSelection(objects = null, offset = 1, orientation = null) {
    const box = new THREE.Box3();

    if (objects) {
        if (Array.isArray(objects)) {
            objects.forEach(object => {
                box.expandByObject(object.mesh);
            });
        } else {
            box.setFromObject(objects.mesh);
        }
    } else {
        scene.traverse(child => {
            if (child instanceof THREE.Mesh) {
                box.expandByObject(child);
            }
        });
    }

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = offset * Math.max(fitHeightDistance, fitWidthDistance);

    const direction = controls.target.clone().sub(camera.position).normalize().multiplyScalar(distance);

    controls.maxDistance = distance * 2;
    controls.target = center;

    // Check if objects is an empty array
    if (Array.isArray(objects) && objects.length === 0) {
        console.error('Error: Empty array provided to fitCameraToSelection');
        return;
    }

    let newPosition;
    if (orientation) {
        switch (orientation) {
            case "TOP":
                newPosition = new THREE.Vector3(center.x, center.y, center.z + distance);
                break;
            case "SIDE":
                newPosition = new THREE.Vector3(center.x, center.y + distance, center.z);
                break;
            case "FRONT":
                newPosition = new THREE.Vector3(center.x + distance, center.y, center.z);
                break;
            default:
                break;
        }
    } else {
        newPosition = controls.target.clone().sub(direction);
    }

    timeline.clear();
    timeline.fromTo(camera.position,
        {x: camera.position.x, y: camera.position.y, z: camera.position.z},
        {x: newPosition.x, y: newPosition.y, z: newPosition.z,
            onUpdate: function() { controls.update(); }}
    );

    camera.near = distance / 10;
    camera.far = distance * 10;

    camera.updateProjectionMatrix();

    controls.update();
}

// EVENT LISTENERS
window.addEventListener('resize', onWindowResize, false);

pageElements.subConfigCheckbox.addEventListener('change', (event) => {
    setSubLocationY(event.target.checked, pageElements.subDistanceFromCenterInput.value);
    addSubMirror(event.target);

    if (event.target.checked) {
        fitCameraToSelection([sub, subMirror], 2, "FRONT");
    }
    animate();
});

pageElements.distanceReferencedFromBelowArrayCheckbox.addEventListener('change', (event) => {
    if (event.target.checked) {
        main.setX(0);
        sub.setX((-sub.getDimensions().depth / 2) + (main.getDimensions().depth / 2) + Number(pageElements.subDepthInput.value));
    } else {
        main.setX(-mainDimensions.depth / 2);
        sub.setX(-sub.getDimensions().depth / 2 + Number(pageElements.subDepthInput.value));
    }
    mainMirror.setX(main.getPosition().x);
    subMirror.setX(sub.getPosition().x);

    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.subDistanceFromCenterInput.value, event.target.checked);

    fitCameraToSelection([main, sub], 3, "SIDE");
    animate();
});

pageElements.subDepthInput.addEventListener('input', (event) => {
    let x = Number(event.target.value);

    if (pageElements.distanceReferencedFromBelowArrayCheckbox.checked) {
        sub.setX(-sub.getDimensions().depth / 2 + x + main.getDimensions().depth / 2);
    } else {
        sub.setX(-sub.getDimensions().depth / 2 + x);
    }

    subMirror.setX(sub.getPosition().x);

    if (pageElements.subConfigCheckbox.checked) {
        fitCameraToSelection([sub, subMirror], 1, "TOP");
    } else {
        fitCameraToSelection(sub, 3, "TOP");
    }
    animate();
});

pageElements.arrayDepthInput.addEventListener('input', (event) => {
    main.setDepth(Number(event.target.value));
    if (!pageElements.distanceReferencedFromBelowArrayCheckbox.checked) {
        main.setX(-main.getDimensions().depth / 2);
    }

    mainMirror.setDepth(main.getDimensions().depth);
    mainMirror.setX(main.getPosition().x);

    fitCameraToSelection(main, 5, "SIDE")
    animate();
});

pageElements.arraySpanInput.addEventListener('input', (event) => {
    main.setHeight(event.target.value);
    mainMirror.setHeight(main.getDimensions().height);

    fitCameraToSelection(main, 3, "SIDE");
    animate();
});

pageElements.arrayBottomHeightInput.addEventListener('input', (event) => {
    main.setZFromBottom(event.target.value);
    mainMirror.setZFromBottom(event.target.value);

    fitCameraToSelection(main, 3, "SIDE");
    animate();
});

pageElements.subDistanceFromCenterInput.addEventListener('input', (event) => {
    setMainYFromSub(event.target.value);
    setSubLocationY(pageElements.subConfigCheckbox.checked, event.target.value);
    subMirror.setY(-sub.getPosition().y);
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, event.target.value);

    if (pageElements.subConfigCheckbox.checked) {
        fitCameraToSelection([sub, subMirror], 1, "TOP");
    } else {
        fitCameraToSelection(sub, 3, "TOP");
    }
    animate();
});

pageElements.audienceDepthFirstRowInput.addEventListener('input', (event) => {
    updateAudience(event.target.value);
    fitCameraToSelection(null, 1, "TOP");
    animate();
});

pageElements.audienceDepthLastRowInput.addEventListener('input', (event) => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, event.target.value);
    fitCameraToSelection(null, 1, "TOP");
    animate();
});

pageElements.audienceSeatedRadio.addEventListener('change', (event) => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.subDistanceFromCenterInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        event.target.checked);
    fitCameraToSelection(null, 1, "SIDE");
    animate();
});

pageElements.audienceStandingRadio.addEventListener('change', () => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.subDistanceFromCenterInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        false);
    fitCameraToSelection(null, 1, "SIDE");
    animate();
});

pageElements.metersRadio.addEventListener('change', (event) => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.subDistanceFromCenterInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        pageElements.audienceSeatedRadio.checked, event.target.checked);
    fitCameraToSelection(null, 1, "SIDE");
    animate();
});

pageElements.feetRadio.addEventListener('change', () => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.subDistanceFromCenterInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        pageElements.audienceSeatedRadio.checked, false);
    fitCameraToSelection(null, 1, "SIDE");
    animate();
});

pageElements.resetZoom.addEventListener('click', () => {
    fitCameraToSelection();
    animate();
});