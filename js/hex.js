var t = THREE;
var vr = false;

/*
 * General Setup
 */

// Setup three.js WebGL renderer
var renderer = new t.WebGLRenderer( { antialias: true } );
document.body.appendChild( renderer.domElement );

// setup button click events
var restartBtn = document.getElementById('restartBtn');
var toggleVRBtn = document.getElementById('toggleVR');
var toggleAI = document.getElementById('toggleAI');
restartBtn.onclick = function(e) { restartGame() };
toggleVRBtn.onclick = function(e) {
  toggleVR();
};
toggleAI.onclick = function(e) {
  isAI = toggleAI.checked;
  hexWorker.postMessage({cmd: 'ai_toggle', isAI: isAI});
};

//Create a three.js scene
var scene = new t.Scene();

//Create a three.js camera
var camera = new t.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 2, 10000 );
scene.add(camera);

camera.position.set(100, 100, 150);
camera.rotation.x = -45 * Math.PI / 180;

//Apply VR headset positional data to camera.
var controls = new t.VRControls( camera );
var orbit = new THREE.OrbitControls(camera, renderer.domElement);

//Apply VR stereo rendering to renderer
var effect = new t.VREffect( renderer );
effect.setSize( window.innerWidth, window.innerHeight );
renderer.setSize( window.innerWidth, window.innerHeight );

/*
 * Hex game
 */
var boardSize = 14,
    hexSize = 4;
var hexRad = hexSize * 2;
var startLoc = new t.Vector3(0,0,0);

// ai values
var isAI = true;
var aiTurn = false;

var currentPlayer = false; // 2 player only false - p1, true - p2

var playerColor1 = 0xFF4081;
var playerColor2 = 0xC6FF00;

var hex = [],
    hexOutlines = [];

var raycaster = new t.Raycaster(),
    outlineRaycaster = new t.Raycaster();
var mouse = new t.Vector2();


// set center of orbit
orbit.target = new t.Vector3(
  (boardSize/2 * hexSize) + boardSize/2 * hexRad - startLoc.x,
  startLoc.y,
  boardSize/2 * hexRad - startLoc.z
);

/*
web worker init
*/
var hexWorker = new Worker('js/hexworker.js');
hexWorker.onmessage = function(e) {
    var data = e.data;
    console.log('worker said ' + data);
    switch(data.cmd) {
      case 'aiplay':
        // todo show AIs move
        aiTurn = true;
        var obj = hex[data.x * boardSize + data.y]
        if (obj && !obj.played) {
      		obj.material.color.set( currentPlayer ?  playerColor2 : playerColor1 ); // set player color
          dodecahedron.material.color.set( currentPlayer ? playerColor1 : playerColor2 ); // play indicator
          obj.played = true;

          currentPlayer = !currentPlayer;
          aiTurn = false;
        } else {
          hexWorker.postMessage({cmd: 'aiplay'});
        }
        break;
    }
};
hexWorker.postMessage({cmd: 'start', boardSize: boardSize, isAI: isAI});

/*
player indicator, floor, and light
*/
var geometry = new t.DodecahedronGeometry(10, 0);
var material = new t.MeshBasicMaterial({wireframe: true, color: 0xFF4081, side: t.DoubleSide });
var dodecahedron = new t.Mesh( geometry, material );
dodecahedron.position.set((boardSize * hexRad), 30, 0);

scene.add(dodecahedron);

var floor = new t.Mesh(
                  new t.PlaneBufferGeometry( 1000, 1000, 1, 1 ),
                  new t.MeshBasicMaterial( {
                          color: 0x222222,
                          side: t.DoubleSide
                        })
                      );
floor.rotation.x = Math.PI/2;
floor.position.y = -50;
scene.add( floor );

var directionalLight = new t.DirectionalLight( 0xffffff, 0.5 );
directionalLight.position.set( 0, 10, 0 );
scene.add( directionalLight );

/*
board creation
*/

// border for player goals
for(var i = -1; i < boardSize+1; i++) {
  for(var j = -1; j < boardSize+1; j++){
    cgeo = new t.CylinderGeometry(hexSize, hexSize, 3, 6);

    // do not draw border on shared hexagons
    if (i < 0 && j < 0)
      continue;
    if (i == boardSize && j == boardSize)
      continue;
    if (i == boardSize && j == boardSize - 1)
      continue;
    if (j < 0 && i == boardSize)
      continue;
    if (i < 0 && j == boardSize)
      continue;

    if (i < 0 || i == boardSize) { // player1
      cmatout = new t.MeshBasicMaterial({
                    color: 0xe91e63,
                    wireframe: true,
                    wireframeLinewidth: 2,
                    transparent: true });

      borderWire = new t.Mesh(cgeo, cmatout);


      borderWire.position.set(
        (i * hexSize) + j * hexRad - startLoc.x,
        startLoc.y,
        i * hexRad - startLoc.z
      )
      scene.add( borderWire );

    }
    else if (j < 0 || j == boardSize) { //player 2
      cmatout = new t.MeshBasicMaterial({
                    color: 0xcddc39,
                    wireframe: true,
                    wireframeLinewidth: 2,
                    transparent: true });
      borderWire = new t.Mesh(cgeo, cmatout);

      borderWire.position.set(
        (i * hexSize) + j * hexRad - startLoc.x,
        startLoc.y,
        i * hexRad - startLoc.z
      )
      scene.add( borderWire );
    }
  }
}

