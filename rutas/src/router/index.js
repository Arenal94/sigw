import Vue from 'vue'
import Router from 'vue-router'
import GoogleMap from '@/components/HelloWorld'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'GoogleMap',
      component: GoogleMap
    }
  ]
})
