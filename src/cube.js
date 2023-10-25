import * as THREE from 'three';
import {Dimensions} from "./dimensions";

export class Cube {
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