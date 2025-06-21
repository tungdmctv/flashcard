<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">คำศัพท์ทั้งหมด</h1>
      <div class="flex gap-4">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="ค้นหาคำศัพท์..."
          class="input input-bordered w-full max-w-xs"
        />
        <div class="dropdown">
          <label tabindex="0" class="btn m-1">กรองตามแท็ก</label>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
            <li v-for="tag in allTags" :key="tag">
              <label class="label cursor-pointer justify-start gap-2">
                <input type="checkbox" v-model="selectedTags" :value="tag" class="checkbox" />
                <span class="label-text">{{ tag }}</span>
              </label>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>คำศัพท์</th>
            <th>ความหมาย</th>
            <th>แท็ก</th>
            <th>วันที่เพิ่ม</th>
            <th>วันที่แก้ไข</th>
            <th>การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="card in filteredCards" :key="card._id">
            <td>{{ card.word }}</td>
            <td>{{ card.meaning }}</td>
            <td>
              <div class="flex flex-wrap gap-1">
                <span v-for="tag in card.tags" :key="tag" class="badge badge-primary">{{ tag }}</span>
              </div>
            </td>
            <td>{{ formatDate(card.createdAt) }}</td>
            <td>{{ formatDate(card.updatedAt) }}</td>
            <td>
              <div class="flex gap-2">
                <button class="btn btn-sm" @click="editCard(card)">แก้ไข</button>
                <button class="btn btn-sm btn-error" @click="deleteCard(card)">ลบ</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <dialog class="modal" :class="{ 'modal-open': showEditModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">แก้ไขคำศัพท์</h3>
        <form @submit.prevent="saveCard">
          <div class="form-control">
            <label class="label">
              <span class="label-text">คำศัพท์</span>
            </label>
            <input
              type="text"
              v-model="cardForm.word"
              required
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">ความหมาย</span>
            </label>
            <textarea
              v-model="cardForm.meaning"
              required
              class="textarea textarea-bordered h-24"
            ></textarea>
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">แท็ก (คั่นด้วยเครื่องหมาย ,)</span>
            </label>
            <input
              type="text"
              v-model="cardForm.tagsInput"
              placeholder="tag1, tag2, tag3"
              class="input input-bordered w-full"
            />
          </div>
          <div class="modal-action">
            <button type="submit" class="btn btn-primary">บันทึก</button>
            <button type="button" class="btn" @click="showEditModal = false">ยกเลิก</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showEditModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PouchDB from 'pouchdb'

interface Card {
  _id?: string
  word: string
  meaning: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

const db = new PouchDB('flashcards')

// State
const cards = ref<Card[]>([])
const showEditModal = ref(false)
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const editingCard = ref<Card | null>(null)
const cardForm = ref({
  word: '',
  meaning: '',
  tagsInput: ''
})

// Computed
const allTags = computed(() => {
  const tags = new Set<string>()
  cards.value.forEach(card => card.tags?.forEach(tag => tags.add(tag)))
  return Array.from(tags)
})

const filteredCards = computed(() => {
  return cards.value
    .filter(card => {
      if (!card.word || !card.meaning) return false
      const matchesSearch = searchQuery.value
        ? (card.word.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
           card.meaning.toLowerCase().includes(searchQuery.value.toLowerCase()))
        : true
      const matchesTags = selectedTags.value.length === 0 ||
        selectedTags.value.every(tag => card.tags?.includes(tag))
      return matchesSearch && matchesTags
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
})

// Methods
async function loadCards() {
  try {
    const result = await db.allDocs({ include_docs: true })
    cards.value = result.rows.map(row => row.doc as Card)
  } catch (error) {
    console.error('Error loading cards:', error)
  }
}

async function saveCard() {
  try {
    const tags = cardForm.value.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    const card: Card = {
      word: cardForm.value.word,
      meaning: cardForm.value.meaning,
      tags,
      createdAt: editingCard.value?.createdAt || Date.now(),
      updatedAt: Date.now()
    }

    if (editingCard.value?._id) {
      await db.put({ ...card, _id: editingCard.value._id, _rev: (await db.get(editingCard.value._id))._rev })
    }

    await loadCards()
    resetForm()
    alert('อัปเดตคำศัพท์สำเร็จ')
  } catch (error) {
    console.error('Error saving card:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกคำศัพท์: ' + (error as Error).message)
  }
}

async function deleteCard(card: Card) {
  if (!card._id) return
  if (!confirm('คุณแน่ใจหรือไม่ที่จะลบคำศัพท์นี้?')) return

  try {
    const doc = await db.get(card._id)
    await db.remove(doc)
    await loadCards()
    alert('ลบคำศัพท์สำเร็จ')
  } catch (error) {
    console.error('Error deleting card:', error)
    alert('เกิดข้อผิดพลาดในการลบคำศัพท์: ' + (error as Error).message)
  }
}

function editCard(card: Card) {
  editingCard.value = card
  cardForm.value = {
    word: card.word,
    meaning: card.meaning,
    tagsInput: card.tags?.join(', ') || ''
  }
  showEditModal.value = true
}

function resetForm() {
  cardForm.value = {
    word: '',
    meaning: '',
    tagsInput: ''
  }
  editingCard.value = null
  showEditModal.value = false
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Initial load
loadCards()
</script>