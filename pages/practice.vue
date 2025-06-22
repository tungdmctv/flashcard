<template>
  <div class="text-lg">
    <!-- Controls -->
    <div class="flex justify-end items-center mb-6">
      <div class="flex flex-wrap justify-end gap-4 items-center">
        <!-- Tag Filter -->
        <div class="dropdown dropdown-sm">
          <label tabindex="0" class="btn m-1">
            <Icon name="material-symbols:label-important-rounded" /> Tags
          </label>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
            <li v-for="tag in allTags" :key="tag">
              <label class="label cursor-pointer justify-start gap-2">
                <input type="checkbox" v-model="selectedTags" :value="tag" class="checkbox" />
                <span class="label-text">{{ tag }}</span>
              </label>
            </li>
          </ul>
        </div>
        <!-- Mode Toggle -->
        <button class="btn btn-sm" @click="toggleMode">
          <Icon v-if="!isRandomMode" name="fe:random" />
          <Icon v-else name="lineicons:sort-amount-asc" /> {{ isRandomMode ? 'A->B' : 'Random' }}
        </button>
      
        <!-- End Game -->
        <button class="btn btn-error btn-sm" @click="endGame">
          <Icon name="ic:baseline-stop-circle" /> End
        </button>
      </div>
    </div>

    <!-- Score Display -->
    <div class="w-full flex items-center justify-center">
      <div class="stats shadow mb-6 w-full lg:w-1/2">
        <div class="stat">
          <div class="stat-title">Played</div>
          <div class="stat-value">{{ answeredCount }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">OK</div>
          <div class="stat-value text-success">{{ correctCount }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Wrong</div>
          <div class="stat-value text-error">{{ incorrectCount }}</div>
        </div>
        <div class="flex w-20 h-full w-full items-center justify-center text-center">
          <nuxt-link to="/stat">
            <Icon name="material-symbols:bar-chart-4-bars" class="mx-auto" />
          </nuxt-link>
        </div>
      </div>

      <!-- History Navigation -->
      <div class="flex items-center gap-2 ml-4">
        <button class="btn btn-sm" :disabled="sessionHistory.length === 0" @click="navigateHistory(-1)">
          <Icon name="material-symbols:arrow-back" />
        </button>
        <button class="btn btn-sm" :disabled="sessionHistory.length === 0" @click="navigateHistory(1)">
          <Icon name="material-symbols:arrow-forward" />
        </button>
      </div>

    </div>

    <!-- Quiz Card -->
    <div v-if="currentCard && !isGameOver" class="card bg-base-200 max-w-2xl mx-auto cursor-pointer relative"
      @click="toggleReveal">
      <div @click="openEditModal(currentCard)" class="absolute top-2 right-2">
        <Icon name="material-symbols:edit-square-outline" />
      </div>
      <div class="card-body items-center text-center">
        <h2 class="card-title text-6xl mb-4 py-6">{{ currentCard.word }}</h2>
        <!-- meaning with line breaks -->
        <p v-show="isRevealed" class="text-xl mb-4" v-html="formattedMeaning"></p>
        <div v-show="isRevealed" class="flex gap-4">
          <button class="btn btn-success" @click.stop="handleAnswer(true)">OK</button>
          <button class="btn btn-error" @click.stop="handleAnswer(false)">Again</button>
        </div>
      </div>
    </div>
    <div v-else-if="!isGameOver" class="text-center py-12">
      <p class="text-xl mb-4">No Words Selected</p>
      <button class="btn btn-primary" @click="restartGame">Start</button>
    </div>
    <div v-else class="text-center py-12">
      <p>No cards available.</p>
    </div>

    <!-- Read Aloud Buttons -->
    <div v-if="currentCard && !isGameOver" class="flex justify-center gap-2 my-4">
      <div class="dropdown">
        <select v-model="selectLangToSpeak" class="select select-bordered w-full">
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
        </select>
      </div>
      <button class="btn" @click.stop="speak(selectLangToSpeak)">
        <Icon name="material-symbols:volume-up" /> อ่านออกเสียง
      </button>
    </div>


    <!-- End Game Modal -->
    <input type="checkbox" id="end-modal" class="modal-toggle" v-model="isGameOver" />
    <div class="modal">
      <div class="modal-box relative">
        <h3 class="text-lg font-bold mb-4">จบเกมแล้ว 🎉</h3>
        <p class="mb-2">คำที่ทายไปทั้งหมด: {{ answeredCount }}</p>
        <p class="mb-2 text-success">จำนวนคำที่ถูกต้อง: {{ correctCount }}</p>
        <p class="mb-4 text-error">จำนวนคำที่ผิดพลาด: {{ incorrectCount }}</p>
        <div class="modal-action">
          <button class="btn btn-primary" @click="restartGame">เล่นใหม่</button>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <div class="modal" :class="{ 'modal-open': showAddModal }">
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

        <h3 class="text-xl font-bold mb-6">{{ editingCard ? 'แก้ไขคำศัพท์' : 'เพิ่มคำศัพท์' }}</h3>

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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import PouchDB from 'pouchdb'
import pronunciationLanguageData from '~/src/pronunciationLanguage.json'

interface Card {
  _id?: string
  word: string
  meaning: string
  tags: string[]
  stats?: { correct: number; incorrect: number; lastSeen?: number }
}

const db = new PouchDB<Card>('flashcards')
const languages = ref(pronunciationLanguageData.languages);
const selectLangToSpeak = ref('th-TH');
const settings = ref<{ pronunciationLanguage: string }>({ pronunciationLanguage: 'th-TH' });
// State
const cards = ref<Card[]>([])
const currentIndex = ref(0)
const isRevealed = ref(false)
const isRandomMode = ref(true)
const selectedTags = ref<string[]>([])
const isGameOver = ref(false)
const sessionHistory = ref<string[]>([])
const historyIndex = ref(0)
const showAlert = ref(false)
const alertMessage = ref('')
const editingCard = ref<Card | null>(null)
const showAddModal = ref(false)
const isLoadingAI = ref(false)
const cardForm = ref({ word: '', meaning: '', tagsInput: '' })

// Computed Stats
const correctCount = computed(() =>
  cards.value.reduce((sum, card) => sum + (card.stats?.correct || 0), 0)
)
const incorrectCount = computed(() =>
  cards.value.reduce((sum, card) => sum + (card.stats?.incorrect || 0), 0)
)
const answeredCount = computed(() => correctCount.value + incorrectCount.value)

// Computed Quiz
const allTags = computed(() => [...new Set(cards.value.flatMap(c => c.tags))])
const filteredCards = computed(() =>
  cards.value.filter(c =>
    selectedTags.value.length === 0 || selectedTags.value.some(t => c.tags.includes(t))
  )
)
const currentCard = computed(() => filteredCards.value[currentIndex.value] || null)

// Format meaning with <br>
const formattedMeaning = computed(() => {
  return currentCard.value?.meaning
    .replace(/\n/g, '<br>') || ''
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
  if (isRandomMode.value) shuffle()
}

function shuffle() {
  currentIndex.value = 0
  isRevealed.value = false
  cards.value = [...filteredCards.value].sort(() => Math.random() - 0.5)
}

function toggleMode() {
  isRandomMode.value = !isRandomMode.value
  isRevealed.value = false
  isRandomMode.value ? shuffle() : (currentIndex.value = 0)
}

function toggleReveal() {
  if (!isRevealed.value) {
    isRevealed.value = true
  }
}

async function handleAnswer(correct: boolean) {
  if (!currentCard.value?._id) return
  const doc = await db.get(currentCard.value._id)
  const stats = {
    correct: doc.stats?.correct || 0,
    incorrect: doc.stats?.incorrect || 0,
    lastSeen: doc.stats?.lastSeen || Date.now()
  }
  const key = correct ? 'correct' : 'incorrect';
  // Handle NaN by ensuring stats[key] is a number or defaulting to 0
  stats[key] = (Number(stats[key]) || 0) + 1;
  stats.lastSeen = Date.now();
  await db.put({ ...doc, stats });
  if (currentCard.value.stats) {
    currentCard.value.stats[correct ? 'correct' : 'incorrect']!++
    currentCard.value.stats.lastSeen = stats.lastSeen
  }
  // Add to session history
  if (currentCard.value._id && !sessionHistory.value.includes(currentCard.value._id)) {
    sessionHistory.value.push(currentCard.value._id)
  }
  isRevealed.value = false
  next()
}

function next() {
  if (currentIndex.value < filteredCards.value.length - 1) {
    currentIndex.value++
  } else if (isRandomMode.value) {
    shuffle();
  } else {
    currentIndex.value = 0
  }
  isRevealed.value = false
  historyIndex.value = -1
}


// Text-to-Speech
function speak(lang: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  const utterance = new SpeechSynthesisUtterance(currentCard.value?.word || '')
  const langMap: Record<string, string> = { th: 'th-TH', en: 'en-US', zh: 'zh-CN' }
  utterance.lang = langMap[lang] ?? 'en-US'

  const voices = window.speechSynthesis.getVoices()
  const voice = voices.find(v => v.lang === utterance.lang) ||
    voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)))
  if (voice) utterance.voice = voice

  window.speechSynthesis.cancel() // stop any ongoing speech
  window.speechSynthesis.speak(utterance)
}



