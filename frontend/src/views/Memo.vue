<template>
    <div class="page">
        <div class="spaceDiv breadcrumbs">
            <v-breadcrumbs :items="subheadings"></v-breadcrumbs>
            <Icon v-if="catPreview" class="add" @click="addCatOpen()" icon="icon-park-solid:add"/>
            <Icon v-if="!catPreview" class="add" @click="addEntryOpen()" icon="icon-park-solid:add"/>
        </div>
        <!-- preview  -->
        <div v-if="catPreview" class="category_block_list">
            <template v-for="category in categories">
                <v-card class="category_block" @click="selectCat(category)">
                    <v-card-title class="category_title">{{ category.title }}</v-card-title>
                    <v-card-actions>
                        <label> Creation date: {{ new Date(category.createdAt).toLocaleDateString('en-GB') }} </label>
                        <v-spacer/>
                        <Icon class="delete" @click.stop="delCatOpen(category)" icon="material-symbols:delete-outline-rounded"/>
                    </v-card-actions>
                </v-card>
            </template>
        </div>
        <!-- delete dialogue -->
        <v-dialog v-model="delCatConfirm" max-width="500px">
            <v-card class="dialogBox" title="Delete Category">
                <v-card-text> Are you sure you want to delete '{{ delCatTitle }}'? All related entries in the category will be deleted. </v-card-text>
                <v-card-actions>
                    <v-btn text="Cancel" @click="delCatClose()"></v-btn>
                    <v-spacer></v-spacer>
                    <v-btn text="Delete" @click="deleteCategory()" color="red" variant="flat"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- add category window -->
        <v-dialog v-model="addCatForm" max-width="500px">
            <v-card class="dialogBox" title="Add Category">
                <v-form v-model="isCatFormValid" class="dialogform" @submit.prevent="addCategory()">
                    <v-text-field v-model="addCatTitle" :rules="[addCatRule(addCatTitle)]" label="Category Title" autocomplete="off" required></v-text-field>
                    <div class="spaceDiv">
                        <v-btn class="cancelBtn" text="Cancel" @click="addCatClose()"></v-btn>
                        <v-btn text="Add" type="submit" color="var(--secondary_dark)" variant="flat"></v-btn>
                    </div>
                </v-form>
            </v-card>
        </v-dialog>
        <!-- show entries in selected category -->
        <div v-if="!catPreview" class="entry_block_list">
            <template v-for="entry in entries">
                <v-card class="entry_block" @click="editEntryOpen(entry)">
                    <v-card-title class="entry_title">
                        <div style="display: flex; padding-right: 1rem; flex-flow: wrap;"> {{ entry.title }} </div>
                        <Icon class="defaultBtn" @click.stop="getTTS(entry.title)" icon="mingcute:volume-fill"/>
                    </v-card-title>
                    <v-card-text class="entry_text"> Translation: {{ entry.translation }} </v-card-text>
                    <v-card-text class="entry_text"> Notes: {{ entry.notes }} </v-card-text>
                </v-card>
            </template>
        </div>
        <!-- delete entry dialogue -->
        <v-dialog v-model="delEntryConfirm" max-width="500px">
            <v-card class="dialogBox" title="Delete Note Entry">
                <v-card-text> Are you sure you want to delete '{{ delEntry.title }}'? All related entries in the category will be deleted. </v-card-text>
                <v-card-actions>
                    <v-btn text="Cancel" @click="delEntryClose()"></v-btn>
                    <v-spacer></v-spacer>
                    <v-btn text="Delete" @click="deleteEntry()" color="red" variant="flat"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- add memo entry window -->
        <v-dialog v-model="addEntryForm" max-width="500px">
            <v-card class="dialogBox" title="Add Note Entry">
                <v-form v-model="isAddEntryFormValid" class="dialogform" @submit.prevent="addEntry()">
                    <v-text-field v-model="addEntryTitle" :rules="[entryTitleRule]" label="Entry Title" autocomplete="off" required></v-text-field>
                    <v-textarea v-model="addEntryTranslation" :rules="[entryRule]" label="Translation">
                        <template v-slot:append-inner>
                            <Icon class="defaultBtn_small" @click.stop="getTranslation('add')" icon="bi:translate"/>
                        </template>
                    </v-textarea>
                    <v-textarea v-model="addEntryNotes" :rules="[entryRule]" label="Notes"></v-textarea>
                    <div class="spaceDiv">
                        <v-btn class="cancelBtn" text="Cancel" @click="addEntryClose()"></v-btn>
                        <v-btn text="Add" type="submit" color="var(--secondary_dark)" variant="flat"></v-btn>
                    </div>
                </v-form>
            </v-card>
        </v-dialog>
        <!-- edit memo entry window -->
        <v-dialog v-model="editEntryForm" max-width="500px">
            <v-card class="dialogBox" title="Edit Note Entry">
                <template v-slot:append>
                    <Icon class="delete" @click.stop="delEntryOpen()" icon="material-symbols:delete-outline-rounded"/>
                </template>
                <v-form v-model="isEditEntryFormValid" class="dialogform" @submit.prevent="editEntry()">
                    <v-select v-model="editEntryCat" :items="categories.map(category => category.title)" label="Category"></v-select>
                    <v-text-field v-model="editEntryTitle" :rules="[entryTitleRule]" label="Entry Title" autocomplete="off"></v-text-field>
                    <v-textarea v-model="editEntryTranslation" :rules="[entryRule]" label="Translation">
                        <template v-slot:append-inner>
                            <Icon class="defaultBtn_small" @click.stop="getTranslation('edit')" icon="bi:translate"/>
                        </template>
                    </v-textarea>
                    <v-textarea v-model="editEntryNotes" :rules="[entryRule]" label="Notes"></v-textarea>
                    <div class="spaceDiv">
                        <v-btn class="cancelBtn" text="Cancel" @click="editEntryClose()"></v-btn>
                        <v-btn text="Edit" type="submit" color="var(--secondary_dark)" variant="flat"></v-btn>
                    </div>
                </v-form>
            </v-card>
        </v-dialog>
    
        <!-- settings -->
        <v-btn icon class="iconBtn settings_btn" @click="toggleSettings()">
            <Icon class="iconBtnIcon" icon="material-symbols:settings"/>
        </v-btn>
        <v-dialog v-model="settings.editSettings" max-width="500px">
            <GeneralSettings v-model="settings"></GeneralSettings>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import axios from '../axios'