// main game board
for(var i = 0; i < boardSize; i++) {
  for(var j = 0; j < boardSize; j++){
    // geometry and materials
    cgeo = new t.CylinderGeometry(hexSize, hexSize, 3, 6);
    cmat = new t.MeshBasicMaterial({color: 0x666666});
    cmatout = new t.MeshBasicMaterial({
                    color: 0x000,
                    wireframe: true,
                    wireframeLinewidth: 2,
                    transparent: true });

    // add hexagons and outlines
    hex[i * boardSize + j] = new t.Mesh(cgeo, cmat);
    hexOutlines[i * boardSize + j] = new t.Mesh(cgeo, cmatout);

    // set props
    hex[i * boardSize + j].played = false;

    // place pieces in a rhombus grid
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


function restartGame() {
  hexWorker.postMessage({cmd: 'restart', boardSize: boardSize, isAI: isAI});

  // clear all played hexagons
  for (var i = 0; i < boardSize; i++) {
    for (var j = 0; j < boardSize; j++) {
      hex[i * boardSize + j].material.color.set(0x666666);
      hex[i * boardSize + j].played = false;
    }
  }
}

function toggleVR() {
  vr = !vr;

camera.position.set(100, 100, 150);
  camera.rotation.x = -45 * Math.PI / 180;
  camera.rotation.y = 0;
  camera.rotation.z = 0;
  if (vr)
    camera.fov = 110;
  else
    camera.fov = 60;

  onWindowResize();
}

/*
  when user clicks on a hexagon change the color
*/
function onMouseDown( event ) {
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components

  if (vr) {
    mouse.x = 0;
    mouse.y = 0;
  } else {
  	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  }

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects( scene.children );

  if (intersects[ 0 ].object.material.color) { // get first object intersected (hex tile)
    obj = intersects[ 0 ].object;

    var idx = hex.indexOf(obj);

    if (idx !== -1) {       // check if this is a hex piece

      var x = idx % boardSize, // column
          y = Math.floor(idx / boardSize); // row

      if (!obj.played && !aiTurn) {
        hexWorker.postMessage({cmd: 'play', player: currentPlayer, x: x, y: y}); // send player move

    		intersects[ 0 ].object.material.color.set( currentPlayer ?  playerColor2 : playerColor1 ); // set player color
        dodecahedron.material.color.set( currentPlayer ? playerColor1 : playerColor2 ); // play indicator

        // todo: play nice sounds

        currentPlayer = !currentPlayer; // change player
        obj.played = true; // set value
      }
    }
  }
}

window.addEventListener( 'mousedown', onMouseDown, false );

function onMouseMove( event ) {
	// mouse pos (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

window.addEventListener( 'mousemove', onMouseMove, false);


/*
Request animation frame loop function
*/
function animate() {
  // Apply any desired changes for the next frame. In this case, we rotate our object.
  dodecahedron.rotation.x += 0.01;
  dodecahedron.rotation.y += 0.005;

  if (vr) // if vr use center of screen as reticule
    mouse = new t.Vector2(0, 0);
  outlineRaycaster.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	var intersects = outlineRaycaster.intersectObjects( scene.children );

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

  // Render the scene through the VREffect. Update controls
  if (vr) {
    effect.render( scene, camera );
    controls.update();
  }
  else {
    renderer.render( scene, camera );
    orbit.update();
  }

  requestAnimationFrame( animate );
}

animate();	// Kick off animation loop



/*
Listen for keyboard events
*/
function onkey(event) {
  event.preventDefault();

  if (vr) {
    if (event.keyCode == 90)  // z
      controls.resetSensor(); //zero rotation
    else if (event.keyCode == 70 ) //f or enter
      effect.setFullScreen(true) //fullscreen
    else if (event.key == 'Enter') {

      console.log('ugh');
      onMouseDown();
    }
  }

  // some controls
  if(event.keyCode == 87) // w
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
  //camera.position.z += Math.log(window.innerWidth) * 10;
  console.log(camera.position.z);
  if (vr)
    effect.setSize( window.innerWidth, window.innerHeight );
  else
    renderer.setSize( window.innerWidth, window.innerHeight );
}
window.addEventListener( 'resize', onWindowResize, false );
