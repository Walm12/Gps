// —————————————————————————
// 1) Configuración de Firebase
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
// 3) Inicialización del mapa (callback de Google Maps)
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
  // 4) Escucha de Firebase para ubicación en tiempo real
  // —————————————————————————
  database.ref('/').on('value', snapshot => {
    const data = snapshot.val();
    // Asegúrate de que tus nodos se llamen exactamente "latitud" y "longitud"
    if (data && data.latitud != null && data.longitud != null) {
      const pos = new google.maps.LatLng(data.latitud, data.longitud);

      // Crear o mover marcador
      if (!marker) {
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
      } else {
        marker.setPosition(pos);
        if (infoWindowOpened) updateInfoWindow(data);
      }

      // Añadir al recorrido y actualizar polyline
      pathCoordinates.push(pos);
      polyline.setPath(pathCoordinates);

      // Centrar y hacer zoom
      map.setCenter(pos);
      map.setZoom(18);
    }
  });

  // Cierra InfoWindow
  google.maps.event.addListener(infoWindow, 'closeclick', () => {
    infoWindowOpened = false;
  });
}

// —————————————————————————
// 5) Actualiza contenido del InfoWindow
// —————————————————————————
function updateInfoWindow(data) {
  const content = `
    <div>
      <p><strong>Altitud:</strong> ${data.altitud ?? 'N/A'} m</p>
      <p><strong>Velocidad:</strong> ${data.velocidad ?? 'N/A'} km/h</p>
    </div>`;
  infoWindow.setContent(content);
}
