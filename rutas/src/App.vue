<template>
  <div id="app" class="all">
    <google-map />
  </div>
</template>

<script>
import GoogleMap from '@/components/HelloWorld'

export default {
  name: 'App',
  components: {
    GoogleMap
  }
}
</script>
<style>
.all{height:100%}
</style>
