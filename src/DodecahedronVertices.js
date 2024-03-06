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

    this.geometry = new THREE.OctahedronGeometry(this.size, 3);
    this.geometry.setAttribute(
      "originalPosition",
      new THREE.BufferAttribute(
        this.geometry.attributes.position.array.slice(),
        3
      )
    );
    this.mesh = this.createMesh();
    this.lines = this.createLines();

    this.noise3D = createNoise3D();
    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        this.createRandomRipple();
      }
    });
    this.addToScene();
  }

  createMesh() {
    const material = new THREE.MeshBasicMaterial({
      color: this.vertexColor,
      wireframe: false,
    });
    return new THREE.Mesh(this.geometry, material);
  }

  createLines() {
    const lineStartPositions = this.geometry.attributes.position.array;
    const lineIndices = [];
    const numVertices = this.geometry.attributes.position.count;

    const lineColors = new Float32Array(numVertices * 2); // For each vertex, a color value

    // Assign colors to each vertex
    for (let i = 0; i < numVertices; i++) {
        // Assign black (0.0) to first half and white (1.0) to second half
        lineColors[i] = Math.random() > 0.5 ? 0.0 : 1.0;
    }

    const lineMaterial = new THREE.ShaderMaterial({
        uniforms: {
            centerPosition: { value: new THREE.Vector3(0, 0, 0) },
            offset: { value: this.size + 0.1 }
        },
        vertexShader: lineVertexShader,
        fragmentShader: lineFragmentShader,
        // Note: No need to pass 'white' as a uniform since it will be a varying attribute
    });

    

    for (let i = 0; i < numVertices; i++) {
      for (let j = i + 1; j < numVertices; j++) {
        lineIndices.push(i, j);
      }
    }

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(lineStartPositions), 3)
    );
    linesGeometry.setIndex(lineIndices);

    linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 1));

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
        this.noise3D(
          originalPositions[i] * noiseScale + elapsedTime * timeScale,
          originalPositions[i + 1] * noiseScale + elapsedTime * timeScale,
          originalPositions[i + 2] * noiseScale + elapsedTime * timeScale
        ) + 1.0; // Adjusted noise value range

      const distanceFromCenter = position.length(); // Calculate the distance from the center

      const distortedPosition = position
        .clone()
        .multiplyScalar(noiseValue * noiseStrength); // Clone the position to keep the original size, then multiply by the adjusted noise value and strength

      const finalPosition = position
        .clone()
        .add(distortedPosition.multiplyScalar(distanceFromCenter)); // Add the distorted position scaled by the original distance from the center

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

  createRandomRipple() {
    console.log("Creating random ripple");

    const linePositions = this.lines.geometry.attributes.position.array;
    const numVertices = this.geometry.attributes.position.count;
    const randomVertexIndex = Math.floor(Math.random() * numVertices); // Generate a random vertex index
    const ripplePropagationSpeed = 6.0; // Units per second
    const rippleFrequency = 4.0; // Cycles per second
    const dampingFactor = 1.2 ; // Exponential damping
    const rippleAmplitude = 0.8; // Units
    const distanceFalloff = 0.6; // Adjust the falloff effect based on distance
    const startTime = performance.now();

    const animateRipple = (timestamp) => {
      const elapsedTime = (timestamp - startTime) / 1000; // Convert to seconds

      let maxDistortion = 0;

      for (let i = 0; i < numVertices; i++) {
        const positionIndex = i * 3;
        const position = new THREE.Vector3(
          this.geometry.attributes.originalPosition.array[positionIndex],
          this.geometry.attributes.originalPosition.array[positionIndex + 1],
          this.geometry.attributes.originalPosition.array[positionIndex + 2]
        );

        const sourcePosition = new THREE.Vector3(
          this.geometry.attributes.originalPosition.array[
            randomVertexIndex * 3
          ],
          this.geometry.attributes.originalPosition.array[
            randomVertexIndex * 3 + 1
          ],
          this.geometry.attributes.originalPosition.array[
            randomVertexIndex * 3 + 2
          ]
        );

        const distanceFromSource = position.distanceTo(sourcePosition);
        const timeOffset = distanceFromSource / ripplePropagationSpeed;

        if (elapsedTime > timeOffset) {
          const effectiveTime = elapsedTime - timeOffset;
          const phase = effectiveTime * rippleFrequency;
          // Apply falloff based on distance to make the distortion intensity decrease with distance
          const distortionMagnitude =
            (Math.sin(phase) *
              Math.exp(-dampingFactor * effectiveTime) *
              rippleAmplitude) /
            Math.exp(distanceFromSource / distanceFalloff);

          maxDistortion = Math.max(
            maxDistortion,
            Math.abs(distortionMagnitude)
          );

          const normal = new THREE.Vector3(
            this.geometry.attributes.normal.array[positionIndex],
            this.geometry.attributes.normal.array[positionIndex + 1],
            this.geometry.attributes.normal.array[positionIndex + 2]
          ).normalize();

          const distortion = normal.multiplyScalar(distortionMagnitude);
          position.add(distortion);

          this.geometry.attributes.position.array[positionIndex] = position.x;
          this.geometry.attributes.position.array[positionIndex + 1] =
            position.y;
          this.geometry.attributes.position.array[positionIndex + 2] =
            position.z;

          // Update line positions
          linePositions[positionIndex] = position.x;
          linePositions[positionIndex + 1] = position.y;
          linePositions[positionIndex + 2] = position.z;
        }
      }

      this.lines.geometry.attributes.position.needsUpdate = true; // Update line positions
      this.geometry.attributes.position.needsUpdate = true;
      
      requestAnimationFrame(animateRipple);
    };

    requestAnimationFrame(animateRipple);
  }

  resetPositions() {
    const originalPositions = this.geometry.attributes.originalPosition.array;
    const positions = this.geometry.attributes.position.array;

    for (let i = 0; i < originalPositions.length; i++) {
      positions[i] = originalPositions[i];
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  tick(elapsedTime) {
    //this.distortVertices(elapsedTime);

    //rotate the mesh and lines

    this.mesh.rotation.y = elapsedTime / 4;

    this.lines.rotation.y = elapsedTime / 4;
  }
}

export default DodecahedronVertices;
