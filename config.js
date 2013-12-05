/*
 Filename of the panorama scene
*/
PANO.panorama = 
	'pano/enfuse3.jpeg';

/*
 Music files and their location in degrees off center, left to right
 - e.g. 0 = in front at start, 180 = in the back at start
 - set to null to use the default equidistant placement
 The second, optional, parameter is a displacement of the clickable
 area, > 0 is up, < 0 down.
*/
PANO.sounds = [
	[ "Center Speakers.mp3", 0 ],
	[ "La Chambre.mp3", 57, -1 ],
	[ "L'Argo.mp3", 95, -1 ],
	[ "Jesrad.mp3", 165, -3 ],
	[ "Combien etaient-ils.mp3", 225, -2 ],
	[ "Chronos II.mp3", 280, -2 ],
	//[ "D_O_M_Collage_Mockup_v1.mp3", null ],
	//[ "Dreams_Themes_BacktoBack_ref-01.mp3", null ],
];

/* 
 When true, shows blue orbs ("helpers") at the sound locations,
 the sound currently playing, and orientation of the camera in 
 the browser title.
*/
PANO.helper = false;