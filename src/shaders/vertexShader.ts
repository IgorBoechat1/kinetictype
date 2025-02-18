const vertexShader = `
uniform float u_time;
uniform float u_scalingIntensity;
uniform float u_waveIntensity;
uniform float u_fragmentationIntensity;
uniform float u_displacementIntensity;
uniform float u_rotationIntensity;
uniform float u_soundData;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;

void main() {
  vUv = uv;
  vNormal = normal;
  vPos = (modelViewMatrix * vec4(position, 1.0)).xyz;

  vec3 newPosition = position;

  // Apply sound data to position
  newPosition.x += sin(position.y * 10.0 + u_time * 5.0) * u_soundData * u_displacementIntensity;
  newPosition.y += cos(position.x * 10.0 + u_time * 5.0) * u_soundData * u_waveIntensity;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

export default vertexShader;