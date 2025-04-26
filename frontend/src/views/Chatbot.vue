<template>
    <div class="page">
        <v-dialog v-model="setScenario" max-width="700px" persistent>
            <v-card class="dialogBox" title="Scenario Settings">
                <v-form v-model="scenario.isValid" class="dialogform" @submit.prevent="submitScenario()">
                    <v-text-field v-model="scenario.title" :rules="[scenario.shortTxtRule]" label="Chat Title" autocomplete="off" required></v-text-field>
                    <v-textarea v-model="scenario.description" :rules="[scenario.longTxtRule]" label="Describe the Scenario"></v-textarea>
                    <v-textarea v-model="scenario.goal" :rules="[scenario.longTxtRule]" label="Goal of Conversation"></v-textarea>
                    <div class="spaceDiv">
                        <v-text-field v-model="scenario.userRole" class="short_input" :rules="[scenario.shortTxtRule]" label="Your Role" autocomplete="off"></v-text-field>
                        <div class="paddingDiv"></div>
                        <v-text-field v-model="scenario.botRole" class="short_input" :rules="[scenario.shortTxtRule]" label="Chatbot's Role" autocomplete="off"></v-text-field>
                    </div>
                    <v-radio-group v-model="scenario.engLevel" label="Your English Proficiency Level" inline>
                        <v-radio label="Beginner" value="beginner" color="var(--secondary)"></v-radio>
                        <v-radio label="Intermediate" value="intermediate" color="var(--secondary)"></v-radio>
                        <v-radio label="Advanced" value="advanced" color="var(--secondary)"></v-radio>
                    </v-radio-group>
                    <div class="spaceDiv">
                        <v-btn class="cancelBtn" text="Back" href="https://fyp-frontend-629590115382.asia-northeast1.run.app" variant="flat"></v-btn>
                        <v-btn :disabled="scenario.isSubmitted" text="Submit" type="submit" color="var(--secondary_dark)" variant="flat"></v-btn>
                    </div>
                </v-form>
            </v-card>
        </v-dialog>
        
        <div class="chat" ref="ChatRef">
            <Chat v-model="msgs" :scenario="scenario" :settings="settings"></Chat>
        </div>
        
        <div class="toolbar">
            <div class="toolbarItem left">
                <v-btn icon class="iconBtn" @click="toggleSettings()">
                    <Icon class="iconBtnIcon" icon="material-symbols:settings"/>
                </v-btn>
                <v-btn icon class="iconBtn" style="margin-left: 1rem;" @click="toggleViewScenario()">
                    <Icon class="iconBtnIcon" icon="mdi:script"/>
                </v-btn>
            </div>
            <!-- record -->
            <div class="toolbarItem center">
                <v-btn v-if="isSaved == null" :disabled="isRecDisabled" icon :class="isRecDisabled ? 'chatBtnDisabled' : !isRecording ? 'chatBtn' : 'chatBtnPressed'" @click="toggleRecording()">
                    <Icon v-if="!isRecording" :class="isRecDisabled ? 'chatIconDisabled' : 'chatIcon'" icon="fontisto:mic"/>
                    <Icon v-else :class="isRecDisabled ? 'chatIconDisabled' : 'chatIconPressed'" icon="material-symbols:stop"/>
                </v-btn>
                <v-btn v-if="isSaved != null" icon class="chatBtn" @click="toggleSaveWindow()">
                    <Icon class="chatIcon" icon="ci:redo"/>
                </v-btn>
            </div>
            <!-- Suggestions -->
            <div class="toolbarItem right hidden">
                <v-btn icon class="iconBtn" @click="toggleSuggestion()">
                    <Icon class="iconBtnIcon" icon="mdi:lightbulb-on"/>
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
                    <v-text-field v-model="scenario.title" label="Chat Title" readonly></v-text-field>
                    <v-textarea v-model="scenario.description" label="Describe the Scenario" readonly></v-textarea>
                    <v-textarea v-model="scenario.goal" label="Goal of Conversation" readonly></v-textarea>
                    <div class="spaceDiv">
                        <v-text-field v-model="scenario.userRole" label="Your Role" readonly></v-text-field>
                        <div class="paddingDiv"></div>
                        <v-text-field v-model="scenario.botRole" label="Chatbot's Role" readonly></v-text-field>
                    </div>
                    <v-radio-group v-model="scenario.engLevel" label="Your English Proficiency Level" inline>
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

        <v-dialog v-model="resave" max-width="500px">
            <v-card class="dialogBox" title="Delete Category">
                <v-card-text> The chat has not been saved. Would you like to save before refreshing? </v-card-text>
                <v-card-actions>
                    <v-btn text="Save" @click="saveChatlog()" color="var(--secondary_dark)" variant="flat"></v-btn>
                    <v-spacer></v-spacer>
                    <v-btn text="Restart" @click="refresh()" color="red" variant="flat"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useStore } from 'vuex';
