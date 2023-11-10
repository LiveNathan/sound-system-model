/**
 * This is a Three.js based 3D scene setup and manipulation program for an architectural visualization where the Z axis represents the up and down directions.
 *
 * The purpose of the program is to create a 3D visualization that allows the users to adjust and view a particular architectural configuration such as audience seating arrangement from different angles and perspectives.
 *
 * The visualization scene is created using THREE.js library and features a setup of 3D objects that can be manipulated in real time through the HTML UI elements or programmatically.
 *
 * The setup includes a main cube object, sub-cube objects with mirror capabilities as well as an audience cube object. Changes to these objects such as dimensions, and positions can be done through UI elements.
 *
 * The program also features functionality for zooming and repositioning the viewpoint of the visualization which can be done programmatically or from UI elements.
 *
 * The visualization also uses gsap for smooth transition of viewpoint changes. Error handling for unavailability of WebGL is included to keep the user informed about the compatibility issues.
 *
 * With the architectural axis arrangement where z is up and down, it follows the common architectural and engineering practices, it allows easy translation between the architectural designs and this 3D representation.
 *
 * @module main.js
 * @author Nathan Lively
 * @version 1.0
 */
import './index.css'
import { Scene, Box3, Vector3, Object3D, AxesHelper, Mesh } from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import {gsap} from "gsap";
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
import {Dimensions} from "./dimensions";
import {Cube} from "./cube";
import {setupCamera, setupRenderer, setupControls, addAxesLabels} from "./setup";

// SETUP
Object3D.DEFAULT_UP.set(0, 0, 1);
const scene = new Scene();
const renderer = setupRenderer(pageElements);
const camera = setupCamera(pageElements.container);
pageElements.container.appendChild(renderer.domElement);

let controls = setupControls(camera, renderer);
let userInteracted = false;
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
let audienceLocation = new Vector3(audienceDimensions.depth / 2 + 5, 0, 1.2);
let audience = new Cube(audienceLocation, AUDIENCE_COLOR, audienceDimensions, 0.15);
scene.add(audience.mesh);
updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.arrayBottomHeightInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
    pageElements.audienceSeatedRadio.checked, pageElements.metersRadio.checked);

fitCameraToSelection();

