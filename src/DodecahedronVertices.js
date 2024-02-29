import * as THREE from "three";
import { createNoise3D } from "simplex-noise";
import { lineFragmentShader, lineVertexShader } from "./lineShader";

class DodecahedronVertices {
  constructor(
    scene,
    camera,
    opts = { size: 1, vertexColor: 0xffffff, vertexSize: 0.05 }
  ) {
    this.camera = camera;
    this.scene = scene;
    this.size = opts.size;
    this.vertexColor = opts.vertexColor;
    this.vertexSize = opts.vertexSize;

    this.geometry = new THREE.OctahedronGeometry(this.size, 2);
    this.geometry.setAttribute(
      "originalPosition",
      new THREE.BufferAttribute(this.geometry.attributes.position.array.slice(), 3)
    );
    this.mesh = this.createMesh();
    this.lines = this.createLines();

    this.noise3D = createNoise3D();

    this.addToScene();
  }

  createMesh() {
    const material = new THREE.MeshBasicMaterial({ color: this.vertexColor, wireframe: false });
    return new THREE.Mesh(this.geometry, material);
  }

  createLines() {
    const lineMaterial = new THREE.ShaderMaterial({
      uniforms: {
          isInternalLine: { value: true } // Set to true for internal lines
      },
      vertexShader: lineVertexShader,
      fragmentShader: lineFragmentShader,
  });

    const lineStartPositions = this.geometry.attributes.position.array;
    const lineIndices = [];
    const numVertices = this.geometry.attributes.position.count;

    for (let i = 0; i < numVertices; i++) {
      for (let j = i + 1; j < numVertices; j++) {
        lineIndices.push(i, j);
      }
    }

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lineStartPositions), 3));
    linesGeometry.setIndex(lineIndices);

    return new THREE.LineSegments(linesGeometry, lineMaterial);
  }

  addToScene() {
    //this.scene.add(this.mesh);  
    this.scene.add(this.lines);
  }

  distortVertices(elapsedTime) {
    const { array: positions } = this.geometry.attributes.position;
    const originalPositions = this.geometry.attributes.originalPosition.array;
    const linePositions = this.lines.geometry.attributes.position.array;

    const noiseStrength = 0.1; // Adjusted noise strength
    const noiseScale = 0.2; // Adjusted noise scale
    const timeScale = 0.4; // Adjusted time scale
    

    for (let i = 0; i < originalPositions.length; i += 3) {
        const position = new THREE.Vector3(
            originalPositions[i],
            originalPositions[i + 1],
            originalPositions[i + 2]
        );

        const center = new THREE.Vector3(0, 0, 0);
        const noiseValue =
            (this.noise3D(
                originalPositions[i] * noiseScale + elapsedTime * timeScale,
                originalPositions[i + 1] * noiseScale + elapsedTime * timeScale,
                originalPositions[i + 2] * noiseScale + elapsedTime * timeScale
            ) + 1.0) ; // Adjusted noise value range

        const distanceFromCenter = position.length(); // Calculate the distance from the center

        const distortedPosition = position.clone().multiplyScalar(noiseValue * noiseStrength); // Clone the position to keep the original size, then multiply by the adjusted noise value and strength

        const finalPosition = position.clone().add(distortedPosition.multiplyScalar(distanceFromCenter)); // Add the distorted position scaled by the original distance from the center

        positions[i] = finalPosition.x + center.x;
        positions[i + 1] = finalPosition.y + center.y;
        positions[i + 2] = finalPosition.z + center.z;

        // Update line positions
        linePositions[i] = finalPosition.x + center.x;
        linePositions[i + 1] = finalPosition.y + center.y;
        linePositions[i + 2] = finalPosition.z + center.z;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.lines.geometry.attributes.position.needsUpdate = true; // Update line positions
}





  tick(elapsedTime) {
    this.distortVertices(elapsedTime);
  }
}

export default DodecahedronVertices;
