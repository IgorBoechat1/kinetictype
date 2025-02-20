export const mirrorVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const mirrorFragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - dot(viewDir, normal), 3.0);
    vec3 iridescentColor = vec3(0.5 + 0.5 * sin(uTime + normal.x * 10.0), 0.5 + 0.5 * sin(uTime + normal.y * 10.0), 0.5 + 0.5 * sin(uTime + normal.z * 10.0));
    gl_FragColor = vec4(iridescentColor * fresnel, 1.0);
  }
`;