function initMap() {
  // 1) Inicializa mapa y polilínea
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 0, lng: 0 },
    zoom: 4
  });
  polyline = new google.maps.Polyline({ path: [], map });

  // 2) Para depurar, mira en consola qué datos recibes
  database.ref('/').on('value', snap => {
    const data = snap.val();
    console.log('Datos de Firebase:', data);

    if (data && data.latitud != null && data.longitud != null) {
      const pos = { lat: data.latitud, lng: data.longitud };

      // 3) Crea o mueve el marcador
      if (!marker) {
        marker = new google.maps.Marker({
          position: pos,
          map: map,
          title: 'Ubicación GPS'
        });
      } else {
        marker.setPosition(pos);
      }

      // 4) Añade el punto a la ruta
      pathCoordinates.push(pos);
      polyline.setPath(pathCoordinates);

      // 5) Centra y hace zoom
      map.setCenter(pos);
      map.setZoom(16);
    }
  });
}
