/*
 Filename of the panorama scene
*/
PANO.panorama = 
	'pano/enfuse3.jpeg';

/*
 Definition of the audio environment:

 The first parameter is the source of the audio, i.e. an MP3 file.
 
 The second parameter is the location in degrees off center, left to right
 - e.g. 0 = in front at start, 180 = in the back at start
 - set to null to use the default equidistant placement
 - set PANO.helper to true for an aiming reticle and degrees in the browser title

 The third parameter is a displacement of the clickable area
 - greater than 0 is up, < 0 down
 - default is 0, equivalent to null

 The fourth parameter is HTML content to be displayed in a dialog when the orb 
 surrounding the area of the audio source is clicked.
*/
PANO.sounds = [
	[ "Center Speakers.mp3", 0, null, "Hello World" ],
	[ "La Chambre.mp3", 57, -1 ],
	[ "L'Argo.mp3", 95, -1 ],
	//[ "Jesrad.mp3", 165, -3 ],
	//[ "Combien etaient-ils.mp3", 225, -2 ],
	//[ "Chronos II.mp3", 280, -2 ],
	//[ "D_O_M_Collage_Mockup_v1.mp3", null ],
	//[ "Dreams_Themes_BacktoBack_ref-01.mp3", null ],
];

/* 
 When true, shows blue orbs ("helpers") at the sound locations,
 the sound currently playing, and orientation of the camera in 
 the browser title.
*/
PANO.helper = true;