import { io } from 'socket.io-client';
import { onBeforeRouteLeave } from 'vue-router';
import axios from '../axios'
import Chat from '@/components/Chat.vue'
import GeneralSettings from '@/components/GeneralSettings.vue'

const isSaved = ref(null);  // non null value shows refresh button
const resave = ref(false);
const toggleSaveWindow = () => {
    if (isSaved.value) {    // refresh
        window.location.reload();
    }
    else {  // ask if retry saving chat
        resave.value = true;
    }
}
const refresh = () => {
    window.location.reload();
}

const msgs = ref([]);

const extractChatHistory = () => {  // parse all messages
    let chatHistory = "";
    for (let i = 0; i < msgs.value.length; i++) {
        chatHistory += `${msgs.value[i].sender}: ${formatMsg(msgs.value[i].message)}`;
        if (i < msgs.value.length - 1) {
            chatHistory += '\n';
        }
    }
    return chatHistory;
}

const formatMsg = (text) => {   // parse 1 mesage
    let formatted = text.map(sentence => sentence.join(' '));
    formatted = formatted.join('\n')
    return formatted;
}

// scenario
const setScenario = ref(true);
const viewScenario = ref(false);
const scenario = ref({
    isValid: false,
    isSubmitted: false,
    isEnd: 0,
    title: "Chat Test",
    description: "Ordering in a restaurant",
    goal: "Order a full course meal",
    userRole: "Customer",
    botRole: "Waiter",
    engLevel: "beginner",
    shortTxtRule: (text) => {
        if (!text) {
            return "Field cannot be blank";
        }
        else if (text.length > 30) {
            return "Text cannot exceed 30 characters."
        }
        else { return true; }
    },
    longTxtRule: (text) => {
        if (!text) {
            return "Field cannot be blank";
        }
        else if (text.length > 400) {
            return "Text cannot exceed 400 characters."
        }
        else { return true; }
    }
});

// stream user input audio
const isRecDisabled = ref(false);
const isRecording = ref(false);
const store = useStore();

