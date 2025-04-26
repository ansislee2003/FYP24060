import { createApp } from 'vue'
import App from './App.vue'
import { createVuetify } from 'vuetify'
import router from './router/router.js'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import './assets/style.css'
import store from './store';

const vuetify = createVuetify({
  components,
  directives,
  provide: {
    layout: () => ({})
  }
})

const app = createApp(App);
app.use(router);
app.use(vuetify);
app.use(store);
app.mount('#app');
