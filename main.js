/* global L Papa */

/*
 * Script to display two tables from Google Sheets as point and geometry layers using Leaflet
 * The Sheets are then imported using PapaParse and overwrite the initially laded layers
 */

// PASTE YOUR URLs HERE
// these URLs come from Google Sheets 'shareable link' form
// the first is the geometry layer and the second the points
let pointsURL =
  "https://docs.google.com/spreadsheets/d/1X55II1fEv9rnCIw9vZxN2x187o3k9irraoikggUFDo0/pub?output=csv";

window.addEventListener("DOMContentLoaded", init);

let map;
let zoom;
let sidebar;
let panelID = "my-info-panel";

/*
 * init() is called when the page has loaded
 */
function init() {
  // Create a new Leaflet map centered on the continental US
  map = L.map("map", {zoomControl:false});
  zoom = L.control.zoom({position: 'bottomleft'});
  zoom.addTo(map);

  // This is the Carto Positron basemap
  L.tileLayer(
    "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='http://cartodb.com/attributions'>CartoDB</a>",
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  sidebar = L.control
    .sidebar({
      container: "sidebar",
      closeButton: true,
      position: "right",
    })
    .addTo(map);

  let panelContent = {
    id: panelID,
    tab: "<i class='fa fa-bars active'></i>",
    pane: "<p id='sidebar-content'></p>",
    title: "<h2 id='sidebar-title'>Ingen dokumentation vald</h2>",
  };
  sidebar.addPanel(panelContent);

  map.on("click", function () {
    sidebar.close(panelID);
  });

  // Use PapaParse to load data from Google Sheets
  // And call the respective functions to add those to the map.
  Papa.parse(pointsURL, {
    download: true,
    header: true,
    complete: addPoints,
  });
}

/*
 * addPoints is a bit simpler, as no GeoJSON is needed for the points
 */
function addPoints(data) {
  data = data.data;
  let pointGroupLayer = L.layerGroup().addTo(map);

  // Choose marker type. Options are:
  // (these are case-sensitive, defaults to marker!)
  // marker: standard point with an icon
  // circleMarker: a circle with a radius set in pixels
  // circle: a circle with a radius set in meters
  let markerType = "marker";

  // Marker radius
  // Wil be in pixels for circleMarker, metres for circle
  // Ignore for point
  let markerRadius = 100;

  for (let row = 0; row < data.length; row++) {
    let marker;
    if (markerType == "circleMarker") {
      marker = L.circleMarker([data[row].Latitud, data[row].Longitud], {
        radius: markerRadius,
      });
    } else if (markerType == "circle") {
      marker = L.circle([data[row].Latitud, data[row].Longitud], {
        radius: markerRadius,
      });
    } else {
      marker = L.marker([data[row].Latitud, data[row].Longitud]);
    }
    marker.addTo(pointGroupLayer);

    // UNCOMMENT THIS LINE TO USE POPUPS
    //marker.bindPopup('<h2>' + data[row].name + '</h2>There's a ' + data[row].description + ' here');

    // COMMENT THE NEXT GROUP OF LINES TO DISABLE SIDEBAR FOR THE MARKERS
    marker.feature = {
      properties: {
        institution: data.elements[row]["Institution"],
        dokumentation: data.elements[row]["Dokumentationens namn"],
        url: data.elements[row]["Dokumentationens webbplats"],
        kontaktperson: data.elements[row]["Kontaktperson"],
        mejl: data.elements[row]["Mejl till kontaktperson (om det ska synas)"],
        telefon: data.elements[row]["Telefonnr till kontaktperson (om det ska synas)"]
      },
    };
    marker.on({
      click: function (e) {
        L.DomEvent.stopPropagation(e);
        document.getElementById("sidebar-title").innerHTML =
          e.target.feature.properties.institution;
        document.getElementById("sidebar-content").innerHTML = "";
        if(e.target.feature.properties.dokumentation != "") {
          document.getElementById("sidebar-content").innerHTML += "Dokumentation: " + e.target.feature.properties.dokumentation;
        }
        if(e.target.feature.properties.url != "") {
          document.getElementById("sidebar-content").innerHTML += '<br/>Webbplats: <a href="' + e.target.feature.properties.url + '" target="_blank">' + e.target.feature.properties.url + "</a>"
        }
        if(e.target.feature.properties.kontaktperson != "") {
          document.getElementById("sidebar-content").innerHTML += "<br/>Kontaktperson: " + e.target.feature.properties.kontaktperson;
        }
        if(e.target.feature.properties.mejl != "") {
          document.getElementById("sidebar-content").innerHTML += '<br/>Mejladress: <a href="mailto:' + e.target.feature.properties.mejl + '">' + e.target.feature.properties.mejl + "</a>";
        }
        if(e.target.feature.properties.telefon != "") {
          document.getElementById("sidebar-content").innerHTML += "<br/>Telefon: " + e.target.feature.properties.telefon;
        }
        sidebar.open(panelID);
      },
    });
    // COMMENT UNTIL HERE TO DISABLE SIDEBAR FOR THE MARKERS

    // AwesomeMarkers is used to create fancier icons
    let icon = L.AwesomeMarkers.icon({
      icon: "info-circle",
      iconColor: "white",
      markerColor: data[row].color,
      prefix: "fa",
      extraClasses: "fa-rotate-0",
    });
    if (!markerType.includes("circle")) {
      marker.setIcon(icon);
    }
  }
}

