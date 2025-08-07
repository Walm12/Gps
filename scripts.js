// —————————————————————————
// 1) Configuración de Firebase
// —————————————————————————
const firebaseConfig = {
  apiKey: "AIzaSyBqh1FQgDO6oxuFMF7feaBQdJxT0mzNmsQ",
  authDomain: "ubicacion-pruebas.firebaseapp.com",
  databaseURL: "https://ubicacion-pruebas-default-rtdb.firebaseio.com/",
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


// —————————————————————————
// 3) Inicialización del mapa (callback de Google Maps)
// —————————————————————————
function initMap() {
  // 1) Inicializa mapa y polilínea
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 0, lng: 0 },
    zoom: 4
  });
  polyline = new google.maps.Polyline({ path: [], map});

  // 2) Crea el InfoWindow (antes estabas usando infoWindow sin inicializarlo)
  infoWindow = new google.maps.InfoWindow();

// Icono personalizado (imagen de ave)
const birdIcon = {
  url: 'https://firebasestorage.googleapis.com/v0/b/ubicacion-pruebas.appspot.com/o/SOMBRA%20AVE.png?alt=media',
  scaledSize: new google.maps.Size(50, 50),
  anchor: new google.maps.Point(25, 25)
};

  // 3) Escucha datos de Firebase
  database.ref('/').on('value', snap => {
    const data = snap.val();
    console.log('Datos de Firebase:', data);

    if (!data?.latitud || !data?.longitud) return; {
      const pos = { lat: data.latitud, lng: data.longitud };

      // 4) Crea o mueve el marcador
      if (!marker) {
        marker = new google.maps.Marker({
          position: pos,
          map: map,
          icon: birdIcon,
          title: 'Ubicación GPS'
        });
        marker.addListener('click', () => {
          infoWindowOpened = true;
          updateInfoWindow(data);
          infoWindow.open(map, marker);
        });
      } else {
        marker.setPosition(pos);
        if (infoWindowOpened) {
          updateInfoWindow(data);
        }
      }

      // 5) Añade al recorrido y actualiza la polilínea
      pathCoordinates.push(pos);
      polyline.setPath(pathCoordinates);

      // 6) Centra y hace zoom
      map.setCenter(pos);
      map.setZoom(16);
    }
  });

  // 7) Listener para cerrar el InfoWindow
  google.maps.event.addListener(infoWindow, 'closeclick', () => {
    infoWindowOpened = false;
  });
}

// —————————————————————————
// 4) Actualiza contenido del InfoWindow
// —————————————————————————
function updateInfoWindow(data) {
  const html = `
    <div>
      <p><strong>Altitud:</strong> ${data.altitud ?? 'N/A'} m</p>
      <p><strong>Velocidad:</strong> ${data.velocidad ?? 'N/A'} km/h</p>
    </div>`;
  infoWindow.setContent(html);
}
