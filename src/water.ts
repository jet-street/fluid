/// <reference path="../node_modules/@types/three/index.d.ts" />
/// <reference path="../node_modules/@types/dat-gui/index.d.ts" />


// Set up
const scene = new THREE.Scene()

const fov = 75
const aspect = window.innerWidth / window.innerHeight
const near = 0.1
const far = 1000
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
camera.position.z = -50
camera.position.y = 20

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const clock = new THREE.Clock()

const controls = new THREE.OrbitControls(camera, renderer.domElement)

class Wavefront {
  constructor(public amplitude: number,
              public length: number,
              public steepness: number,
              public direction: THREE.Vector2) {}
}

const wavefronts = [
  new Wavefront(1, 10, 0.3, new THREE.Vector2(1, 1)),
  new Wavefront(1, 10, 1, new THREE.Vector2(0.4, 0.8)),
  new Wavefront(3, 30, 1, new THREE.Vector2(-0.6, 0.3)),
  new Wavefront(3, 30, 1, new THREE.Vector2(-0.6, 0.3)),
  new Wavefront(3, 30, 1, new THREE.Vector2(-0.6, 0.3)),
  new Wavefront(1, 10, 0.3, new THREE.Vector2(1, 1)),
  new Wavefront(1, 10, 1, new THREE.Vector2(0.4, 0.8)),
  new Wavefront(3, 30, 1, new THREE.Vector2(-0.6, 0.3)),
]


// GUI
const gui = new dat.GUI()

wavefronts.forEach((wavefront, index) => {
  const GUIWavefront = {
    ...wavefront,
    direction: vec2ToDeg(wavefront.direction)
  }  

  const folder = gui.addFolder(`Wave ${index + 1}`)

  folder.add(GUIWavefront, 'amplitude')
    .onChange((val: number) => { wavefront.amplitude = val })

  folder.add(GUIWavefront, 'length')
    .onChange((val: number) => { wavefront.length = val })

  folder.add(GUIWavefront, 'steepness').min(0).max(1).step(0.01)
    .onChange((val: number) => { wavefront.steepness = val })

  folder.add(GUIWavefront, 'direction').min(0).max(359)
    .onChange((val: number) => { wavefront.direction = degToVec2(val) })
})

function degToVec2(degree: number): THREE.Vector2 {
  return new THREE.Vector2(Math.cos(THREE.Math.degToRad(degree)),
                           Math.sin(THREE.Math.degToRad(degree)))
}

function vec2ToDeg(vec: THREE.Vector2): number {
  return THREE.Math.radToDeg(Math.atan2(vec.y, vec.x))
}


// Surface
const uniforms = {
  time: {type: 'f', value: 1.0},
  wavefronts: { value: wavefronts }
}
const size = 32
const surface = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(30, 30, size, size),
  new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      #define M_PI 3.1415926535897932384626433832795
      #define NUM_WAVEFRONTS 8

      uniform float time;

      varying vec3 surfaceNormal;
      varying vec3 vertPos;

      struct Wave {
        vec3 position;
        vec3 normal;
      };

      struct Wavefront {
        float amplitude;
        float length;
        float steepness;
        vec2 direction;
      };
      uniform Wavefront wavefronts[NUM_WAVEFRONTS];

      Wave getWave(Wavefront wf) {
        float A = wf.amplitude;
        float L = wf.length;
        float Q = wf.steepness;
        vec2 D = wf.direction;
        float w = 2.0 * M_PI / L; // frequency
        float speed = 1.0;        // phase

        float dotD = dot(position, vec3(D.x, 0.0, D.y));
        float S = sin(w * dotD + time * speed);
        float C = cos(w * dotD + time * speed);

        vec3 wavePosition = vec3(position.x + Q * A * C * D.x,
                                 A * S,
                                 position.z + Q * A * C * D.y);

        vec3 waveNormal = vec3(-D.x * w * A * C,            
                               1.0 - Q * w * A * S,
                               -D.y * w * A * C);

        return Wave(wavePosition, waveNormal);
      }

      Wave sumWaves() {
        Wave sum = Wave(vec3(0.0), vec3(0.0));
        for (int i = 0; i < NUM_WAVEFRONTS; i++) {
          Wave wave = getWave(wavefronts[i]);
          sum.position += wave.position;
          sum.normal += wave.normal;
        }
        return sum;
      }

      void main(){
        Wave combinedWave = sumWaves();
        gl_Position = projectionMatrix * modelViewMatrix
                      * vec4(combinedWave.position, 1.0);
        vec4 vertPos4 = modelViewMatrix * vec4(combinedWave.position, 1.0);
        vertPos = vec3(vertPos4) / vertPos4.w;
        surfaceNormal = vec3(normalMatrix * combinedWave.normal);
      }
    `,
    fragmentShader: `
      varying vec3 surfaceNormal;
      varying vec3 vertPos;

      const vec3 lightPos = vec3(1.0);
      const vec3 diffuseColor = vec3(0.0, 0.0, 1.0);
      const vec3 specularColor = vec3(1.0);

      void main() {
        vec3 normal = normalize(surfaceNormal); 
        vec3 lightDir = normalize(lightPos - vertPos);

        float lambertian = max(dot(lightDir, normal), 0.0);
        float specular = 0.0;

        if (lambertian > 0.0) {
          vec3 halfwayDir = reflect(-lightDir, normal);
          vec3 viewDir = normalize(-vertPos);

          float specAngle = max(dot(halfwayDir, viewDir), 0.0);
          specular = pow(specAngle, 32.0);
        }

        gl_FragColor = vec4(lambertian * diffuseColor
                            + specular * specularColor, 1.0);
      }
    `
  }))
scene.add(surface)
surface.geometry.rotateX(-90 * THREE.Math.DEG2RAD)


// Loop
function main() {
  requestAnimationFrame(main)
  uniforms.time.value = clock.getElapsedTime()
  renderer.render(scene, camera)
}
main()
