/*
 Filename of the panorama scene
*/
PANO.panorama = 
	'pano/enfuse8.jpeg';

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
	[ "Center Speakers.mp3", 0, null, "<h2>Hello World</h2>Lorum ipsum." ],
	[ "La Chambre.mp3", 74, -1, '<br><iframe src="//player.vimeo.com/video/62075663" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe> <p><a href="http://vimeo.com/62075663">Polly Scattergood - Wanderlust</a> from <a href="http://vimeo.com/mutesong">Mute</a> on <a href="https://vimeo.com">Vimeo</a>.</p>' ],
	[ "L'Argo.mp3", 113, -1 ],
	[ "Jesrad.mp3", 181, -4 ],
	[ "Combien etaient-ils.mp3", 240, -2 ],
	[ "Chronos II.mp3", 294, -2 ],
	//[ "D_O_M_Collage_Mockup_v1.mp3" ],
	//[ "Dreams_Themes_BacktoBack_ref-01.mp3" ],
];

/* 
 When true, shows blue orbs ("helpers") at the sound locations,
 the sound currently playing, and orientation of the camera in 
 the browser title.
*/
PANO.helper = true;