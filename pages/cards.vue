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
        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-[1]">
          <li v-for="tag in allTags" :key="tag">
            <label class="cursor-pointer flex gap-2">
              <input v-model="selectedTags" :value="tag" type="checkbox" class="checkbox" />
              <span>{{ tag }}</span>
            </label>
          </li>
        </ul>
      </div>
    </div>

    <!-- Card List -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="card in filteredCards.filter(c => c.word)" :key="card._id" class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">{{ card.word }}</h2>
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

    <!-- Add / Edit Modal -->
    <div class="modal" :class="{ 'modal-open': showAddModal }">
      <div class="modal-box relative max-w-2xl">
        <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="closeAddModal">✕</button>
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

interface Card {
  _id?: string
  word: string
  meaning: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

const db = new PouchDB<Card>('flashcards')

// ----- STATE -----
const cards = ref<Card[]>([])
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const editingCard = ref<Card | null>(null)
const cardToDelete = ref<Card | null>(null)
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const isLoadingAI = ref(false)
const cardForm = ref({ word: '', meaning: '', tagsInput: '' })

const { getMeaning } = useOpenAI()

// ----- COMPUTED -----
const allTags = computed(() => Array.from(new Set(cards.value.flatMap(c => c.tags))))

const filteredCards = computed(() =>
  cards.value
    .filter(card => {
      const matchSearch = searchQuery.value
        ? card.word.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        card.meaning.toLowerCase().includes(searchQuery.value.toLowerCase())
        : true
      const matchTags = !selectedTags.value.length || selectedTags.value.every(t => card.tags.includes(t))
      return matchSearch && matchTags
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
)

// ----- MODAL HELPERS -----
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

function showDeleteConfirm(card: Card) {
  cardToDelete.value = card
  showDeleteModal.value = true
}
function cancelDelete() { showDeleteModal.value = false; cardToDelete.value = null }

// ----- CRUD -----
async function loadCards() {
  const res = await db.allDocs({ include_docs: true })
  cards.value = res.rows.map(r => r.doc as Card)
}

async function saveCard() {
  // trim และตรวจสอบว่ากรอกครบ
  const word = cardForm.value.word.trim()
  const meaning = cardForm.value.meaning.trim()
  if (!word || !meaning) return

  // ตรวจคำซ้ำ (case‑insensitive) ถ้าเป็นการเพิ่มใหม่หรือเปลี่ยนคำ
  const duplicate = cards.value.find(c => c.word.toLowerCase() === word.toLowerCase() && c._id !== editingCard.value?._id)
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
  loadCards()
}

async function confirmDelete() {
  if (!cardToDelete.value?._id) return
  const doc = await db.get(cardToDelete.value._id)
  await db.remove(doc)
  showDeleteModal.value = false
  cardToDelete.value = null
  loadCards()
}

// ----- AI -----
async function getMeaningFromAI() {
  if (!cardForm.value.word || isLoadingAI.value) return
  isLoadingAI.value = true
  try { cardForm.value.meaning = await getMeaning(cardForm.value.word) }
  catch (e) { console.error(e) }
  finally { isLoadingAI.value = false }
}

onMounted(loadCards)
</script>