let socket = null;
let msgID = 0;
if (store.getters.getUsername) {    // websocket connection if user logged in
    socket = io('https://fyp-backend-629590115382.asia-northeast1.run.app', {
        withCredentials: true
    });
    socket.on('connect', () => {
    });

    socket.on('error', () => {
        recCleanUp();
        msgs.value.splice(msgID, 1);
        isRecording.value = false;
        isRecDisabled.value = false;
        window.$showSnackbar("Failed to capture voice.", "orange", 3000);
    })

    socket.on('transcript', (res) => {
        try {
            msgs.value[msgID].message = [res.message];
            scrollToBottom();
            if (res.message.length >= 300) {     // stop recording if input more than 300 words
                toggleRecording();
            }
        }
        catch(error) {
            recCleanUp();
            msgs.value.splice(msgID, 1);
            isRecording.value = false;
            isRecDisabled.value = false;
            window.$showSnackbar("Failed to capture voice.", "orange", 3000);
        }
        
    });

    socket.on('transcript_end', async (res) => {
        try {
            if (res.message.length > 0) {     // non-empty transcript
                scenario.value.isEnd = Number(res.isEnd);
                msgs.value[msgID].message = [res.message];

                isRecDisabled.value = true;
                scrollToBottom();
                await getResponse();

                if (msgs.value.length >= 30) {     // end chat if reach 30 messages
                    scenario.value.isEnd = 1;
                }
                if (scenario.value.isEnd) {     // get evaluation
                    getResponse();
                }
            }
            else {
                recCleanUp();
                msgs.value.splice(msgID, 3);
                isRecording.value = false;
                isRecDisabled.value = false;
                window.$showSnackbar("Failed to capture voice.", "orange", 3000);
            }
        }
        catch(error) {
            recCleanUp();
            msgs.value.splice(msgID, 3);
            isRecording.value = false;
            isRecDisabled.value = false;
            window.$showSnackbar("Failed to capture voice.", "orange", 3000);

        }
    })
}

// get response from chatbot
const getResponse = async () => {
    try {
        let res = await axios.post('/chatbot/getResponse', {
            chatHistory: extractChatHistory(),
            scenario: {
                description: scenario.value.description,
                goal: scenario.value.goal,
                userRole: scenario.value.userRole,
                botRole: scenario.value.botRole,
                engLevel: scenario.value.engLevel,
                isEnd: scenario.value.isEnd
            }
        });
        let response = res.data

        msgs.value.push({ id: msgs.value.length, sender: "bot", message: response.message, showTranslation: false, translation: "" });
        scrollToBottom();

        if (scenario.value.isEnd) {     // autosave
            saveChatlog();
        }

        if (response.isEnd) {
            scenario.value.isEnd = 1
        }
        
        await getTTS(response.message)

        if (scenario.value.isEnd) {
            isRecDisabled.value = true;
        }
        else {
            isRecDisabled.value = false;
        }
    }
    catch(error) {
        msgs.value.splice(msgID, 3);
        isRecDisabled.value = false;
        window.$showSnackbar("Failed to get response from chatbot. Please try again.", "red", 3000);
    }
}

let stream = null;
let mediaRecorder = null;
const recCleanUp = () => {
    if (mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder = null;
    }
    if (stream) {
        stream.getTracks().forEach((track) => {
            track.stop();
        });
        stream = null;
    }
}
const toggleRecording = async () => {
    try {
        if (!isRecording.value) {   // start recording
            isRecording.value = true;
            isRecDisabled.value = true;

            let locale = settings.value.accent.code;
            msgID = msgs.value.length;
            msgs.value.push({ id: msgs.value.length, sender: "user", message: [], showTranslation: false, translation: "" });
            scrollToBottom();

            //STT
            mediaRecorder = null;
            
            if (!socket) { throw new Error("Failed to connect to server."); }
            await new Promise((resolve, reject) => {   // wait for server to config recognizer locale
                let timeout = setTimeout(() => {
                    reject(new Error("Failed to connect to server."));
                }, 5000);
                
                socket.emit('recognizerConfig', locale, (res) => {
                    clearTimeout(timeout);
                    if (res.error) {
                        reject(res.error);
                    }
                    else {
                        resolve();
                    }
                });
            });

            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            
            isRecDisabled.value = false;

            mediaRecorder.ondataavailable = async (event) => {
                try {
                    if (event.data.size > 0 && socket) {
                        if (socket.disconnected) { throw new Error("Failed to connect to server."); }
                        event.data.arrayBuffer()
                        .then(async (arrayBuffer) => {
                            socket.emit('STT', arrayBuffer);
                        })
                        .catch((err) => {
                            recCleanUp();
                            msgs.value.splice(msgID, 1);
                            isRecording.value = false;
                            isRecDisabled.value = false;
                            window.$showSnackbar("Recording failed.", "red", 3000);
                        })
                    }
                    else {      // send audio with no sound
                        socket.emit('STT', new ArrayBuffer(1600));
                    }                    
                }
                catch(error) {
                    recCleanUp();
                    msgs.value.splice(msgID, 1);
                    isRecording.value = false;
                    isRecDisabled.value = false;
                    window.$showSnackbar("Recording failed.", "red", 3000);
                }
            };

            mediaRecorder.start(100);   // send chunks every 100ms (recommended in cloud stt documentation)
        }
        else {  // stop recording
            socket.emit('STT_end');
            recCleanUp();
            
            stream = null;

            isRecDisabled.value = true;
            isRecording.value = false;
        }
    }
    catch(error) {
        recCleanUp();
        msgs.value.splice(msgID, 1);
        isRecording.value = false;
        isRecDisabled.value = false;
        window.$showSnackbar("Recording failed.", "red", 3000);
    }
}

