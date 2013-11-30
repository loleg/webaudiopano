var panoramaFile = 'pano/6K_1381492158_604799-0-25-1.jpeg';
var soundFiles = [
	"La Chambre.mp3",
	"L'Argo.mp3",
	"Jesrad.mp3",
	"Combien etaient-ils.mp3"/*,
	"Chronos II.mp3",
	"D_O_M_Collage_Mockup_v1.mp3",
	"Dreams_Themes_BacktoBack_ref-01.mp3",
	"Center Speakers.mp3"*/
];

var camera, scene, renderer;

var fov = 70,
texture_placeholder,
isUserInteracting = false,
onMouseDownMouseX = 0, onMouseDownMouseY = 0,
lon = 0, onMouseDownLon = 0,
lat = 0, onMouseDownLat = 0,
phi = 0, theta = 0;

var cubes = [];
var audio;
var loading = 0, loadingDone = soundFiles.length;

initAura();
initScene();
initCubes();

animate(); // go!

function initAura() {
	var a = {};
	audio = a;

	// Detect if the audio context is supported.
	window.AudioContext = (
	  window.AudioContext ||
	  window.webkitAudioContext ||
	  null
	);
	if (!AudioContext) {
	  throw new Error("AudioContext not supported!");
	} 

	a.context = new AudioContext();
	a.convolver = a.context.createConvolver();
	a.volume = a.context.createGain();

	a.mixer = a.context.createGain();

	a.flatGain = a.context.createGain();
	a.convolverGain = a.context.createGain();

	a.destination = a.mixer;
	a.mixer.connect(a.flatGain);
	//a.mixer.connect(a.convolver);
	a.convolver.connect(a.convolverGain);
	a.flatGain.connect(a.volume);
	a.convolverGain.connect(a.volume);
	a.volume.connect(a.context.destination);
}

function loadBuffer(soundFileName, callback) {
	var request = new XMLHttpRequest();
	request.open("GET", soundFileName, true);
	request.responseType = "arraybuffer";
	var ctx = audio.context;
	request.onload = function() {
	  ctx.decodeAudioData(request.response, function onSuccess(decodedBuffer) {
		callback(decodedBuffer);
	  }, function onFailure() {
		alert("Decoding the audio buffer failed");
	  });
	};
	request.send();
	return request;
}

function loadSound(soundFileName) {
	var ctx = audio.context;

	var sound = {};
	sound.source = ctx.createBufferSource();
	sound.source.loop = true;
	sound.panner = ctx.createPanner();
	sound.volume = ctx.createGain();

	sound.source.connect(sound.volume);
	sound.volume.connect(sound.panner);
	sound.panner.connect(audio.destination);

	loadBuffer(soundFileName, function(buffer){
	  sound.buffer = buffer;
	  sound.source.buffer = sound.buffer;
	  loading++;
	});

	return sound;
}

function setPositionAndVelocity(object, audioNode, x, y, z, dt) {

	//var p = object.matrixWorld.getPosition();
	var p = new THREE.Vector3()
			.getPositionFromMatrix(object.matrixWorld);
	var px = p.x, py = p.y, pz = p.z;
	object.position.set(x,y,z);
	object.updateMatrixWorld();
	//var q = object.matrixWorld.getPosition();
	var q = new THREE.Vector3()
			.getPositionFromMatrix(object.matrixWorld);
	var dx = q.x-px, dy = q.y-py, dz = q.z-pz;
	audioNode.setPosition(q.x, q.y, q.z);
}

function setPosition(object, x, y, z, dt) {

	setPositionAndVelocity(object, object.sound.panner, x, y, z, dt);
	var vec = new THREE.Vector3(0,0,1);
	var m = object.matrixWorld;
	var mx = m.n14, my = m.n24, mz = m.n34;
	m.n14 = m.n24 = m.n34 = 0;
	vec.applyMatrix3(m);
	//m.multiplyVector3(vec);
	vec.normalize();
	object.sound.panner.setOrientation(vec.x, vec.y, vec.z);
	m.n14 = mx;
	m.n24 = my; 
	m.n34 = mz;
}

function setListenerPosition(object, x, y, z, dt) {
	
	setPositionAndVelocity(object, audio.context.listener, x, y, z, dt);

	var m = object.matrix;
	var mx = m.n14, my = m.n24, mz = m.n34;
	m.n14 = m.n24 = m.n34 = 0;

	var vec = new THREE.Vector3(0,0,1);
	vec.applyMatrix3(m);
	//m.multiplyVector3(vec);
	vec.normalize();

	var up = new THREE.Vector3(0,-1,0);
	up.applyMatrix3(m);
	//m.multiplyVector3(up);
	up.normalize();

	audio.context.listener.setOrientation(vec.x, vec.y, vec.z, up.x, up.y, up.z);

	m.n14 = mx;
	m.n24 = my; 
	m.n34 = mz;
}

