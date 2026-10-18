/* =====================================
   WEBGIS LAB 03
   Student: Abdul Muneeb
   ARID: 24 ARID 2194
   Study Area: Islamabad
===================================== */


// =====================================
// 1. ISLAMABAD LOCATIONS
// =====================================

const locations = {

    faisal: {
        name: "Faisal Mosque",

        address: "Shah Faisal Avenue, Islamabad",

        coordinates: [33.7295, 73.0372],

        description: "One of Islamabad's famous landmarks."
    },

    monument: {
        name: "Pakistan Monument",

        address: "Shakarparian Hills, Islamabad",

        coordinates: [33.6938, 73.0652],

        description: "A national monument in Islamabad."
    },

    lake: {
        name: "Rawal Lake",

        address: "Rawal Lake View Park, Islamabad",

        coordinates: [33.7077, 73.1261],

        description: "A popular recreational area."
    }

};


// =====================================
// 2. MAP INITIALIZATION
// =====================================

// Initial map center: Islamabad

const map = L.map("map", {
    zoomControl: false
}).setView([33.7077, 73.0551], 12);


// Add zoom controls to the top-right corner

L.control.zoom({
    position: "topright"
}).addTo(map);


// OpenStreetMap base layer
L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);



// =====================================
// 3. CUSTOM MAP ICONS
// =====================================

function createIcon(color) {

    return L.divIcon({

        className: "custom-map-icon",

        html: `
            <div style="
                width: 22px;
                height: 22px;
                background: ${color};
                border: 4px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 12px rgba(0,0,0,0.3);
            "></div>
        `,

        iconSize: [22, 22],

        iconAnchor: [11, 11],

        popupAnchor: [0, -12]

    });

}


const destinationIcon = createIcon("#4169e1");

const userIcon = createIcon("#10b981");


// =====================================
// 4. ADD DESTINATION MARKERS
// =====================================

const destinationMarkers = {};

Object.entries(locations).forEach(([key, location]) => {

    const marker = L.marker(
        location.coordinates,
        {
            icon: destinationIcon
        }
    ).addTo(map);

    marker.bindPopup(`
        <div style="min-width:180px">

            <strong style="font-size:14px">
                ${location.name}
            </strong>

            <p style="margin:6px 0;color:#64748b">
                ${location.address}
            </p>

            <button
                onclick="selectLocation('${key}')"
                style="
                    width:100%;
                    padding:9px;
                    background:#4169e1;
                    color:white;
                    border:none;
                    border-radius:6px;
                    cursor:pointer;
                "
            >
                Select Destination
            </button>

        </div>
    `);

    destinationMarkers[key] = marker;

});


// =====================================
// 5. GLOBAL VARIABLES
// =====================================

let currentPosition = null;

let currentLocationMarker = null;

let routeLayer = null;

let selectedLocationKey = null;

let isLocating = false;


// =====================================
// 6. HTML ELEMENTS
// =====================================

const locateBtn = document.getElementById("locateBtn");

const routeBtn = document.getElementById("routeBtn");

const routeStatus = document.getElementById("routeStatus");

const routeStatusText = document.getElementById("routeStatusText");

const distanceValue = document.getElementById("distanceValue");

const timeValue = document.getElementById("timeValue");

const destinationName = document.getElementById("destinationName");

const destinationAddress = document.getElementById("destinationAddress");

const detailDistance = document.getElementById("detailDistance");

const detailTime = document.getElementById("detailTime");


// =====================================
// 7. SELECT DESTINATION
// =====================================

function selectLocation(key) {

    const location = locations[key];

    if (!location) {
        return;
    }

    selectedLocationKey = key;


    // Highlight selected sidebar card

    document.querySelectorAll(".location-card").forEach(card => {

        card.classList.toggle(
            "selected",
            card.dataset.location === key
        );

    });


    // Update destination information

    destinationName.textContent = location.name;

    destinationAddress.textContent = location.address;


    // Open destination popup

    destinationMarkers[key].openPopup();


    // Center map on selected destination

    map.flyTo(
        location.coordinates,
        14,
        {
            duration: 1.2
        }
    );


    // Reset previous route

    clearRoute();


    routeStatus.textContent = "Selected";

    routeStatusText.textContent = location.name;

    distanceValue.textContent = "--";

    timeValue.textContent = "--";

    detailDistance.textContent = "--";

    detailTime.textContent = "--";


    // If the user's location is already available,
    // calculate the route automatically.

    if (currentPosition) {

        calculateRoute();

    }

}


// Make function available to popup buttons

window.selectLocation = selectLocation;


// =====================================
// 8. SIDEBAR CLICK EVENTS
// =====================================

document.querySelectorAll(".location-card").forEach(card => {

    card.addEventListener("click", () => {

        const key = card.dataset.location;

        selectLocation(key);

    });

});


// =====================================
// 9. GET CURRENT LOCATION
// =====================================

