import {BoxGeometry, MeshBasicMaterial, Mesh, EdgesGeometry, LineSegments, LineBasicMaterial, Color} from 'three';
import {Dimensions} from "./dimensions";

/**
 * A class for creating and manipulating 3D Cubes in THREE.js.
 *
 * @class Cube
 * @constructor
 * @param position {Object} Object with `x`, `y` and `z` values indicating the cube's position in the 3D space.
 * @param color {string} the color of the cube in a three.js color format (eg: "#ffffff" or color name string).
 * @param dimensions {Dimensions} An instance of `Dimensions` class with `depth`, `width`, and `height` of the cube. By default, creates a 1x1x1 cube.
 * @param opacity {number} A decimal between 0 and 1 indicating the cube's transparancy. 1 by default.
 *
 *
 * @example
 *  const cube = new Cube({x: 0, y: 0, z: 0}, "#ffffff", new Dimensions(1, 1, 1), 1);
 *  cube.setPosition({x: 1, y: 1, z: 1});
 *
 * @returns Cube instance
 */
export class Cube {
    /**
     * Create a BoxGeometry for our Mesh.
     *
     * Note: In this project, Depth corresponds to the X axis, Width corresponds to the Y axis,
     * and Height corresponds to the Z axis. So contrary to the expected order of parameters in
     * Three.js when creating a BoxGeometry which is Width, Height, and Depth, here we are using
     * Depth, Width, and Height. This is because in our architectural drawing Z is up/down
     * (corresponding to the height of the object) and this concept is enforced by `THREE.Object3D.DEFAULT_UP.set(0, 0, 1)`
     * settings in the main.js.
     *
     * @const geometry {BoxGeometry}
     * @memberof Cube
     * @inner
     */
    constructor(position, color, dimensions = new Dimensions(1, 1, 1), opacity = 1) {
        const geometry = new BoxGeometry(dimensions.depth, dimensions.width, dimensions.height);
        const material = new MeshBasicMaterial({color: color, transparent: true, opacity: opacity});
        this.mesh = new Mesh(geometry, material);
        const edges = new EdgesGeometry(geometry);
        const edgeColor = new Color(color);
        edgeColor.offsetHSL(0, 0, 0.2); // Increase lightness by 20%
        const line = new LineSegments(edges, new LineBasicMaterial({color: edgeColor.getHex()}));
        this.mesh.add(line);
        this.mesh.position.set(position.x, position.y, position.z);
    }

    /**
     * Method to change the dimensions of the cube.
     *
     * In Three.js, there's no built-in way to directly update the geometry of a cube and its edges.
     * Therefore, this method first removes existing line segments (edges) from the cube's geometry.
     * Then, it creates a new geometry with the updated dimensions and a corresponding edges geometry,
     * and attaches these to the cube. This way, we ensure that the dimensions of the cube and its edges
     * stay in sync whenever the cube's dimensions are updated.
     *
     * @method changeDimensions
     * @param dimensions {Dimensions} An instance of `Dimensions` class with `depth`, `width`, `height` of the cube.
     * @example
     *  cube.changeDimensions(new Dimensions(2, 2, 2));
     */
    changeDimensions(dimensions) {
        this.mesh.children.forEach(child => {
            if (child instanceof LineSegments) {
                this.mesh.remove(child);
            }
        });

        const geometry = new BoxGeometry(dimensions.depth, dimensions.width, dimensions.height);
        const edges = new EdgesGeometry(geometry);

        this.mesh.geometry.dispose();
        this.mesh.geometry = geometry;

        const edgeColor = new Color(this.mesh.material.color.getHex());
        edgeColor.offsetHSL(0, 0, 0.2);  // Increase lightness by 20%

        const line = new LineSegments(edges, new LineBasicMaterial({color: edgeColor.getHex()}));
        this.mesh.add(line);
    }

    setDepth(depth) {
        if (depth > 0) {
            let dimensions = this.getDimensions();
            this.changeDimensions(new Dimensions(dimensions.height, dimensions.width, depth));
        }
    }

    setWidth(width) {
        if (width > 0) {
            let dimensions = this.getDimensions();
            this.changeDimensions(new Dimensions(dimensions.height, width, dimensions.depth));
        }
    }

    setHeight(height) {
        if (height > 0) {
            let dimensions = this.getDimensions();
            this.changeDimensions(new Dimensions(height, dimensions.width, dimensions.depth));  // height, width, depth
        }
    }

    /**
     * Method to get the dimensions of the cube.
     *
     * Please note that in this project's configuration, the
     * 'depth' is along the X axis, 'width' is along the Y axis,
     * and 'height' is along the Z axis.
     *
     * Three.js's BoxGeometry constructor takes parameters in the
     * order (width, height, depth), but because of our unique
     * axis configuration, we pass them as (depth, width, height)
     * as evident in Cube's constructor. Therefore, when we
     * fetch parameters, we have to match our architectural drawing
     * coordinate system with Three.js's geometry parameters.
     *
     * @method getDimensions
     * @returns {Dimensions} Returns an instance of `Dimensions` with the cube's current depth, width, and height.
     * @example
     *  let currentDimensions = cube.getDimensions();
     */
    getDimensions() {
        let localDepth = this.mesh.geometry.parameters.width;
        let localWidth = this.mesh.geometry.parameters.height;
        let localHeight = this.mesh.geometry.parameters.depth;
        return new Dimensions(localHeight, localWidth, localDepth);
    }

    setPosition(position) {
        this.mesh.position.set(position.x, position.y, position.z);
    }

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

    /**
     * Method to mirror the cube object along the Y axis.
     *
     * This is especially useful when working with `mainMirror` and `subMirror` objects
     * for quickly producing a mirror effect along the Y axis.
     *
     * @method flipY
     * @example
     *  cube.flipY();
     */
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