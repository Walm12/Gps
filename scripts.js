// --- Firebase config (tu bucket corregido) ---
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

const $status = document.getElementById('status');
const setStatus = (t) => { if ($status) $status.textContent = t; };

let map, marker, polyline, infoWindow;
let pathCoordinates = [];
let infoWindowOpened = false;

function initMap() {
  console.log("[Maps] initMap llamado");
  console.log("[Firebase] databaseURL:", firebase.app().options.databaseURL);

  setStatus("Inicializando mapa…");
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -1.5, lng: -78.0 },
    zoom: 6,
    mapTypeId: "hybrid"
  });

  polyline = new google.maps.Polyline({
    path: pathCoordinates, geodesic: true, strokeColor: "#00ff00",
    strokeOpacity: 1.0, strokeWeight: 2
  });
  polyline.setMap(map);

  infoWindow = new google.maps.InfoWindow();

  // Lee la RAÍZ "/"
  const ref = database.ref("/");
  ref.on("value", (snap) => {
    const data = snap.val();
    console.log("[RTDB] / =", data);

    if (!data) { setStatus("No hay datos en '/'."); return; }

    const lat = Number(data.latitud);
    const lng = Number(data.longitud);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.warn("[RTDB] Lat/Lng inválidos:", data.latitud, data.longitud);
      setStatus(`Lat/Lng inválidos: lat=${data.latitud} lng=${data.longitud}`);
      return;
    }

    setStatus(`Última actualización: lat=${lat.toFixed(6)} lng=${lng.toFixed(6)}`);
    const pos = { lat, lng };

    if (marker) {
      marker.setPosition(pos);
    } else {
      marker = new google.maps.Marker({ position: pos, map });
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
    console.error("[RTDB] Error leyendo / :", err);
    setStatus(`Error RTDB: ${err?.code || err}`);
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
