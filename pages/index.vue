<template>
  <section class="book-home min-h-[80vh] rounded-2xl p-4 md:p-8">
    <div class="mx-auto max-w-6xl">
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="paper-stat">
          <div class="flex items-center justify-center gap-2 text-amber-900/80">
            <Icon name="material-symbols:book-2-outline-rounded" class="text-xl" />
            <span class="text-sm leading-none">คำศัพท์</span>
          </div>
          <div class="text-3xl md:text-4xl font-bold text-amber-950 leading-none my-3">{{ totalWords }}</div>
          <div class="text-[11px] text-amber-900/55">ทั้งหมด</div>
        </div>
        <div class="paper-stat">
          <div class="flex items-center justify-center gap-2 text-amber-900/80">
            <Icon name="material-symbols:check-circle-outline" class="text-xl" />
            <span class="text-sm leading-none">ตอบถูก</span>
          </div>
          <div class="text-3xl md:text-4xl font-bold text-emerald-800 leading-none my-3">{{ totalCorrect }}</div>
          <div class="text-[11px] text-amber-900/55">ครั้ง</div>
        </div>
        <div class="paper-stat">
          <div class="flex items-center justify-center gap-2 text-amber-900/80">
            <Icon name="material-symbols:cancel-outline-rounded" class="text-xl" />
            <span class="text-sm leading-none">ตอบผิด</span>
          </div>
          <div class="text-3xl md:text-4xl font-bold text-rose-800 leading-none my-3">{{ totalWrong }}</div>
          <div class="text-[11px] text-amber-900/55">ครั้ง</div>
        </div>
      </div>

      <div class="paper-panel mb-8">
        <div class="text-center mb-3 text-amber-900/80">อัตราความสำเร็จ</div>
        <div class="flex justify-center">
          <div
            class="radial-progress border-4 border-amber-700/40 bg-amber-50 text-amber-900"
            :style="{ '--value': successRate }"
            role="progressbar"
          >
            {{ successRate }}%
          </div>
        </div>
      </div>

      <div class="paper-panel mb-8">
        <div class="text-center mb-4 text-amber-900/80">ความสม่ำเสมอ 7 วันล่าสุด (เล่นกี่คำ)</div>
        <div class="consistency-grid">
          <div v-for="item in last7DaysPlayed" :key="item.date" class="consistency-item">
            <div class="consistency-bar-wrap">
              <div class="consistency-bar" :style="{ height: `${item.height}%` }"></div>
            </div>
            <div class="text-sm font-bold text-amber-900">{{ item.count }}</div>
            <div class="text-xs text-amber-900/70">{{ item.label }}</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink to="/practice" class="menu-card">
          <Icon name="material-symbols:play-circle" class="text-3xl" />
          <span>เริ่มทายคำ</span>
        </NuxtLink>
        <NuxtLink to="/cards" class="menu-card">
          <Icon name="icon-park-outline:setting-config" class="text-3xl" />
          <span>จัดการคำศัพท์</span>
        </NuxtLink>
        <NuxtLink to="/stat" class="menu-card">
          <Icon name="material-symbols:bar-chart-4-bars" class="text-3xl" />
          <span>สถิติ</span>
        </NuxtLink>
        <NuxtLink to="/settings" class="menu-card">
          <Icon name="material-symbols:settings-heart-outline" class="text-3xl" />
          <span>ตั้งค่า</span>
        </NuxtLink>
      </div>

      <div class="w-full flex flex-wrap gap-4 justify-center text-xl mt-10">
        <button v-if="canPromptInstall" @click="installApp" class="install-btn">
          <Icon name="material-symbols:download" class="w-6 h-6 inline-block" /> Install App
        </button>
      </div>
    </div>
  </section>
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
    dailyPlayed?: Record<string, number>
  }
}

const db = new PouchDB<Card>('flashcards')
const totalWords = ref(0)
const totalCorrect = ref(0)
const totalWrong = ref(0)
const successRate = ref(0)
const last7DaysPlayed = ref<Array<{ date: string; label: string; count: number; height: number }>>([])

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

  const days: Array<{ date: string; label: string }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    days.push({ date, label })
  }

  const dailyTotals = days.map((d) => {
    const count = cards.reduce((sum, card) => {
      return sum + Number(card.stats?.dailyPlayed?.[d.date] || 0)
    }, 0)
    return { ...d, count }
  })
  const maxCount = Math.max(...dailyTotals.map(d => d.count), 0)
  last7DaysPlayed.value = dailyTotals.map((d) => ({
    ...d,
    height: maxCount > 0 ? Math.max(10, Math.round((d.count / maxCount) * 100)) : 10
  }))
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

<style scoped>
.book-home {
  background:
    radial-gradient(circle at 10% 10%, rgba(251, 191, 36, 0.2), transparent 45%),
    radial-gradient(circle at 85% 85%, rgba(120, 53, 15, 0.18), transparent 40%),
    linear-gradient(135deg, #f7ecd5 0%, #f3e3c2 50%, #ead6b2 100%);
  border: 1px solid rgba(120, 53, 15, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 12px 40px rgba(120, 53, 15, 0.18);
}

.paper-stat {
  background: linear-gradient(180deg, rgba(255, 251, 240, 0.95), rgba(250, 240, 217, 0.95));
  border: 1px solid rgba(120, 53, 15, 0.2);
  border-radius: 1rem;
  padding: 1rem 1.2rem;
  box-shadow: 0 4px 14px rgba(120, 53, 15, 0.1);
}

.paper-panel {
  border-radius: 1rem;
  border: 1px solid rgba(120, 53, 15, 0.2);
  background: rgba(255, 251, 240, 0.85);
  padding: 1.25rem;
}

.menu-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  border-radius: 1rem;
  border: 1px solid rgba(120, 53, 15, 0.28);
  background: linear-gradient(180deg, #fff9ec, #f4e4c4);
  color: #4a2f1b;
  font-weight: 700;
  font-size: 1.05rem;
  min-height: 4.2rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.menu-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(120, 53, 15, 0.18);
}

.install-btn {
  padding: 0.7rem 1.2rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(120, 53, 15, 0.3);
  background: #5b3a29;
  color: #fff9ec;
}

.consistency-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.65rem;
  align-items: end;
}

.consistency-item {
  text-align: center;
}

.consistency-bar-wrap {
  height: 90px;
  border-radius: 0.7rem;
  background: rgba(120, 53, 15, 0.08);
  border: 1px solid rgba(120, 53, 15, 0.18);
  display: flex;
  align-items: flex-end;
  padding: 0.3rem;
}

.consistency-bar {
  width: 100%;
  border-radius: 0.45rem;
  background: linear-gradient(180deg, #8b5d3d, #5d3a28);
  transition: height 0.3s ease;
}
</style>
