<template>
  <v-app>
    <Navbar></Navbar>
    <v-main class="main_content">
      <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
        {{ snackbar.message }}
      </v-snackbar>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import Navbar from './components/Navbar.vue';
import { RouterView } from 'vue-router';
import { useStore } from 'vuex';
import axios from './axios';

const store = useStore();

let isAuthenticated = 0;
const checkAuth = () => {   // check authentication status with backend
  axios.get('/authCheck')
  .then(res => {
    isAuthenticated = Number(res.data.isAuthenticated);
    if (isAuthenticated) {
      store.dispatch('login', res.data.userData)
    }
  })
  .catch(err => {
    isAuthenticated = 0;
  })
}
checkAuth();

const snackbar = ref({message: "", show: false, color: "", timeout: 0});

const showSnackbar = (message, color, timeout) => {
  snackbar.value.show = false;
  setTimeout(() => {
    snackbar.value.message = message;
    snackbar.value.color = color;
    snackbar.value.show = true;
    snackbar.value.timeout = timeout;
  }, 200);
}

window.$showSnackbar = showSnackbar;
</script>

<style scoped>
</style>