function endGame() {
  isGameOver.value = true
}

function restartGame() {
  isGameOver.value = false
  isRevealed.value = false
  sessionHistory.value = []
  historyIndex.value = -1
  isRandomMode.value ? shuffle() : (currentIndex.value = 0)
}

function navigateHistory(direction: number) {
  if (sessionHistory.value.length === 0) return

  let newIndex = historyIndex.value + direction

  // Cycle through history when reaching either end
  if (newIndex < 0) newIndex = sessionHistory.value.length - 1
  else if (newIndex >= sessionHistory.value.length) newIndex = 0

  historyIndex.value = newIndex

  if (historyIndex.value >= 0) {
    const cardId = sessionHistory.value[historyIndex.value]
    const cardIndex = filteredCards.value.findIndex(c => c._id === cardId)
    if (cardIndex >= 0) {
      currentIndex.value = cardIndex
      isRevealed.value = true
    }
  }
}

watch(selectedTags, () => {
  currentIndex.value = 0
  isRevealed.value = false
  if (isRandomMode.value) shuffle()
})

async function loadSettings() {
  try {
    const doc = await db.get<{ pronunciationLanguage: string }>('app_settings');
    settings.value = { pronunciationLanguage: doc.pronunciationLanguage || 'th-TH' }
    selectLangToSpeak.value = doc.pronunciationLanguage || 'th-TH'
  } catch (err) {
    console.error('Failed to load settings:', err)
  }
}



