<template>
    <div class="chat_area">
        <div v-for="msg in msgs" :class="msg.sender == 'bot' ? 'default_row bot_row' : 'default_row user_row'">
            <v-card :class="msg.sender == 'bot' ? 'default_msg bot' : 'default_msg user'">
                <div v-if="!msg.showTranslation">
                    <div v-for="(sentence, s) in msg.message">
                        <div v-if="sentence.length === 0" class="newline"></div>
                        <template v-else v-for="(word, i) in sentence">
                            <span v-if="isWord(word)" :key="i" class="word" @click.stop="toggleDefinition(word, $event)"> {{ word }} </span>
                            <span v-else> {{ word }} </span>
                            <span v-if="i+1 < sentence.length && isAddSpace(sentence[i+1])"> {{ ' ' }} </span>
                        </template>
                    </div>
                </div>
                <div v-else>
                    <div> {{ msg.translation }} </div>
                </div>
                <v-divider class="divider border-opacity-25" :thickness="2"></v-divider>
                <v-card-actions v-if="msg.sender == 'bot'" class="btnBar">
                    <Icon class="defaultBtn" @click="getTTS(msg.message)" icon="mingcute:volume-fill"/>  
                    <Icon class="defaultBtn" @click="toggleTranslation(msg.id, msg.message)" icon="bi:translate"/>  
                    <Icon class="defaultBtn" @click="toggleEntryForm(msg.message)" icon="fluent-emoji-high-contrast:memo"/>
                </v-card-actions>
                <v-card-actions v-else-if="msg.sender == 'user'" class="btnBar">
                    <Icon class="defaultBtn" @click="getTTS(msg.message)" icon="mingcute:volume-fill"/>
                    <Icon class="defaultBtn" @click="toggleComment(msg.id)" icon="iconamoon:comment-dots-fill"/>  
                    <Icon class="defaultBtn" @click="toggleEntryForm(msg.message)" icon="fluent-emoji-high-contrast:memo"/>  
                </v-card-actions>
            </v-card>
        </div>
         <!-- dictionary -->
        <div v-show="dictionary.showDictionary" id="dictionary" ref="dictionaryRef" class="dictionary" role="tooltip">
            <v-skeleton-loader v-if="dictionary.loading" class="skeleton" type="article"></v-skeleton-loader>
            <div v-else>
                <div> {{ dictionary.word }} </div>
                <v-divider class="divider border-opacity-25" :thickness="2"></v-divider>
                <template v-for="def in dictionary.definition">
                    <div class="dictionaryDes"> {{ def }} </div>
                </template>
            </div>
        </div>
    </div>

    <!-- add note entry -->
    <v-dialog v-model="noteEntry.form" max-width="500px">
        <v-card class="dialogBox" title="Add Note Entry">
            <v-form v-model="noteEntry.isValidForm" class="dialogform" @submit.prevent="addNoteEntry()">
                <v-select v-model="noteEntry.category" :rules="[noteEntry.categoryRule]" :items="categories.map(category => category.title)" label="Category">
                    <template v-slot:prepend-item>
                        <v-btn class="addCatBtn" @click.stop="toggleCatForm()" text="+ Add Category" variant="flat"></v-btn>
                    </template>
                </v-select>
                <v-text-field v-model="noteEntry.title" :rules="[noteEntry.titleRule]" label="Entry Title" autocomplete="off" required></v-text-field>
                <v-textarea v-model="noteEntry.translation" :rules="[noteEntry.rule]" label="Translation">
                    <template v-slot:append-inner>
                        <Icon class="defaultBtn_small" @click.stop="getTranslation()" icon="bi:translate"/>
                    </template>
                </v-textarea>
                <v-textarea v-model="noteEntry.notes" :rules="[noteEntry.rule]" label="Notes"></v-textarea>
                <div class="spaceDiv">
                    <v-btn class="cancelBtn" text="Cancel" @click="toggleEntryForm()"></v-btn>
                    <v-btn text="Add" type="submit" color="var(--secondary_dark)" variant="flat"></v-btn>
                </div>
            </v-form>
        </v-card>
    </v-dialog>

    <!-- add category -->
    <v-dialog v-model="addCatForm" max-width="500px">
        <v-card class="dialogBox" title="Add Category">
            <v-form v-model="isCatFormValid" class="dialogform" @submit.prevent="addCategory()">
                <v-text-field v-model="addCatTitle" :rules="[addCatRule]" label="Category Title" autocomplete="off" required></v-text-field>
                <div class="spaceDiv">
                    <v-btn class="cancelBtn" text="Cancel" @click.stop="toggleCatForm()"></v-btn>
                    <v-btn text="Add" type="submit" color="var(--secondary_dark)" variant="flat"></v-btn>
                </div>
            </v-form>
        </v-card>
    </v-dialog>

    <!-- suggestion -->
    <div v-if="!viewOnly" class="bottom_right">
        <v-menu v-model="suggestion.viewSuggestion" location="top" :open-on-hover="false" :close-on-content-click="false" style="z-index: 2;">
            <template v-slot:activator="{ props }">
                <v-btn icon :disabled="Boolean(scenario.isEnd)" class="iconBtn" @click="toggleSuggestion()" v-bind="props">
                    <Icon class="iconBtnIcon" icon="mdi:lightbulb-on"/>
                </v-btn>
            </template>
            <v-skeleton-loader v-if="suggestion.loading" type="article"></v-skeleton-loader>
            <v-card v-else class="suggestion">
                <div v-if="!suggestion.showTranslation">
                    <div v-for="(sentence, s) in suggestion.message">
                        <div v-if="sentence.length === 0" class="newline"></div>
                        <template v-else v-for="(word, i) in sentence">
                            <span v-if="isWord(word)" :key="i" class="word" @click.stop="toggleDefinition(word, $event)"> {{ word }} </span>
                            <span v-else> {{ word }} </span>
                            <span v-if="i+1 < sentence.length && isAddSpace(sentence[i+1])"> {{ ' ' }} </span>
                        </template>
                    </div>
                </div>
                <div v-else>
                    <div> {{ suggestion.translation }} </div>
                </div>
                <v-divider class="divider border-opacity-25" :thickness="2"></v-divider>
                <v-card-actions>
                    <Icon class="defaultBtn" @click="getTTS(suggestion.message)" icon="mingcute:volume-fill"/>  
                    <Icon class="defaultBtn" @click="toggleSuggestionTranslation()" icon="bi:translate"/>  
                    <Icon class="defaultBtn" @click="toggleEntryForm(suggestion.message)" icon="fluent-emoji-high-contrast:memo"/>
                </v-card-actions>
            </v-card>
        </v-menu>
    </div>

    <!-- comment -->
    <v-dialog v-model="comment.showComment" max-width="500px">
        <v-card class="dialogBox dialogform" title="Comment" >
            <v-textarea v-model="comment.targetMsg" label="Target Message" row-height="15" rows="2" no-resize readonly></v-textarea>
            <v-progress-linear v-if="comment.loading" class="progress_bar" color="blue-lighten-3" indeterminate :height="7"></v-progress-linear>
            <v-textarea v-else v-model="comment.message" label="Comment" row-height="15" rows="8" no-resize readonly></v-textarea>
            <div class="centerDiv">
                <v-btn text="Done" color="var(--secondary_dark)" variant="flat" @click="toggleComment()"></v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { defineProps } from 'vue';
