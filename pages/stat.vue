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
            <th>อัตราความสำเร็จ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in sortedStats.filter(w => w.word)" :key="item._id">
            <td>{{ item.word }}</td>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PouchDB from 'pouchdb'

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
const sortField = ref<'word' | 'correct' | 'incorrect'>('correct')
const sortDirection = ref<'asc' | 'desc'>('desc')
const showModal = ref(false)
function toggleSort(field: 'word' | 'correct' | 'incorrect') {
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
    }

    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

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
  stats.value = res.rows.map(r => r.doc as Card)
}

onMounted(loadStats)
</script>