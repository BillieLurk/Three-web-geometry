// lineVertexShader
export const lineVertexShader = `
    
    uniform vec3 centerPosition; 
    varying float vDistanceFromCenter;

    attribute float color; 

    varying float vColor; 

    void main() {
        // Transform centerPosition from world space to model space
        vec4 modelSpaceCenter = modelMatrix * vec4(centerPosition, 1.0);

        vColor = color;
        
        // Now calculate distance in model space, making it invariant to camera movement
        vDistanceFromCenter = distance(modelSpaceCenter.xyz, position);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
