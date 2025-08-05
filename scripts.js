// —————————————————————————
// 1) Configuración de Firebase (temporalmente comentada)
// —————————————————————————
const firebaseConfig = {
   apiKey: "AIzaSyBqh1FQgDO6oxuFMF7feaBQdJxT0mzNmsQ",
   authDomain: "ubicacion-pruebas.firebaseapp.com",
   databaseURL: "https://ubicacion-pruebas-default-rtdb.firebaseio.com",
   projectId: "ubicacion-pruebas",
   storageBucket: "ubicacion-pruebas.appspot.com",
   messagingSenderId: "989875849360",
   appId: "1:989875849360:web:c09628b92a336dcf947015"
 };
 firebase.initializeApp(firebaseConfig);
 const database = firebase.database();

// —————————————————————————
// 2) Variables globales para el mapa
// —————————————————————————
let map;
let marker;
let pathCoordinates = [];
let polyline;
let infoWindow;
let infoWindowOpened = false;
// Icono personalizado (imagen de ave)
const birdIcon = {
  url: 'https://firebasestorage.googleapis.com/v0/b/ubicacion-pruebas.appspot.com/o/SOMBRA%20AVE.png?alt=media',
  scaledSize: new google.maps.Size(50, 50),
  anchor: new google.maps.Point(25, 25)
};

// —————————————————————————
// 3) Inicialización del mapa
//    Llamada automática desde el callback de Google Maps
// —————————————————————————
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 0, lng: 0 },
    zoom: 4,
    mapTypeId: 'hybrid'
  });

  polyline = new google.maps.Polyline({
    path: pathCoordinates,
    geodesic: true,
    strokeColor: '#00ff00',
    strokeOpacity: 1.0,
    strokeWeight: 2
  });
  polyline.setMap(map);

  infoWindow = new google.maps.InfoWindow();


  // —————————————————————————
  // 5) Cuando tengas el GPS listo, descomenta este listener:
  // —————————————————————————
  database.ref('/').on('value', snapshot => {
    const data = snapshot.val();
    if (data && data.latitud != null && data.longitud != null) {
      const pos = new google.maps.LatLng(data.latitud, data.longitud);

      if (marker) {
        marker.setPosition(pos);
      } else {
        marker = new google.maps.Marker({
          position: pos,
          map,
          icon: birdIcon
        });
        marker.addListener('click', () => {
          infoWindowOpened = true;
          updateInfoWindow(data);
          infoWindow.open(map, marker);
        });
      }

      if (infoWindowOpened) updateInfoWindow(data);
      pathCoordinates.push(pos);
      polyline.setPath(pathCoordinates);
      map.setCenter(pos);
      map.setZoom(18);
    }
  });

  // Detecta cierre del InfoWindow
  google.maps.event.addListener(infoWindow, 'closeclick', () => {
    infoWindowOpened = false;
  });
}

// —————————————————————————
// 6) Actualiza el contenido del InfoWindow
// —————————————————————————
function updateInfoWindow(data) {
  const content = `
    <div>
      <p><strong>Altitud:</strong> ${data.altitud ?? 'N/A'} m</p>
      <p><strong>Velocidad:</strong> ${data.velocidad ?? 'N/A'} km/h</p>
    </div>`;
  infoWindow.setContent(content);
}
