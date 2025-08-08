// --- Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyDQLpuTmW5d_3lUqumAPW0RqomCxYQPkrE",
  authDomain: "datosdeubicacion.firebaseapp.com",
  databaseURL: "https://datosdeubicacion-default-rtdb.firebaseio.com",
  projectId: "datosdeubicacion",
  storageBucket: "datosdeubicacion.appspot.com",
  messagingSenderId: "1095247152012",
  appId: "1:1095247152012:web:5d8aa44fbecdbe1f95cca9",
  measurementId: "G-L7T609J8YS"
};
firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const storage  = firebase.storage();

// --- helpers UI ---
const $status = document.getElementById('status');
const setStatus = (t) => { if ($status) $status.textContent = t; };

// --- variables mapa ---
let map, marker, polyline, infoWindow;
let pathCoordinates = [];
let infoWindowOpened = false;

// Ruta del icono en tu bucket (ajústala si está en otro lugar)
const BIRD_STORAGE_PATH = "public/birdimage.png";
let birdIconUrl = null;

// Carga URL pública del icono desde Firebase Storage
function loadBirdIconUrl() {
  return storage.ref(BIRD_STORAGE_PATH).getDownloadURL()
    .then((url) => {
      birdIconUrl = url;
      // Si el marcador ya existe, actualiza su contenido
      if (marker && !marker.content) {
        marker.content = createBirdIconElement(birdIconUrl);
      }
    })
    .catch((err) => {
      console.warn("No pude obtener la URL del icono desde Storage:", err);
      // Opcional: puedes dejar un pin por defecto si falla
    });
}

// Crea un elemento IMG para AdvancedMarkerElement
function createBirdIconElement(url) {
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Tracker';
  img.style.width = '50px';
  img.style.height = '50px';
  // Ancla visual aproximada al centro (equivalente a anchor(25,25))
  img.style.transform = 'translate(-25px, -25px)';
  img.draggable = false;
  return img;
}

// --- Google Maps callback ---
function initMap() {
  console.log("[Maps] initMap");
  console.log("[Firebase] DB URL:", firebase.app().options.databaseURL);

  setStatus("Inicializando mapa…");

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -1.5, lng: -78.0 }, // Ecuador aprox. mientras llegan datos
    zoom: 6,
    mapTypeId: "hybrid"
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

  // Carga el icono (no bloquea)
  loadBirdIconUrl();

  // Lee la RAÍZ (tu DB muestra latitud/longitud ahí)
  const ref = database.ref("/");
  ref.on("value", (snap) => {
    const data = snap.val();
    console.log("[RTDB] / =", data);

    if (!data) {
      setStatus("No hay datos en '/'.");
      return;
    }

    const lat = Number(data.latitud);
    const lng = Number(data.longitud);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.warn("[RTDB] Lat/Lng inválidos:", data.latitud, data.longitud);
      setStatus(`Lat/Lng inválidos: lat=${data.latitud} lng=${data.longitud}`);
      return;
    }

    setStatus(`Última actualización: lat=${lat.toFixed(6)} lng=${lng.toFixed(6)}`);
    const pos = { lat, lng };

    // Crear/actualizar AdvancedMarkerElement
    if (marker) {
      marker.position = pos; // actualización en AdvancedMarkerElement
    } else {
      const opts = { map, position: pos };
      if (birdIconUrl) {
        opts.content = createBirdIconElement(birdIconUrl);
      }
      marker = new google.maps.marker.AdvancedMarkerElement(opts);

      // Soporta tanto 'gmp-click' (nuevo) como 'click' por compatibilidad
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

    // Traza ruta
    pathCoordinates.push(pos);
    polyline.setPath(pathCoordinates);

    // Enfoca
    map.setCenter(pos);
    map.setZoom(18);
  }, (err) => {
    console.error("[RTDB] Error leyendo / :", err);
    setStatus(`Error RTDB: ${err?.code || err}`);
  });

  // Detecta cierre del InfoWindow
  google.maps.event.addListener(infoWindow, "closeclick", () => {
    infoWindowOpened = false;
  });
}
window.initMap = initMap;

// --- InfoWindow ---
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
