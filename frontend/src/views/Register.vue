<template>
    <div class="page">
        <div class="centerDiv max_div">
            <v-card class="dialogBox registerBox pad_top" title="Register">
                <v-form v-model="register.isValid" class="dialogform" @submit.prevent="submit_register">
                    <v-text-field v-model="register.username" class="pad_top pad_btm" :rules="[register.usernameRule]" label="Username" autocomplete="off" required></v-text-field>
                    <v-text-field v-model="register.password" class="pad_btm" :rules="[register.passwordRule]" label="Password" autocomplete="off" required></v-text-field>
                    <div class="centerDiv">
                        <v-btn text="Register" type="submit" color="var(--secondary_dark)" variant="flat"></v-btn>
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

const router = useRouter();

const usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
const passwordRegex = /^(?=(?:.*[a-z]){1})(?=(?:.*[A-Z]){1})(?=(?:.*\d){1})(?=(?:.*[!@#$%^&*_-]){1}).{8,20}$/;

let isDupe = false;

const register = ref({
    isValid: false,
    username: "",
    password: "",
    usernameRule: async (username) => {
        try {
            isDupe = await axios.get('/register/checkUsername', {   // check if username exists already
                params: {
                    username: username
                }
            })
            isDupe = Number(isDupe.data);
        }
        catch {
            isDupe = false;
        }

        if (isDupe) { return "Username has been taken." }
        if (usernameRegex.test(username)) {
            return true;
        }
        else {
            if (!username) { return "You must enter a username."; }
            if (!/^[a-zA-Z0-9_.-]+$/.test(username)) { return "Username can only include letters, numbers and special characters including .-_"; }
            if (username.length < 3 || username.length > 20) { return "Username must be 3-20 characters."; }
            return false;
        }
    },
    passwordRule: (password) => {
        if (passwordRegex.test(password)) {
            return true;
        }
        else {
            if (!password) { return "You must enter a password."; }
            if (!/[a-z]/.test(password)) { return "Password must include at least 1 lowercase letter."; }
            if (!/[A-Z]/.test(password)) { return "Password must include at least 1 uppercase letter."; }
            if (!/\d/.test(password)) { return "Password must include at least 1 number."; }
            if (!/[!@#$%^&*-]/.test(password)) { return "Password must include at least 1 special character in !@#$%^&*-"; }
            if (password.length < 8 || password.length > 20) { return "Password must be 8-20 characters."; }
            return false;
        }
    }
});

const submit_register = () => {
    if (register.value.isValid) {
        axios.post('/register/addAccount', {
            username: register.value.username,
            password: register.value.password
        }).then(res => {
            window.$showSnackbar("Successfully registered account.", "green", 3000);
            router.push('/login')
        }).catch(error => {
            window.$showSnackbar("Failed to register account.", "red", 3000);
        })
    }
}

</script>

<style scoped>
.max_div {
    height: 100%;
    width: 100%;
}
.registerBox {
    min-width: 250px;
    width: 400px;
    height: 350px;
}
.pad_top {
    padding-top: 18px;
}
.pad_btm {
    padding-bottom: 18px;
}
</style>