/// <reference path="../node_modules/@types/three/index.d.ts" />
/// <reference path="../node_modules/@types/dat-gui/index.d.ts" />
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
// Set up
var scene = new THREE.Scene();
var fov = 75;
var aspect = window.innerWidth / window.innerHeight;
var near = 0.1;
var far = 2500;
var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.x = 300;
camera.position.y = 100;
camera.position.z = 400;
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var clock = new THREE.Clock();
var controls = new THREE.OrbitControls(camera, renderer.domElement);
var Wavefront = (function () {
    function Wavefront(amplitudeOverLength, length, steepness, speed, direction) {
        if (amplitudeOverLength === void 0) { amplitudeOverLength = 0; }
        if (length === void 0) { length = 1; }
        if (steepness === void 0) { steepness = 0.5; }
        if (speed === void 0) { speed = 1.0; }
        if (direction === void 0) { direction = degToVec2(0); }
        this.amplitudeOverLength = amplitudeOverLength;
        this.length = length;
        this.steepness = steepness;
        this.speed = speed;
        this.direction = direction;
    }
    return Wavefront;
}());
var wavefronts = [
    new Wavefront(0.1, 10, 0, 0.3, degToVec2(0)),
    new Wavefront(0.1, 20, 0, 0.4, degToVec2(45)),
    new Wavefront(0.1, 15, 0, 0.2, degToVec2(13)),
    new Wavefront(0.074, 4, 0.87, -0.26, degToVec2(25)),
    new Wavefront(0.09, 9, 0.73, -0.55, degToVec2(17)),
    new Wavefront(0.15, 6, 0.77, -0.79, degToVec2(50)),
    new Wavefront(0.07, 8, 0.87, -0.16, degToVec2(53)),
    new Wavefront(0.08, 6, 0.97, -0.7, degToVec2(37)),
];
// Boat
var loader = new THREE.ObjectLoader();
loader.load('../assets/ship.json', function (obj) {
    var boat = obj;
    scene.add(boat);
    boat.scale.x = boat.scale.y = boat.scale.z = 10;
});
var directionalLight = new THREE.DirectionalLight();
scene.add(directionalLight);
directionalLight.position.z = -500;
directionalLight.position.y = 300;
// GUI
var gui = new dat.GUI();
wavefronts.forEach(function (wavefront, index) {
    var GUIWavefront = __assign({}, wavefront, { direction: vec2ToDeg(wavefront.direction) });
    var folder = gui.addFolder("Wave " + (index + 1));
    folder.add(GUIWavefront, 'amplitudeOverLength').min(0).max(0.5).step(0.1)
        .onChange(function (val) { wavefront.amplitudeOverLength = val; });
    folder.add(GUIWavefront, 'length').min(1)
        .onChange(function (val) { wavefront.length = val; });
    folder.add(GUIWavefront, 'steepness').min(0).max(1).step(0.01)
        .onChange(function (val) { wavefront.steepness = val; });
    folder.add(GUIWavefront, 'speed').step(0.1)
        .onChange(function (val) { wavefront.speed = val; });
    folder.add(GUIWavefront, 'direction').min(0).max(359)
        .onChange(function (val) { wavefront.direction = degToVec2(val); });
});
function degToVec2(degree) {
    return new THREE.Vector2(Math.cos(THREE.Math.degToRad(degree)), Math.sin(THREE.Math.degToRad(degree)));
}
function vec2ToDeg(vec) {
    return THREE.Math.radToDeg(Math.atan2(vec.y, vec.x));
}
// Surface
var uniforms = {
    time: { type: 'f', value: 1.0 },
    wavefronts: { value: wavefronts }
};
var size = 256;
var surface = new THREE.Mesh(new THREE.PlaneBufferGeometry(30, 30, size, size), new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: "\n      #define M_PI 3.1415926535897932384626433832795\n      #define NUM_WAVEFRONTS 8\n      #define NUM_LF_WAVEFRONTS 3\n      #define NUM_HF_WAVEFRONTS 5\n\n      uniform float time;\n\n      varying vec3 surfaceNormal;\n      varying vec3 vertPos;\n\n      struct Wave {\n        vec3 position;\n        vec3 normal;\n      };\n\n      struct Wavefront {\n        float amplitudeOverLength;\n        float length;\n        float steepness;\n        float speed;\n        vec2 direction;\n      };\n      uniform Wavefront wavefronts[NUM_WAVEFRONTS];\n\n      Wave getWave(Wavefront wf, vec3 basePosition) {\n        float A = wf.amplitudeOverLength * wf.length;\n        float L = wf.length;\n        float w = 2.0 * M_PI / L; // frequency\n        float Q = A == 0.0 ? wf.steepness : wf.steepness / (w * A);\n        vec2 D = wf.direction;\n        float speed = wf.speed;   // phase\n\n        float dotD = dot(basePosition, vec3(D.x, 0.0, D.y));\n        float S = sin(w * dotD + time * speed);\n        float C = cos(w * dotD + time * speed);\n\n        vec3 wavePosition = vec3(basePosition.x + Q * A * C * D.x,\n                                 A * S,\n                                 basePosition.z + Q * A * C * D.y);\n\n        vec3 waveNormal = vec3(-D.x * w * A * C,            \n                               1.0 - Q * w * A * S,\n                               -D.y * w * A * C);\n\n        return Wave(wavePosition, waveNormal);\n      }\n\n      Wave sumWaves() {\n        Wave lowFrequencySum = Wave(vec3(0.0), vec3(0.0));\n        Wave highFrequencySum = Wave(vec3(0.0), vec3(0.0));\n\n        for (int i = 0; i < NUM_LF_WAVEFRONTS; i++) {\n          Wave wave = getWave(wavefronts[i], position);\n          lowFrequencySum.position += wave.position;\n          lowFrequencySum.normal += wave.normal;\n        }\n\n        for (int i = NUM_LF_WAVEFRONTS; i < NUM_WAVEFRONTS; i++) {\n          Wave wave = getWave(wavefronts[i], lowFrequencySum.position);\n          highFrequencySum.position += wave.position;\n          highFrequencySum.normal += wave.normal;\n        }\n\n        return Wave(lowFrequencySum.position + highFrequencySum.position,\n                    lowFrequencySum.normal + highFrequencySum.normal);\n      }\n\n      void main(){\n        Wave combinedWave = sumWaves();\n        gl_Position = projectionMatrix * modelViewMatrix\n                      * vec4(combinedWave.position, 1.0);\n        vertPos = vec3(modelMatrix * vec4(combinedWave.position, 1.0));\n        surfaceNormal = vec3(modelMatrix * vec4(combinedWave.normal, 1.0));\n      }\n    ",
    fragmentShader: "\n      varying vec3 surfaceNormal;\n      varying vec3 vertPos;\n\n      const vec3 lightPos = vec3(0.0, 300.0, -500.0);\n      const vec3 diffuseColor = vec3(0.05, 0.3, 0.6);\n      const vec3 ambientColor = vec3(0.04, 0.0, 0.0);\n      const vec3 specularColor = vec3(1.0, 0.66, 0.33) * 3.0;\n\n      void main() {\n        vec3 normal = normalize(surfaceNormal); \n        vec3 lightDir = normalize(lightPos - vertPos);\n\n        float lambertian = max(dot(lightDir, normal), 0.0);\n        float specular = 0.0;\n\n        if (lambertian > 0.0) {\n          vec3 halfwayDir = reflect(-lightDir, normal);\n          vec3 viewDir = normalize(cameraPosition - vertPos);\n\n          float specAngle = max(dot(halfwayDir, viewDir), 0.0);\n          specular = pow(specAngle, 32.0);\n        }\n\n        gl_FragColor = vec4(lambertian * diffuseColor\n                            + ambientColor\n                            + specular * specularColor, 1.0);\n      }\n    "
}));
scene.add(surface);
surface.geometry.rotateX(-90 * THREE.Math.DEG2RAD);
// Loop
function main() {
    requestAnimationFrame(main);
    uniforms.time.value = clock.getElapsedTime();
    renderer.render(scene, camera);
}
main();
