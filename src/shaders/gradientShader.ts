const gradientShader = `
varying vec2 vUv;

void main() {
  vec3 color = mix(vec3(0.0), vec3(1.0), vUv.y);
  
}
`;

export default gradientShader;