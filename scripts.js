// --- Firebase config (bucket corregido) ---
const firebaseConfig = {
  apiKey: "AIzaSyDQLpuTmW5d_3lUqumAPW0RqomCxYQPkrE",
  authDomain: "datosdeubicacion.firebaseapp.com",
  databaseURL: "https://console.firebase.google.com/u/1/project/datosdeubicacion/database/datosdeubicacion-default-rtdb/data/~2F",
  projectId: "datosdeubicacion",
  storageBucket: "datosdeubicacion.appspot.com", // <- CORREGIDO
  messagingSenderId: "1095247152012",
  appId: "1:1095247152012:web:5d8aa44fbecdbe1f95cca9",
  measurementId: "G-L7T609J8YS"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- helpers UI ---
const $status = document.getElementById('status');
const setStatus = (t) => { if ($status) $status.textContent = t; };

// --- variables mapa ---
let map, marker, polyline, infoWindow;
let pathCoordinates = [];
let infoWindowOpened = false;

// (Opcional) si luego quieres icono personalizado, pega aquí su URL pública:
// const BIRD_ICON_URL = "https://firebasestorage.googleapis.com/v0/b/....?alt=media&token=...";

// --- Google Maps callback ---
function initMap() {
  setStatus("Inicializando mapa…");

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -1.5, lng: -78.0 }, // centro inicial aprox. Ecuador
    zoom: 6,
    mapTypeId: "hybrid"
  });

  polyline = new google.maps.Polyline({
    path: pathCoordinates, geodesic: true, strokeColor: "#00ff00",
    strokeOpacity: 1.0, strokeWeight: 2
  });
  polyline.setMap(map);

  infoWindow = new google.maps.InfoWindow();

  // Lee la RAÍZ "/": (tu captura muestra latitud/longitud ahí mismo)
  database.ref("/").on("value", (snap) => {
    const data = snap.val();
    console.log("[RTDB] / =", data);

    const lat = Number(data?.latitud);
    const lng = Number(data?.longitud);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setStatus("Lat/Lng inválidos o ausentes en '/'.");
      return;
    }

    setStatus(`Última actualización: lat=${lat.toFixed(6)} lng=${lng.toFixed(6)}`);
    const pos = { lat, lng };

    if (marker) {
      marker.setPosition(pos);
    } else {
      const opts = { position: pos, map };
      // if (BIRD_ICON_URL) {
      //   opts.icon = {
      //     url: BIRD_ICON_URL,
      //     scaledSize: new google.maps.Size(50, 50),
      //     anchor: new google.maps.Point(25, 25)
      //   };
      // }
      marker = new google.maps.Marker(opts);
      marker.addListener("click", () => {
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
  }, (err) => {
    console.error("Error RTDB:", err);
    setStatus(`Error RTDB: ${err?.code || err}`);
  });

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
