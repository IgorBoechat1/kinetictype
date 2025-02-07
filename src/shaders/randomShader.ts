const randomShader = `
varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_lightPosition;
uniform vec3 u_viewPosition;
uniform vec2 u_resolution;

const float timeScale = 1.2;

void main() {
    float cycle = fract(u_time * timeScale);
    vec2 grid = vec2(40.0, 20.0);
    vec2 position = (gl_FragCoord.xy / u_resolution.xy * grid) - vec2(cycle, 0.0);

    float color = 0.0;

    if (mod(position.y, 2.0) < 1.0) {
        if (fract(position.x) < cycle) color = 1.0;
    } else {
        if (fract(position.x) > cycle) color = 1.0;
    }

    if (mod(floor(u_time * timeScale), 2.0) < 1.0) color = 1.0 - color;

    vec3 baseColor = vec3(color);

    // Calculate basic lighting
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(u_lightPosition - vPos);
    float diff = max(dot(normal, lightDir), 2.0);
    vec3 diffuse = diff * u_color;

    vec3 viewDir = normalize(u_viewPosition - vPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 20.0);
    vec3 specular = vec3(0.5) * spec;

    vec3 ambient = vec3(0.1) * u_color;

    vec3 finalColor = (ambient + diffuse + specular) * baseColor;

    // Increase brightness
    finalColor *= 1.5;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export default randomShader;