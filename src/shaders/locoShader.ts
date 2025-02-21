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
  uniform vec3 uLightPosition;
  uniform samplerCube uEnvMap;
  uniform float uAudioData; // Add uniform for audio data
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  float fresnelEffect(vec3 normal, vec3 viewDir, float power) {
    return pow(1.0 - dot(viewDir, normal), power);
  }

  vec3 spectralColor(float wavelength) {
    float gamma = 0.8;
    float intensityMax = 1.0;
    vec3 color = vec3(0.0);

    if (wavelength >= 380.0 && wavelength < 440.0) {
      color.r = -(wavelength - 440.0) / (440.0 - 380.0);
      color.b = 1.0;
    } else if (wavelength >= 440.0 && wavelength < 490.0) {
      color.g = (wavelength - 440.0) / (490.0 - 440.0);
      color.b = 1.0;
    } else if (wavelength >= 490.0 && wavelength < 510.0) {
      color.g = 1.0;
      color.b = -(wavelength - 510.0) / (510.0 - 490.0);
    } else if (wavelength >= 510.0 && wavelength < 580.0) {
      color.r = (wavelength - 510.0) / (580.0 - 510.0);
      color.g = 1.0;
    } else if (wavelength >= 580.0 && wavelength < 645.0) {
      color.r = 1.0;
      color.g = -(wavelength - 645.0) / (645.0 - 580.0);
    } else if (wavelength >= 645.0 && wavelength <= 780.0) {
      color.r = 1.0;
    }

    float factor = 0.0;
    if (wavelength >= 380.0 && wavelength < 420.0) {
      factor = 0.3 + 0.7 * (wavelength - 380.0) / (420.0 - 380.0);
    } else if (wavelength >= 420.0 && wavelength < 645.0) {
      factor = 1.0;
    } else if (wavelength >= 645.0 && wavelength <= 780.0) {
      factor = 0.3 + 0.7 * (780.0 - wavelength) / (780.0 - 645.0);
    }

    color.r = pow(color.r * factor, gamma);
    color.g = pow(color.g * factor, gamma);
    color.b = pow(color.b * factor, gamma);

    return color * intensityMax;
  }

  vec3 iridescenceEffect(vec3 normal, vec3 viewDir, float time) {
    float angle = dot(normal, viewDir);
    float wavelength = 380.0 + 400.0 * pow(1.0 - angle, 2.0); // Adjusted to enhance color visibility
    return spectralColor(wavelength);
  }

  vec3 specularHighlight(vec3 normal, vec3 viewDir, vec3 lightDir, float shininess) {
    vec3 halfVector = normalize(viewDir + lightDir);
    float spec = pow(max(dot(normal, halfVector), 0.0), shininess);
    return vec3(1.0) * spec;
  }

  // Simplex noise function for random movements
  vec3 randomMovement(float time, float audioData) {
    return vec3(
      sin(time * 0.5 + audioData) * 12.0 + cos(time * 0.3 + audioData) * 1.0,
      cos(time * 0.5 + audioData) * 21.0 + sin(time * 0.3 + audioData) * 1.0,
      sin(time * 0.5 + 1.0 + audioData) * 12.0 + cos(time * 0.3 + 1.0 + audioData) * 1.0
    );
  }

  // Function to create Newton rings
  float newtonRings(vec2 uv, float time, float audioData) {
    float dist = length(uv - vec2(0.5));
    float rings = sin(dist * 500.0 - time * 2.0 + audioData * 12.0) * 0.5 + 2.5;
    return rings;
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 lightDir = normalize(uLightPosition - vPosition);
    
    // Animate the fresnel light around the shape with audio data
    vec3 animatedLightPos = uLightPosition + randomMovement(uTime, uAudioData);
    vec3 animatedLightDir = normalize(animatedLightPos - vPosition);

    float fresnel = fresnelEffect(normal, viewDir, 2.0);
    vec3 iridescence = iridescenceEffect(normal, viewDir, uTime);
    vec3 specular = specularHighlight(normal, viewDir, animatedLightDir, 32.0);
    
    // Reflection
    vec3 reflectedDir = reflect(viewDir, normal);
    vec3 reflection = textureCube(uEnvMap, reflectedDir).rgb;

    // Newton rings effect
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float rings = newtonRings(uv, uTime, uAudioData);
    
    // Combine effects
    vec3 color = mix(vec3(0.1, 0.1, 0.1), iridescence, fresnel) + specular + reflection * fresnel;
    color *= rings; // Apply Newton rings effect
    gl_FragColor = vec4(color, 1.0);
  }
`;