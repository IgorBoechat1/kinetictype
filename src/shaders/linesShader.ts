const glassShader = `
varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_lightPosition;
uniform vec3 u_viewPosition;
uniform float u_soundData;
uniform vec2 u_resolution;

#define t u_time
#define r u_resolution.xy

void main() {
    vec3 c;
    float l, z = t;
    vec2 fragCoord = vUv * u_resolution;

    for (int i = 0; i < 3; i++) {
        vec2 uv, p = fragCoord.xy / r;
        uv = p;
        p -= 0.5;
        p.x *= r.x / r.y;
        z += 0.07;
        l = length(p);
        uv += p / l * (sin(z) + 1.0) * abs(sin(l * 9.0 - z - z));
        c[i] = 0.01 / length(mod(uv, 1.0) - 0.5);
    }

    vec3 color = c / l;

    // Calculate basic lighting
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(u_lightPosition - vPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * u_color;

    vec3 viewDir = normalize(u_viewPosition - vPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = vec3(0.5) * spec;

    vec3 ambient = vec3(0.4) * u_color;

    vec3 finalColor = (ambient + diffuse + specular) * color;

    // Increase brightness
    finalColor *= 4.5;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export default glassShader;