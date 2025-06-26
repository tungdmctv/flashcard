<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-6">สถิติการฝึกฝน</h1>


    <div class="flex justify-between items-center mb-6">

      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">คำศัพท์ทั้งหมด</div>
          <div class="stat-value">{{ stats.length }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">ถูกทั้งหมด</div>
          <div class="stat-value">{{ totalCorrect }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">ผิดทั้งหมด</div>
          <div class="stat-value">{{ totalWrong }}</div>
        </div>
      </div>
    </div>

    <div class="flex justify-center my-4">
        <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
            class="px-4 py-2 mx-1 rounded border border-gray-300 bg-transparent hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Previous
          </button>
        <span class="px-4 py-2">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
            class="px-4 py-2 mx-1 rounded border border-gray-300 bg-transparent hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
            Next
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
      </div>

    <div class="overflow-x-auto">
      <table class="table mx-auto table-xl w-full">
        <thead>
          <tr>
            <th @click="toggleSort('word')" class="cursor-pointer hover:font-bold">
              คำศัพท์
              <span v-if="sortField === 'word'" class="ml-1">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="toggleSort('correct')" class="cursor-pointer hover:font-bold">
              ถูก
              <span v-if="sortField === 'correct'" class="ml-1">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="toggleSort('incorrect')" class="cursor-pointer hover:font-bold">
              ผิด
              <span v-if="sortField === 'incorrect'" class="ml-1">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="toggleSort('successRate')" class="cursor-pointer hover:font-bold">
              อัตราความสำเร็จ
              <span v-if="sortField === 'successRate'" class="ml-1">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedStats.filter(w => w.word)" :key="item._id">
            <td @click="openPopup(item)" class="cursor-pointer hover:text-blue-500 text-2xl">{{ item.word }}</td>
            <td>{{ item.stats?.correct || 0 }}</td>
            <td>{{ item.stats?.incorrect || 0 }}</td>
            <td>
              <div class="flex items-center gap-2">
                <progress class="progress progress-primary w-32" :value="getSuccessRate(item)" max="100"></progress>
                <span>{{ getSuccessRate(item) }}%</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex justify-center my-4">
        <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
            class="px-4 py-2 mx-1 rounded border border-gray-300 bg-transparent hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Previous
          </button>
        <span class="px-4 py-2">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
            class="px-4 py-2 mx-1 rounded border border-gray-300 bg-transparent hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
            Next
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
      </div>
    </div>
    <!-- Reset Stats -->
    <div class="w-full flex my-4 justify-center">
      <button class="btn btn-error btn-sm" @click="showModal = true">
        <Icon name="radix-icons:reset" /> Reset Your Statistics
      </button>
    </div>
    <!-- Delete Confirmation Modal -->
    <div class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <h3 class="text-lg font-bold mb-4">ยืนยันการ Reset</h3>
        <p>คุณต้องการ Reset ประวัติการเล่นของคุณ ใช่หรือไม่?</p>
        <div class="modal-action">
          <button class="btn btn-error" @click="resetStats">
            <Icon name="material-symbols:delete-outline" /> ยืนยัน
          </button>
          <button class="btn" @click="showModal = false">
            <Icon name="bitcoin-icons:cross-filled" /> ยกเลิก
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showModal = false"></div>
    </div>

  </div>
  <div class="modal" :class="{ 'modal-open': showPopup }">
    <div class="modal-box">
      <h3 class="text-3xl font-bold mb-4 text-center">{{ popupCard?.word }}</h3>
      <p class="mb-4" v-html="popupCard?.meaning.replace(/\n/g, '<br>')"></p>
      <div class="modal-action">
        <div class="dropdown">
          <select v-model="selectLangToSpeak" class="select select-bordered w-full">
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
          </select>
        </div>
        <button class="btn" @click="popupSpeak">
          <Icon name="material-symbols:volume-up" /> อ่านออกเสียง
        </button>
        <button class="btn btn-error" @click="closePopup">
          <Icon name="bitcoin-icons:cross-filled" /> ปิด
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="closePopup"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import pronunciationLanguageData from '~/src/pronunciationLanguage.json'
const languages = ref(pronunciationLanguageData.languages)
import PouchDB from 'pouchdb'

const currentPage = ref(1);
const itemsPerPage = 20;

interface Card {
  _id?: string
  word: string
  meaning: string
  tags: string[]
  stats?: {
    correct: number
    incorrect: number
  }
}

const db = new PouchDB<Card>('flashcards')
const stats = ref<Card[]>([])
const sortField = ref<'word' | 'correct' | 'incorrect' | 'successRate'>('correct')
const sortDirection = ref<'asc' | 'desc'>('desc')
const showModal = ref(false)
function toggleSort(field: 'word' | 'correct' | 'incorrect' | 'successRate') {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'desc'
  }
}

const totalCorrect = computed(() =>
  stats.value.reduce((sum, card) => sum + (card.stats?.correct || 0), 0)
)

const totalWrong = computed(() =>
  stats.value.reduce((sum, card) => sum + (card.stats?.incorrect || 0), 0)
)

const sortedStats = computed(() => {
  return [...stats.value].sort((a, b) => {
    const aCorrect = a.stats?.correct || 0
    const bCorrect = b.stats?.correct || 0
    const aWrong = a.stats?.incorrect || 0
    const bWrong = b.stats?.incorrect || 0

    let comparison = 0

    switch (sortField.value) {
      case 'word':
        comparison = a.word.localeCompare(b.word)
        break
      case 'correct':
        comparison = aCorrect - bCorrect
        break
      case 'incorrect':
        comparison = aWrong - bWrong
        break
      case 'successRate':
        comparison = getSuccessRate(a) - getSuccessRate(b)
        break
    }

    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

const paginatedStats = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return sortedStats.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(sortedStats.value.length / itemsPerPage);
});

function getSuccessRate(card: Card) {
  if (!card.stats) return 0
  const total = (card.stats.correct || 0) + (card.stats.incorrect || 0)
  if (total === 0) return 0
  const rate = (card.stats.correct / total) * 100
  return Math.round(rate * 100) / 100 // Keep 2 decimal places
}

// Reset all stats
async function resetStats() {
  const cards = await db.allDocs({ include_docs: true })
  stats.value = cards.rows.map(r => r.doc as Card);

  for (const card of stats.value) {
    if (!card._id) continue
    const doc = await db.get(card._id)
    const stat = { correct: 0, incorrect: 0, lastSeen: Date.now() }
    await db.put({ ...doc, stats: stat })
  }
  showModal.value = false;
  loadStats();
}

async function loadStats() {
  const res = await db.allDocs({ include_docs: true })
  stats.value = res.rows.filter(c => c.doc?.word).map(r => r.doc as Card)
}

onMounted(() => {
  loadStats()
  loadSettings()
})
const popupCard = ref<Card | null>(null)
const showPopup = ref(false)
function openPopup(card: Card) { popupCard.value = card; showPopup.value = true }
function closePopup() { showPopup.value = false }
const selectLangToSpeak = ref('th-TH')

async function loadSettings() {
  try {
    const doc = await db.get<{ pronunciationLanguage: string }>('app_settings')
    selectLangToSpeak.value = doc.pronunciationLanguage || 'th-TH'
  } catch (err) {
    console.error('Failed to load settings:', err)
  }
}

function popupSpeak() {
  if (!popupCard.value) return
  const utterance = new SpeechSynthesisUtterance(popupCard.value.word)
  const langMap: Record<string, string> = { th: 'th-TH', en: 'en-US', zh: 'zh-CN' }
  utterance.lang = langMap[selectLangToSpeak.value] ?? 'en-US'

  const voices = window.speechSynthesis.getVoices()
  const voice = voices.find(v => v.lang === utterance.lang) ||
    voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)))
  if (voice) utterance.voice = voice

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
</script>