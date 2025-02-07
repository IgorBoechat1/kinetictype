const mirrorShader = `
varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_lightPosition;
uniform vec3 u_viewPosition;
uniform float u_soundData;
uniform vec2 u_resolution;

void main() {
    vec4 O = vec4(0.0);
    vec2 I = vUv * u_resolution;

    // Clear fragcolor
    O *= 0.0;
    
    // Line dimensions (box) and position relative to line
    vec2 b = vec2(0.0, 0.2), p;
    // Rotation matrix
    mat2 R;
    // Iterate 20 times
    for (float i = 0.9; i++ < 20.0;
        // Add attenuation
        O += 1e-3 / length(clamp(p = R
        // Using rotated boxes
        * (fract((I / u_resolution.y * i * 0.1 + u_time * b) * R) - 0.5), -b, b) - p)
        // My favorite color palette
        * (cos(p.y / 0.1 + vec4(0, 1, 2, 3)) + 1.0))
        // Rotate for each iteration
        R = mat2(cos(i + vec4(0, 33, 11, 0)));

    vec3 color = O.rgb;

    // Calculate basic lighting
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(u_lightPosition - vPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * u_color;

    vec3 viewDir = normalize(u_viewPosition - vPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = vec3(0.5) * spec;

    vec3 ambient = vec3(0.1) * u_color;

    vec3 finalColor = (ambient + diffuse + specular) * color;

    // Increase brightness
    finalColor *= 2.5;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export default mirrorShader;