function getCurrentLocation() {

    if (isLocating) {
        return;
    }


    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by your browser."
        );

        return;

    }


    isLocating = true;

    locateBtn.disabled = true;

    locateBtn.textContent = "Locating...";


    navigator.geolocation.getCurrentPosition(

        // SUCCESS CALLBACK

        function (position) {

            currentPosition = [

                position.coords.latitude,

                position.coords.longitude

            ];


            // Remove old current-position marker

            if (currentLocationMarker) {

                map.removeLayer(currentLocationMarker);

            }


            // Add current-position marker

            currentLocationMarker = L.marker(

                currentPosition,

                {
                    icon: userIcon
                }

            ).addTo(map);


            currentLocationMarker.bindPopup(
                "<strong>Your Current Location</strong>"
            );


            currentLocationMarker.openPopup();


            // Center map on the user's location

            map.flyTo(
                currentPosition,
                14,
                {
                    duration: 1.3
                }
            );


            // Restore button

            locateBtn.disabled = false;

            locateBtn.textContent = "◎ My Location";

            isLocating = false;


            routeStatus.textContent = "Located";

            routeStatusText.textContent = "Position detected";


            // Calculate route if a destination is selected

            if (selectedLocationKey) {

                calculateRoute();

            }

        },


        // ERROR CALLBACK

        function (error) {

            isLocating = false;

            locateBtn.disabled = false;

            locateBtn.textContent = "◎ My Location";


            let message = "Unable to retrieve your location.";


            if (error.code === 1) {

                message =
                    "Location permission was denied. Allow location access in your browser settings.";

            } else if (error.code === 2) {

                message =
                    "Your location is currently unavailable. Please try again.";

            } else if (error.code === 3) {

                message =
                    "Location request timed out. Please try again.";

            }


            alert(message);


            routeStatus.textContent = "Unavailable";

            routeStatusText.textContent = "Location access required";

        },


        // GEOLOCATION OPTIONS

        {
            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0

        }

    );

}


// My Location button

locateBtn.addEventListener(
    "click",
    getCurrentLocation
);


// =====================================
// 10. CLEAR PREVIOUS ROUTE
// =====================================

function clearRoute() {

    if (routeLayer) {

        map.removeLayer(routeLayer);

        routeLayer = null;

    }

}


// =====================================
// 11. CALCULATE ROAD ROUTE
// =====================================

async function calculateRoute() {

    if (!selectedLocationKey) {

        alert("Please select a destination first.");

        return;

    }


    if (!currentPosition) {

        alert(
            "Please click My Location and allow location access first."
        );

        return;

    }


    const destination = locations[selectedLocationKey];


    // OSRM uses longitude,latitude order.

    const startCoordinates =

        `${currentPosition[1]},${currentPosition[0]}`;


    const endCoordinates =

        `${destination.coordinates[1]},${destination.coordinates[0]}`;


    const routingURL =

        "https://router.project-osrm.org/route/v1/driving/" +

        `${startCoordinates};${endCoordinates}` +

        "?overview=full&geometries=geojson";


    routeBtn.disabled = true;

    routeBtn.textContent = "Calculating Route...";


    routeStatus.textContent = "Loading";

    routeStatusText.textContent = "Finding the best route";


    try {

        const response = await fetch(routingURL);


        if (!response.ok) {

            throw new Error(
                "Routing service returned an error."
            );

        }


        const data = await response.json();


        if (

            data.code !== "Ok" ||

            !data.routes ||

            data.routes.length === 0

        ) {

            throw new Error(
                "No driving route was found."
            );

        }


        const route = data.routes[0];


        // Distance is returned in meters

        const distanceKm = route.distance / 1000;


        // Duration is returned in seconds

        const durationMinutes = route.duration / 60;


        const distanceText =

            distanceKm < 1

                ? `${Math.round(route.distance)} m`

                : `${distanceKm.toFixed(2)} km`;


        const timeText = formatDuration(durationMinutes);


        // Remove the previous route

        clearRoute();


        // GeoJSON coordinates are [longitude, latitude].
        // Leaflet can draw the GeoJSON directly.

        routeLayer = L.geoJSON(

            route.geometry,

            {

                style: {

                    color: "#4169e1",

                    weight: 6,

                    opacity: 0.85

                }

            }

        ).addTo(map);


        // Fit the map around the full route

        map.fitBounds(

            routeLayer.getBounds(),

            {
                padding: [45, 45]
            }

        );


        // Update statistics

        distanceValue.textContent = distanceText;

        timeValue.textContent = timeText;


        detailDistance.textContent = distanceText;

        detailTime.textContent = timeText;


        routeStatus.textContent = "Complete";

        routeStatusText.textContent = "Driving route calculated";


        // Open a popup with route details

        currentLocationMarker.bindPopup(`

            <strong>Your Current Location</strong>

            <br>

            Route to ${destination.name}

            <br>

            Distance: ${distanceText}

            <br>

            Estimated time: ${timeText}

        `);


        console.log("Route calculated successfully.");

        console.log("Destination:", destination.name);

        console.log("Distance:", distanceText);

        console.log("Estimated time:", timeText);


    } catch (error) {

        console.error(
            "Routing error:",
            error
        );


        routeStatus.textContent = "Failed";

        routeStatusText.textContent = "Routing unavailable";


        alert(
            "Unable to calculate the route right now. " +
            "Please check your internet connection and try again."
        );


    } finally {

        routeBtn.disabled = false;

        routeBtn.innerHTML = "<span>➤</span> Find Route";

    }

}


// =====================================
// 12. FORMAT TRAVEL DURATION
// =====================================

function formatDuration(totalMinutes) {

    const minutes = Math.round(totalMinutes);


    if (minutes < 60) {

        return `${minutes} min`;

    }


    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;


    if (remainingMinutes === 0) {

        return `${hours} hr`;

    }


    return `${hours} hr ${remainingMinutes} min`;

}


// =====================================
// 13. FIND ROUTE BUTTON
// =====================================

routeBtn.addEventListener(

    "click",

    calculateRoute

);


// =====================================
// 14. INITIAL MAP SETUP
// =====================================

// Open the Faisal Mosque popup when the dashboard loads.

destinationMarkers.faisal.openPopup();


// Keep the map correctly sized if the layout changes.

setTimeout(() => {

    map.invalidateSize();

}, 300);


console.log(
    "WebGIS Dashboard initialized successfully."
);

console.log(
    "Student: Abdul Muneeb | ARID: 24 ARID 2194"
);