import axios from '../axios'
import { createPopper } from '@popperjs/core';
import { onBeforeRouteLeave } from 'vue-router';

const props = defineProps({
    id: {
      type: String,
    },
    modelValue: {
        type: Array,
        required: true
    },
    scenario: {
        type: Object,
        required: true
    },
    settings: {
        type: Object,
        required: true
    },
    viewOnly: {
        type: Boolean,
        default: false
    }
});
const msgs = ref(props.modelValue);

const emit = defineEmits(['update:modelValue']);

watch(msgs, (newValue) => {
  emit('update:modelValue', newValue);
}, { deep: true });

watch(() => props.modelValue, (newValue) => {
    msgs.value = newValue;
}, { deep: true });

const extractChatHistory = () => {
    let chatHistory = "";
    for (let i = 0; i < msgs.value.length; i++) {
        chatHistory += `${msgs.value[i].sender}: ${formatMsg(msgs.value[i].message)}`;
        if (i < msgs.value.length - 1) {
            chatHistory += '\n';
        }
    }
    return chatHistory;
}

const formatMsg = (text) => {
    let formatted = text.map(sentence => sentence.join(' ')); //.replace(/\s([.,!?;:)\]}…-])/g, '$1').replace(/'\s/g, "'")
    formatted = formatted.join('\n')
    return formatted;
}

