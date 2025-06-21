<template>
  <div class="hero min-h-[80vh] bg-base-200 rounded-lg">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">
          <Icon name="icon-park-outline:flash-payment" /> My Flash Card
        </h1>
        <p class="py-6">
          ช่วยจำคำศัพท์ ด้วย Flash Card ด้วยคำที่คุณได้เรียนรู้มา พร้อมการสนับสนุนจาก AI
          ในการเพิ่มความหมายอัตโนมัติ
        </p>
        <div class="w-full flex flex-wrap gap-4 justify-center text-xl">
          <NuxtLink to="/cards" class="btn btn-primary text-xl">
            <Icon name="icon-park-outline:setting-config" />คำศัพท์
          </NuxtLink>
          <NuxtLink to="/practice" class="btn btn-secondary text-xl">
            <Icon name="material-symbols:play-circle" />เริ่มทายคำ
          </NuxtLink>
          <button v-if="canPromptInstall" @click="installApp" class="px-4 py-2 bg-blue-500 text-white rounded">
            <Icon name="material-symbols:download" class="w-6 h-6 inline-block" /> Install App
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  link: [
    { rel: 'manifest', href: '/flashcard/manifest.json' }
  ]
})

const canPromptInstall = ref(false)
let deferredPrompt = null
onMounted(() => {
  window.addEventListener('beforeinstallprompt', e => {
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