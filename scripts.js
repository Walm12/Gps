// --- Firebase config ---
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

// --- UI ---
const $status = document.getElementById('status');
const setStatus = (t) => { if ($status) $status.textContent = t; };

// --- Mapa / Advanced Marker ---
let map, marker, polyline, infoWindow;
let pathCoordinates = [];
let infoWindowOpened = false;

const MAP_ID = 'ed456c9ff425e26cdc394dea';

// Ruta del icono en tu bucket (ajústala si está en otro lugar):
const BIRD_STORAGE_PATH = "gs://datosdeubicacion.firebasestorage.app/public/birdimage.png";
let birdIconUrl = null;

function loadBirdIconUrl() {
  // Usa el bucket configurado en firebaseConfig (evita refFromURL)
  const ref = firebase.storage().ref('gs://datosdeubicacion.firebasestorage.app/public/birdimage.png');
  return ref.getDownloadURL()
    .then((url) => {
      console.log('[Storage] download URL = https://firebasestorage.googleapis.com/v0/b/datosdeubicacion.firebasestorage.app/o/public%2Fbirdimage.png?alt=media&token=19b65c24-40d7-481b-8433-303b4eec1c0d', url); // debería ser googleapis con ?alt=media&token=...
      birdIconUrl = url;
      if (marker && !marker.content) {
        marker.content = createBirdIconElement(birdIconUrl);
      }
    })
    .catch((err) => {
      console.warn('No pude obtener la URL del icono desde Storage:', err);
    });
}

function createBirdIconElement(url) {
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Tracker';
  img.style.width = '50px';
  img.style.height = '50px';
  // centra el icono (anclaje visual)
  img.style.transform = 'translate(-25px, -25px)';
  img.draggable = false;
  return img;
}

function initMap() {
  setStatus("Inicializando mapa…");

  // Map ID requerido para AdvancedMarkerElement
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -1.5, lng: -78.0 },
    zoom: 6,
    mapId: MAP_ID,          // 👈 CLAVE: Map ID vector
    // mapTypeId: "hybrid",  // (opcional) con mapId, Google ignora estilos aquí
  });

  polyline = new google.maps.Polyline({
    path: pathCoordinates, geodesic: true,
    strokeColor: "#00ff00", strokeOpacity: 1.0, strokeWeight: 2
  });
  polyline.setMap(map);

  infoWindow = new google.maps.InfoWindow();

  // Carga icono (no bloquea)
  loadBirdIconUrl().finally(() => {
    // Suscríbete a RTDB
    const ref = database.ref("/");
    ref.on("value", (snap) => {
      const data = snap.val();
      console.log("[RTDB] / =", data);

      if (!data) { setStatus("No hay datos en '/'."); return; }

      const lat = Number(data.latitud);
      const lng = Number(data.longitud);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setStatus(`Lat/Lng inválidos: lat=${data.latitud} lng=${data.longitud}`);
        return;
      }

      setStatus(`Última actualización: lat=${lat.toFixed(6)} lng=${lng.toFixed(6)}`);
      const pos = { lat, lng };

      // Crea/actualiza AdvancedMarkerElement
      if (marker) {
        marker.position = pos;
      } else {
        const opts = { map, position: pos };
        if (birdIconUrl) opts.content = createBirdIconElement(birdIconUrl);
        marker = new google.maps.marker.AdvancedMarkerElement(opts);

        // soporta click (gmp-click es el evento nuevo)
        marker.addListener("gmp-click", () => {
          infoWindowOpened = true;
          updateInfoWindow(data);
          infoWindow.open({ map, anchor: marker });
        });
        marker.addListener("click", () => {
          infoWindowOpened = true;
          updateInfoWindow(data);
          infoWindow.open({ map, anchor: marker });
        });
      }

      if (infoWindowOpened) {
        updateInfoWindow(data);
        infoWindow.open({ map, anchor: marker });
      }

      pathCoordinates.push(pos);
      polyline.setPath(pathCoordinates);
      map.setCenter(pos);
      map.setZoom(18);
    }, (err) => {
      console.error("[RTDB] Error:", err);
      setStatus(`Error RTDB: ${err?.code || err}`);
    });
  });

  google.maps.event.addListener(infoWindow, "closeclick", () => {
    infoWindowOpened = false;
  });
}
window.initMap = initMap;

function updateInfoWindow(data) {
  const html = `
    <div>
      <p><strong>Temperatura:</strong> ${data?.Temperatura ?? "N/A"} °C</p>
      <p><strong>Altitud:</strong> ${data?.altitud ?? "N/A"} m</p>
      <p><strong>Velocidad:</strong> ${data?.velocidad ?? "N/A"} km/h</p>
      <p><strong>Satélites:</strong> ${data?.satelite ?? "N/A"}</p>
    </div>`;
  infoWindow.setContent(html);
}
