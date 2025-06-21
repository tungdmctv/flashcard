<template>
  <div class="hero min-h-[80vh] bg-base-200 rounded-lg">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold"><Icon name="icon-park-outline:flash-payment" /> My Flash Card</h1>
        <p class="py-6">
          ช่วยจำคำศัพท์ ด้วย Flash Card ด้วยคำที่คุณได้เรียนรู้มา พร้อมการสนับสนุนจาก AI
          ในการเพิ่มความหมายอัตโนมัติ
        </p>
        <div class="flex gap-4 justify-center">
          <NuxtLink to="/cards" class="btn btn-primary"><Icon name="icon-park-outline:setting-config" />คำศัพท์</NuxtLink>
          <NuxtLink to="/practice" class="btn btn-secondary"><Icon name="material-symbols:play-circle" />เริ่มทายคำ</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Component logic here
</script>