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
          <Icon v-if="isRandomMode" name="fe:random" />
          <Icon v-else name="lineicons:sort-amount-asc" /> {{ !isRandomMode ? 'A->B' : 'Random' }}
        </button>
        <div @click="showStatsModal = true">
          <Icon name="material-symbols:bar-chart-4-bars" class="mx-auto mb-1" />
        </div>
        <!-- End Game -->
        <button class="btn btn-error btn-xs" @click="endGame">
          <Icon name="ic:baseline-stop-circle" /> End
        </button>
      </div>
    </div>
    <!-- Score Display -->

    <div class="w-full flex flex-col items-center justify-center">

      <div class="stats shadow mb-2 w-full lg:w-1/2">
        <div class="stat">
          <div class="stat-title">เล่น</div>
          <div class="stat-value">{{ wordStatsSummary.totalPlayed }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">ถูก</div>
          <div class="stat-value text-success">{{ wordStatsSummary.totalCorrect }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">ผิด</div>
          <div class="stat-value text-error">{{ wordStatsSummary.totalIncorrect }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">อัตราความสำเร็จ</div>
          <div class="stat-value">{{ wordStatsSummary.avgSuccessRate }}%</div>
        </div>
      </div>

    </div>
    <div class="w-full flex justify-end items-center pb-4">
      <!-- History Navigation -->
      <div class="flex items-center gap-2 ml-4">
        <button class="btn btn-sm btn-outline" :disabled="sessionHistory.length === 0" @click="navigateHistory(-1)">
          <Icon name="material-symbols:arrow-back" />
        </button>
        <button class="btn btn-sm btn-outline" :disabled="sessionHistory.length === 0" @click="navigateHistory(1)">
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
      <div class="flex flex-wrap justify-start items-center gap-2 mt-2 text-gray-300">
        <span v-for="tag in currentCard.tags" :key="tag" class="badge badge-sm ">{{ tag }}</span>
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

    <!-- Statistics Modal -->
    <dialog id="stats_modal" class="modal" :class="{ 'modal-open': showStatsModal }">
      <div class="modal-box w-full">
        <h3 class="w-full flex justify-center items-center font-bold text-lg mb-4">Overall Statistics</h3>
        <div class="w-2/3 mx-center stats stats-vertical shadow">
          <div class="stat">
            <div class="stat-title">Total Plays</div>
            <div class="stat-value">{{ answeredCount }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Correct</div>
            <div class="stat-value text-success">{{ correctCount }}</div>
            <div class="stat-desc">{{ successRate }}% </div>
          </div>
          <div class="stat">
            <div class="stat-title">Incorrect</div>
            <div class="stat-value text-error">{{ incorrectCount }}</div>
            <div class="stat-desc">{{ 100 - successRate }}%</div>
          </div>
          <div class="stat">
            <div class="stat-title">Success Rate</div>
            <div class="stat-value">{{ successRate }}%</div>
            <div class="stat-desc">Overall success rate</div>
          </div>
        </div>
        <div class="modal-action">
          <nuxt-link to="/stat" class="btn btn-secondary">
            <Icon name="material-symbols:bar-chart-4-bars" /> Stats
          </nuxt-link>
          <button class="btn" @click="showStatsModal = false">Close</button>
        </div>
      </div>
    </dialog>
    <AddEdit id="edit-modal" :card="editingCard" />
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

interface SessionStats {
  played: number
  correct: number
  incorrect: number
  successRate: number
}

interface WordStats {
  played: number
  correct: number
  incorrect: number
  successRate: number
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
const showStatsModal = ref(false)
const editingCard = ref<Card | undefined>(undefined)
const showAddModal = ref(false)
const isLoadingAI = ref(false)
const cardForm = ref({ word: '', meaning: '', tagsInput: '' })
const wordStats = ref<Record<string, WordStats>>({})

// Computed Stats
const correctCount = computed(() =>
  cards.value.reduce((sum, card) => sum + (card.stats?.correct || 0), 0)
)
const incorrectCount = computed(() =>
  cards.value.reduce((sum, card) => sum + (card.stats?.incorrect || 0), 0)
)
const answeredCount = computed(() => correctCount.value + incorrectCount.value)
const successRate = computed(() => {
  const total = answeredCount.value
  return total > 0 ? Math.round((correctCount.value / total) * 100) : 0
})

const wordStatsSummary = computed(() => {
  const stats = Object.values(wordStats.value)
  return {
    totalPlayed: stats.reduce((sum, s) => sum + s.played, 0),
    totalCorrect: stats.reduce((sum, s) => sum + s.correct, 0),
    totalIncorrect: stats.reduce((sum, s) => sum + s.incorrect, 0),
    avgSuccessRate: stats.length > 0
      ? Math.round(stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length)
      : 0
  }
})

// Format meaning with <br>
const formattedMeaning = computed(() => {
  return currentCard.value?.meaning
    .replace(/\n/g, '<br>') || ''
})

// Computed Quiz
const allTags = computed(() => [...new Set(allCards.value.flatMap(c => c.tags))])
const filteredCards = computed(() => {
  return cards.value.filter(c =>
    selectedTags.value.length === 0 || selectedTags.value.some(t => c.tags.includes(t))
  )
}
)
const currentCard = computed(() => filteredCards.value[currentIndex.value] || null)


// Methods
const allCards = ref<Card[]>([])
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
  allCards.value = [...cards.value]
  if (isRandomMode.value) {
    console.log("shuffle loadCards");
    shuffle()
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
  // Update word stats
  const wordId = currentCard.value?._id || '';
  if (!wordStats.value[wordId]) {
    wordStats.value[wordId] = {
      played: 0,
      correct: 0,
      incorrect: 0,
      successRate: 0
    };
  }

  wordStats.value[wordId].played++;
  if (correct) {
    wordStats.value[wordId].correct++;
  } else {
    wordStats.value[wordId].incorrect++;
  }
  wordStats.value[wordId].successRate = wordStats.value[wordId].played > 0
    ? Math.round((wordStats.value[wordId].correct / wordStats.value[wordId].played) * 100)
    : 0;
  isRevealed.value = false
  next()
}


function shuffle() {
    currentIndex.value = 0
    isRevealed.value = false
    const array = [...filteredCards.value];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    // filteredCards.value = [...array];
    cards.value = [...array];
}


function next() {
  console.log("next card");
  if (isRandomMode.value) {
    console.log("next isRandomMode");
    shuffle();
    if (Math.random() > 0.75) {
      console.log("next getLowestSuccessRateWords");
      getLowestSuccessRateWords();
    }
  } else {
    console.log("next Not Random");
    if (Math.random() >= 0.75) {
      console.log("next Not Random : getLowestSuccessRateWords");
      getLowestSuccessRateWords();
    }
  }

  if (currentIndex.value < filteredCards.value.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
  }

  isRevealed.value = false
  historyIndex.value = -1
}


function getLowestSuccessRateWords(limit = 1) {
  const lowestWords = Object.entries(wordStats.value)
    .filter(([_, stats]) => stats.played > 0 && stats.successRate < 80)
    .sort((a, b) => a[1].successRate - b[1].successRate)
    .slice(0, limit)
    .map(([wordId, stats]) => ({
      wordId,
      word: cards.value.find(c => c._id === wordId)?.word || wordId,
      successRate: stats.successRate
    }));

  if (lowestWords.length > 0) {
    const newWord = lowestWords[0];
    const cardToInsert = cards.value.find(c => c._id === newWord.wordId);
    if (cardToInsert) {
      const updatedCards = filteredCards.value
        .filter(card => card._id !== newWord.wordId)
        .toSpliced(currentIndex.value, 0, cardToInsert);
      // Create new array reference to trigger reactivity
      filteredCards.value = [...updatedCards];
    }
  }
  console.log("lowestWords", lowestWords);
  return lowestWords;
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

function endGame() {
  isGameOver.value = true
}

function restartGame() {
  isGameOver.value = false
  isRevealed.value = false
  sessionHistory.value = []
  historyIndex.value = -1
  // Keep word stats for reference
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

function openEditModal(card?: Card) {
  if (card) {
    editingCard.value = card
    cardForm.value = { word: card.word, meaning: card.meaning, tagsInput: card.tags.join(', ') }
  } else {
    editingCard.value = undefined
    cardForm.value = { word: '', meaning: '', tagsInput: '' }
  }
  setTimeout(() => {
    openModal("edit-modal")
  }, 40);
}

function openModal(id = "") {
  const modal = document.getElementById(id)
  modal?.classList.add('modal-open');
}

function closeModal(id = "") {
  const modal = document.getElementById(id)
  modal?.classList.remove('modal-open');
}



onMounted(() => {
  loadCards()
  loadSettings()
})
</script>
