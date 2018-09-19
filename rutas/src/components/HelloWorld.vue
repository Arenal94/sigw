<template>
  <div class="all">
 <GmapMap
  :center="{lat:10, lng:10}"
  :zoom="7"
  map-type-id="terrain"
  style="width: 100%; height: 100%"
>
</GmapMap>
  </div>
</template>

<script>
import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'
export default {
  name: 'GoogleMap'
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