async function saveCard() {
  // trim และตรวจสอบว่ากรอกครบ
  const word = cardForm.value.word.trim()
  const meaning = cardForm.value.meaning.trim()
  if (!word || !meaning) return

  // ตรวจคำซ้ำ (case‑insensitive) ถ้าเป็นการเพิ่มใหม่หรือเปลี่ยนคำ
  const duplicate = cards.value.find(c => c?.word?.toLowerCase() === word?.toLowerCase() && c._id !== editingCard.value?._id)
  if (duplicate) {
    alert(`มีคำ "${word}" อยู่แล้วในรายการ`)
    return
  }

  // จัดการแท็ก
  const tags = cardForm.value.tagsInput.split(',').map(t => t.trim()).filter(Boolean)
  const now = Date.now()
  const card: Card = {
    word,
    meaning,
    tags,
    createdAt: editingCard.value?.createdAt || now,
    updatedAt: now
  }

  // save
  if (editingCard.value?._id) {
    const doc = await db.get(editingCard.value._id)
    await db.put({ ...card, _id: editingCard.value._id, _rev: doc._rev })
  } else {
    await db.post(card)
  }
  closeAddModal()
}

const { getMeaning } = useOpenAI()

// ----- AI -----
async function getMeaningFromAI() {
  try {
    const settingsDoc = await db.get<{ pronunciationLanguage: string }>('app_settings');
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

function openAddModal() { openEditModal() }
function openEditModal(card?: Card) {
  if (card) {
    editingCard.value = card
    cardForm.value = { word: card.word, meaning: card.meaning, tagsInput: card.tags.join(', ') }
  } else {
    editingCard.value = null
    cardForm.value = { word: '', meaning: '', tagsInput: '' }
  }
  showAddModal.value = true
}
function closeAddModal() {
  showAddModal.value = false
  editingCard.value = null
}


onMounted(() => {
  loadCards()
  loadSettings()
})
</script>
