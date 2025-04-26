<template>
    <v-card class="dialogBox" title="General Settings">
        <div v-if="loading" class="centerDiv">
            <v-progress-linear class="progress_bar" color="blue-lighten-3" indeterminate :height="7"></v-progress-linear>
        </div>
        <v-form v-else v-model="settingOptions.isValid" class="dialogform" @submit.prevent="submitSettings()">

            <div class="padding_btm"> Your Accent: </div>
            <v-select class="padding_btm"
            v-model="settings.accent"
            :items="settingOptions.accent"
            item-title="label"
            return-object
            single-line
            :rules="[settingRule(settings.accent)]"
            :disabled="loading"
            ></v-select>
            
            <div class="padding_btm"> Translation Language: </div>
            <v-select class="padding_btm"
            v-model="settings.translationLang"
            :items="settingOptions.translationLang"
            item-title="label"
            return-object 
            single-line
            :rules="[settingRule(settings.translationLang)]"
            :disabled="loading"
            ></v-select>
            
            <div class="padding_btm"> Text-to-Speech Voice: </div>
            <v-select class="padding_btm"
            v-model="settings.ttsVoice" 
            :items="settingOptions.ttsVoice"
            :item-props="ttsVoice_props"
            return-object 
            single-line
            :rules="[settingRule(settings.ttsVoice)]"
            :disabled="loading"
            ></v-select>

            <div class="padding_btm"> Text-to-Speech Speed: </div>
            <v-slider class="padding_btm"
            v-model="settings.ttsSpeed" 
            :max="2"
            :min="0.1"
            :step="0.1"
            thumb-label="always"
            :rules="[settingRule(settings.ttsSpeed)]"
            :disabled="loading">
            </v-slider>

            <div class="centerDiv">
                <v-btn type="submit" text="Done" color="var(--secondary_dark)" variant="flat"></v-btn>
            </div>
        </v-form>
    </v-card>
</template>

<script setup>
import { ref } from 'vue'
import axios from '../axios'

const loading = ref(true);
const props = defineProps({
    modelValue: {   // settings
        type: Object,
        required: true,
    },
});

const ttsVoice_props = (voice) => ({
    title: voice.label,
    subtitle: voice.locale
});

const settingOptions = ref({
    isValid: false,
    accent: [
        { label: 'Australia', code: 'en-AU' },
        { label: 'Canada', code: 'en-CA' },
        { label: 'Hong Kong', code: 'en-HK' },
        { label: 'India', code: 'en-IN' },
        { label: 'Ireland', code: 'en-IE' },
        { label: 'Pakistan', code: 'en-PK' },
        { label: 'New Zealand', code: 'en-NZ' },
        { label: 'Singapore', code: 'en-SG' },
        { label: 'United Kingdom', code: 'en-GB' },
        { label: 'United States', code: 'en-US' }
    ],
    translationLang: [{ label:'Chinese (Traditional)', code:'ZH-HANT'}],
    ttsVoice: [{ label: 'Sonia', code: 'en-GB-SoniaNeural', locale: 'English (United Kingdom)' }],
    ttsSpeed: 1
});
const settings = ref({
    accent: props.modelValue.accent,
    translationLang: props.modelValue.translationLang,
    ttsVoice: props.modelValue.ttsVoice,
    ttsSpeed: props.modelValue.ttsSpeed
})
const settingRule = (setting) => {
    if (setting) { return true; }
    else { return "This field is required."; }
}

const emit = defineEmits(['update:modelValue']);

const submitSettings = () => {
    if (settingOptions.value.isValid) {
        axios.post('/chatbot/updateSettings', {
            accent: settings.value.accent,
            translationLang: settings.value.translationLang,
            ttsVoice: settings.value.ttsVoice,
            ttsSpeed: settings.value.ttsSpeed
        })
        .then(res => {
            let updatedSettings = settings.value;
            updatedSettings.editSettings = false;
            emit('update:modelValue', updatedSettings);
            window.$showSnackbar("Updated settings successfully.", "green", 3000);
        })
        .catch(err => {
            window.$showSnackbar("Failed to update settings.", "red", 3000);
        })
    }
};

const getSettingOptions = () => {
    axios.get('/chatbot/getSettingOptions')
    .then(res => {
        settingOptions.value.translationLang = res.data.options.translationLang;
        settingOptions.value.ttsVoice = res.data.options.ttsVoice;

        loading.value = false;
    })
    .catch(err => {
        let updatedSettings = props.modelValue;
        updatedSettings.editSettings = false;
        emit('update:modelValue', updatedSettings);

        loading.value = true;
        window.$showSnackbar("Failed to load settings.", "red", 3000);
    })
}

getSettingOptions();
</script>

<style scoped>
.padding_btm {
    padding-bottom: 10px;
}
</style>