import axios from 'axios';
import router from './router/router.js'

const instance = axios.create({
  baseURL: 'https://fyp-backend-629590115382.asia-northeast1.run.app/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

instance.interceptors.response.use(
  (res) => {
    if (res.status === 401) {   // reroute to login page if unauthorized
      window.$showSnackbar("Please login.", "orange", 3000);
      router.push('/login')
    }
    return res;
  },
  (error) => {
    if (error.response && error.response.status === 401) {  // reroute to login page if unauthorized
      window.$showSnackbar("Please login.", "orange", 3000);
      router.push('/login')
    }
    else if (error.response && error.response.status === 400) {
      window.$showSnackbar(error.response.data.message, "orange", 3000);
    }
    else if (error.response && error.response.status === 500) {
      window.$showSnackbar(error.response.data.message, "red", 3000);
    }
    return Promise.reject(error.response.data);
  }
)

export default instance;