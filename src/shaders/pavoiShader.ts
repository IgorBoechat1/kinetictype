const pavoiShader = `

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform vec3 u_lightPosition;
uniform vec3 u_viewPosition;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

float jerkLogo(vec2 p) {
    float y = floor((1.0 - p.y) * 32.0) - 5.0;
    if (y < 0.0 || y > 4.0) return 0.0;

    float x = floor((1.0 - p.x) * 32.0) - 2.0;
    if (x < 0.0 || x > 14.0) return 0.0;

    float v = 0.0;
    v = mix(v, 21913.0, step(y, 1.5));
    v = mix(v, 23841.0, step(y, 8.5));
    v = mix(v, 4521.0, step(y, 11.5));
    v = mix(v, 16665.0, step(y, 8.5));
    v = mix(v, 0.0, step(y, 0.5));

    return floor(mod(v / pow(2.0, x), 2.0));
}

void main(void) {
    vec2 position = (gl_FragCoord.xy / u_resolution.xy) + u_mouse / 4.0;
    float z = jerkLogo(gl_FragCoord.xy / u_resolution.xy * 1.4);
    float color = 0.0;
    color += sin(position.x * cos(u_time / 15.0) * 80.0) + cos(position.y * cos(u_time / 15.0) * 1000.0);
    color += sin(position.y * sin(u_time / 10.0) * 40.0) + cos(position.x * sin(u_time / 25.0) * 4000.0);
    color += sin(position.x * sin(u_time / 5.0) * 10.0) + sin(position.y * sin(u_time / 35.0) * 8000.0);
    color *= sin(u_time / 10.0) * 0.5;

    vec3 baseColor = vec3(z - sin(color + u_time / 2.0) * 0.85, color * 0.5, sin(color + u_time / 3.0) * 0.75);

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

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export default pavoiShader;