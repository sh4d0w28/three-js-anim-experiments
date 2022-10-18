import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Quaternion, Vec3 } from 'cannon-es';
import * as THREE from 'three'
require('./KeyboardState')


import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader'

/**
 * Really basic example to show cannon.js integration
 * with three.js.
 * Each frame the cannon.js world is stepped forward and then
 * the position and rotation data of the boody is copied
 * over to the three.js scene.
 */


// three.js variables
let camera, scene, renderer
// cannon.js variables
let world
let modelReady = false
let mixer
let animationAction

let animactions = []


let keyboard = new KeyboardState();
let clock = new THREE.Clock();

let player = {};

let physicsObjects = [];

let lion = {};

initThree()
initCannon()
addObjects();
animate()

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

  
function initCannon() {
    world = new CANNON.World({gravity: new CANNON.Vec3(0, 0, -2) })
}

function initThree() {
  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100)
  camera.position.z = 10
  camera.position.x = 0
  camera.position.y = -10
  camera.lookAt(0,0,0);
  // Scene
  scene = new THREE.Scene()
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)
  window.addEventListener('resize', onWindowResize) 

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 1, 0)
}

function addObjects() {
  const loader = new FBXLoader();
  loader.setCrossOrigin("anonymous");
  loader.load( '../fbx/ion.fbx', function ( object ) {
    object.scale.set(.005, .005, .005);
    //object.rotateZ(Math.PI/2);
    mixer = new THREE.AnimationMixer(object)
    // debugger;
    animactions.push(mixer.clipAction(object.animations[8]));
    animactions.push(mixer.clipAction(object.animations[3]));

    lion = object;
    scene.add( lion );
    modelReady = true;
    animactions[0].play()

    const lionShape = new CANNON.Sphere(1);
    let lionBody = new CANNON.Body({mass:1, angularFactor:new Vec3(0,0,1)});
    lionBody.addShape(lionShape)
    lionBody.position.set(0,0,10);
    world.addBody(lionBody);
    player = lionBody;
    physicsObjects.push({three: lion, cannon:lionBody});

  }, undefined, function ( error ) {
    console.error( error );
  });

  const hemilight = new THREE.HemisphereLight({skyColor: 0xfefefe});
  scene.add(hemilight);

  createStaticBox(10,10,0.5,0,0,0);
  createStaticBox(10,0.5,3,0,5,2);
  createStaticBox(10,0.5,3,0,-5,2);
  createStaticBox(0.5,10,3,5,0,2);
  createStaticBox(0.5,10,3,-5,0,2);
}


function animate() {
  requestAnimationFrame(animate)
  // Step the physics world
  world.fixedStep()
  syncPhysicsObjects()

  if (modelReady) mixer.update(clock.getDelta())
//   camera.lookAt(player.position);

  // Render three.js
  renderer.render(scene, camera)

  if ( keyboard.pressed("D") ) {
    player.force = new Vec3(9,0,0);
  }
  if ( keyboard.pressed("A") ) {
    player.force = new Vec3(-9,0,0);
  }
  if ( keyboard.pressed("W") )  {
    animactions[0].stop();
    animactions[1].play();
    player.force = new Vec3(0,9,0);
  }
  if ( keyboard.pressed("S") )  {
    player.force = new Vec3(0,-9,0);
  }
  
  if(keyboard.up("W")) {
    animactions[0].play();
    animactions[1].stop()
  }

  keyboard.update()
}

function syncPhysicsObjects() {
    physicsObjects.forEach((po) => {
        try {
          po.three.position.copy(po.cannon.position);
          po.three.quaternion.copy(po.cannon.quaternion);
        } catch (e) {
          console.error(po);
          debugger;
        }
    });
}

function createStaticBox(gx,gy,gz,x,y,z) {
  const material = new THREE.MeshPhongMaterial({ color: 0x333333, wireframe: true });
  const geometry = new THREE.BoxGeometry(gx,gy,gz);
  let mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  let cannonShape = new CANNON.Box(new CANNON.Vec3(gx,gy,gz));
  let cannonBody = new CANNON.Body({mass:0});
  cannonBody.addShape(cannonShape);
  cannonBody.position.set(x,y,z);
  world.addBody(cannonBody);

  physicsObjects.push({three: mesh, cannon:cannonBody});
}