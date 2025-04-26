import { createRouter, createWebHistory } from 'vue-router';
import axios from '../axios';
import store from '../store';
import Home from '../views/Home.vue';
import Memo from '../views/Memo.vue';
import Chatbot from '../views/Chatbot.vue';
import Chatlog from '../views/Chatlog.vue';
import Register from '../views/Register.vue';
import Login from '../views/Login.vue';

// route guard
const authCheck = async (to, from, next) => {
  try {
    let res = await axios.get('authCheck');
    let isAuthenticated =  Number(res.data.isAuthenticated)
    if (isAuthenticated) {
      next();
    } 
    else {
      window.$showSnackbar( "Please login." , "orange", 3000);
      await store.dispatch('logout')
      next('/login');
    }
  } catch (error) {
    window.$showSnackbar( "Please login." , "orange", 3000);
    await store.dispatch('logout')
    next('/login');
  }
}

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/chatbot', name: 'Chatbot', component: Chatbot, beforeEnter: authCheck},
  { path: '/memo', name: 'Memo', component: Memo , beforeEnter: authCheck},
  { path: '/chatlogs', name: 'Chatlog', component: Chatlog , beforeEnter: authCheck},
  { path: '/register', name: 'Register', component: Register },
  { path: '/login', name: 'Login', component: Login }
];

const router = createRouter({
  history: createWebHistory('/'),
  routes,
});

export default router;