const saveChatlog = () => {
    axios.post('/chatlog/saveChatlog', {
        title: scenario.value.title,
        message: msgs.value,
        scenario: {
            description: scenario.value.description,
            goal: scenario.value.goal,
            userRole: scenario.value.userRole,
            botRole: scenario.value.botRole,
            engLevel: scenario.value.engLevel
        }
    })
    .then(res => {
        window.$showSnackbar("Saved chatlog successfully.", "green", 3000);
        isSaved.value = true;
        resave.value = false;
    })
    .catch(error => {
        window.$showSnackbar("Failed to save chatlog.", "red", 3000);
        isSaved.value = false;
    })
}

// settings
const settings = ref({
    editSettings: false,
    accent: { label: 'United States', code: 'en-US' },
    translationLang: { label:'Chinese (Traditional)', code:'ZH-HANT'},
    ttsVoice: { label: 'Sonia', code: 'en-GB-SoniaNeural', locale: 'English (United Kingdom)' },
    ttsSpeed: 1
});

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

const submitScenario = () => {      // start chatbot conversation
    scenario.value.isSubmitted = true;
    if (scenario.value.isValid) {
        axios.post('/chatbot/getResponse', {
            scenario: {
                description: scenario.value.description,
                goal: scenario.value.goal,
                userRole: scenario.value.userRole,
                botRole: scenario.value.botRole,
                engLevel: scenario.value.engLevel,
                isEnd: scenario.value.isEnd
            },
            chatHistory: []
        })
        .then(res => {
            getTTS(res.data.message);

            setTimeout(() => {
                setScenario.value = false;  // close scenario settings
                scenario.value.isSubmitted = false;

                // add message to chat
                msgs.value.push({ id: msgs.value.length, sender: "bot", message: res.data.message, showTranslation: false, translation: "" });
            }, 1000)
        })
        .catch(error => {
            scenario.value.isSubmitted = false;
            window.$showSnackbar("Failed to submit scenario.", "red", 3000);
        }) 
    }
}
const toggleViewScenario = () => {
    viewScenario.value = !viewScenario.value;
}

