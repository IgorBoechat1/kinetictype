const vertexShader = `
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

export default vertexShader;