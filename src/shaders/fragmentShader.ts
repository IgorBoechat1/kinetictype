const fragmentShader = `
varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_lightPosition;
uniform vec3 u_viewPosition;
uniform float u_soundData;

vec3 spectral_colour(float l) {
    float r = 0.0, g = 0.0, b = 0.0;
    if ((l >= 400.0) && (l < 410.0)) { float t = (l - 400.0) / (410.0 - 400.0); r = +(0.33 * t) - (0.20 * t * t); }
    else if ((l >= 410.0) && (l < 475.0)) { float t = (l - 410.0) / (475.0 - 410.0); r = 0.14 - (0.13 * t * t); }
    else if ((l >= 545.0) && (l < 595.0)) { float t = (l - 545.0) / (595.0 - 545.0); r = +(1.98 * t) - (t * t); }
    else if ((l >= 595.0) && (l < 650.0)) { float t = (l - 595.0) / (650.0 - 595.0); r = 0.98 + (0.06 * t) - (0.40 * t * t); }
    else if ((l >= 650.0) && (l < 700.0)) { float t = (l - 650.0) / (700.0 - 650.0); r = 0.65 - (0.84 * t) + (0.20 * t * t); }
    if ((l >= 415.0) && (l < 475.0)) { float t = (l - 415.0) / (475.0 - 415.0); g = +(0.80 * t * t); }
    else if ((l >= 475.0) && (l < 590.0)) { float t = (l - 475.0) / (590.0 - 475.0); g = 0.8 + (0.76 * t) - (0.80 * t * t); }
    else if ((l >= 585.0) && (l < 639.0)) { float t = (l - 585.0) / (639.0 - 585.0); g = 0.82 - (0.80 * t); }
    if ((l >= 400.0) && (l < 475.0)) { float t = (l - 400.0) / (475.0 - 400.0); b = +(2.20 * t) - (1.50 * t * t); }
    else if ((l >= 475.0) && (l < 560.0)) { float t = (l - 475.0) / (560.0 - 475.0); b = 0.7 - (t) + (0.30 * t * t); }
    return vec3(r, g, b);
}

// Function to generate pseudo-random value based on fragment position
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec2 p = (2.0 * vUv - 1.0) * 2.0;

    // Generate a random factor based on the fragment's position
    float randFactor = random(vUv) * 5.0;

    for (int i = 0; i < 8; i++) {
        vec2 newp = vec2(
            p.y + cos(p.x + u_time + randFactor) - sin(p.y * cos((u_time + randFactor) * 0.2)),
            p.x - sin(p.y - u_time - randFactor) - cos(p.x * sin((u_time - randFactor) * 0.3))
        );
        p = newp;
    }

    vec3 color = spectral_colour(p.y * 50.0 + 500.0 + sin(u_time * 0.6));

    // Calculate basic lighting
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(u_lightPosition - vPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * u_color;

    vec3 viewDir = normalize(u_viewPosition - vPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = vec3(0.5) * spec;

    vec3 ambient = vec3(0.6) * u_color;

    vec3 finalColor = (ambient + diffuse + specular) * color;

    // Increase brightness
    finalColor *= 4.5;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export default fragmentShader;