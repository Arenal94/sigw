<template>
  <div class="all">
 <GmapMap
  :center="{lat:43.362395, lng:-5.849154}"
  :zoom="7"
  map-type-id="terrain"
  style="width: 100%; height: 100%"
>
<GmapMarker
    :key="index"
    v-for="(m, index) in markers"
    :position="m.position"
    :clickable="true"
    :draggable="true"
    @click="center=m.position"
  />
</GmapMap>
  </div>
</template>

<script>
import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'
export default {
  name: 'GoogleMap',
  data () {
    return {
      center: { lat: 43.362395, lng: -5.849154 },
      markers: [],
      places: []
    }
  },
  created () {
    this.markers.push({
      position: this.center,
      icon: 'https://maps.google.com/mapfiles/kml/shapes/parking_lot_maps.png'
    })
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
