<template>
  <div class='all'>
 <GmapMap
  :center='{lat: 43.536900, lng: -5.637167}'
  :zoom='7'
  style='width: 100%; height: 100%'
>Busesmarkers
<GmapMarker
    ref='mapRef'
    :key='index'
    v-for='(m, index) in markers'
    :position='m.position'
    :clickable='true'
    :draggable='true'
    :icon='m.icon'
    :animation='m.animation'
    :title='m.title'
    :zIndex='m.zIndex'
    @click='center=m.position'
  />
  <GmapMarker
    ref='mapRef'
    :key='index'
    v-for='(m, index) in Busesmarkers'
    :position='m.position'
    :clickable='true'
    :draggable='true'
    :icon='m.icon'
    :animation='m.animation'
    :title='m.title'
    :zIndex='m.zIndex'
    @click='center=m.position'
  />
   <gmap-polyline v-bind:path.sync="filteredJourneyPath" v-bind:options="{ strokeColor:'#8A2BE2'}">
         </gmap-polyline>

</GmapMap>
<select id="trayecto" v-model="selectLine" @change="setTrayecto()" class="form-control sel">
<button id="buscarParada" type="button" class="btn btn-warning" v-on:click="buscarParada()">Buscar parada más próxima</button>
<div id="textoParada" class="textoParada">
  <p id="texto"></p>
</div>
</select>
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
      Busesmarkers: [],
      filteredJourneyPath: [],
      filteredBusPositions: [],
      places: [],
      nombres: [],
      puntoTrayecto: [],
      busPositions: [],
      lines: [],
      linesName: [],
      trayecto:10,
      flightPath:null,
      selectLine:"",
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
    this.createMap()
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
          zoom: 15
        });
        
      }
      var onOff = /** @type {!HTMLDivElement} */(
                document.getElementById('trayecto'));
      var parada = /** @type {!HTMLDivElement} */(
                document.getElementById('buscarParada'));
      var texto = /** @type {!HTMLDivElement} */(
                document.getElementById('textoParada'));
       map.controls[google.maps.ControlPosition.TOP_CENTER].push(onOff);
       map.controls[google.maps.ControlPosition.TOP_LEFT].push(parada);
       map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(texto);
    });
  },
  methods: {
    createMap: function(){
      this.markers.push({
        position: this.center
      });
      let getDataPromise = new Promise((resolve, reject) =>
        resolve(this.getDataAPI())
      );

      getDataPromise.then(() => {
          this.relateLinesAndJourney();
          this.drawDataOnGoogleMap();
          let promiseLines = new Promise((resolve, reject) =>
          resolve(this.getLinesName())
        );
        promiseLines.then(() => {
          this.setSelectLines();
        });
      });
    },
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
    getLinesName: function(){
      
      for(var i in this.lines){
        if(!this.checkLine(this.lines[i].idlinea)){
          this.linesName.push({name:this.lines[i].descripcion, id:this.lines[i].idlinea})
        }
      }
    },
    checkLine: function(number){
      for(var i in this.linesName){
        if(number === this.linesName[i].idlinea){
          return true;
        }
      }
      return false;
    },
    setTrayecto: function(){
      this.trayecto = this.getIdLine(this.selectLine)
      this.deletemarkers()
      this.createMap()
    },
    setSelectLines: function(){
      for(var i in this.linesName){
        var x = document.getElementById("trayecto");
        var option = document.createElement("option");
        option.text = this.linesName[i].name;
        x.add(option);
      }
      
    },
    deletemarkers: function(){
      this.flightPath.setMap(null)
      this.filteredJourneyPath = [];
      this.markers = []
    },
    getIdLine: function(name){
      for(var i in this.linesName){
        if(name === this.linesName[i].name){
         return this.linesName[i].id;
        }
      }
      return 1;
    },
    buscarParada: function(){
      var userPosition = new google.maps.LatLng(this.markers[0].position.lat, this.markers[0].position.lng )
      var distanciaFinal = 999999999999999999999999;
      var posicionFinal = null;
      for(var i in this.markers){
        if(i!=0){
          var markerPosition =this.markers[i].position
          var distancia = google.maps.geometry.spherical.computeDistanceBetween(userPosition, markerPosition).toFixed(2)/1000
          if(distancia<= distanciaFinal){
            distanciaFinal = distancia
            posicionFinal = markerPosition
          }
        }
      }
      var markerFinal = new google.maps.Marker({
              map: this.map,
              animation: google.maps.Animation.DROP,
              position: posicionFinal,
              icon : "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
              zIndex:8,
              title: "Parada mas próxima a tu posición"
             });
      this.markers.push(markerFinal)
      document.getElementById('texto').innerHTML='La parada mas próxima a tu posición se encuentra a '+ Math.round((distanciaFinal * 1000) * 100) / 100  +' metros'
    },
    relateLinesAndJourney() {
      var lineas = this.lines;
      this.puntoTrayecto.map(function(trayecto, value) {
        lineas.map(function(linea, value) {
          if (linea.idlinea == trayecto.idlinea) {
            trayecto.infolinea = linea;
          }
        });
      });
    },
    drawDataOnGoogleMap() {
      let filteredJourney = this.puntoTrayecto.filter(
        journey => journey.idlinea == this.trayecto
      );
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
          icon: pinImage,
          title:
            filteredJourney[i].infolinea.descripcion +
            " Linea: " +
            filteredJourney[i].idlinea
        });
        this.markers.push(marker);
      }
      this.flightPath = new google.maps.Polyline({
        path: this.filteredJourneyPath,
        geodesic: true,
        strokeColor: "#8A2BE2",
        strokeOpacity: 1.0,
        strokeWeight: 0.25
      });
      this.flightPath.setMap(this.map)
      this.filteredBusPositions = this.busPositions.filter(
        bus => bus.idlinea == this.trayecto
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
          icon:
            "http://icons.iconarchive.com/icons/flaticonmaker/flat-style/24/bus-icon.png",
          title:
            this.filteredBusPositions[j].idautobus +
            " - " +
            this.filteredBusPositions[j].modelo
        });
        this.Busesmarkers.push(marker);
      }
    },
    busPositionsRefresh() {
      const self = this;
      setInterval(function() {
        self.refreshBusPositionsData();
        self.deleteOldBusPositions();
        self.addBusMarkers();
      }, 5000);
    },
    refreshBusPositionsData() {
      return axios
        .get("http://datos.gijon.es/doc/transporte/busgijontr.json")
        .then(response => {
          this.filteredBusPositions = response.data.posiciones.posicion.filter(
            bus => bus.idlinea == this.trayecto
          );
        });
    },
    deleteOldBusPositions() {
      let busMarkers = this.markers.filter(marker => marker.isBus !=undefined);
      this.markers = this.markers.filter( ( el ) => !busMarkers.includes( el ) );
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
.sel{
  width:35%;
}
.textoParada{
	background-color: #FFFFFF;
	opacity: 0.85;
	margin: 0 auto;
	width: 35%;
	overflow: auto;
	margin-left: 1%;
  padding: 15px;
}

#trayecto{
  margin-top: 10px;
}

#buscarParada{
  margin-top: 10px;
  margin-left: 10px;
}

p{
    font-size: 17px;
    font-weight: bold;
}
</style>
