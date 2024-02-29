// lineVertexShader
export const lineVertexShader = `
    uniform float isInternalLine; // Use float instead of bool

    varying vec3 vStartPosition;
    varying vec3 vEndPosition;
    varying float vIsInternalLine; // Use float instead of bool

    void main() {
        vStartPosition = position;
        vEndPosition = position;
        vIsInternalLine = isInternalLine; // Use float value for boolean

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// lineFragmentShader
export const lineFragmentShader = `
    varying vec3 vStartPosition;
    varying vec3 vEndPosition;
    varying float vIsInternalLine; // Use float instead of bool

    void main() {
        if (vIsInternalLine > 0.5) { // Compare with 0.5 for boolean condition
            gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); // Blue color for internal lines
        } else {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // White color for external lines
        }
    }
`;
