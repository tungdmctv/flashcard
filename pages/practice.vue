<template>
  <div class="text-lg">
    <!-- Controls -->
    <div class="flex justify-end items-center mb-6">
      <div class="flex flex-wrap justify-end gap-4 items-center">
        <!-- Tag Filter -->
        <div class="dropdown">
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
        <button class="btn" @click="toggleMode">
          <Icon v-if="!isRandomMode" name="fe:random" />
          <Icon v-else name="lineicons:sort-amount-asc" /> {{ isRandomMode ? 'A->B' : 'Random' }}
        </button>
        <!-- Reset Stats -->
        <button class="btn btn-warning btn-sm" @click="resetStats">
          <Icon name="radix-icons:reset" /> Reset
        </button>
        <!-- End Game -->
        <button class="btn btn-error btn-sm" @click="endGame">
          <Icon name="ic:baseline-stop-circle" /> End
        </button>
      </div>
    </div>

    <!-- Score Display -->
    <div class="w-full flex justify-center">
      <div class="stats shadow mb-6">
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
      </div>
    </div>

    <!-- Quiz Card -->
    <div v-if="currentCard && !isGameOver" class="card bg-base-200 max-w-2xl mx-auto cursor-pointer"
      @click="toggleReveal">
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
const settings = ref<{pronunciationLanguage: string}>({ pronunciationLanguage: 'th-TH' });
// State
const cards = ref<Card[]>([])
const currentIndex = ref(0)
const isRevealed = ref(false)
const isRandomMode = ref(true)
const selectedTags = ref<string[]>([])
const isGameOver = ref(false)

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
    stats: doc.stats || { correct: 0, incorrect: 0, lastSeen: Date.now() }
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
  const stats = { ...doc.stats }
  stats[correct ? 'correct' : 'incorrect']!++
  stats.lastSeen = Date.now()
  await db.put({ ...doc, stats })
  if (currentCard.value.stats) {
    currentCard.value.stats[correct ? 'correct' : 'incorrect']!++
    currentCard.value.stats.lastSeen = stats.lastSeen
  }
  isRevealed.value = false
  next()
}

function next() {
  if (currentIndex.value < filteredCards.value.length - 1) {
    currentIndex.value++
  } else if (isRandomMode.value) {
    shuffle()
  } else {
    currentIndex.value = 0
  }
  isRevealed.value = false
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


// Reset all stats
async function resetStats() {
  for (const card of cards.value) {
    if (!card._id) continue
    const doc = await db.get(card._id)
    const stats = { correct: 0, incorrect: 0, lastSeen: Date.now() }
    await db.put({ ...doc, stats })
    card.stats = stats
  }
}

function endGame() {
  isGameOver.value = true
}

function restartGame() {
  isGameOver.value = false
  isRevealed.value = false
  isRandomMode.value ? shuffle() : (currentIndex.value = 0)
}

watch(selectedTags, () => {
  currentIndex.value = 0
  isRevealed.value = false
  if (isRandomMode.value) shuffle()
})




async function loadSettings() {
  try {
    const doc = await db.get<{pronunciationLanguage: string}>('app_settings')
    settings.value = { pronunciationLanguage: doc.pronunciationLanguage || 'th-TH' }
    selectLangToSpeak.value = doc.pronunciationLanguage || 'th-TH'
  } catch (err) {
    console.error('Failed to load settings:', err)
  }
}

onMounted(() => {
  loadCards()
  loadSettings()
})
</script>