const noteEntry = ref({
    form: false,
    isValidForm: false,
    category: "",
    title: "",
    translation: "",
    notes: "",
    rule: (field) => {
        if (field.length > 300) { return "Field cannot exceed 300 characters."; }
        else { return true; }
    },
    titleRule: (title) => {
        if (!title) { return "You must enter a title."; }
        else if (title.length > 200) { return "Title cannot exceed 200 characters."; }
        else { return true; }
    },
    categoryRule: (cat) => {
        if (cat) { return true; }
        else { return false; }
    },
});

const isWord = (word) => {
    var wordRegex = /[a-zA-Z0-9]/;
    return wordRegex.test(word);
}
const isAddSpace = (word) => {      // check if a space should be added for formatting
    if (/^[\"${}[}()_<>\-]$/.test(word) || /[a-zA-Z0-9]/.test(word)) {
        return true;
    }
    else { return false; }
}

const dictionaryRef = ref(null);
const dictionary = ref({ showDictionary: false, loading: true, word: "", definition: "" });
let popperInstance;
// remove definition popper when click outside of it
onMounted(() => {
    document.addEventListener('click', (event) => {
        if (dictionaryRef.value && event.target != dictionaryRef.value && !dictionaryRef.value.contains(event.target)) {
            dictionaryRef.value.classList.remove('show');
            setTimeout(() => {
                dictionary.value.showDictionary = false;
                dictionary.value.loading = true;
            }, 300);
        }
    })
})
const toggleDefinition = (word, event) => {     // show definition pop-up
    dictionary.value.showDictionary = true;
    if (popperInstance) {
        popperInstance.destroy();
        dictionaryRef.value.classList.remove('show');
        dictionary.value.loading = true;
    }
    popperInstance = createPopper(event.target, dictionaryRef.value, {
        placement: 'auto',
        strategy: 'absolute',
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: [0, 8],
                },
            },
            {
                name: 'preventOverflow',
                options: {
                    boundary: 'parent',
                },
            },
        ],
    });
    dictionaryRef.value.style.display = 'block';
    setTimeout(() => {
        dictionaryRef.value.classList.add('show');
    }, 0);
    axios.get('/chatbot/getDefinition', {
        params: {
            word: word
        }
    })
    .then(res => {
        dictionary.value.word = word;
        
        if (res.data.definitions.length > 0) {
            dictionary.value.definition = res.data.definitions;
        }
        else {
            dictionary.value.definition = ["No definition found"];
        }
        dictionary.value.loading = false;
    })
    .catch(error => {
        dictionary.value.definition = ["No definition found"];
    })
}

const getTranslation = () => {  // for memo
    axios.post('/chatbot/getTranslation', {
        text: noteEntry.value.title,
        targetLang: props.settings.translationLang.code
    })
    .then(res => {
        noteEntry.value.translation = res.data.translation;
    })
    .catch(err => {
        window.$showSnackbar("Failed to get translation", "red", 3000);
    })
}
const toggleTranslation = (id, text) => {   // for message
    if (!msgs.value[id].showTranslation) {
        if (!msgs.value[id].translation || msgs.value[id].translation.length === 0 || msgs.value[id].translationLang != props.settings.translationLang.code) {
            axios.post('/chatbot/getTranslation', {
                text: formatMsg(text),
                targetLang: props.settings.translationLang.code
            })
            .then(res => {
                msgs.value[id].translation = res.data.translation;
                msgs.value[id].translationLang = props.settings.translationLang.code;
                msgs.value[id].showTranslation = true;
            })
            .catch(err => {
                window.$showSnackbar("Failed to get translation", "red", 3000);
            })
        }
        else {
            msgs.value[id].showTranslation = true;
        }
    }
    else {
        msgs.value[id].showTranslation = false;
    }
}

