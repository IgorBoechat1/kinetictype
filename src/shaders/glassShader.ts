const glassShader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform vec3 u_lightPosition;
uniform vec3 u_viewPosition;
uniform float u_soundData;

varying vec3 vPos;
varying vec3 vNormal;

void main(void) {
    vec2 position = (gl_FragCoord.xy / u_resolution.xy) + u_mouse / 4.0;

    float color = 0.0;
    color += sin(position.x * cos(u_time / 15.0) * 80.0) + cos(position.y * cos(u_time / 15.0) * 10.0);
    color += sin(position.y * sin(u_time / 10.0) * 40.0) + cos(position.x * sin(u_time / 25.0) * 40.0);
    color += sin(position.x * sin(u_time / 5.0) * 10.0) + sin(position.y * sin(u_time / 35.0) * 80.0);
    color *= sin(u_time / 10.0) * 0.5;

    vec3 baseColor = vec3(color, color * 0.5, sin(color + u_time / 3.0) * 0.75);

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

    vec3 finalColor = (ambient + diffuse + specular) * baseColor;

    // Increase brightness based on sound data
    finalColor *= 2.5 + u_soundData;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export default glassShader;