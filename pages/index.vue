<template>
  <div class="hero min-h-[80vh] bg-base-200 rounded-lg">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">
          <Icon name="icon-park-outline:flash-payment" /> My Flash Card
        </h1>
      
        <div class="w-full stats shadow mb-6">
          <div class="stat">
            <div class="stat-title">คำศัพท์ทั้งหมด</div>
            <div class="stat-value">{{ totalWords }}</div>
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
        <div class="w-full text-center text-white">อัตราความสำเร็จ</div>
        <div class="mt-2 mb-8 radial-progress" :class="successRateColor" :style="{ '--value': successRate }" aria-valuenow="70"
          role="progressbar">{{ successRate }}%</div>

        <div class="w-full flex flex-col md:flex-row md:flex-wrap gap-4 justify-center text-xl">
          <NuxtLink to="/practice" class="btn btn-secondary btn-outline  text-xl">
            <Icon name="material-symbols:play-circle" class="text-2xl" />เริ่มทายคำ
          </NuxtLink>

          <NuxtLink to="/cards" class="btn btn-info btn-outline  text-xl">
            <Icon name="icon-park-outline:setting-config" class="text-2xl" />คำศัพท์
          </NuxtLink>
          <NuxtLink to="/stat" class="btn btn-accent btn-outline  text-xl">
            <Icon name="material-symbols:bar-chart-4-bars" class="text-2xl" /> สถิติ
          </NuxtLink>
          <NuxtLink to="/settings" class="btn  btn-outline  text-xl">
            <Icon name="material-symbols:settings-heart-outline" class="text-2xl" />ตั้งค่า
          </NuxtLink>
        </div>
        <div class="w-full flex flex-wrap gap-4 justify-center text-xl mt-14">
          <button v-if="canPromptInstall" @click="installApp" class="px-4 py-2 bg-blue-500 text-white rounded">
            <Icon name="material-symbols:download" class="w-6 h-6 inline-block" /> Install App
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PouchDB from 'pouchdb'

useHead({
  link: [
    { rel: 'manifest', href: '/flashcard/manifest.json' }
  ]
})

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
const totalWords = ref(0)
const totalCorrect = ref(0)
const totalWrong = ref(0)
const successRate = ref(0)
const successRateColor = computed(() => {
  if (successRate.value >= 80) return 'text-success'
  if (successRate.value >= 60) return 'text-warning'
  return 'text-error'
})

async function loadStats() {
  const res = await db.allDocs({ include_docs: true })
  const cards = res.rows.filter(c => c.doc?.word).map(r => r.doc as Card)

  totalWords.value = cards.length
  totalCorrect.value = cards.reduce((sum, card) => sum + (card.stats?.correct || 0), 0)
  totalWrong.value = cards.reduce((sum, card) => sum + (card.stats?.incorrect || 0), 0)

  const totalAttempts = totalCorrect.value + totalWrong.value
  successRate.value = totalAttempts > 0
    ? Math.round((totalCorrect.value / totalAttempts) * 10000) / 100
    : 0
}

onMounted(() => {
  loadStats()
})

const canPromptInstall = ref(false)
let deferredPrompt: BeforeInstallPromptEvent | null = null
onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
    e.preventDefault()
    deferredPrompt = e
    canPromptInstall.value = true
  })
})

async function installApp() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const choice = await deferredPrompt.userChoice
  console.log('Install prompt outcome:', choice.outcome)
  deferredPrompt = null
  canPromptInstall.value = false
}
</script>