const comment = ref({
    showComment: false,
    loading: true,
    targetMsg: "",
    message: ""
});
const toggleComment = (id) => {
    if (!comment.value.showComment) {
        comment.value.targetMsg = "";
        comment.value.loading = true;
        comment.value.message = "";
    }

    if (id) {
        comment.value.targetMsg = formatMsg(props.modelValue[id].message);
    }
    comment.value.showComment = !comment.value.showComment;

    if (comment.value.showComment) {    // open comment
        axios.post('/chatbot/getComment', {
            scenario: {
                description: props.scenario.description,
                goal: props.scenario.goal,
                userRole: props.scenario.userRole,
                botRole: props.scenario.botRole,
                engLevel: props.scenario.engLevel
            },
            chatHistory: extractChatHistory(),
            targetMsg: formatMsg(props.modelValue[id].message)
        })
        .then(res => {
            comment.value.message = res.data.message;
            comment.value.loading = false;
        })
        .catch(err => {
            comment.value.showComment = false;
            comment.value.targetMsg = "";
            comment.value.loading = true;
            comment.value.message = "";

            window.$showSnackbar("Failed to get comments.", "red", 3000);
        })
    }
    else {  // close comment
        comment.value.targetMsg = "";
        comment.value.loading = true;
        comment.value.message = "";
    }
}

// category
const categories = ref([]);

const getCategories = ()=>{
    axios.get('/memo/getCategories')
    .then(res => {
        categories.value = Object.values(res.data).map(value => value)
    })
    .catch(error => {
        window.$showSnackbar("Failed to get categories.", "red", 3000);
    })
} 
// add category
const addCatForm = ref(false);
const addCatTitle = ref("");
const isCatFormValid = ref(false);

const toggleCatForm = () => {
    addCatForm.value = !addCatForm.value;
    addCatTitle.value = "";
}

const addCategory = () => {
    if (isCatFormValid.value) {
        axios.post('/memo/addCategory', {
            title: addCatTitle.value
        })
        .then(res => {
            toggleCatForm();
            getCategories();
            window.$showSnackbar("Added Category Successfully", "success", 3000);
        })
        .catch(error => {
            window.$showSnackbar("Failed to Add Category", "red", 3000);
        })
    }   
}

const addCatRule = (title) => {
    let titleCheck = categories.value.map(category => category.title);
    if (!title) {
        return "You must enter a title.";
    }
    else if (titleCheck.includes(title)) {
        return "Category already exists."
    }
    else if (title.length > 30) {
        return "Title cannot exceed 30 characters."
    }
    else { return true; }
}

// note entry
const toggleEntryForm = (text) => {
    noteEntry.value.title = ""; 
    noteEntry.value.category = "";
    noteEntry.value.translation = "";
    noteEntry.value.notes = ""; 

    if (!noteEntry.value.form) {
        getCategories();
        noteEntry.value.title = formatMsg(text);
    }

    noteEntry.value.form = !noteEntry.value.form;
}

const addNoteEntry = () => {
    if (noteEntry.value.isValidForm) {
        axios.post('/memo/addEntry', {
            category: noteEntry.value.category,
            title: noteEntry.value.title,
            translation: noteEntry.value.translation,
            notes: noteEntry.value.notes
        })
        .then (res => {
            toggleEntryForm();
            window.$showSnackbar("Added Entry Successfully", "success", 3000);
        })
        .catch(error => {
            window.$showSnackbar("Failed to Add Entry", "red", 3000);
        })       
    }
}

