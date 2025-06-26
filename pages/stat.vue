<template>
  <div class="p-0 w-full ">
    <h1 class="text-2xl font-bold mb-6">สถิติการฝึกฝน</h1>

    <!-- Search & Filter -->
    <div class="flex justify-center items-center gap-1 mb-6 ">
      <input v-model="searchQuery" type="text" placeholder="ค้นหาคำศัพท์..."
        class="input input-bordered w-1/2" />
      <div class="dropdown">
        <label tabindex="0" class="btn m-1"><Icon name="material-symbols:label-outline" class="mr-1" /> Tags</label>
        <ul tabindex="0"
          class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-[1] max-h-96 overflow-y-auto">
          <li v-for="tag in allTags.filter(t => t)" :key="tag">
            <label class="cursor-pointer flex gap-2">
              <input v-model="selectedTags" :value="tag" type="checkbox" class="checkbox" />
              <span>{{ tag }}</span>
            </label>
          </li>
        </ul>
      </div>
    </div>


    <div class="flex w-full justify-between items-center mb-6 gap-1 ">
      <div class="stats shadow  w-full p-0">
        <div class="stat">
          <div class="stat-title">คำ</div>
          <div class="stat-value">{{ stats.length }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">ถูก</div>
          <div class="stat-value text-success">{{ totalCorrect }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">ผิด</div>
          <div class="stat-value text-error">{{ totalWrong }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">สำเร็จ</div>
          <div 
            class="stat-value" 
            :style="{ color: getSuccessRateColor(overallSuccessRate) }"
          >
            {{ overallSuccessRate }}%
          </div>
        </div>
      </div>

    </div>

    <div class="flex text-sm justify-center my-4">
      <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
        class="btn btn-outline btn-sm">
        <Icon name="material-symbols:arrow-back-ios" class="inline-block" />
      </button>
      <span class="px-4 py-2">
        {{ currentPage }} of {{ totalPages }}
      </span>
      <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
        class="btn btn-outline btn-sm">
        <Icon name="material-symbols:arrow-forward-ios" class="inline-block" />
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
                <span :style="'color: hsl(' + (getSuccessRate(item) * 1.2) + ', 100%, 50%)'">
                  {{ getSuccessRate(item) }}%
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex text-sm justify-center my-4">
        <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
          class="btn btn-outline btn-sm">
          <Icon name="material-symbols:arrow-back-ios" class="inline-block" />
        </button>
        <span class="px-4 py-2">
          {{ currentPage }} of {{ totalPages }}
        </span>
        <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
          class="btn btn-outline btn-sm">
          <Icon name="material-symbols:arrow-forward-ios" class="inline-block" />
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

const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const allTags = computed(() => Array.from(new Set(stats.value.flatMap(c => c.tags))))
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
const sortField = ref<'word' | 'correct' | 'incorrect' | 'successRate'>('successRate')
const sortDirection = ref<'asc' | 'desc'>('desc')
function getSuccessRateColor(rate: number) {
  if (rate >= 80) return '#22c55e' // green-500
  if (rate >= 60) return '#eab308' // yellow-500
  if (rate >= 40) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

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

const overallSuccessRate = computed(() => {
  const total = totalCorrect.value + totalWrong.value
  if (total === 0) return 0
  const rate = (totalCorrect.value / total) * 100
  return Math.round(rate)
})

const filteredStats = computed(() =>
  stats.value
    .filter(card => {
      const matchSearch = searchQuery.value
        ? (card.word && card.word.toLowerCase().includes(searchQuery.value.toLowerCase()))
        : true
      const matchTags = !selectedTags.value.length || (card.tags && selectedTags.value.every(t => card.tags.includes(t)))
      return matchSearch && matchTags && card.word
    })
    .sort((a, b) => {
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
)

const paginatedStats = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredStats.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredStats.value.length / itemsPerPage);
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