// FUNCTIONS
function animate() {
    requestAnimationFrame(animate);
    controls.update();
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
    const axesHelper = new AxesHelper(500);
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
    let mainLocation = new Vector3(-mainDimensions.depth / 2, 20, mainDimensions.height / 2 + 10);

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
    let subLocation = new Vector3(-0.5, 0, 0.5);
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

/**
 * This function updates different audience properties and dimensions.
 *
 * @param {string|number} audienceDepthFirstRow - The audience depth for the first row. Default is the value from input.
 * @param {string|number} audienceDepthLastRow - The audience depth for the last row. Default is the value from input.
 * @param {string|number} subY - The distance of subwoofer from center. Default is the value from input.
 * @param {boolean} distancedReferencedFromBelowArray - Check if the distance is referenced from below array. Default is a checked value from checkbox.
 * @param {boolean} audienceSeated - Check if the audience is seated. Default is a checked value from radio button.
 * @param {boolean} meters - Check if the measurement unit is in meters. Default is a checked value from radio button.
 *
 */
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

/**
 * Adjusts the camera to fit a selection of objects within the view.
 * The camera view can be oriented from top, side or front, and has calculated distance.
 * The distance calculation will depend on the camera's field of view and its aspect ratio.
 * The function offers different calculations based on whether the object is an array, has a specific orientation, or if it is null.
 *
 * @param {Array} objects - The objects that the camera must adapt to. If empty, the function traverses the entire scene to get the outer boundary.
 * @param {number} offset - The offset for the camera from the objects. A larger offset will move the camera further away. Default value is 1.
 * @param {string|null} orientation - The orientation of the camera. Valid values are "TOP", "SIDE", "FRONT" or null. If null, the function will adapt the camera based on the objects and offset.
 */
function fitCameraToSelection(objects = [], offset = 1, orientation = null) {
    if (!userInteracted) {
        // camera.up.set(0, 1, 0);
        const timeline = gsap.timeline({defaults: {duration: 1}});
        const box = new Box3();

        if (objects.length > 0) {
            objects.forEach(object => {
                box.expandByObject(object.mesh);
            });
        } else {
            scene.traverse(child => {
                if (child instanceof Mesh) {
                    box.expandByObject(child);
                }
            });
        }

        const size = box.getSize(new Vector3());
        const center = box.getCenter(new Vector3());

        const maxSize = Math.max(size.x, size.y, size.z);
        const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
        const fitWidthDistance = fitHeightDistance / camera.aspect;
        const distance = offset * Math.max(fitHeightDistance, fitWidthDistance);

        const direction = controls.target.clone().sub(camera.position).normalize().multiplyScalar(distance);

        controls.maxDistance = distance * 2;
        controls.target = center;

        let newPosition;
        if (orientation) {
            switch (orientation) {
                case "TOP":
                    newPosition = new Vector3(center.x, center.y, center.z + distance);
                    break;
                case "SIDE":
                    newPosition = new Vector3(center.x, center.y + distance, center.z);
                    break;
                case "FRONT":
                    newPosition = new Vector3(center.x + distance, center.y, center.z);
                    break;
                default:
                    break;
            }
        } else {
            newPosition = controls.target.clone().sub(direction);
        }

        timeline.clear();
        timeline.fromTo(camera.position,
            {...camera.position},
            {
                ...newPosition, onUpdate: function () {
                    controls.update();
                },
                onComplete: function () {
                    camera.up.set(0, 0, 1);
                }
            }
        );

        camera.near = distance / 10;
        camera.far = distance * 10;

        camera.updateProjectionMatrix();

        controls.update();
    }
}

function fitMainSubFromSide() {
    fitCameraToSelection([main, sub], 3, "SIDE");
}

function fitMainFromSide() {
    fitCameraToSelection([main], 3, "SIDE");
}

function fitSceneFromSide() {
    fitCameraToSelection([], 1, "SIDE");
}

function fitSceneFromTop() {
    fitCameraToSelection([], 1, "TOP");
}

function fitSubAndMirrorFromTop() {
    if (pageElements.subConfigCheckbox.checked) {
        fitCameraToSelection([sub, subMirror], 1, "TOP");
    } else {
        fitCameraToSelection([sub], 3, "TOP");
    }
}

// EVENT LISTENERS
window.addEventListener('resize', onWindowResize, false);

pageElements.subConfigCheckbox.addEventListener('change', (event) => {
    setSubLocationY(event.target.checked, pageElements.subDistanceFromCenterInput.value);
    addSubMirror(event.target);

    if (event.target.checked) {
        fitCameraToSelection([sub, subMirror], 1, "FRONT");
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

    fitMainSubFromSide();
    animate();
});

pageElements.distanceReferencedFromBelowArrayCheckbox.addEventListener('focus', () => {
    fitMainSubFromSide();
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

    fitSubAndMirrorFromTop();
    animate();
});

pageElements.subDepthInput.addEventListener('focus', () => {
    fitSubAndMirrorFromTop();
    animate();
});

pageElements.arrayDepthInput.addEventListener('input', (event) => {
    main.setDepth(Number(event.target.value));
    if (!pageElements.distanceReferencedFromBelowArrayCheckbox.checked) {
        main.setX(-main.getDimensions().depth / 2);
    }

    mainMirror.setDepth(main.getDimensions().depth);
    mainMirror.setX(main.getPosition().x);

    fitMainFromSide();
    animate();
});

pageElements.arrayDepthInput.addEventListener('focus', () => {
    fitMainFromSide();
    animate();
});

pageElements.arraySpanInput.addEventListener('input', (event) => {
    main.setHeight(event.target.value);
    mainMirror.setHeight(main.getDimensions().height);

    fitMainFromSide();
    animate();
});

pageElements.arraySpanInput.addEventListener('focus', () => {
    fitMainFromSide();
    animate();
});

pageElements.arrayBottomHeightInput.addEventListener('input', (event) => {
    main.setZFromBottom(event.target.value);
    mainMirror.setZFromBottom(event.target.value);

    fitMainFromSide();
    animate();
});

pageElements.arrayBottomHeightInput.addEventListener('focus', () => {
    fitMainFromSide();
    animate();
});

pageElements.subDistanceFromCenterInput.addEventListener('input', (event) => {
    setMainYFromSub(event.target.value);
    setSubLocationY(pageElements.subConfigCheckbox.checked, event.target.value);
    subMirror.setY(-sub.getPosition().y);
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, event.target.value);

    fitSubAndMirrorFromTop();
    animate();
});

pageElements.subDistanceFromCenterInput.addEventListener('focus', () => {
    fitSubAndMirrorFromTop();
    animate();
});

pageElements.audienceDepthFirstRowInput.addEventListener('input', (event) => {
    updateAudience(event.target.value);
    fitSceneFromTop();
    animate();
});

pageElements.audienceDepthFirstRowInput.addEventListener('focus', () => {
    fitSceneFromTop();
    animate();
});

pageElements.audienceDepthLastRowInput.addEventListener('input', (event) => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, event.target.value);
    fitSceneFromTop();
    animate();
});

pageElements.audienceDepthLastRowInput.addEventListener('focus', () => {
    fitSceneFromTop();
    animate();
});

pageElements.audienceSeatedRadio.addEventListener('change', (event) => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.subDistanceFromCenterInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        event.target.checked);
    fitSceneFromSide();
    animate();
});

pageElements.audienceStandingRadio.addEventListener('change', () => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.subDistanceFromCenterInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        false);
    fitSceneFromSide();
    animate();
});

pageElements.metersRadio.addEventListener('change', (event) => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.subDistanceFromCenterInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        pageElements.audienceSeatedRadio.checked, event.target.checked);
    fitSceneFromSide();
    animate();
});

pageElements.feetRadio.addEventListener('change', () => {
    updateAudience(pageElements.audienceDepthFirstRowInput.value, pageElements.audienceDepthLastRowInput.value, pageElements.subDistanceFromCenterInput.value, pageElements.distanceReferencedFromBelowArrayCheckbox.checked,
        pageElements.audienceSeatedRadio.checked, false);
    fitSceneFromSide();
    animate();
});

pageElements.resetZoom.addEventListener('click', () => {
    userInteracted = false;
    fitCameraToSelection();
    animate();
});

controls.addEventListener('start', () => userInteracted = true);