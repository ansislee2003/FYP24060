import Vuex from 'vuex';

export default new Vuex.Store({
  state: {
    userID: null,
    username: null
  },
  mutations: {
    setUserID(state, userID) {
      state.userID = userID;
    },
    setUsername(state, username) {
      state.username = username;
    },
    clearUserData(state) {
      state.userID = null;
      state.username = null;
    }
  },
  actions: {
    login({ commit }, userData) {
      commit('setUserID', userData.userID);
      commit('setUsername', userData.username);
    },
    logout({ commit }) {
      commit('clearUserData');
    }
  },
  getters: {
    getUserID: (state) => { return state.userID; },
    getUsername: (state) => { return state.username; }
  }
});