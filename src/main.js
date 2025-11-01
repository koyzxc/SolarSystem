import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gsap } from 'gsap'

/* ---------- Scene ---------- */
const scene = new THREE.Scene()

/* ---------- Camera ---------- */
const sizes = { width: window.innerWidth, height: window.innerHeight }
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 8000)
const defaultCamPos = new THREE.Vector3(0, 200, 500)
camera.position.copy(defaultCamPos)
scene.add(camera)

/* ---------- Renderer ---------- */
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#webgl'),
  antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace

/* ---------- Controls ---------- */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

/* ---------- Lights ---------- */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const sunLight = new THREE.PointLight(0xffffff, 3, 8000)
scene.add(sunLight)

/* ---------- Stars (Moving Background) ---------- */
const starGeometry = new THREE.BufferGeometry()
const starCount = 7000
const starPositions = new Float32Array(starCount * 3)
for (let i = 0; i < starCount * 3; i++) {
  starPositions[i] = (Math.random() - 0.5) * 8000
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 })
const stars = new THREE.Points(starGeometry, starMaterial)
scene.add(stars)

/* ---------- Asteroid Belt ---------- */
const asteroidGeometry = new THREE.SphereGeometry(0.8, 8, 8)
const asteroidMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 })
const asteroids = new THREE.Group()
for (let i = 0; i < 300; i++) {
  const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial)
  const angle = Math.random() * Math.PI * 2
  const radius = 230 + Math.random() * 20
  asteroid.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 10, Math.sin(angle) * radius)
  asteroids.add(asteroid)
}
scene.add(asteroids)

/* ---------- Orbit Rings ---------- */
function createOrbit(distance) {
  const orbitGeometry = new THREE.RingGeometry(distance - 1, distance + 1, 128)
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: 0x666666,
    side: THREE.DoubleSide
  })
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial)
  orbit.rotation.x = Math.PI / 2
  scene.add(orbit)
}

/* ---------- Helper: Create Planet ---------- */
function createPlanet(color, size, distance, speed, emissive = 0x000000) {
  const geometry = new THREE.SphereGeometry(size, 64, 64)
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.3,
    metalness: 0.3,
    roughness: 0.7
  })
  const planet = new THREE.Mesh(geometry, material)
  planet.userData = { distance, speed }
  scene.add(planet)
  if (distance > 0) createOrbit(distance)
  return planet
}

/* ---------- Planets ---------- */
const planets = {
  sun: createPlanet(0xFDB813, 40, 0, 0, 0xFDB813),
  mercury: createPlanet(0xB1B1B1, 5, 70, 0.8),
  venus: createPlanet(0xEEDC82, 7, 100, 0.6),
  earth: createPlanet(0x1E90FF, 8, 130, 0.5),
  mars: createPlanet(0xB22222, 6, 160, 0.45),
  jupiter: createPlanet(0xC48E5C, 20, 210, 0.3),
  saturn: createPlanet(0xD8C078, 18, 270, 0.25),
  uranus: createPlanet(0xAFEEEE, 14, 330, 0.2),
  neptune: createPlanet(0x355CFF, 14, 400, 0.18)
}

/* ---------- Saturn Rings ---------- */
const ringGeometry = new THREE.RingGeometry(20, 30, 64)
const ringMaterial = new THREE.MeshStandardMaterial({
  color: 0xD8C078,
  side: THREE.DoubleSide,
  emissive: 0xD8C078,
  emissiveIntensity: 0.2
})
const saturnRings = new THREE.Mesh(ringGeometry, ringMaterial)
saturnRings.rotation.x = Math.PI / 3
planets.saturn.add(saturnRings)

/* ---------- Animation ---------- */
const clock = new THREE.Clock()
let followTarget = null
let overview = true

function animate() {
  const elapsed = clock.getElapsedTime()

  // Stars movement
  stars.rotation.y += 0.0003
  stars.rotation.x += 0.0001

  // Asteroid rotation
  asteroids.rotation.y += 0.0008

  sunLight.position.copy(planets.sun.position)

  // Orbit planets
  for (const name in planets) {
    const planet = planets[name]
    const { distance, speed } = planet.userData
    if (distance > 0) {
      planet.position.x = Math.cos(elapsed * speed) * distance
      planet.position.z = Math.sin(elapsed * speed) * distance
      planet.rotation.y += 0.01
    }
  }

  // Follow mode
  if (followTarget && !overview) {
    const planet = planets[followTarget]
    if (planet) {
      const desiredPos = new THREE.Vector3(planet.position.x + 50, planet.position.y + 30, planet.position.z + 70)
      camera.position.lerp(desiredPos, 0.02)
      controls.target.lerp(planet.position, 0.05)
    }
  } else if (overview) {
    camera.position.lerp(defaultCamPos, 0.05)
    controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.05)
  }

  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate()

/* ---------- Buttons ---------- */
document.querySelectorAll('.controls button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const planetName = btn.getAttribute('data-planet')
    if (followTarget === planetName && !overview) {
      // Toggle back to overview
      overview = true
      followTarget = null
    } else {
      followTarget = planetName
      overview = false
    }
  })
})

/* ---------- Resize ---------- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
