<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">จัดการคำศัพท์</h1>
      <button class="btn btn-primary" @click="openAddModal">เพิ่มคำศัพท์</button>
    </div>

    <!-- Search & Filter -->
    <div class="flex gap-4 mb-6 flex-wrap">
      <input v-model="searchQuery" type="text" placeholder="ค้นหาคำศัพท์..."
        class="input input-bordered w-full max-w-xs" />
      <div class="dropdown">
        <label tabindex="0" class="btn m-1">กรองตามแท็ก</label>
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

    <div class="dropdown mx-auto w-full  md:w-1/2 flex space-x-2 justify-center items-center">
      <div class="hidden md:block">อ่านภาษา : </div>
      <select v-model="selectLangToSpeak" class="select select-bordered ">
        <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
      </select>
    </div>

    <!-- Pagination -->
    <div class="flex justify-center my-8">
      <div class="btn-group">
        <button class="btn" :disabled="currentPage === 1" @click="currentPage--">«</button>
        <button class="btn">หน้า {{ currentPage }}</button>
        <button class="btn" :disabled="currentPage >= totalPages" @click="currentPage++">»</button>
      </div>
    </div>

    <!-- Card List -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="card in paginatedCards" :key="card._id" class="card bg-base-200">
        <div class="card-body relative">
          <button class="btn btn-circle btn-lg btn-ghost absolute top-2 right-2" @click="speakWord(card.word)"
            title="อ่านออกเสียง">
            <Icon name="material-symbols:volume-up" />
          </button>
          <div class="flex justify-between items-start">
            <h2 class="card-title">{{ card.word }}</h2>

          </div>
          <p>{{ card.meaning }}</p>
          <div class="flex flex-wrap gap-2 mt-2">
            <span v-for="tag in card.tags" :key="tag" class="badge badge-primary">{{ tag }}</span>
          </div>
          <div class="card-actions justify-end mt-4">
            <button class="btn btn-sm" @click="openEditModal(card)">แก้ไข</button>
            <button class="btn btn-sm btn-error" @click="showDeleteConfirm(card)">ลบ</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex justify-center mt-8">
      <div class="btn-group">
        <button class="btn" :disabled="currentPage === 1" @click="currentPage--">«</button>
        <button class="btn">หน้า {{ currentPage }}</button>
        <button class="btn" :disabled="currentPage >= totalPages" @click="currentPage++">»</button>
      </div>
    </div>

    <AddEdit id="edit-modal" :card="editingCard" @saveCard="loadCards" />

    <!-- Delete Confirmation Modal -->
    <div class="modal" :class="{ 'modal-open': showDeleteModal }">
      <div class="modal-box">
        <h3 class="text-lg font-bold mb-4">ยืนยันการลบ</h3>
        <p>คุณต้องการลบคำศัพท์ "{{ cardToDelete?.word }}" ใช่หรือไม่?</p>
        <div class="modal-action">
          <button class="btn btn-error" @click="confirmDelete">
            <Icon name="material-symbols:delete-outline" /> ยืนยัน
          </button>
          <button class="btn" @click="cancelDelete">
            <Icon name="bitcoin-icons:cross-filled" /> ยกเลิก
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="cancelDelete"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PouchDB from 'pouchdb'
import { useOpenAI } from '~/composables/useOpenAI'
import pronunciationLanguageData from '~/src/pronunciationLanguage.json'

interface Card {
  _id?: string
  word: string
  meaning: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

const settings = ref<{ pronunciationLanguage: string }>({ pronunciationLanguage: 'th-TH' });

async function loadSettings() {
  try {
    const doc = await db.get<{ pronunciationLanguage: string }>('app_settings');
    settings.value = { pronunciationLanguage: doc.pronunciationLanguage || 'th-TH' }
    selectLangToSpeak.value = doc.pronunciationLanguage || 'th-TH'
  } catch (err) {
    console.error('Failed to load settings:', err)
  }
}

// Text-to-Speech
function speakWord(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  const utterance = new SpeechSynthesisUtterance(text || '')
  const langMap: Record<string, string> = { th: 'th-TH', en: 'en-US', zh: 'zh-CN' }
  utterance.lang = langMap[selectLangToSpeak.value] ?? 'en-US'

  const voices = window.speechSynthesis.getVoices()
  const voice = voices.find(v => v.lang === utterance.lang) ||
    voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)))
  if (voice) utterance.voice = voice

  window.speechSynthesis.cancel() // stop any ongoing speech
  window.speechSynthesis.speak(utterance)
}


const db = new PouchDB<Card>('flashcards')
const languages = ref(pronunciationLanguageData.languages)
const selectLangToSpeak = ref('th-TH')

// ----- STATE -----
const cards = ref<Card[]>([])
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const editingCard = ref<Card | undefined>()
const cardToDelete = ref<Card | undefined>()
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const isLoadingAI = ref(false)
const cardForm = ref({ word: '', meaning: '', tagsInput: '' })
const currentPage = ref(1)
const itemsPerPage = 12

const { getMeaning } = useOpenAI()

// ----- COMPUTED -----
const allTags = computed(() => Array.from(new Set(cards.value.flatMap(c => c.tags))))

const filteredCards = computed(() =>
  cards.value
    .filter(card => {
      const matchSearch = searchQuery.value
        ? (card.word && card.word.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
        (card.meaning && card.meaning.toLowerCase().includes(searchQuery.value.toLowerCase()))
        : true
      const matchTags = !selectedTags.value.length || (card.tags && selectedTags.value.every(t => card.tags.includes(t)))
      return matchSearch && matchTags && card.word
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
),

  totalPages = computed(() => Math.ceil(filteredCards.value.length / itemsPerPage)),

  paginatedCards = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredCards.value.slice(start, end)
  })

// ----- MODAL HELPERS -----
function openAddModal() {
  editingCard.value = {};
  openEditModal();
}
function openEditModal(card?: Card) {
  if (card) {
    editingCard.value = card
    cardForm.value = { word: card.word, meaning: card.meaning, tagsInput: card.tags.join(', ') }
  } else {
    editingCard.value = null
    cardForm.value = { word: '', meaning: '', tagsInput: '' }
  }
  showAddModal.value = true;
  setTimeout(() => {
    openModal("edit-modal")
  }, 40);
}


function showDeleteConfirm(card: Card) {
  cardToDelete.value = card
  showDeleteModal.value = true
}
function cancelDelete() { showDeleteModal.value = false; cardToDelete.value = undefined }

// ----- CRUD -----
async function loadCards() {
  const res = await db.allDocs({ include_docs: true })
  cards.value = res.rows.map(r => r.doc as Card)
}



async function confirmDelete() {
  if (!cardToDelete.value?._id) return
  const doc = await db.get(cardToDelete.value._id)
  await db.remove(doc)
  showDeleteModal.value = false
  cardToDelete.value = null
  loadCards()
}

function openModal(id = "") {
  const modal = document.getElementById(id)
  modal?.classList.add('modal-open');
}

onMounted(() => {
  loadSettings();
  loadCards();
})
</script>
