<template>
    <div class="page">
        <div class="centerDiv max_div">
            <v-card class="dialogBox loginBox pad_top" title="Login">
                <v-form v-model="login.isValid" class="dialogform" @submit.prevent="submit_login">
                    <v-text-field v-model="login.username" class="pad_top pad_btm" :rules="[login.usernameRule]" label="Username" autocomplete="off" spellcheck="false" required></v-text-field>
                    <v-text-field v-model="login.password" :rules="[login.passwordRule]" label="Password" autocomplete="off" spellcheck="false" required></v-text-field>
                    <div class="pad_btm">
                        <a href="https://fyp-frontend-629590115382.asia-northeast1.run.app/register" class="register_link"> Dont have an account? Register here! </a>
                    </div>
                    <div class="centerDiv">
                        <v-btn text="Login" type="submit" color="var(--secondary_dark)" variant="flat"></v-btn>
                    </div>
                </v-form>
            </v-card>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import axios from '../axios';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();
const usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;

const login = ref({
    isValid: false,
    username: "",
    password: "",
    usernameRule: (username) => {
        if (usernameRegex.test(username)) {
            return true;
        }
        else {
            if (!username) { return "You must enter a username."; }
            if (!/^[a-zA-Z0-9_.-]+$/.test(username)) { return "Usernames only include letters, numbers and special characters including .-_"; }
            if (username.length < 3 || username.length > 20) { return "Usernames are 3-20 characters."; }
            return false;
        }
    },
    passwordRule: (password) => {
        if (!password) { return "You must enter a password."; }
        else { return true; }
    }
});

const submit_login = () => {
    if (login.value.isValid) {
        axios.post('/login/loginAccount', {
            username: login.value.username,
            password: login.value.password
        })
        .then(res => {
            // store
            store.dispatch('login', {
                userID: res.data.userData.userID,
                username: res.data.userData.username
            })
            .then(() => {
                router.push('/')
                window.$showSnackbar("Login successful.", "green", 3000);
            })
        })
        .catch(err => {
            window.$showSnackbar("Login failed.", "red", 3000);
        })
    }
}

</script>

<style scoped>
.max_div {
    height: 100%;
    width: 100%;
}
.loginBox {
    min-width: 250px;
    width: 400px;
    height: fit-content;
}
.pad_top {
    padding-top: 18px;
}
.pad_btm {
    padding-bottom: 18px;
}
.register_link {
    text-decoration: none;
    color:var(--secondary);
}
.register_link:hover {
    color: rgb(165, 255, 255);
}
</style>