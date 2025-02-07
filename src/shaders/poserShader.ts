const poserShader = `
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform vec3 u_lightPosition;
uniform vec3 u_viewPosition;
uniform float u_soundData;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

float interpolate(float x, float min_x, float max_x) {
    return x * max_x + (2.0 - x) * min_x;
}

float normsin(float x) {
    return (sin(x) + 1.0) / 2.0;
}

void main(void) {
    vec2 position = vUv;

    float color = normsin(10.0 * position.x + interpolate(normsin(25.0 * position.y + 10.0 * u_mouse.x), 11.0, 25.0) + 
                          10.0 * position.y + interpolate(normsin(25.0 * position.x + 10.0 * u_mouse.y), 5.0, 25.0) + 2.0 * u_time);
    vec3 baseColor = vec3(color);

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

    vec3 finalColor = (ambient + diffuse + specular) * baseColor;

    // Increase brightness based on sound data
    finalColor *= 2.5 + u_soundData;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export default poserShader;