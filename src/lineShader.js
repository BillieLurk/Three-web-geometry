// lineVertexShader
export const lineVertexShader = `
uniform vec3 centerPosition;
uniform float thickness;  // Add thickness uniform

varying float vDistanceFromCenter;
varying float vColor;
attribute float color;

void main() {
    vec4 modelSpaceCenter = modelMatrix * vec4(centerPosition, 1.0);
    vColor = color;
    vDistanceFromCenter = distance(modelSpaceCenter.xyz, position);

    // Calculate line direction in screen space
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec4 projected = projectionMatrix * mvPosition;
    vec2 screenNormal = normalize(projected.xy / projected.w);
    
    // Offset vertices perpendicular to line direction
    vec2 offset = vec2(-screenNormal.y, screenNormal.x) * thickness * 0.005;
    gl_Position = projected + vec4(offset, 0.0, 0.0);
}
`;

// lineFragmentShader
export const lineFragmentShader = `
    uniform float offset; // Uniform to define the distance offset for coloring
    varying float vDistanceFromCenter; // Received from vertex shader
    varying float vColor;

    void main() {
       
        vec3 colorGradient = mix(vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), vColor);
       
        // Ensure effectiveDistance starts increasing only when vDistanceFromCenter is above the offset
        float effectiveDistance = max(vDistanceFromCenter - offset, 0.0);

        // Apply a scaling factor to make the transition more pronounced
        // The scaling factor can be adjusted to control how quickly the color transitions beyond the offset
        float scalingFactor = 5.0; 
        float intensityFactor = clamp(effectiveDistance * scalingFactor, 0.0, 1.0);

        // Create a gradient from white to red based on the effective distance
        vec3 color = mix(colorGradient, vec3(1.0, 0.2, 0.0), intensityFactor);

        gl_FragColor = vec4(color, 1.0);
    }
`;
