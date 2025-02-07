const standardVertexShader = `
varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const standardFragmentShader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 u_color;
uniform vec3 u_lightPosition;
uniform vec3 u_viewPosition;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

void main() {
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

    vec3 finalColor = ambient + diffuse + specular;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export { standardVertexShader, standardFragmentShader };