<template>
    <!-- Add / Edit Modal -->
    <div class="modal" id="edit-modal">
        <div class="modal-box relative max-w-2xl">
            <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="closeAddModal">✕</button>
            <!-- Alert -->
            <div v-if="showAlert" role="alert" class="alert alert-info shadow-lg mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 w-6 h-6" fill="none"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ alertMessage }}</span>
            </div>

            <h3 class="text-xl font-bold mb-6">{{ props.card ? 'แก้ไขคำศัพท์' : 'เพิ่มคำศัพท์' }}</h3>

            <form @submit.prevent="saveCard" class="space-y-6">
                <!-- Word -->
                <div class="form-control">
                    <label class="label"><span class="label-text font-medium">คำศัพท์</span></label>
                    <input v-model="cardForm.word" type="text" required class="input input-bordered input-lg w-full" />
                </div>

                <!-- Meaning + AI -->
                <div class="form-control">
                    <label class="label flex justify-between items-center">
                        <span class="label-text font-medium">ความหมาย</span>
                        <button type="button" class="btn btn-sm btn-outline" :disabled="!cardForm.word || isLoadingAI"
                            @click="getMeaningFromAI">
                            <Icon v-if="!isLoadingAI" name="material-symbols:magic-button" />
                            <Icon v-else name="svg-spinners:pulse-rings-3" />
                            {{ isLoadingAI ? 'กำลังโหลด...' : 'ขอความหมายจาก AI' }}
                        </button>
                    </label>
                    <textarea v-model="cardForm.meaning" required
                        class="textarea textarea-bordered textarea-lg w-full h-48 resize-none"></textarea>
                </div>

                <!-- Tags -->
               
                <div class="form-control">
                    <label class="label"><span class="label-text font-medium">แท็ก (คั่นด้วย ,)</span></label>
                    <input v-model="cardForm.tagsInput" type="text" placeholder="tag1, tag2"
                        class="input input-bordered input-lg w-full" />
                </div>

                <div class="flex flex-wrap gap-2 mb-4">
                    <span v-for="tag in allTags" :key="tag" class="badge badge-lg cursor-pointer"
                        :class="{ 'badge-primary': cardForm.tagsInput.includes(tag) }" @click="toggleTag(tag)">
                        {{ tag }}
                    </span>
                </div>
                
                <div class="modal-action mt-2">
                    <button type="submit" class="btn btn-primary">
                        <Icon name="ri:save-3-line" /> บันทึก
                    </button>
                    <button type="button" class="btn" @click="closeAddModal">
                        <Icon name="bitcoin-icons:cross-filled" /> ยกเลิก
                    </button>
                </div>
            </form>
        </div>
        <div class="modal-backdrop" @click="closeAddModal"></div>
    </div>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import PouchDB from 'pouchdb'
import { useOpenAI } from '~/composables/useOpenAI'
const { getMeaning } = useOpenAI()
const emit = defineEmits(['saveCard'])

interface Card {
    _id?: string
    word: string
    meaning: string
    tags: string[]
    createdAt?: number
    updatedAt?: number
    stats?: { correct: number; incorrect: number; lastSeen?: number }
}

const props = defineProps({
    card: { type: Object as PropType<Card>, default: () => ({}) },
})

watch(() => props.card, (newVal) => {
    cardForm.value.word = props.card?.word || ''
    cardForm.value.meaning = props.card?.meaning || ''
    cardForm.value.tagsInput = Array.isArray(props.card?.tags) ? props.card.tags.join(', ') : props.card?.tags || ''
})
const db = new PouchDB<Card>('flashcards')
const cardForm = ref<{ word: string; meaning: string; tagsInput: string }>({
    word: props.card?.word || '',
    meaning: props.card?.meaning || '',
    tagsInput: Array.isArray(props.card?.tags) ? props.card.tags.join(', ') : props.card?.tags || ''
})

function toggleTag(tag: string) {
    const tagsStr = cardForm.value.tagsInput || ''
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean)
    const index = tags.indexOf(tag)

    if (index === -1) {
        tags.push(tag)
    } else {
        tags.splice(index, 1)
    }

    cardForm.value.tagsInput = tags.join(', ')
}

const isLoadingAI = ref(false)
const showAlert = ref(false)
const alertMessage = ref('')
const cards = ref<Card[]>([])
const allTags = computed(() => {
    const tags = new Set<string>()
    cards.value.forEach(card => {
        card.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
})

// Methods
async function loadCards() {
    const res = await db.allDocs({ include_docs: true })
    const docs = res.rows
        .map(r => r.doc!)
        .filter(doc => doc.word && !doc._id?.startsWith('_design'))

    cards.value = docs.map(doc => ({
        ...doc,
        tags: doc.tags || [],
        stats: {
            correct: doc.stats?.correct || 0,
            incorrect: doc.stats?.incorrect || 0,
            lastSeen: doc.stats?.lastSeen || Date.now()
        }
    }))
}

async function saveCard() {
    // trim และตรวจสอบว่ากรอกครบ
    const word = cardForm.value.word.trim()
    const meaning = cardForm.value.meaning.trim()
    if (!word || !meaning) return

    const duplicate = cards.value.find(c => c?.word?.toLowerCase() === word?.toLowerCase() && c._id !== props.card?._id)
    if (duplicate) {
        alert(`มีคำ "${word}" อยู่แล้วในรายการ`)
        return
    }

    // จัดการแท็ก
    console.log("cardForm", cardForm.value);

    const tags = cardForm.value.tagsInput.split(',').map((t: string) => t.trim()).filter(Boolean)
    const now = Date.now()
    const card: Card = {
        word,
        meaning,
        tags,
        createdAt: props.card?.createdAt || now,
        updatedAt: now
    }

    // save
    if (props.card?._id) {
        const doc = await db.get(props.card._id)
        await db.put({ ...card, _id: props.card._id, _rev: doc._rev })
    } else {
        await db.post(card)
    }
    closeAddModal();
    loadCards();
    emit('saveCard', true);
}


// ----- AI -----
async function getMeaningFromAI() {
    try {
        const settingsDoc = await db.get<{ pronunciationLanguage: string; openaiApiKey?: string }>('app_settings');
        if (!settingsDoc?.openaiApiKey) {
            throw new Error("OpenAI API Key is not set");
        }
        if (!cardForm.value.word || isLoadingAI.value) {
            throw new Error("Please enter a word");
        }
        isLoadingAI.value = true
        cardForm.value.meaning = await getMeaning(cardForm.value.word)
    }
    catch (e: any) {
        showFeedback('เกิดข้อผิดพลาด : ' + e);
        console.error(e);
        return;
    }
    finally { isLoadingAI.value = false }
}


function showFeedback(msg: string) {
    alertMessage.value = msg
    showAlert.value = true
    setTimeout(() => (showAlert.value = false), 5000)
}


function closeAddModal() {
    const modal = document.getElementById('edit-modal')
    modal?.classList.remove('modal-open');
}

onMounted(() => {
    loadCards()
})
</script>