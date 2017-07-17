/// <reference path="../node_modules/@types/three/index.d.ts" />


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


// Surface
const uniforms = {
  time: {type: 'f', value: 1.0}
}
const size = 32
const surface = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30, size, size),
  new THREE.ShaderMaterial({
    vertexShader: `
      #define M_PI 3.1415926535897932384626433832795

      uniform float time;

      vec3 wave() {
        float A = 1.0;            // amplitude
        float L = 10.0;           // length
        float w = 2.0 * M_PI / L; // frequency
        float Q = 0.5;            // steepness
        vec2 D = vec2(1.0, 1.0);  // direction

        float speed = 1.0;

        float dotD = dot(position, vec3(D, 1.0));
        float C = cos(w * dotD + time * speed);
        float S = sin(w * dotD + time * speed);

        return vec3(position.x + Q * A * C * D.x,
                    A * S,
                    position.z + Q * A * C * D.y);
      }

      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(wave(), 1.0);
      }
    `,
    uniforms: uniforms
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