// suggestion
const suggestion = ref({
    viewSuggestion: false,
    loading: true,
    message: "",
    showTranslation: false,
    translation: "",
    translationLang: ""
});
const toggleSuggestion = () => {
    suggestion.value.loading = true;
    suggestion.value.viewSuggestion = !suggestion.value.viewSuggestion;

    if (!suggestion.value.viewSuggestion) { // close
        suggestion.value.showTranslation = false;
        suggestion.value.translation = "";
        suggestion.value.translationLang = "";
    }
    else {
        axios.post('/chatbot/getSuggestion', {
            chatHistory: extractChatHistory(),
            scenario: {
                description: props.scenario.description,
                goal: props.scenario.goal,
                userRole: props.scenario.userRole,
                botRole: props.scenario.botRole,
                engLevel: props.scenario.engLevel,
                isEnd: props.scenario.isEnd
            }
        })
        .then(res => {
            suggestion.value.message = res.data.message;
            suggestion.value.loading = false;   // stop loading after adding content
        })
        .catch(err => {
            suggestion.value.viewSuggestion = false;
            suggestion.value.showTranslation = false;
            suggestion.value.translation = "";
            suggestion.value.translationLang = "";
            window.$showSnackbar("Failed to get suggestions.", "red", 3000);
        })
    }
}
const toggleSuggestionTranslation = () => {
    if (!suggestion.value.showTranslation) {
        if (!suggestion.value.translation || suggestion.value.translation.length === 0 || suggestion.value.translationLang != props.settings.translationLang.code) {
            axios.post('/chatbot/getTranslation', {
                text: formatMsg(suggestion.value.message),
                targetLang: props.settings.translationLang.code
            })
            .then(res => {
                suggestion.value.translation = res.data.translation;
                suggestion.value.translationLang = props.settings.translationLang.code;
                suggestion.value.showTranslation = true;
            })
            .catch(err => {
                window.$showSnackbar("Failed to get translation", "red", 3000);
            })
        }
        else {
            suggestion.value.showTranslation = true;
        }
    }
    else {
        suggestion.value.showTranslation = false;
    }
} 

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
                voice: props.settings.ttsVoice.code,
                locale: props.settings.ttsVoice.locale,
                ttsSpeed: props.settings.ttsSpeed
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

        const reader = response.body.getReader();   // create readable stream

        mediaSource = new MediaSource();
        audio = new Audio();
        audio.src = URL.createObjectURL(mediaSource);

        mediaSource.addEventListener('sourceopen', async () => {
            const sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs=opus');
            let isReady = true;

            sourceBuffer.addEventListener('updateend', () => {  // process chunks after each update
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

            audio.play().catch(error => {   // play audio
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
    } catch (error) {
        window.$showSnackbar("Failed to play audio", "red", 3000);
        audioCleanup();
    }
}
onBeforeUnmount(() => {     // audio cleanup when change page
    audioCleanup();
});
onBeforeRouteLeave(() => {  // audio cleanup when change page
    audioCleanup();
    return true;
});
</script>

<style scoped>
.newline {
    display: block;
    height: 1.5rem;
}

.dictionary {
    font-size: 1rem;
    border-radius: 6px;
    background-color: white;
    padding: 0.5rem 0.5rem 0rem 0.5rem;
    z-index: 1000;
    width: 300px;
    display: none;
    opacity: 0;
    transition: opacity 0.3s ease;
}
.dictionaryDes {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}
.dictionary.show {
    display: block;
    opacity: 1;
}

.chat_area {
    font-size: 1.2rem;
    padding-left: 1rem;
    padding-right: 1rem;
}

.default_row {
    display: flex;
    text-align: justify;
    margin-top: 1rem;
    margin-bottom: 1rem;
}
.bot_row {
    justify-content: flex-start;
}
.user_row {
    justify-content: flex-end;
}

.default_msg {
    padding: 1rem 1rem 1rem 1rem;
    border-radius: 10px;
    width: fit-content;
    max-width: 60%;
}
.bot {
    background-color: var(--text);
}
.user {
    background-color: var(--secondary);
}

.defaultBtn {
    min-height: 2.2rem;
    min-width: 2.2rem;
    color: var(--primary_lighter);
}
.defaultBtn:hover {
    color: var(--primary);
}

.btnBar {
    min-height: 0px;
    padding: 0;
}

.divider {
    padding-bottom: 0.5rem;
}

.addCatBtn {
    text-align: left;
    width: 100%;
    height: 100%;
}

.word {
    background-color: transparent;
}
.word:hover {
    background-color: yellow;
}

.skeleton {
    width: 250px;
    height: 100%;
}

.bottom_right {
    position: fixed;
    bottom: 1.75rem;
    right: 1.5rem;
    z-index: 1000;
}
@media (max-width: 400px) {
    .bottom_right {
        position: absolute;
        left: 310px;
    }
}
@media (max-height: 208px) {
    .bottom_right {
        position: absolute;
        top: 115px;
    }
}

.suggestion {
    padding: 0.5rem 0.5rem 0.5rem 0.5rem;
    border-radius: 10px;
    max-width: 300px;
}

.comment_skeleton {
    height: 220px;
    margin-bottom: 7px;
}
</style>
