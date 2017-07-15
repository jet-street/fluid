/// <reference path="../node_modules/@types/three/index.d.ts" />


// Set up
const scene = new THREE.Scene()

const fov = 75
const aspect = window.innerWidth / window.innerHeight
const near = 0.1
const far = 1000
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

camera.position.z = -50
camera.position.y = 20

// Controls
const controls = new THREE.OrbitControls( camera, renderer.domElement );

// Lights
const lights = [];
lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 )
lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 )
lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 )
lights[ 0 ].position.set( 0, 200, 0 )
lights[ 1 ].position.set( 100, 200, 100 )
lights[ 2 ].position.set( - 100, - 200, - 100 )
scene.add( lights[ 0 ] )
scene.add( lights[ 1 ] )
scene.add( lights[ 2 ] )

// Loop
function main() {
  requestAnimationFrame(main)
  renderer.render(scene, camera)
}
main()

// ============= Water 

let deltaT = 1 // todo
let speed = 1

let A = 5               // amplitude
let L = 50              // length
let w = 2 * Math.PI / L // frequency
let Q = 0.5             // steepness

function wave(P0: THREE.Vector3, direction: THREE.Vector2): THREE.Vector3 {

  const w = 2 * Math.PI / L // frequency
  const dotD = P0.dot(new THREE.Vector3(direction.x, 0, direction.y))
  const C = Math.cos(w * dotD + deltaT * speed)
  const S = Math.sin(w * dotD + deltaT * speed)

  return new THREE.Vector3(P0.x + Q * A * C * direction.x,
                           A * S,
                           P0.z + Q * A * C * direction.y)
}

// Surface
const size = 32
const surface = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30, size, size),
  new THREE.MeshPhongMaterial({
    color: 0x156289,
    emissive: 0x072534,
    side: THREE.DoubleSide,
    shading: THREE.FlatShading
  }))
scene.add(surface)
surface.geometry.rotateX(90 * THREE.Math.DEG2RAD)

// Update vertices
function updateVertices() {
  const d = new THREE.Vector2(1, 1)
  const surfaceGeometry = <THREE.Geometry> surface.geometry
  surfaceGeometry.vertices.forEach((vertex) => {
    const w = wave(vertex, d)
    vertex.set(w.x, w.y, w.z)
  })
  surfaceGeometry.verticesNeedUpdate = true  
}

updateVertices()
