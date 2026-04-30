<template>
  <div class="text-lg">
    <!-- Controls -->
    <div class="flex justify-end items-center mb-6">
      <div class="flex flex-wrap justify-end gap-2 md:gap-3 items-center">
        <!-- Tag Filter -->
        <div class="dropdown dropdown-sm">
          <label tabindex="0" class="btn control-btn h-11 min-h-11 md:h-14 md:min-h-14 px-4 md:px-6 text-sm md:text-base">
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
        <button class="btn control-btn h-11 min-h-11 md:h-14 md:min-h-14 px-4 md:px-6 text-sm md:text-base" @click="toggleMode">
          <Icon v-if="isRandomMode" name="fe:random" />
          <Icon v-else name="lineicons:sort-amount-asc" />
          {{ isRandomMode ? 'Random' : 'A->B' }}
        </button>
        <button class="btn control-btn h-11 min-h-11 w-11 md:h-14 md:min-h-14 md:w-14 p-0" @click="showStatsModal = true">
          <Icon name="material-symbols:bar-chart-4-bars" class="text-lg md:text-xl" />
        </button>
        <!-- End Game -->
        <button class="btn control-btn h-11 min-h-11 md:h-14 md:min-h-14 px-4 md:px-6 text-sm md:text-base" @click="endGame">
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
        <button class="btn control-btn h-11 min-h-11 w-11 md:h-12 md:min-h-12 md:w-12 p-0" :disabled="sessionHistory.length === 0" @click="navigateHistory(-1)">
          <Icon name="material-symbols:arrow-back" />
        </button>
        <button class="btn control-btn h-11 min-h-11 w-11 md:h-12 md:min-h-12 md:w-12 p-0" :disabled="sessionHistory.length === 0" @click="navigateHistory(1)">
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
        <p v-if="showPinyin && currentCard.pinyin" class="text-lg mb-2 opacity-80">พินอิน: {{ currentCard.pinyin }}</p>
        <!-- meaning with line breaks -->
        <p v-show="isRevealed" class="text-xl mb-4" v-html="formattedMeaning"></p>
        <div v-show="isRevealed && !isHistoryView" class="flex gap-4">
          <button class="btn btn-success" @click.stop="handleAnswer(true)">OK</button>
          <button class="btn btn-error" @click.stop="handleAnswer(false)">Again</button>
        </div>
        <div v-if="isRevealed && isHistoryView" class="text-sm opacity-70">
          คุณทายคำนี้ไปแล้ว (กด Next เพื่อกลับไปเล่นต่อ)
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
      <button class="btn control-btn" @click.stop="speak(selectLangToSpeak)">
        <Icon name="material-symbols:volume-up" /> อ่านออกเสียง
      </button>
      <button v-if="currentCard?.pinyin" class="btn control-btn" @click.stop="showPinyin = !showPinyin">
        <Icon name="material-symbols:translate" /> {{ showPinyin ? 'ซ่อน Pinyin' : 'แสดง Pinyin' }}
      </button>
    </div>


    <!-- End Game Modal -->
    <input type="checkbox" id="end-modal" class="modal-toggle" v-model="isGameOver" />
    <div class="modal">
      <div class="modal-box relative">
        <h3 class="text-lg font-bold mb-4">จบเกมแล้ว 🎉</h3>
        <p class="mb-2">คำที่ทายไปทั้งหมด: {{ sessionAnsweredCount }}</p>
        <p class="mb-2 text-success">จำนวนคำที่ถูกต้อง: {{ sessionCorrectCount }}</p>
        <p class="mb-4 text-error">จำนวนคำที่ผิดพลาด: {{ sessionIncorrectCount }}</p>
        <div class="modal-action">
          <button class="btn" @click="closeEndModal">ปิด</button>
          <button class="btn btn-primary" @click="restartGame">เล่นใหม่</button>
        </div>
      </div>
    </div>

    <!-- Statistics Modal -->
    <dialog id="stats_modal" class="modal" :class="{ 'modal-open': showStatsModal }">
      <div class="modal-box w-11/12 max-w-4xl">
        <h3 class="w-full flex justify-center items-center gap-2 font-extrabold text-2xl mb-5">
          <Icon name="material-symbols:bar-chart-4-bars" />
          สถิติการฝึกฝน
        </h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div class="card bg-base-100 border border-base-300 shadow-sm">
            <div class="card-body p-4">
              <div class="flex items-center gap-2 text-sm opacity-80">
                <Icon name="material-symbols:sports-score-outline" />
                เล่นทั้งหมด
              </div>
              <div class="text-4xl font-extrabold">{{ answeredCount }}</div>
            </div>
          </div>
          <div class="card bg-base-100 border border-base-300 shadow-sm">
            <div class="card-body p-4">
              <div class="flex items-center gap-2 text-sm opacity-80">
                <Icon name="material-symbols:check-circle-outline" />
                ตอบถูก
              </div>
              <div class="text-4xl font-extrabold text-success">{{ correctCount }}</div>
              <div class="text-xs opacity-70">{{ successRate }}%</div>
            </div>
          </div>
          <div class="card bg-base-100 border border-base-300 shadow-sm">
            <div class="card-body p-4">
              <div class="flex items-center gap-2 text-sm opacity-80">
                <Icon name="material-symbols:cancel-outline-rounded" />
                ตอบผิด
              </div>
              <div class="text-4xl font-extrabold text-error">{{ incorrectCount }}</div>
              <div class="text-xs opacity-70">{{ 100 - successRate }}%</div>
            </div>
          </div>
          <div class="card bg-base-100 border border-base-300 shadow-sm">
            <div class="card-body p-4">
              <div class="flex items-center gap-2 text-sm opacity-80">
                <Icon name="material-symbols:workspace-premium-outline" />
                ความสำเร็จ
              </div>
              <div class="text-4xl font-extrabold">{{ successRate }}%</div>
              <div class="text-xs opacity-70">อัตราความสำเร็จรวม</div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <nuxt-link to="/stat" class="btn btn-secondary">
            <Icon name="material-symbols:bar-chart-4-bars" /> หน้าสถิติละเอียด
          </nuxt-link>
          <button class="btn" @click="showStatsModal = false">
            <Icon name="material-symbols:close-rounded" /> ปิด
          </button>
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
  pinyin?: string
  meaning: string
  tags: string[]
  stats?: { correct: number; incorrect: number; lastSeen?: number; dailyPlayed?: Record<string, number> }
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
const historyIndex = ref(-1)
const showAlert = ref(false)
const alertMessage = ref('')
const showStatsModal = ref(false)
const editingCard = ref<Card | undefined>(undefined)
const showAddModal = ref(false)
const isLoadingAI = ref(false)
const cardForm = ref({ word: '', meaning: '', tagsInput: '' })
const wordStats = ref<Record<string, WordStats>>({})
const displayQueue = ref<Card[]>([])
const sessionCorrectCount = ref(0)
const sessionIncorrectCount = ref(0)
const sessionAnsweredCount = computed(() => sessionCorrectCount.value + sessionIncorrectCount.value)
const showPinyin = ref(false)
const isHistoryView = ref(false)
const resumeCardId = ref<string | null>(null)
const repeatState = ref<Record<string, { dueIn: number }>>({})
const forcedQueue = ref<string[]>([])

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
const currentCard = computed(() => displayQueue.value[currentIndex.value] || null)


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
  rebuildQueue()
}