function updateAura() {

	var cp = camera.position;
	var camZ = cp.z, camX = cp.x, camY = cp.y;
	setListenerPosition(camera, camX, camY, camZ, 0);

	var cx = camX, cy = camY, cz = camZ;

	var cl = cubes.length;

	var degabs = (theta * 180/Math.PI) % 360;
	degabs = (degabs < 0) ? 360 + degabs : degabs;

	var maxdist = 0.5 * 360/cl;

	// Oscillating function
	cubes.forEach(function(c, i) {
		var dist = Math.abs((360*i/cl) - degabs);
		if (i == 0 && degabs > 180) 
			dist = Math.abs(360 - degabs);

		if (dist > maxdist) {
			setPosition(c, 99999, 0, 0, 0);	
		} else {
			var offset = Math.sin( (theta / 2) - (Math.PI/cl) * i ) * 50;
			setPosition(c, cx + offset, cy, cz, 0);

			// For debugging
			document.title = c.soundFile + " " + parseInt(degabs);
		}
	});

} // -updateAura

function initScene() {

	var container, mesh;

	container = document.getElementById( 'container' );

	camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 1100 );
	camera.target = new THREE.Vector3( 0, 0, 0 );

	scene = new THREE.Scene();

	var geometry = new THREE.SphereGeometry( 500, 60, 40 );
	geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );

	var material = new THREE.MeshBasicMaterial( {
		map: THREE.ImageUtils.loadTexture( panoramaFile )
	} );

	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );

	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
	document.addEventListener( 'DOMMouseScroll', onDocumentMouseWheel, false);

	window.addEventListener( 'resize', onWindowResize, false );
} // -initScene

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseDown( event ) {
	event.preventDefault();

	isUserInteracting = true;

	onPointerDownPointerX = event.clientX;
	onPointerDownPointerY = event.clientY;

	onPointerDownLon = lon;
	onPointerDownLat = lat;
}

function onDocumentMouseMove( event ) {
	if ( isUserInteracting ) {
		lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
		lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
	}
}

function onDocumentMouseUp( event ) {
	isUserInteracting = false;
}

function onDocumentMouseWheel( event ) {
	// WebKit
	if ( event.wheelDeltaY ) {
		fov -= event.wheelDeltaY * 0.05;

	// Opera / Explorer 9
	} else if ( event.wheelDelta ) {
		fov -= event.wheelDelta * 0.05;

	// Firefox
	} else if ( event.detail ) {
		fov += event.detail * 1.0;
	}

	camera.projectionMatrix.makePerspective( fov, window.innerWidth / window.innerHeight, 1, 1100 );
	render();
}

function animate() {

	requestAnimationFrame( animate );

	if (loading < loadingDone) { return; }
	else if (loading == loadingDone) { // run once
		document.getElementById('loading').style.display = 'none';
		var ctx = audio.context;
		cubes.forEach(function(c) {
			c.sound.source.start(ctx.currentTime + 0.020);
		});
		loading++;
	}

	render();

	updateAura();
}

function render() {

	lat = Math.max( - 85, Math.min( 85, lat ) );
	phi = THREE.Math.degToRad( 90 - lat );
	theta = THREE.Math.degToRad( lon );

	camera.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
	camera.target.y = 500 * Math.cos( phi );
	camera.target.z = 500 * Math.sin( phi ) * Math.sin( theta );

	camera.lookAt( camera.target );

	/*
	// distortion
	camera.position.x = - camera.target.x;
	camera.position.y = - camera.target.y;
	camera.position.z = - camera.target.z;
	*/

	renderer.render( scene, camera );

}

function initCubes() {

	var signs = [];

	var resolution = soundFiles.length;
	var amplitude = 20;
	var size = 360 / resolution;

	for (var i = 0; i < resolution; i++) {
		var segment = ( i * size ) * Math.PI / 180;
		var X = Math.cos( segment ) * amplitude;
		var Z = Math.sin( segment ) * amplitude;

		var cube = new THREE.Mesh( 
				new THREE.CubeGeometry( 1, 1, 1 ), 
				new THREE.MeshBasicMaterial( { color: 0xff0000 } )
			);
		cube.visible = false;
		cube.sound = loadSound('sound/' + soundFiles[i]);
		cube.soundFile = soundFiles[i].replace('.mp3', '');
		scene.add( cube );
		cubes.push(cube);

		var sign = new THREE.Mesh( 
				new THREE.CubeGeometry( 1, 1, 1 ), 
				new THREE.MeshBasicMaterial( { color: 0x0000ff } )
			);
		sign.position.set(X, 0, Z);
		scene.add( sign );
		signs.push(sign);
	}

} // -initCubes