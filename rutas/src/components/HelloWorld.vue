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

      places: [],
      nombres: [],
      puntoTrayecto: [],
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
    this.markers.push({
      position: this.center
    });
    this.obtainParadas();
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
    obtainParadas: function() {
      return axios
        .get("http://datos.gijon.es/doc/transporte/busgijontray.json", {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers":
              "Origin, X-Requested-With, Content-Type, Accept"
          }
        })
        .then(response => {
          this.puntoTrayecto = response.data.puntosTrayectos.puntoTrayecto;
          axios
            .get("http://datos.gijon.es/doc/transporte/busgijoninfo.json", {
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers":
                  "Origin, X-Requested-With, Content-Type, Accept"
              }
            })
            .then(response => {
              axios
                .get("http://datos.gijon.es/doc/transporte/busgijontr.json", {
                  headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers":
                      "Origin, X-Requested-With, Content-Type, Accept"
                  }
                })
                .then(response => {
                  var posiciones = response.data.posiciones.posicion;
                  console.log(posiciones);
                  for(var j=0; j<posiciones.length; j++){
                    var pos = utm.toLatLon(
                      posiciones[j].utmx,
                      posiciones[j].utmy,
                      30,
                      "N"
                    );
                    var marker = new google.maps.Marker({
                      position: new google.maps.LatLng(pos.latitude, pos.longitude),
                      url: 'http://icons.iconarchive.com/icons/flaticonmaker/flat-style/24/bus-icon.png',
                      title: posiciones[j].idautobus + ' - ' + posiciones[j].modelo
                    });
                    this.markers.push(marker);
                }
              });

              var lineas = response.data.lineas.linea;
              this.puntoTrayecto.map(function(trayecto, value) {
                lineas.map(function(linea, value) {
                  if (linea.idlinea == trayecto.idlinea) {
                    trayecto.infolinea = linea;
                  }
                });
              });
              var i;
              for (i = 0; i < 100; i++) {
                var pos = utm.toLatLon(
                  this.puntoTrayecto[i].utmx,
                  this.puntoTrayecto[i].utmy,
                  30,
                  "N"
                );
                var pinImage = new google.maps.MarkerImage(
                  "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" +
                    this.puntoTrayecto[i].infolinea.colorHex,
                  new google.maps.Size(21, 34),
                  new google.maps.Point(0, 0),
                  new google.maps.Point(10, 34)
                );
                var marker = new google.maps.Marker({
                  position: new google.maps.LatLng(pos.latitude, pos.longitude),
                  url: pinImage,
                  title:
                    this.puntoTrayecto[i].infolinea.descripcion +
                    " Linea: " +
                    this.puntoTrayecto[i].idlinea
                });
                this.markers.push(marker);
              }
            });
        });
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