async function handleAnswer(correct: boolean) {
  if (!currentCard.value?._id) return
  const answeredId = currentCard.value._id
  const doc = await db.get(currentCard.value._id)
  const stats = {
    correct: doc.stats?.correct || 0,
    incorrect: doc.stats?.incorrect || 0,
    lastSeen: doc.stats?.lastSeen || Date.now(),
    dailyPlayed: doc.stats?.dailyPlayed || {}
  }
  const key = correct ? 'correct' : 'incorrect';
  // Handle NaN by ensuring stats[key] is a number or defaulting to 0
  stats[key] = (Number(stats[key]) || 0) + 1;
  stats.lastSeen = Date.now();
  const todayKey = new Date().toISOString().slice(0, 10)
  stats.dailyPlayed[todayKey] = (Number(stats.dailyPlayed[todayKey]) || 0) + 1
  await db.put({ ...doc, stats });
  if (currentCard.value.stats) {
    currentCard.value.stats[correct ? 'correct' : 'incorrect']!++
    currentCard.value.stats.lastSeen = stats.lastSeen
  }
  // Add to session history
  if (currentCard.value._id) {
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
    sessionCorrectCount.value++
    wordStats.value[wordId].correct++;
  } else {
    sessionIncorrectCount.value++
    wordStats.value[wordId].incorrect++;
  }
  wordStats.value[wordId].successRate = wordStats.value[wordId].played > 0
    ? Math.round((wordStats.value[wordId].correct / wordStats.value[wordId].played) * 100)
    : 0;

  updateRepeatState(answeredId, correct)
  isRevealed.value = false
  next()
}

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickWeightedRandomIndex(queue: Card[]): number {
  if (!queue.length) return 0

  const weights = queue.map((card) => {
    const correct = Number(card.stats?.correct || 0)
    const incorrect = Number(card.stats?.incorrect || 0)
    const total = correct + incorrect
    if (total === 0) return 3
    const successRate = correct / total
    return 1 + (1 - successRate) * 3
  })

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i]
    if (random <= 0) return i
  }
  return queue.length - 1
}

