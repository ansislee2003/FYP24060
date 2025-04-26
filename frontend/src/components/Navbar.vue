<template>
    <v-app-bar class="appBar">
        <v-btn class="menu_button" size="small" @click.stop="toggle_drawer()">
            <Icon class="button_icon" icon="material-symbols:menu"/>
        </v-btn>
        <v-toolbar-title>
            <a class="navbar_link" href="https://fyp-frontend-629590115382.asia-northeast1.run.app">
                <div class="navbar_title secondary">
                    <Icon class="logo_icon" icon="lucide:bot-message-square"/>
                    <div> AI Chatting </div>
                </div>
            </a>
        </v-toolbar-title>
        <v-btn v-if="!username" size="large" class="button" @click.stop="login()">
            <Icon class="button_icon" icon="mdi:login"/>
            <span> Login </span>
        </v-btn>
        <v-btn v-else-if="username" size="large" class="button" @click.stop="logout()">
            <Icon class="button_icon" icon="mdi:login"/>
            <span> Log Out </span>
        </v-btn>
    </v-app-bar>

    <v-navigation-drawer class="nav_drawer" v-model="drawer" temporary>
        <v-list>
          <v-list-item class="secondary"
            prepend-avatar="/pfp.jpg"
            :title="username ? username : 'guest'"
          ></v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list v-for="page in pages" v-model="curr_tab" nav>
            <v-list-item @click="changeTab(page.path)">
                <template #prepend>
                    <Icon class="button_icon" :icon="page.icon"/>
                </template>
                <label class="list_title"> {{ page.title }} </label>
            </v-list-item>
        </v-list>
    </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router';
import axios from '../axios'
import { useStore } from 'vuex';
import { computed } from 'vue';

const router = useRouter();

const store = useStore();
const username = computed(() => { return store.getters.getUsername; } );

const drawer = ref(false);      // drawer close by default
const curr_tab = ref("home");
const pages = ref([     // drawer navigation options
    {title: "Home", value: "home", path: "/", icon: "line-md:home" },
    {title: "Chatbot", value: "chatbot", path: "/chatbot", icon: "lucide:bot-message-square" },
    {title: "Memo", value: "memo", path: "/memo", icon: "fluent-emoji-high-contrast:memo" },
    {title: "Chat Logs", value: "chatlogs", path: "/chatlogs", icon: "icon-park-outline:log" }
]);

const toggle_drawer = () => {
    drawer.value = !drawer.value;
}

const changeTab = (tab) =>{ 
    router.push(tab);
}

const login = () => {
    router.push("/login");
}

const logout = () => {
    axios.post('/logoutAccount', {
        username: "test"
    })
    .then(res => {
        store.dispatch('logout').then(() => {
            router.push("/login");
            window.$showSnackbar( res.data.message , "green", 3000);
        });
    })
    .catch(err => {
        window.$showSnackbar("Failed to logout.", "red", 3000);
    })
}
</script>

<style scoped>
.appBar {
    height: 4rem;
}
.nav_drawer {
    background: var(--primary);
}
.v-app-bar.v-toolbar {
    background: var(--primary);
}
.v-toolbar__content > .v-toolbar-title {
    margin-inline-start: 5px;
}
.logo_icon {
    color: var(--secondary);
    margin-right: 8px;
    min-width: 2rem;
    min-height: 2rem;
}
.button {
    color: var(--secondary);
    border: 2px solid var(--secondary);
    border-radius: 7px;
    padding: 0 10px;
}
.menu_button {
    display: flex;
    justify-content: center;
}
.button_icon {
    color: var(--secondary);
    margin-right: 0.2rem;
    height: 2rem;
    width: 2rem;
}
.list_title {
    color: var(--secondary);
    margin-left: 0.3rem;
    font-size: 1.2rem;
}
.secondary {
    color: var(--secondary);
}
.navbar_title {
    display: flex;
    align-items: center;
    font-weight: 300;
}
.navbar_link{
    text-decoration: none;
}

@media (max-width: 335px) {
    .logo_icon {
        display: none;
    }
}
</style>