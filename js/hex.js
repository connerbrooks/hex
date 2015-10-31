// Setup three.js WebGL renderer
var renderer = new THREE.WebGLRenderer( { antialias: true } );


// Append the canvas element created by the renderer to document body element.
document.body.appendChild( renderer.domElement );

var t = THREE;

var vr = false;

var clock = new THREE.Clock();

//Create a three.js scene
var scene = new THREE.Scene();

//Create a three.js camera
if (vr)
  var camera = new THREE.PerspectiveCamera( 110, window.innerWidth / window.innerHeight, 2, 10000 );
else
  var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 2, 10000 );
scene.add(camera);

camera.position.set(80, 100, 150);
camera.rotation.x = -45 * Math.PI / 180;

//Apply VR headset positional data to camera.
var controls = new THREE.VRControls( camera );

//Apply VR stereo rendering to renderer
if (vr) {
  var effect = new THREE.VREffect( renderer );
  effect.setSize( window.innerWidth, window.innerHeight );
}
else {
  renderer.setSize( window.innerWidth, window.innerHeight );
}

/*
Hex game
*/

/*
Create, position, and add 3d objects
*/
var geometry = new THREE.DodecahedronGeometry(10, 0);
var material = new THREE.MeshBasicMaterial({wireframe: true, color: 0xFF4081 });
material.side = THREE.DoubleSide;
var dodecahedron = new THREE.Mesh( geometry, material );
dodecahedron.position.z = 60;
dodecahedron.position.y = 20;
scene.add(dodecahedron);


var floor = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1000, 1000, 1, 1 ), new THREE.MeshBasicMaterial( { color: 0x222222, side: THREE.DoubleSide } ) );
floor.rotation.x = Math.PI/2;
floor.position.y = -50;
scene.add( floor );

var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight.position.set( 0, 10, 0 );
scene.add( directionalLight );

/*
board creation
*/
var boardSize = 14,
    hexSize = 4,
    startLoc = new t.Vector3(0,0,0);
var hex = [],
    hexOutlines = [];

for(var i = 0; i < boardSize; i++) {
  for(var j = 0; j < boardSize; j++){
    // add hexagons

    cgeo = new t.CylinderGeometry(hexSize, hexSize, 3, 6);
    cmat = new t.MeshBasicMaterial({color: 0x666666});
    cmatout = new t.MeshBasicMaterial({color: 0x000, wireframe: true, wireframeLinewidth: 2, transparent: true});

    // add hexagons and outlines
    hex[i * boardSize + j] = new t.Mesh(cgeo, cmat);
    hexOutlines[i * boardSize + j] = new t.Mesh(cgeo, cmatout);

    // set props
    hex[i * boardSize + j].played = false;
    hexOutlines[i * boardSize + j].hover = false;

    // place pieces in a rhombus grid
    hexRad = hexSize * 2;

    hex[i * boardSize + j].position.set(
      (i * hexSize) + j * hexRad - startLoc.x,
      startLoc.y,
      i * hexRad - startLoc.z
    );
    hexOutlines[i * boardSize + j].position.set(
      (i * hexSize) + j * hexRad - startLoc.x,
      startLoc.y,
      i * hexRad - startLoc.z
    );

    scene.add( hex[i * boardSize + j] );
    scene.add( hexOutlines[i * boardSize + j] );
  }
}



var currentPlayer = true;


var raycaster = new THREE.Raycaster();
var raycaster1 = new THREE.Raycaster();
var mouse = new THREE.Vector2();

function onMouseClick( event ) {
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects( scene.children );


  if (intersects[ 0 ].object.material.color) { // get first object intersected (hex tile)
      obj = intersects[ 0 ].object;

      if (hex.indexOf(obj) !== -1) {       // check if this is a hex piece
        if (!obj.played) {
          if (currentPlayer) {        // first player
        		intersects[ 0 ].object.material.color.set( 0xFF4081 );
            dodecahedron.material.color.set( 0xC6FF00 ); // play indicator
          }
          else { // second player
        		intersects[ 0 ].object.material.color.set( 0xC6FF00 );
            dodecahedron.material.color.set( 0xFF4081 ); // play indicator
          }

          // play nice sounds
          /*
          var sine1 = T("sin", {freq:330, mul:0.5});
          var sine2 = T("sin", {freq:40, mul:0.5});
          T("phaser", {r:200}, sine1, sine2).on("ended", function() {
            this.pause();
          }).bang().play();
          */

          currentPlayer = !currentPlayer; // change player
          obj.played = true; // set value
        }
      }
    }
  }

function onMouseMove( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

window.addEventListener( 'mousemove', onMouseMove, false);
window.addEventListener( 'mousedown', onMouseClick, false );


/*
Request animation frame loop function
*/
function animate() {
  // Apply any desired changes for the next frame. In this case, we rotate our object.
  dodecahedron.rotation.x += 0.01;
  dodecahedron.rotation.y += 0.005;

  /*
    highlight and play tone
  */
  if (vr)
    mouse = new t.Vector2(0, 0); // if vr use center of screen as point
  raycaster1.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	var intersects = raycaster1.intersectObjects( scene.children );

  for ( var i = 0; i < intersects.length; i++ ) {
    obj = intersects[ i ].object;
    if (obj.material.color && i === 1 && hexOutlines.indexOf(obj) !== -1 ) {
  		obj.material.color.set( 0x44ffff );
      idx = hexOutlines.indexOf(obj);


      setTimeout(function(o) {
    		o.material.color.set( 0x000 );
      }, 100, obj);
    }
	}


  //Update VR headset position and apply to camera.
  if (vr)
    controls.update();

  var delta = clock.getDelta(),
			time = clock.getElapsedTime() * 10;
  //controls.update( delta );

  // Render the scene through the VREffect.
  if (vr)
    effect.render( scene, camera );
  else
    renderer.render( scene, camera );
  requestAnimationFrame( animate );
}

animate();	// Kick off animation loop

/*
Listen for double click event to enter full-screen mode.
We listen for single click because that works best for mobile for now
*/
document.body.addEventListener( 'dblclick', function(){
  effect.setFullScreen( true );
})

/*
Listen for keyboard events
*/
function onkey(event) {
  event.preventDefault();

  if (event.keyCode == 90) { // z
    controls.resetSensor(); //zero rotation
  } else if (event.keyCode == 70 || event.keyCode == 13) { //f or enter
    effect.setFullScreen(true) //fullscreen
  }
  else if(event.keyCode == 87) // w
    camera.position.z -= 0.8;
  else if(event.keyCode == 83) // s
    camera.position.z += 0.8;
  else if(event.keyCode == 65) // a
    camera.position.x -= 0.8;
  else if(event.keyCode == 68) // d
    camera.position.x += 0.8;
};
window.addEventListener("keydown", onkey, true);

/*
Handle window resizes
*/
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  if (vr)
    effect.setSize( window.innerWidth, window.innerHeight );
  else
    renderer.setSize( window.innerWidth, window.innerHeight );
}
window.addEventListener( 'resize', onWindowResize, false );
