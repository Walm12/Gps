// --- Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyDQLpuTmW5d_3lUqumAPW0RqomCxYQPkrE",
  authDomain: "datosdeubicacion.firebaseapp.com",
  databaseURL: "https://datosdeubicacion-default-rtdb.firebaseio.com",
  projectId: "datosdeubicacion",
  storageBucket: "datosdeubicacion.firebasestorage.app", // <-- tu bucket real
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

// Map ID (vector) para Advanced Markers
const MAP_ID = 'ed456c9ff425e26cdc394dea';

// Ruta del icono en tu bucket (tal cual tu consola)
const BIRD_STORAGE_GS = 'gs://datosdeubicacion.firebasestorage.app/public/birdimage.png';
let birdIconUrl = null;

function loadBirdIconUrl() {
  const iconRef = storage.refFromURL(BIRD_STORAGE_GS);
  return iconRef.getDownloadURL()
    .then((url) => {
      birdIconUrl = url; // p.ej. https://firebasestorage.googleapis.com/v0/b/...
      if (marker && !marker.content) {
        marker.content = createBirdIconElement(birdIconUrl);
      }
    })
    .catch((err) => {
      console.warn('No pude obtener la URL del icono desde Storage:', err);
    });
}
// Ajustes globales
const ICON_SIZE = 50;       // px visibles
const ICON_ROT_DEG = -90;   // prueba -90 o 90 según tu PNG
const ICON_ANCHOR = 'center'; // 'center' o 'bottom'

// Crea el contenido para AdvancedMarkerElement
function createBirdIconElement(url, { size = ICON_SIZE, deg = ICON_ROT_DEG, anchor = ICON_ANCHOR } = {}) {
  // 1) Wrapper: define el anclaje (centro o bottom-center) con porcentajes
  const wrap = document.createElement('div');
  wrap.style.display = 'inline-block';
  wrap.style.willChange = 'transform';
  wrap.style.transform = (anchor === 'bottom')
    ? 'translate(-50%, -100%)'  // ancla en la base (como un pin)
    : 'translate(-50%, -50%)';  // ancla en el centro (ideal para iconos “planos”)

  // 2) Imagen: rotación/origen centrado
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Tracker';
  img.width = size;
  img.height = size;
  img.style.display = 'block';
  img.style.transformOrigin = 'center center';
  img.style.transform = `rotate(${deg}deg)`; // SOLO rotación aquí
  img.draggable = false;

  wrap.appendChild(img);
  return wrap;
}


// --- Google Maps callback ---
function initMap() {
  setStatus("Inicializando mapa…");

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -1.5, lng: -78.0 },
    zoom: 6,
    mapId: MAP_ID
  });

  polyline = new google.maps.Polyline({
    path: pathCoordinates,
    geodesic: true,
    strokeColor: "#00ff00",
    strokeOpacity: 1.0,
    strokeWeight: 2
  });
  polyline.setMap(map);

  infoWindow = new google.maps.InfoWindow();

  // Carga icono (no bloquea)
  loadBirdIconUrl().finally(() => {
    // Suscribirse a RTDB (tu captura muestra las claves en "/")
    const ref = database.ref("/");
    ref.on("value", (snap) => {
      const data = snap.val();

      if (!data) { setStatus("No hay datos en '/'."); return; }

      const lat = Number(data.latitud);
      const lng = Number(data.longitud);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setStatus(`Lat/Lng inválidos: lat=${data.latitud} lng=${data.longitud}`);
        return;
      }

      setStatus(`Última actualización: lat=${lat.toFixed(6)} lng=${lng.toFixed(6)}`);
      const pos = { lat, lng };

      // Crear/actualizar AdvancedMarkerElement
      if (marker) {
        marker.position = pos;
      } else {
        const opts = { map, position: pos };
        if (birdIconUrl) opts.content = createBirdIconElement(birdIconUrl);
        marker = new google.maps.marker.AdvancedMarkerElement(opts);

        // Evento de clic (nuevo y legacy)
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

      // Traza ruta y centra
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