// TTS
let audio = null;
let mediaSource = null;
let abortFetch = null;
const audioCleanup = () => {
    try {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';
        }
        if (mediaSource) {
            if (mediaSource.readyState === 'open') {
                mediaSource.endOfStream();
            }
        }
        if (abortFetch) {
            abortFetch.abort('Cleanup');
            abortFetch = null;
        }
    }
    catch(error) {
        if (error.name === 'AbortError') {
            return;
        } else {
            console.error('Error during audio cleanup');
        }
    }
}
const getTTS = async (text) => {
  try {
        audioCleanup();

        abortFetch = new AbortController();
        let signal = abortFetch.signal;

        const response = await fetch('https://fyp-backend-629590115382.asia-northeast1.run.app/api/chatbot/getTTS', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
            body: JSON.stringify({
                text: formatMsg(text),
                voice: settings.value.ttsVoice.code,
                locale: settings.value.ttsVoice.locale,
                ttsSpeed: settings.value.ttsSpeed
            }),
            signal: signal
        })
        .catch(error => {
            if (error.name === 'AbortError') {
                return;
            }
            else {
                window.$showSnackbar("Failed to play audio", "red", 3000);
                audioCleanup();
            }
        });

        const reader = response.body.getReader();

        mediaSource = new MediaSource();
        audio = new Audio();
        audio.src = URL.createObjectURL(mediaSource);

        mediaSource.addEventListener('sourceopen', async () => {
            const sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs=opus');
            let isReady = true;

            sourceBuffer.addEventListener('updateend', () => {
                isReady = true;
                processNextChunk();
            });

            async function processNextChunk() {
                if (!isReady) {
                    return;
                }
                
                const { done, value } = await reader.read();
                if (done) {
                    mediaSource.endOfStream();
                    return;
                }

                isReady = false;
                sourceBuffer.appendBuffer(value);
            }

            audio.play().catch(error => {
                if (error.name === 'AbortError') {
                    return;
                }
                else {
                    window.$showSnackbar("Failed to play audio", "red", 3000);
                    audioCleanup();
                }
            });
            processNextChunk();
        });

        await new Promise((resolve, reject) => {
            audio.addEventListener('ended', () => {
                resolve();
            },{ once: true });

            audio.addEventListener('error', () => {
                reject(new Error('Failed to play audio.'));
            },{ once: true });
        })
    } catch (error) {
        window.$showSnackbar("Failed to play audio.", "red", 3000);
        audioCleanup();
    }
}
onBeforeUnmount(() => {     // audio cleanup when component unmounts
    audioCleanup();
});
onBeforeRouteLeave(() => {  // audio cleanup when change pages
    audioCleanup();
    return true;
});

const ChatRef = ref(null);
const scrollToBottom = async ()=>{
    setTimeout(() => {
        if (ChatRef.value) {
            ChatRef.value.scrollTop = ChatRef.value.scrollHeight;
        }
    }, 10);
};
getSettingConfigs();
</script>

<style scoped>
.chat {
    overflow-y: scroll;
    height: calc(100vh - 13rem);
    margin-bottom: 1.5rem;
}

.toolbar {
    height: 4.5rem;
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    width: calc(100vw - 3rem);
}
.toolbarItem {
    align-items: center;
    display: flex;
    flex: 1;
}
.toolbarItem.left {
    justify-content: flex-start;
}
.toolbarItem.center {
    justify-content: center;
}
.toolbarItem.right {
    justify-content: flex-end;
}

.chatBtn.v-btn {
    height: 4.5rem;
    width: 4.5rem;
    border-radius: 50%;
    background: var(--primary);
    border: 1px solid var(--secondary);
}
.chatBtnPressed.v-btn {
    height: 4.5rem;
    width: 4.5rem;
    border-radius: 50%;
    background: var(--primary);
    border: 1px solid rgb(232, 0, 0);
}
.chatBtnDisabled.v-btn {
    height: 4.5rem;
    width: 4.5rem;
    border-radius: 50%;
    background: var(--primary);
    border: 1px solid rgb(184, 184, 184);
}

.chatIcon {
    color: var(--secondary);
    width: 40px;
    height: 40px;
}
.chatIconPressed {
    color: rgb(232, 0, 0);
    width: 40px;
    height: 40px;
}
.chatIconDisabled {
    color: rgb(184, 184, 184);
    width: 40px;
    height: 40px;
}

.paddingDiv {
    padding-left: 1rem;
    padding-right: 1rem;
}

.v-input--disable {
  color: var(--text);
}

.hidden {
    visibility: hidden;
}

.short_input {
    width: 56px;
}
</style>