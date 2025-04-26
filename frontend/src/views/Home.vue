<template>
    <div class="page">
        <div ref="HI" class="horizontal">
            <div>
                <img class="robot" src="@/assets/robot.png" alt="robot"/>
                <a class="robot_ref" href="https://www.freepik.com/free-psd/cute-3d-robot-waving-hand-cartoon-vector-icon-illustration-people-technology-isolated-flat-vector_138484452.htm#fromView=search&page=5&position=10&uuid=6f0f98ba-af1d-441b-990a-86013f0fedce">Image by catalyststuff on Freepik</a>
            </div>
            <div class="title_block">
                <div class="title">  Improve your English with our interactive chat bot </div>
                <div class="subtitle"> Boost your confidence with unlimited English speaking practice and real-time feedback with the power of AI. </div>
                <v-btn class="button" @click="start()"> Get Started </v-btn>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const start = () => {
    router.push('/chatbot');
}
</script>

<style scoped>
.horizontal {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.title {
    font-size: clamp(2rem, 4.5vw, 4.5vw);
    font-weight: bolder;
    color: var(--secondary);
    text-align: center;
    padding-bottom: 3rem;
}
.subtitle {
    font-size: clamp(1rem, 1.5vw, 1.5vw);
    font-weight: 200;
    color: var(--text);
    text-align: center;
    padding-bottom: 3rem;
    max-width: 80%;
}
.title_block {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.button {
    background: var(--primary);
    color: var(--secondary);
    border: 2px solid var(--secondary);
    border-radius: 7px;
    padding: 0px 15px;
}
.robot {
    width: 36vw;
    height: 40vw;
}

@media (max-width: 450px) {
    .robot {
        display: none;
    }
    .robot_ref {
        display: none;
    }
}
</style>