import GeneralSettings from '@/components/GeneralSettings.vue'
import { onBeforeRouteLeave } from 'vue-router';

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

const subheadings = ref([{title: "Memo", disabled: false, href: 'https://fyp-frontend-629590115382.asia-northeast1.run.app/memo',}])
const categories = ref([]);

const delCatConfirm = ref(false);
const delCatTitle = ref("");

const addCatForm = ref(false);
const addCatTitle = ref("");
const isCatFormValid = ref(false);

const catPreview = ref(true);

const getCategories = ()=>{
    axios.get('/memo/getCategories')
    .then(res => {
        categories.value = Object.values(res.data).map(value => value)
    })
    .catch(error => {
        window.$showSnackbar("Failed to get category", "red", 3000);
    })
}

// delete Category
const delCatOpen = (category) => {
    delCatTitle.value = category.title;
    delCatConfirm.value = true;
}

const delCatClose = () => {
    delCatConfirm.value = false;
    delCatTitle.value = "";
}

const deleteCategory = ()=>{
    axios.post('/memo/deleteCategory', {
        title: delCatTitle.value
    })
    .then (res => {
        delCatClose();
        getCategories();
        window.$showSnackbar("Deleted category successfully", "success", 3000);
    })
    .catch(error => {
        window.$showSnackbar("Failed to delete category", "red", 3000);
    })
}

// add Category
const addCatOpen = () => {
    addCatTitle.value = "";
    addCatForm.value = true;
}

const addCatClose = () => {
    addCatForm.value = false;
    addCatTitle.value = "";
}

