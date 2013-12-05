var PANO = {};
PANO.main = function() {

var camera, scene, renderer;

var fov = 70,
texture_placeholder,
isUserInteracting = false,
onMouseDownMouseX = 0, onMouseDownMouseY = 0,
lon = 0, onMouseDownLon = 0,
lat = 0, onMouseDownLat = 0,
phi = 0, theta = 0;

var orbs = [];
var audio;
var loading = 0;
var soundFiles = [];
var soundPos = [];

// Load configuration
PANO.sounds.forEach(function(s) {
	if (s.length < 2) 
		return console.error("Invalid config", s);
	soundFiles.push(s[0]);
	soundPos.push(s[1]);
});
if (PANO.helper) {
	document.write('<div id="crosshair"></div>');
}

var loadingDone = soundFiles.length;

initAura();
initScene();
initOrbs();

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

	setTimeout(function(){
		loadBuffer(soundFileName, 
			function(buffer){
			  sound.buffer = buffer;
			  sound.source.buffer = sound.buffer;
			  loadProgress(1);
			});
	}, 250);

	return sound;
}

function loadProgress(dir) {
	loading += dir;
	var pc = parseInt(100 * (loading+1) / loadingDone) + '%';
	document.getElementById('pc').style.width = pc;
	document.getElementById('pctx').innerHTML = 'loading ' + pc;
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

	var cl = orbs.length;

	var degabs = (theta * 180/Math.PI) % 360;
	degabs = (degabs < 0) ? 360 + degabs : degabs;

	var maxdist = 0.5 * 360/cl;

	// Oscillating function
	orbs.forEach(function(c, i) {
		var dist = Math.abs(c.orientdeg - degabs);
		if (i == 0 && degabs > 180) 
			dist = Math.abs(360 - degabs);

		if (dist > maxdist) {
			setPosition(c, 99999, 0, 0, 0);	
		} else {
			var offset = Math.pow(( theta - c.orient )*5,3);
			setPosition(c, cx, cy, cz + offset, 0);

			// For debugging
			if (PANO.helper) {
				//document.title = c.soundFile + " ~" + parseInt(degabs);
			}
			document.title = offset;
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
		map: THREE.ImageUtils.loadTexture( PANO.panorama )
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
		orbs.forEach(function(c) {
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

function initOrbs() {

	var signs = [];

	var resolution = soundFiles.length;
	var amplitude = 20;
	var size = 360 / resolution;

	for (var i = 0; i < resolution; i++) {

		var segment = ( i*size ) * Math.PI/180;
		if (soundPos.length > i) {
			segment = soundPos[i] * Math.PI/180;
		}
		//console.log(i, segment * 180 / Math.PI);

		var X = Math.cos( segment ) * amplitude;
		var Z = Math.sin( segment ) * amplitude;
		
		var Y = 0;
		if (PANO.sounds[i].length > 2) {
			Y = PANO.sounds[i][2];
		}

		var cube = new THREE.Mesh( 
				new THREE.CubeGeometry( 1, 1, 1 ), 
				new THREE.MeshBasicMaterial( { color: 0xff0000 } )
			);
		cube.visible = false;
		cube.sound = loadSound('sound/' + soundFiles[i]);
		cube.soundFile = soundFiles[i].replace('.mp3', '');
		scene.add( cube );
		orbs.push(cube);

		var sign = new THREE.Mesh( 
				new THREE.SphereGeometry( 5, 10, 10 ), 
				new THREE.MeshBasicMaterial( { color: 0x0000ff, transparent: true, opacity: 0.4 } )
			);
		
		sign.visible = PANO.helper;
		sign.position.set(X, Y, Z);
		cube.origin = sign.position;
		cube.orient = segment;
		cube.orientdeg = segment * 180/Math.PI;

		scene.add( sign );
		signs.push(sign);
	}

} // -initOrbs

}; // PANO.main