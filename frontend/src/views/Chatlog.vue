<template>
    <div class="page">
        <div class="spaceDiv breadcrumbs">
            <v-breadcrumbs :items="subheadings"></v-breadcrumbs>
        </div>

        <div v-if="display.chatPreview" class="chat_block_list">
            <template v-for="chat in chats">
                <v-card class="chat_block" @click="selectChat(chat._id, chat.title)">
                    <v-card-title class="chat_title">{{ chat.title }}</v-card-title>
                    <v-card-actions>
                        <label> Creation date: {{ new Date(chat.createdAt).toLocaleDateString('en-GB') }} </label>
                        <v-spacer/>
                        <Icon class="delete" @click.stop="toggleDeleteChatlog(chat._id, chat.title)" icon="material-symbols:delete-outline-rounded"/>
                    </v-card-actions>
                </v-card>
            </template>
        </div>

        <v-progress-linear v-if="!display.chatPreview && display.loading" class="progress_bar" color="blue-lighten-3" indeterminate :height="7"></v-progress-linear>
        
        <!--Chat -->
        <div v-if="!display.chatPreview && !display.loading" class="chat">
            <Chat v-model="selectedChat.message" :scenario="selectedChat.scenario" :settings="settings" :viewOnly="true"></Chat>
        </div>

        <div v-if="!display.chatPreview && !display.loading" class="toolbar">
            <div class="toolbarItem left">
                <v-btn icon class="iconBtn" @click="toggleSettings()">
                    <Icon class="iconBtnIcon" icon="material-symbols:settings"/>
                </v-btn>
                <v-btn icon class="iconBtn" style="margin-left: 1rem;" @click="toggleViewScenario()">
                    <Icon class="iconBtnIcon" icon="mdi:script"/>
                </v-btn>
            </div>
        </div>

        <!-- settings -->
        <v-dialog v-model="settings.editSettings" max-width="500px">
            <GeneralSettings v-model="settings"></GeneralSettings>
        </v-dialog>

        <!-- view scenario -->
        <v-dialog v-model="viewScenario" max-width="700px">
            <v-card class="dialogBox" title="Scenario Settings">
                <div class="dialogform">
                    <v-text-field v-model="selectedChat.scenario.title" label="Chat Title" readonly></v-text-field>
                    <v-textarea v-model="selectedChat.scenario.description" label="Describe the Scenario" readonly></v-textarea>
                    <v-textarea v-model="selectedChat.scenario.goal" label="Goal of Conversation" readonly></v-textarea>
                    <div class="spaceDiv">
                        <v-text-field v-model="selectedChat.scenario.userRole" label="Your Role" readonly></v-text-field>
                        <div class="paddingDiv"></div>
                        <v-text-field v-model="selectedChat.scenario.botRole" label="Chatbot's Role" readonly></v-text-field>
                    </div>
                    <v-radio-group v-model="selectedChat.scenario.engLevel" label="Your English Proficiency Level" inline>
                        <v-radio label="Beginner" value="beginner" color="var(--secondary)" readonly></v-radio>
                        <v-radio label="Intermediate" value="intermediate" color="var(--secondary)" readonly></v-radio>
                        <v-radio label="Advanced" value="advanced" color="var(--secondary)" readonly></v-radio>
                    </v-radio-group>
                    <div class="centerDiv">
                        <v-btn text="Done" color="var(--secondary_dark)" variant="flat" @click="toggleViewScenario()"></v-btn>
                    </div>
                </div>
            </v-card>
        </v-dialog>

        <!-- Delete chalog -->
        <v-dialog v-model="delChatlog.isOpen" max-width="500px">
            <v-card class="dialogBox" title="Delete Category">
                <v-card-text> Are you sure you want to delete '{{ delChatlog.title }}'? </v-card-text>
                <v-card-actions>
                    <v-btn text="Cancel" @click="toggleDeleteChatlog()"></v-btn>
                    <v-spacer></v-spacer>
                    <v-btn :disabled="delChatlog.loading" text="Delete" @click="deleteChatlog()" color="red" variant="flat"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </div>
    
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import axios from '../axios'
import Chat from '@/components/Chat.vue'
import GeneralSettings from '@/components/GeneralSettings.vue'
// breadcumbs
const subheadings = ref([{ title: "Chat Logs", disabled: false, href: 'https://fyp-frontend-629590115382.asia-northeast1.run.app/chatlogs' }])

const display = ref({ chatPreview: true, selectedChat_id: "", loading: true })
const chats = ref([]);
const selectedChat = ref({
    message: [],
    scenario: {
        title: "",
        description: "",
        goal: "",
        userRole: "",
        botRole: "",
        engLevel: ""
    }
});

