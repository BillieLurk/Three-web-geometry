export const vertexShader = `
uniform float time; // Animation time
uniform float pointSize; // Uniform for controlling the size of the points

void main() {
    // Apply distortion to vertex position
    vec3 modPosition = position + sin(time + position.x) * 0.1;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(modPosition, 1.0);
    gl_PointSize = pointSize; // Set the size of the point
}
`;

export const fragmentShader = `
void main() {
    // Calculate distance from the center of the point (0.5, 0.5) in normalized device coordinates
    vec2 coord = gl_PointCoord - vec2(0.5, 0.5);
    if(length(coord) > 0.5) {
        discard; // Discard fragments outside the radius for a circular shape
    }
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // Simple white color
}
`;