const addCategory = () => {
    if (isCatFormValid.value) {
        axios.post('/memo/addCategory', {
            title: addCatTitle.value,
        })
        .then (res => {
            addCatClose();
            getCategories();
            window.$showSnackbar("Added category successfully", "success", 3000);
        })
        .catch(error => {
            window.$showSnackbar("Failed to add category", "red", 3000);
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

// Entries view
const entries = ref([]);
const delEntryConfirm = ref(false);
const delEntry = ref({}) 

const selectedCat = ref("");
const selectedEntry = ref({});

const addEntryForm = ref(false);
const isAddEntryFormValid = ref(false);
const addEntryTitle = ref("");
const addEntryTranslation = ref("");
const addEntryNotes = ref("");

const editEntryForm = ref(false);
const isEditEntryFormValid = ref(false);
const editEntryCat = ref("");
const editEntryTitle = ref("");
const editEntryTranslation = ref("");
const editEntryNotes = ref("");

const getEntries = () => {
    axios.get('/memo/getEntries', {
        params: {
            category: selectedCat.value
        }
    })
    .then(res => {
        entries.value = Object.values(res.data).map(value => value)
    })
    .catch(error => {
        window.$showSnackbar("Failed to get memo entries", "red", 3000);
    })
}

const selectCat = (category) => {
    // change display to entries
    catPreview.value = false;
    subheadings.value.push({title: category.title, disabled: false});

    selectedCat.value = category.title;
    getEntries();
}

const delEntryOpen = () => {
    delEntryConfirm.value = true;
    delEntry.value = selectedEntry.value;
}

const delEntryClose = () => {
    delEntryConfirm.value = false;
    delEntry.value = {};
}

const deleteEntry = () => {
    axios.post('/memo/deleteEntry', {
        _id: delEntry.value._id
    })
    .then (res => {
        delEntryClose();
        editEntryClose();
        getEntries();
        window.$showSnackbar("Deleted entry successfully", "success", 3000);
    })
    .catch(error => {
        window.$showSnackbar("Failed to delete entry", "red", 3000);
    })
}

// add Entry
const addEntryOpen = () => {
    addEntryTitle.value = "";
    addEntryTranslation.value = "";
    addEntryNotes.value = "";
    addEntryForm.value = true;
}

const addEntryClose = () => {
    addEntryForm.value = false;
    addEntryTitle.value = "";
    addEntryTranslation.value = "";
    addEntryNotes.value = "";
}

const addEntry = () => {
    if (isAddEntryFormValid.value) {
        axios.post('/memo/addEntry', {
            category: selectedCat.value,
            title: addEntryTitle.value,
            translation: addEntryTranslation.value,
            notes: addEntryNotes.value
        })
        .then (res => {
            addEntryClose();
            getEntries();
            window.$showSnackbar("Added Entry Successfully", "success", 3000);
        })
        .catch(error => {
            window.$showSnackbar("Failed to Add Entry", "red", 3000);
        })
    }
}

// edit Entry
const editEntryOpen = (entry) => {
    selectedEntry.value = entry;
    editEntryCat.value = selectedCat.value;
    editEntryTitle.value = selectedEntry.value.title;
    editEntryTranslation.value = selectedEntry.value.translation;
    editEntryNotes.value = selectedEntry.value.notes;
    editEntryForm.value = true;
}

const editEntryClose = () => {
    editEntryForm.value = false;
    selectedEntry.value = {};
    editEntryCat.value = "";
    editEntryTitle.value = "";
    editEntryTranslation.value = "";
    editEntryNotes.value = "";
}

const editEntry = () => {
    if (isEditEntryFormValid.value) {
        axios.post('/memo/editEntry', {
            _id: selectedEntry.value._id,
            category: editEntryCat.value,
            title: editEntryTitle.value,
            translation: editEntryTranslation.value,
            notes: editEntryNotes.value
        })
        .then(res => {
            editEntryClose();
            getEntries();
            window.$showSnackbar("Edited Entry Successfully", "success", 3000);
        })
        .catch(error => {
            window.$showSnackbar("Failed to Edit Entry", "red", 3000);
        })
    }
}

const entryTitleRule = (title) => {
    if (!title) {
        return "You must enter a title.";
    }
    else if (title.length > 100) {
        return "Title cannot exceed 100 characters."
    }
    else {
        return true;
    }
}

const entryRule = (field) => {
    if (field.length > 300) {
        return "Field cannot exceed 300 characters."
    }
    else {
        return true;
    }
}
const getTranslation = (mode) => {
    if (mode == "add") {
        axios.post('/chatbot/getTranslation', {
            text: addEntryTitle.value,
            targetLang: settings.value.translationLang.code
        })
        .then(res => {
            addEntryTranslation.value = res.data.translation;
        })
        .catch(err => {
            window.$showSnackbar("Failed to get translation", "red", 3000);
        })
    }
    else if (mode == "edit") {
        axios.post('/chatbot/getTranslation', {
            text: editEntryTitle.value,
            targetLang: settings.value.translationLang.code
        })
        .then(res => {
            editEntryTranslation.value = res.data.translation;
        })
        .catch(err => {
            window.$showSnackbar("Failed to get translation", "red", 3000);
        })
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
                text: text,
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
    } catch (error) {
        window.$showSnackbar("Failed to play audio", "red", 3000);
        audioCleanup();
    }
}
onBeforeUnmount(() => {     // stop audio when component unmounts
    audioCleanup();
});
onBeforeRouteLeave(() => {
    audioCleanup();
    return true;
});

// onload
getCategories();
getSettingConfigs();
</script>
<style scoped>
.category_block_list {
    display: flex;
    flex-flow: wrap;
}

.category_block {
    box-sizing: border-box;
    width: 300px;
    min-width: 200px;
    margin: 1rem 1rem 1rem 1rem;
    color: var(--primary_lighter);
}
.category_block:hover {
    outline: 3px solid var(--secondary);
}

.category_title {
    font-size: 1.5rem;
    text-align: center;
    padding-top: 2rem;
    padding-bottom: 1rem;
}

.delete {
    height: 40px;
    width: 40px;
    color: rgb(235, 0, 0);
}
.delete:hover {
    color: rgb(159, 0, 0);
}

.add {
    height: 50px;
    width: 50px;
    color: var(--secondary);
}
.add:hover {
    color: var(--secondary_dark);
}

.dialogText {
    font-size: 1rem;
}

.entry_block_list {
    display: flex;
    flex-flow: column;
    overflow-y: scroll;
    margin-top: 1rem;
}

.entry_block {
    min-height: fit-content;
    box-sizing: border-box;
    margin: 1rem 1rem 1rem 1rem;
    padding: 1rem 0.5rem 1rem 0.5rem;
    color: var(--primary_lighter);
}
.entry_block:hover {
    outline: 3px solid var(--secondary);
}

.entry_title {
    white-space: normal;
    display: flex;
    font-size: 1.5rem;
    padding-bottom: 0.5rem;
    align-items: center;
}

.entry_text {
    font-size: 1.1rem;
    padding-top: 0rem;
}

.settings_btn {
    position: fixed;
    bottom: 1.75rem;
    right: 1.5rem;
    z-index: 1000;
}

</style>