function rebuildQueue() {
  const base = [...filteredCards.value]
  displayQueue.value = isRandomMode.value ? shuffleArray(base) : base
  currentIndex.value = displayQueue.value.length ? 0 : -1
  isRevealed.value = false
  showPinyin.value = false
  // Clean queues when filter changes or mode changes
  const validIds = new Set(displayQueue.value.map(c => c._id).filter(Boolean) as string[])
  forcedQueue.value = forcedQueue.value.filter(id => validIds.has(id))
  repeatState.value = Object.fromEntries(
    Object.entries(repeatState.value).filter(([id]) => validIds.has(id))
  )
}

function next() {
  isHistoryView.value = false
  if (!displayQueue.value.length) {
    currentIndex.value = -1
    isRevealed.value = false
    return
  }

  const forcedId = forcedQueue.value.shift()
  if (forcedId) {
    const forcedIndex = displayQueue.value.findIndex(c => c._id === forcedId)
    if (forcedIndex >= 0) {
      currentIndex.value = forcedIndex
      isRevealed.value = false
      showPinyin.value = false
      historyIndex.value = -1
      return
    }
  }

  if (isRandomMode.value) {
    currentIndex.value = pickWeightedRandomIndex(displayQueue.value)
  } else {
    if (currentIndex.value < displayQueue.value.length - 1) {
      currentIndex.value++
    } else {
      currentIndex.value = 0
    }
  }

  isRevealed.value = false
  showPinyin.value = false
  historyIndex.value = -1
}

function randomRepeatDelay() {
  return Math.floor(Math.random() * 8) + 3 // 3..10
}

function queueForcedRepeat(cardId: string) {
  if (!forcedQueue.value.includes(cardId)) {
    forcedQueue.value.push(cardId)
  }
}

function updateRepeatState(answeredId: string, correct: boolean) {
  // Tick all pending repeats except the card just answered
  for (const [id, state] of Object.entries(repeatState.value)) {
    if (id === answeredId) continue
    state.dueIn -= 1
    if (state.dueIn <= 0) {
      queueForcedRepeat(id)
      state.dueIn = randomRepeatDelay()
    }
  }

  if (correct) {
    delete repeatState.value[answeredId]
    forcedQueue.value = forcedQueue.value.filter(id => id !== answeredId)
    return
  }

  repeatState.value[answeredId] = { dueIn: randomRepeatDelay() }
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
  rebuildQueue()
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
  sessionCorrectCount.value = 0
  sessionIncorrectCount.value = 0
  wordStats.value = {}
  repeatState.value = {}
  forcedQueue.value = []
  // Keep word stats for reference
  rebuildQueue()
}

function closeEndModal() {
  isGameOver.value = false
  isRevealed.value = false
}

function navigateHistory(direction: number) {
  if (sessionHistory.value.length === 0) return
  if (direction > 0 && isHistoryView.value) {
    resumeFromHistory()
    return
  }

  let newIndex = historyIndex.value

  // First navigation: jump to edge depending on direction
  if (newIndex === -1) {
    resumeCardId.value = currentCard.value?._id || null
    newIndex = direction < 0 ? sessionHistory.value.length - 1 : 0
  } else {
    newIndex = newIndex + direction
  }

  // Cycle through history when reaching either end
  if (newIndex < 0) newIndex = sessionHistory.value.length - 1
  else if (newIndex >= sessionHistory.value.length) newIndex = 0

  historyIndex.value = newIndex

  if (historyIndex.value >= 0) {
    const cardId = sessionHistory.value[historyIndex.value]
    const cardIndex = displayQueue.value.findIndex(c => c._id === cardId)
    if (cardIndex >= 0) {
      currentIndex.value = cardIndex
      isRevealed.value = true
      showPinyin.value = false
      isHistoryView.value = true
    } else {
      const fallbackCard = cards.value.find(c => c._id === cardId)
      if (fallbackCard) {
        displayQueue.value = [fallbackCard, ...displayQueue.value]
        currentIndex.value = 0
        isRevealed.value = true
        showPinyin.value = false
        isHistoryView.value = true
      }
    }
  }
}

function resumeFromHistory() {
  const targetId = resumeCardId.value
  if (!targetId) {
    isHistoryView.value = false
    historyIndex.value = -1
    isRevealed.value = false
    return
  }
  const idx = displayQueue.value.findIndex(c => c._id === targetId)
  if (idx >= 0) currentIndex.value = idx
  isHistoryView.value = false
  historyIndex.value = -1
  isRevealed.value = false
  showPinyin.value = false
}

watch(selectedTags, () => {
  rebuildQueue()
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

<style scoped>
.control-btn {
  background: transparent !important;
  color: #5d3a28 !important;
  border: 1px solid rgba(93, 58, 40, 0.45) !important;
  box-shadow: none !important;
}

.control-btn:hover {
  background: rgba(255, 249, 236, 0.55) !important;
  border-color: rgba(93, 58, 40, 0.7) !important;
}
</style>
