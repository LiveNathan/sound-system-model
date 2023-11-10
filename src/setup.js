// setup.js
import {PerspectiveCamera, Vector3, WebGLRenderer} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DObject, CSS2DRenderer} from 'three/addons/renderers/CSS2DRenderer.js';
import { X_LABEL_CLASS, Y_LABEL_CLASS, Z_LABEL_CLASS, DEFAULT_LABEL_CLASS, LABEL_OFFSET } from './constants.js';

export function setupCamera(container) {
    const camera = new PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    // camera.up.set(0, 0, 1);
    camera.position.set(70, -40, 15);
    camera.lookAt(new Vector3(0, 0, 0));
    return camera;
}

export function setupRenderer(pageElements) {
    const renderer = new WebGLRenderer({canvas: pageElements.canvas});
    renderer.setSize(pageElements.container.offsetWidth, pageElements.container.offsetHeight);
    return renderer;
}

export function setupControls(camera, renderer) {
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.object.up.set(0, 0, 1);
    controls.update();
    return controls;
}

export function createLabel(textContent, className, position) {
    const element = document.createElement('div');
    element.className = className;
    element.textContent = textContent;

    const label = new CSS2DObject(element);
    label.position.set(position.x, position.y, position.z);

    return label;
}

export function addAxesLabels(pageElements) {
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(pageElements.container.offsetWidth, pageElements.container.offsetHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.pointerEvents = 'none';
    pageElements.container.appendChild(labelRenderer.domElement);

    const xLabel = createLabel('X', `${X_LABEL_CLASS} ${DEFAULT_LABEL_CLASS}`, new Vector3(LABEL_OFFSET, 0, 0));
    const yLabel = createLabel('Y', `${Y_LABEL_CLASS} ${DEFAULT_LABEL_CLASS}`, new Vector3(0, LABEL_OFFSET, 0));
    const zLabel = createLabel('Z', `${Z_LABEL_CLASS} ${DEFAULT_LABEL_CLASS}`, new Vector3(0, 0, LABEL_OFFSET));

    return { xLabel, yLabel, zLabel, labelRenderer};
}