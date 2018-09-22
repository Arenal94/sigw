<template>
  <div class='all'>
 <GmapMap
  :center='{lat: 43.536900, lng: -5.637167}'
  :zoom='7'
  style='width: 100%; height: 100%'
>
<GmapMarker
    ref='mapRef'
    :key='index'
    v-for='(m, index) in markers'
    :position='m.position'
    :clickable='true'
    :draggable='true'
    :icon='m.url'
    :title='m.title'
    @click='center=m.position'
  />
  <GmapMarker
    ref='mapRef'
    :key='index'
    v-for='(m, index) in busMarkers'
    :position='m.position'
    :clickable='true'
    :draggable='true'
    :icon='m.url'
    :title='m.title'
    @click='center=m.position'
  />
   <gmap-polyline v-bind:path.sync="filteredJourneyPath" v-bind:options="{ strokeColor:'#008000'}">
         </gmap-polyline>

</GmapMap>
  </div>
</template>

<script>
import Vue from "vue";
import * as VueGoogleMaps from "vue2-google-maps";
import { gmapApi } from "vue2-google-maps";
import axios from "axios";
window.utm = require("utm");
export default {
  name: "GoogleMap",
  data() {
    return {
      center: { lat: 43.5369, lng: -5.637167 },
      markers: [],
      busMarkers: [],
      filteredJourneyPath: [],
      filteredBusPositions: [],
      places: [],
      nombres: [],
      puntoTrayecto: [],
      busPositions: [],
      lines: [],
      mapas: [
        {
          nombre: "PNOA ES",
          versionWMS: "1.3.0",
          url:
            "http://www.ign.es/wms-inspire/pnoa-ma?request=GetMap&service=WMS&VERSION=1.3.0&LAYERS=OI.OrthoimageCoverage"
        },
        {
          nombre: "Raster ES",
          versionWMS: "1.3.0",
          url:
            "http://www.ign.es/wms-inspire/mapa-raster?request=GetMap&service=WMS&VERSION=1.3.0&LAYERS=mtn_rasterizado"
        },
        {
          nombre: "Raster FR",
          versionWMS: "1.1.1",
          url:
            "http://mapsref.brgm.fr/WMS-C-REF/?request=GetMap&service=WMS&VERSION=1.1.1&LAYERS=REF93"
        },
        {
          nombre: "RASTER PT",
          versionWMS: "1.3.0",
          url:
            "http://mapas.dgterritorio.pt/wms/sc500k?request=GetMap&service=WMS&VERSION=1.3.0&LAYERS=sc500k"
        },
        {
          nombre: "OCM",
          versionWMS: "no_version",
          url: "http://a.tile.opencyclemap.org/cycle/"
        },
        {
          nombre: "OSM",
          versionWMS: "no_version",
          url: "http://a.tile.openstreetmap.org/"
        },
        {
          nombre: "Landscape",
          versionWMS: "no_version",
          url: "http://a.tile.thunderforest.com/landscape/"
        },
        { nombre: "Toner", versionWMS: "topo", url: ".tile.stamen.com/toner/" },
        {
          nombre: "Terrain",
          versionWMS: "topo",
          url: ".tile.stamen.com/terrain/"
        },
        { nombre: "TopoMap", versionWMS: "topo", url: ".tile.opentopomap.org/" }
      ]
    };
  },
  async created() {
    const self = this;
    this.markers.push({
      position: this.center
    });
    let getDataPromise = new Promise((resolve, reject) =>
      resolve(this.getDataAPI())
    );

    getDataPromise.then(() => {
      this.relateLinesAndJourney();
      this.drawDataOnGoogleMap();
      this.busPositionsRefresh();
    });
  },
  computed: {
    google: gmapApi
  },
  mounted() {
    for (var i in this.mapas) {
      this.nombres.push(this.mapas[i].nombre);
    }
    this.$refs.mapRef[0].$mapPromise.then(map => {
      this.nombres.push(this.google.maps.MapTypeId.ROADMAP);
      this.nombres.push(this.google.maps.MapTypeId.SATELLITE);
      for (var i in this.mapas) {
        map.mapTypes.set(
          this.mapas[i].nombre,
          this.getMps(this.mapas[i].nombre, i, map, this.mapas, this.google)
        );
        map.setOptions({
          mapTypeControlOptions: {
            position: this.google.maps.ControlPosition.TOP_RIGHT,
            style: this.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: this.nombres
          },
          zoom: 13
        });
      }
    });
  },
  methods: {
    getMps: function(nombre, i, map, mapas, google) {
      return new this.google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
          if (mapas[i].nombre === nombre) {
            if (mapas[i].versionWMS === "1.3.0") {
              var projection = map.getProjection();
              var zpow = Math.pow(2, zoom);
              var ul = new google.maps.Point(
                coord.x * 256.0 / zpow,
                (coord.y + 1) * 256.0 / zpow
              );
              var lr = new google.maps.Point(
                (coord.x + 1) * 256.0 / zpow,
                coord.y * 256.0 / zpow
              );
              var ulw = projection.fromPointToLatLng(ul);
              var lrw = projection.fromPointToLatLng(lr);
              var bbox =
                ulw.lat() + "," + ulw.lng() + "," + lrw.lat() + "," + lrw.lng();
              return (
                mapas[i].url +
                "&STYLES=&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE&CRS=EPSG:4326&WIDTH=250&HEIGHT=250&BBOX=" +
                bbox
              );
            } else if (mapas[i].versionWMS === "1.1.1") {
              var projection = map.getProjection();
              var zpow = Math.pow(2, zoom);
              var ul = new google.maps.Point(
                coord.x * 256.0 / zpow,
                (coord.y + 1) * 256.0 / zpow
              );
              var lr = new google.maps.Point(
                (coord.x + 1) * 256.0 / zpow,
                coord.y * 256.0 / zpow
              );
              var ulw = projection.fromPointToLatLng(ul);
              var lrw = projection.fromPointToLatLng(lr);
              var bbox =
                ulw.lng() + "," + ulw.lat() + "," + lrw.lng() + "," + lrw.lat();
              return (
                mapas[i].url +
                "&STYLES=&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE&SRS=EPSG:4326&WIDTH=250&HEIGHT=250&BBOX=" +
                bbox +
                "&WIDTH=256&HEIGHT=256"
              );
            } else if (mapas[i].versionWMS === "topo") {
              var tilesPerGlobe = 1 << zoom;
              var x = coord.x % tilesPerGlobe;
              if (x < 0) {
                x = tilesPerGlobe + x;
              }
              return (
                "http://a" +
                mapas[i].url +
                zoom +
                "/" +
                x +
                "/" +
                coord.y +
                ".png"
              );
            } else {
              var tilesPerGlobe = 1 << zoom;
              var x = coord.x % tilesPerGlobe;
              if (x < 0) {
                x = tilesPerGlobe + x;
              }
              return mapas[i].url + zoom + "/" + x + "/" + coord.y + ".png";
            }
          }
        },
        isPng: false,
        maxZoom: 20,
        minZoom: 1,
        name: this.mapas[i].nombre,
        tileSize: new this.google.maps.Size(256, 256)
      });
    },
    getDataAPI: function() {
      return axios
        .all([
          axios.get("http://datos.gijon.es/doc/transporte/busgijontray.json"),
          axios.get("http://datos.gijon.es/doc/transporte/busgijoninfo.json"),
          axios.get("http://datos.gijon.es/doc/transporte/busgijontr.json")
        ])
        .then(
          axios.spread((trayRes, InfoRes, TrRes) => {
            this.puntoTrayecto = trayRes.data.puntosTrayectos.puntoTrayecto;
            this.lines = InfoRes.data.lineas.linea;
            this.busPositions = TrRes.data.posiciones.posicion;
          })
        );
    },
    relateLinesAndJourney() {
      var lineas = this.lines;
      this.puntoTrayecto.map(function(trayecto, value) {
        lineas.map(function(linea, value) {
          // console.log(`Comparando ${linea.idlinea} con  ${trayecto.idlinea}`)
          if (linea.idlinea == trayecto.idlinea) {
            trayecto.infolinea = linea;
          }
        });
      });
    },
    drawDataOnGoogleMap() {
      console.log(this.puntoTrayecto);
      console.log(this.busPositions);
      console.log(this.lines);
      let filteredJourney = this.puntoTrayecto.filter(
        journey => journey.idlinea == 1
      ); //Trayecto solo el 1
      var i;
      for (i = 0; i < filteredJourney.length; i++) {
        var pos = utm.toLatLon(
          filteredJourney[i].utmx,
          filteredJourney[i].utmy,
          30,
          "N"
        );
        this.filteredJourneyPath.push({
          lat: pos.latitude,
          lng: pos.longitude
        });
        var pinImage = new google.maps.MarkerImage(
          "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" +
            filteredJourney[i].infolinea.colorHex,
          new google.maps.Size(21, 34),
          new google.maps.Point(0, 0),
          new google.maps.Point(10, 34)
        );
        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(pos.latitude, pos.longitude),
          url: pinImage,
          title:
            filteredJourney[i].infolinea.descripcion +
            " Linea: " +
            filteredJourney[i].idlinea
        });
        this.markers.push(marker);
      }
      var flightPath = new google.maps.Polyline({
        path: this.filteredJourneyPath,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2
      });

      this.filteredBusPositions = this.busPositions.filter(
        bus => bus.idtrayecto == 1
      ); //SOLO BUSES TRAYECTO 1
      this.addBusMarkers();
    },
    addBusMarkers() {
      for (var j = 0; j < this.filteredBusPositions.length; j++) {
        var pos = utm.toLatLon(
          this.filteredBusPositions[j].utmx,
          this.filteredBusPositions[j].utmy,
          30,
          "N"
        );
        var marker = new google.maps.Marker({
          isBus:true,
          position: new google.maps.LatLng(pos.latitude, pos.longitude),
          url:
            "http://icons.iconarchive.com/icons/flaticonmaker/flat-style/24/bus-icon.png",
          title:
            this.filteredBusPositions[j].idautobus +
            " - " +
            this.filteredBusPositions[j].modelo
        });
        this.markers.push(marker);
      }
    },
    busPositionsRefresh() {
      const self = this;
      setInterval(function() {
        console.log("cojo datos");
        self.refreshBusPositionsData();
        console.log("borro buses");
        self.deleteOldBusPositions();
        console.log("pongo buses");
        self.addBusMarkers();
      }, 5000);
    },
    refreshBusPositionsData() {
      return axios
        .get("http://datos.gijon.es/doc/transporte/busgijontr.json")
        .then(response => {
          this.filteredBusPositions = response.data.posiciones.posicion.filter(
            bus => bus.idtrayecto == 1
          );
        });
    },
    deleteOldBusPositions() {
      let busMarkers = this.markers.filter(marker => marker.isBus !=undefined);
      console.log(busMarkers.length)
      console.log(this.markers.length)
      this.markers = this.markers.filter( ( el ) => !busMarkers.includes( el ) );
      console.log(this.markers.length)
    }
  }
};
Vue.use(VueGoogleMaps, {
  load: {
    key: "AIzaSyCJ5GI9TFx8kPwL8dyViS5UUDIybpH36IE",
    libraries: "places"
  }
});
</script>
<style>
.all {
  height: 100%;
}
</style>
