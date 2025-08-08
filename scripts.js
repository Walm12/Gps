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
const storage  = firebase.storage();

// —————————————————————————
// 2) Variables globales para el mapa
// —————————————————————————
let map;
let marker;
let pathCoordinates = [];
let polyline;
let infoWindow;
let infoWindowOpened = false;

// gs:// del ícono en tu bucket
const BIRD_STORAGE_GS_URL = "gs://datosdeubicacion.firebasestorage.app/public/birdimage.png";
let birdIconUrl = null; // se llenará con getDownloadURL()

// Carga el URL de descarga del ícono desde Firebase Storage
function loadBirdIconUrl() {
  const ref = storage.refFromURL(BIRD_STORAGE_GS_URL);
  return ref.getDownloadURL()
    .then((url) => {
      birdIconUrl = url;
      // Si ya hay marcador, actualiza su ícono
      if (marker) {
        marker.setIcon({
          url: birdIconUrl,
          scaledSize: new google.maps.Size(50, 50),
          anchor: new google.maps.Point(25, 25)
        });
      }
    })
    .catch((err) => {
      console.error("No pude obtener la URL del ícono desde Storage:", err);
      // TIP: Si falla por reglas de Storage, usa una URL pública o ajusta reglas.
    });
}

// —————————————————————————
// 3) Inicialización del mapa (callback de Google Maps)
// —————————————————————————
function initMap() {

loadBirdIconUrl();

  // 3.1) Inicializa mapa y polilínea
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 0, lng: 0 },
    zoom: 4
    
  });

   // Polilínea para la ruta
  polyline = new google.maps.Polyline({
    path: pathCoordinates,
    geodesic: true,
    strokeColor: "#00ff00",
    strokeOpacity: 1.0,
    strokeWeight: 2
  });
  polyline.setMap(map);

  // 3.2) Crea el InfoWindow
  infoWindow = new google.maps.InfoWindow();

  // 3.4) Escucha datos de Firebase
  database.ref('/').on('value', snap => {
    const data = snap.val();
    console.log('Datos de Firebase:', data);

    // Si no hay latitud o longitud, salimos
    if (data == null || data.latitud == null || data.longitud == null) {
      return;
    }

    const pos = new google.maps.LatLng(data.latitud, data.longitud);

    // 3.5) Crea o mueve el marcador
    if (marker) {
      marker.setPosition(pos);
    } else {
      // Crea el marcador (si birdIconUrl ya está, úsalo; si no, lo pondremos cuando cargue)
      const markerOptions = {
        position: pos,
        map
      };
      if (birdIconUrl) {
        markerOptions.icon = {
          url: birdIconUrl,
          scaledSize: new google.maps.Size(50, 50),
          anchor: new google.maps.Point(25, 25)
        };
      }
      marker = new google.maps.Marker(markerOptions);

      marker.addListener("click", () => {
        infoWindowOpened = true;
        updateInfoWindow(data);
        infoWindow.open(map, marker);
      });
    }

    if (infoWindowOpened) updateInfoWindow(data);

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
window.initMap = initMap;
// —————————————————————————
// 4) Actualiza el contenido del InfoWindow
function updateInfoWindow(data) {
  const content = `
    <div>
      <p><strong>Altitud:</strong> ${data.altitud ?? "N/A"} m</p>
      <p><strong>Velocidad:</strong> ${data.velocidad ?? "N/A"} km/h</p>
      ${data.Temperatura != null ? `<p><strong>Temperatura:</strong> ${data.Temperatura} °C</p>` : ""}
      ${data.satelite    != null ? `<p><strong>Satélites:</strong> ${data.satelite}</p>` : ""}
    </div>`;
  infoWindow.setContent(content);
}
