<template>
  <div class='all'>
 <GmapMap
  :center='{lat:43.362395, lng:-5.849154}'
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
    @click='center=m.position'
  />
</GmapMap>
  </div>
</template>

<script>
import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'
import {gmapApi} from 'vue2-google-maps'
export default {
  name: 'GoogleMap',
  data () {
    return {
      center: { lat: 43.362395, lng: -5.849154 },
      markers: [],
      places: [],
      nombres: [],
      mapas: [{nombre: 'PNOA ES', versionWMS: '1.3.0', url: 'http://www.ign.es/wms-inspire/pnoa-ma?request=GetMap&service=WMS&VERSION=1.3.0&LAYERS=OI.OrthoimageCoverage'},
        {nombre: 'Raster ES', versionWMS: '1.3.0', url: 'http://www.ign.es/wms-inspire/mapa-raster?request=GetMap&service=WMS&VERSION=1.3.0&LAYERS=mtn_rasterizado'},
        {nombre: 'Raster FR', versionWMS: '1.1.1', url: 'http://mapsref.brgm.fr/WMS-C-REF/?request=GetMap&service=WMS&VERSION=1.1.1&LAYERS=REF93'},
        {nombre: 'RASTER PT', versionWMS: '1.3.0', url: 'http://mapas.dgterritorio.pt/wms/sc500k?request=GetMap&service=WMS&VERSION=1.3.0&LAYERS=sc500k'},
        {nombre: 'OCM', versionWMS: 'no_version', url: 'http://a.tile.opencyclemap.org/cycle/'},
        {nombre: 'OSM', versionWMS: 'no_version', url: 'http://a.tile.openstreetmap.org/'},
        {nombre: 'Landscape', versionWMS: 'no_version', url: 'http://a.tile.thunderforest.com/landscape/'},
        {nombre: 'Toner', versionWMS: 'topo', url: '.tile.stamen.com/toner/'},
        {nombre: 'Terrain', versionWMS: 'topo', url: '.tile.stamen.com/terrain/'},
        {nombre: 'TopoMap', versionWMS: 'topo', url: '.tile.opentopomap.org/'}]
    }
  },
  created () {
    this.markers.push({
      position: this.center,
      icon: 'https://maps.google.com/mapfiles/kml/shapes/parking_lot_maps.png'
    })
  },
  computed: {
    google: gmapApi
  },
  mounted () {
    for (var i in this.mapas) {
      this.nombres.push(this.mapas[i].nombre)
    }
    this.$refs.mapRef[0].$mapPromise.then((map) => {
      this.nombres.push(this.google.maps.MapTypeId.ROADMAP)
      this.nombres.push(this.google.maps.MapTypeId.SATELLITE)
      for (var i in this.mapas) {
        map.mapTypes.set(this.mapas[i].nombre, this.getMps(this.mapas[i].nombre, i, map, this.mapas, this.google))
        map.setOptions(
          {
            mapTypeControlOptions: {
              position: this.google.maps.ControlPosition.TOP_RIGHT,
              style: this.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
              mapTypeIds: this.nombres
            }
          })
      }
    })
  },
  methods: {
    getMps: function (nombre, i, map, mapas, google) {
      return new this.google.maps.ImageMapType({
        getTileUrl: function (coord, zoom) {
          if (mapas[i].nombre === nombre) {
            if (mapas[i].versionWMS === '1.3.0') {
              var projection = map.getProjection()
              var zpow = Math.pow(2, zoom)
              var ul = new google.maps.Point(coord.x * 256.0 / zpow, (coord.y + 1) * 256.0 / zpow)
              var lr = new google.maps.Point((coord.x + 1) * 256.0 / zpow, (coord.y) * 256.0 / zpow)
              var ulw = projection.fromPointToLatLng(ul)
              var lrw = projection.fromPointToLatLng(lr)
              var bbox = ulw.lat() + ',' + ulw.lng() + ',' + lrw.lat() + ',' + lrw.lng()
              return mapas[i].url + '&STYLES=&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE&CRS=EPSG:4326&WIDTH=250&HEIGHT=250&BBOX=' + bbox
            }
            else if (mapas[i].versionWMS === '1.1.1') {
              var projection = map.getProjection()
              var zpow = Math.pow(2, zoom)
              var ul = new google.maps.Point(coord.x * 256.0 / zpow, (coord.y + 1) * 256.0 / zpow)
              var lr = new google.maps.Point((coord.x + 1) * 256.0 / zpow, (coord.y) * 256.0 / zpow)
              var ulw = projection.fromPointToLatLng(ul)
              var lrw = projection.fromPointToLatLng(lr)
              var bbox = ulw.lng() + ',' + ulw.lat() + ',' + lrw.lng() + ',' + lrw.lat()
              return mapas[i].url + '&STYLES=&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE&SRS=EPSG:4326&WIDTH=250&HEIGHT=250&BBOX=' + bbox + '&WIDTH=256&HEIGHT=256'
            }
            else if (mapas[i].versionWMS === 'topo') {
              var tilesPerGlobe = 1 << zoom
              var x = coord.x % tilesPerGlobe
              if (x < 0) {
                x = tilesPerGlobe + x
              }
              return 'http://a' + mapas[i].url + zoom + '/' + x + '/' + coord.y + '.png'
            }
            else {
              var tilesPerGlobe = 1 << zoom
              var x = coord.x % tilesPerGlobe
              if (x < 0) {
                x = tilesPerGlobe + x
              }
              return mapas[i].url + zoom + '/' + x + '/' + coord.y + '.png'
            }
          }
        },
        isPng: false,
        maxZoom: 20,
        minZoom: 1,
        name: this.mapas[i].nombre,
        tileSize: new this.google.maps.Size(256, 256)
      })
    }
  }
}
Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyCJ5GI9TFx8kPwL8dyViS5UUDIybpH36IE',
    libraries: 'places'
  }
})
</script>
<style>
.all{height:100%}
</style>
