// —————————————————————————
// 1) Configuración de Firebase
// —————————————————————————
const firebaseConfig = {
  apiKey: "AIzaSyDQLpuTmW5d_3lUqumAPW0RqomCxYQPkrE",
  authDomain: "datosdeubicacion.firebaseapp.com",
  databaseURL: "https://datosdeubicacion-default-rtdb.firebaseio.com",
  projectId: "datosdeubicacion",
  storageBucket: "datosdeubicacion.firebasestorage.app",
  messagingSenderId: "1095247152012",
  appId: "1:1095247152012:web:5d8aa44fbecdbe1f95cca9",
  measurementId: "G-L7T609J8YS"
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
  // 3.1) Inicializa mapa y polilínea
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 0, lng: 0 },
    zoom: 4
  });
  polyline = new google.maps.Polyline({ path: [], map: map });

  // 3.2) Crea el InfoWindow
  infoWindow = new google.maps.InfoWindow();

  // 3.3) Define el icono ahora que google.maps ya existe
  const birdIcon = {
    url: 'https://firebasestorage.googleapis.com/v0/b/datosdeubicacion.firebasestorage.app/o/public%2Fbirdimage.png?alt=media&token=19b65c24-40d7-481b-8433-303b4eec1c0d',
    scaledSize: new google.maps.Size(50, 50),
    anchor:     new google.maps.Point(25, 25)
  };

  // 3.4) Escucha datos de Firebase
  database.ref('/').on('value', snap => {
    const data = snap.val();
    console.log('Datos de Firebase:', data);

    // Si no hay latitud o longitud, salimos
    if (data == null || data.latitud == null || data.longitud == null) {
      return;
    }

    const pos = { latitud: data.latitud, longitud: data.longitud };

    // 3.5) Crea o mueve el marcador
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

    // 3.6) Añade al recorrido y actualiza la polilínea
    pathCoordinates.push(pos);
    polyline.setPath(pathCoordinates);

    // 3.7) Centra y hace zoom
    map.setCenter(pos);
    map.setZoom(16);
  });

  // 3.8) Listener para cerrar el InfoWindow
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
        <p><strong>Latitud:</strong> ${data.latitud}</p>
        <p><strong>Longitud:</strong> ${data.longitud}</p>
        <p><strong>Altitud:</strong> ${data.altitud ?? 'N/A'} m</p>
        <p><strong>Velocidad:</strong> ${data.velocidad ?? 'N/A'} km/h</p>
      </div>`;
    infoWindow.setContent(html);
    
pathCoordinates.push(pos);
    polyline.setPath(pathCoordinates);
    map.setCenter(pos);
    map.setZoom(16);

}
