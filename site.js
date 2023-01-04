const LoadingSpinner = () => {
    window.scrollTo(0, 0)
    document.body.style.overflowY = "hidden";
    document.getElementById("loadingIndicator").style.display = "flex";
}
const HideLoadingSpinner = () => {
    document.body.style.overflowY = "scroll";
    document.getElementById("loadingIndicator").style.display = "none";
}
const ErrorMessage = (txt) => {
    Swal.fire({
        title: "Auto close error alert",
        icon: "error",
        html: txt,
        timer: 5000,
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading();
            document
                .getElementsByClassName("swal2-popup")[0]
                .addEventListener("mouseenter", () => Swal.stopTimer());

            document
                .getElementsByClassName("swal2-popup")[0]
                .addEventListener("mouseleave", () => Swal.resumeTimer());
        },
        willClose: () => {
            document.getElementsByClassName("swal2-container")[0].remove();
        },
    });
}

mapboxgl.accessToken = 'pk.eyJ1IjoiaGVzaGFtMjAwMSIsImEiOiJjbGNmdHgzdDgwODB6M250OHN5Z2I3Nmd5In0.3pnxlo0eFvBox2ovg0sorg';
mapboxgl.setRTLTextPlugin(
    'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
    null,
    true
);
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [35.907901, 31.956083],
    zoom: 13,
    cooperativeGestures: true
});

// Mapbox Search Input Field
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
});
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

// Navigation Buttons
map.addControl(new mapboxgl.NavigationControl());

// Full Screen mode button
map.addControl(new mapboxgl.FullscreenControl());

// PwC logo as marker
const el = document.createElement('div');
const width = 60;
const height = 60;

el.className = 'marker';
el.style.backgroundImage = `url(assets/PwC-logo.svg)`;
el.style.width = `${width}px`;
el.style.height = `${height}px`;
el.style.backgroundSize = '100%';

// Add markers to the map.
new mapboxgl.Marker(el)
    .setLngLat([35.907901, 31.956083])
    .addTo(map);

el.addEventListener('click', () => {
    new mapboxgl.Popup({ closeOnClick: false })
        .setLngLat([35.907901, 31.956083])
        .setHTML('<h1>PwC Middle east, Amman-Jordan</h1>')
        .setMaxWidth("500px")
        .addTo(map);
});

// User Location Button
map.addControl(
    new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        // Track the user location.
        trackUserLocation: true,
        // Draw an arrow next to the location dot to indicate which direction the device is heading.
        showUserHeading: true
    })
);

// Enable directions on Map
const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken
});
map.addControl(directions, 'top-left');

// Change Map Them
const layerList = document.getElementById('them');
layerList.addEventListener("change", async () => {
    LoadingSpinner();

    const layerId = layerList.options[layerList.selectedIndex].value;
    const currentLayers = map.getStyle().layers;
    await map.setStyle('mapbox://styles/mapbox/' + layerId);
    map.on("style.load", () => {
        map.addSource("directions", {
            "type": "geojson",
            "data": {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-77.0323, 38.9131]
                },
                "properties": {
                    "title": "Mapbox DC",
                    "marker-symbol": "monument"
                }
            }
        });

        currentLayers.forEach((el) => {
            if (el.id.includes("directions")) {
                map.addLayer(el);
            }
        });
        setTimeout(async () => {
            HideLoadingSpinner();
        }, 2000);
    })
});

// Zoom to buildings Button
document.getElementById('zoom').addEventListener('click', () => {
    map.zoomTo(18, { duration: 9000 });
});

// Fit To PwC location Button
document.getElementById('fit').addEventListener('click', () => {
    map.fitBounds([
        [35.907901, 31.956083], // southwestern corner of the bounds
        [35.907901, 31.956083] // northeastern corner of the bounds
    ], {
        maxZoom: 14
    });
});

// On map load event
map.on('load', () => {
    HideLoadingSpinner();

    map.setPaintProperty('building', 'fill-color', [
        'interpolate',
        ['exponential', 0.5],
        ['zoom'],
        15,
        '#D9D3C9',
        18,
        '#ffed8a'
    ]);

    map.setPaintProperty('building', 'fill-opacity', [
        'interpolate',
        // Set the exponential rate of change to 0.5
        ['exponential', 0.5],
        ['zoom'],
        // 100% transparent.
        10,
        0.5,
        // 100% opaque.
        18,
        1
    ]);
});

// Custom search
function openCustomSearchFiled() {
    document.getElementById("customSearchAnchor").classList.add("d-none");
    document.getElementById("customSearch").classList.remove("d-none");
    document.getElementById("customSearch").classList.add("d-flex");
}
document.getElementById("searchButton").addEventListener("click", () => {
    LoadingSpinner();
    const query = document.getElementById("customSearchInputFiled").value;
    document.getElementById("customSearchAnchor").classList.remove("d-none");
    document.getElementById("customSearch").classList.add("d-none");
    document.getElementById("customSearch").classList.remove("d-flex");

    $.ajax(
        {
            url: `http://api.positionstack.com/v1/forward`,
            data: {
                access_key: '063e789796beb0837e9741a8572269bd',
                query: query,
                limit: 1
            },
            "beforeSend": () => LoadingSpinner(),
            success: function (data) {
                HideLoadingSpinner();
                document.getElementById("customSearchInputFiled").value = "";

                if (data.data[0]?.longitude != undefined && data.data[0]?.latitude != undefined) {
                    const result = [data.data[0].longitude, data.data[0].latitude];
                    map.flyTo({
                        center: result,
                        zoom: 9,
                        curve: 1,
                        essential: true // fly animation
                    });
                }
                else {
                    ErrorMessage("This location not found, make sure you entred the right words!");
                }
            },
            error: function (errors) {
                HideLoadingSpinner();
                document.getElementById("customSearchInputFiled").value = "";
                ErrorMessage(errors.responseJSON.error.message);
            }
        }
    )
});