//scenario
const viewScenario = ref(false);

const toggleViewScenario = () => {
    viewScenario.value = !viewScenario.value;
}

// settings
const settings = ref({
    editSettings: false,
    accent: { label: 'United States', code: 'en-US' },
    translationLang: { label:'Chinese (Traditional)', code:'ZH-HANT'},
    ttsVoice: { label: 'Sonia', code: 'en-GB-SoniaNeural', locale: 'English (United Kingdom)' },
    ttsSpeed: 1
});
// get user's customized settings
const getSettingConfigs = async () => {
    try {
        let res = await axios.get('/chatbot/getSettings')
        let { accent, translationLang, ttsVoice, ttsSpeed } = res.data.settings

        if (res.data.settings === null) {
            settings.value.accent = { label: 'United States', code: 'en-US' };
            settings.value.translationLang = { label:'Chinese (Traditional)', code:'ZH-HANT'};
            settings.value.ttsVoice = { label: 'Sonia', code: 'en-GB-SoniaNeural', locale: 'English (United Kingdom)' };
            settings.value.ttsSpeed = 1;
        }
        else {
            settings.value.accent = accent;
            settings.value.translationLang = translationLang;
            settings.value.ttsVoice = ttsVoice;
            settings.value.ttsSpeed = ttsSpeed;
        }
    }
    catch(err) {
        window.$showSnackbar("Failed to get setting configurations.", "red", 3000);
    }
}

const toggleSettings = () => {
    getSettingConfigs();
    settings.value.editSettings = !settings.value.editSettings;
}

// chatlog
const getChatlogList = () => {
    axios.get('/chatlog/getChatlogList')
    .then(res => {
        chats.value = res.data.chatlogs;
        display.value.loading = false;
    })
    .catch(error => {
        window.$showSnackbar("Failed to load chatlogs.", "red", 3000);
    })
}
// get chat log data
const selectChat = (_id, title) => {
    display.value.loading = true;
    display.value.chatPreview = false;

    display.value.selectedChat_id = _id;
    axios.get('/chatlog/getChatlog', {
        params: {
            _id: display.value.selectedChat_id
        }
    })
    .then(res => {
        let {message, scenario} = res.data;
        selectedChat.value.message = message;
        selectedChat.value.scenario = scenario;
        selectedChat.value.scenario.title = title;
        
        subheadings.value.push({title: title, disabled: false});
        display.value.loading = false;
    })
    .catch(error => {
        getChatlogList();
        display.value.chatPreview = true;

        window.$showSnackbar("Failed to load chatlog.", "red", 3000);
    })
}

// delete
const delChatlog = ref({
    isOpen: false,
    _id: null,
    title: null,
    loading : false
})
const toggleDeleteChatlog = (_id, title) => {
    if (!delChatlog.value.isOpen) {   // opening
        delChatlog.value._id = _id;
        delChatlog.value.title = title;
        delChatlog.value.isOpen = true;
    }
    else {
        delChatlog.value.isOpen = false;
        delChatlog.value._id = null;
        delChatlog.value.title = null;
    }
}

const deleteChatlog = () => {
    delChatlog.value.loading = true;

    axios.post('/chatlog/deleteChatlog', {
        _id: delChatlog.value._id,
        title: delChatlog.value.title
    })
    .then (res => {
        toggleDeleteChatlog();
        delChatlog.value.loading = false;
        getChatlogList();
        window.$showSnackbar("Deleted Category Successfully", "success", 3000);
    })
    .catch(error => {
        toggleDeleteChatlog();
        delChatlog.value.loading = false;
        window.$showSnackbar("Failed to Delete Category", "red", 3000);
    })
}

getSettingConfigs();
getChatlogList();
</script>

<style scoped>
.breadcrumbs {
    white-space: nowrap;
}

.chat_block_list {
    display: flex;
    flex-flow: wrap;
    overflow-y: scroll;
}

.chat_block {
    box-sizing: border-box;
    width: 300px;
    min-width: 200px;
    margin: 1rem 1rem 1rem 1rem;
    color: var(--primary_lighter);
}
.chat_block:hover {
    outline: 3px solid var(--secondary);
}

.chat_title {
    font-size: 1.5rem;
    text-align: center;
    padding-top: 2rem;
    padding-bottom: 1rem;
}

.chat {
    overflow-y: scroll;
    height: calc(100vh - 13rem);
    margin-bottom: 1.5rem;
}

.delete {
    height: 40px;
    width: 40px;
    color: rgb(235, 0, 0);
}
.delete:hover {
    color: rgb(159, 0, 0);
}

.paddingDiv {
    padding-left: 1rem;
    padding-right: 1rem;
}
</style>