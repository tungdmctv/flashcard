<template>
  <div class="min-h-screen app-shell">
    <header class="app-titlebar relative z-[1200]">
      <div class="mx-auto max-w-6xl px-4 py-4 md:py-5 relative">
        <div class="dropdown text-lg absolute left-4 top-1/2 -translate-y-1/2">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle hamburger-btn">
            <Icon name="material-symbols:menu-rounded" class="text-[2rem] hamburger-icon" />
          </div>
          <ul tabindex="0"
            class="menu menu-lg dropdown-content bg-base-200 rounded-box z-[1300] mt-3 w-52 p-2 shadow bodered border-2 border-gray-300">
            <li>
              <NuxtLink to="/" @click="closeMobileMenu">
                <Icon name="icon-park-outline:flash-payment" /> My Flash Card
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/practice" @click="closeMobileMenu">
                <Icon name="material-symbols:play-circle" class="text-lg" /> ทายคำ
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/cards" @click="closeMobileMenu">
                <Icon name="icon-park-outline:setting-config" class="text-lg" /> จัดการคำศัพท์
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/stat" @click="closeMobileMenu">
                <Icon name="material-symbols:bar-chart-4-bars" class="text-lg" /> สถิติการฝึกฝน
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/settings" @click="closeMobileMenu">
                <Icon name="material-symbols:settings-heart-outline" class="text-lg" /> ตั้งค่า
              </NuxtLink>
            </li>
          </ul>
        </div>

        <NuxtLink to="/" class="title-brand text-xl md:text-2xl">
          <span class="title-top">READ AND REMEMBER</span>
          <span class="title-main">
            <Icon name="icon-park-outline:flash-payment" class="text-3xl" />
            <span>My Flash Card</span>
          </span>
        </NuxtLink>
      </div>
    </header>
    <div class="hidden">
      <ul class="lg:menu lg:menu-horizontal px-1">
          <li>
            <NuxtLink to="/practice">
              <Icon name="material-symbols:play-circle" class="text-lg" />ทายคำ
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/cards">
              <Icon name="icon-park-outline:setting-config" class="text-lg"/>จัดการคำศัพท์
            </NuxtLink>
          </li>

          <li>
            <nuxt-link to="/stat">
              <Icon name="material-symbols:bar-chart-4-bars" class="text-lg"/> สถิติ
            </nuxt-link>
          </li>
          <li>
            <NuxtLink to="/settings">
              <Icon name="material-symbols:settings-heart-outline" class="text-lg" />ตั้งค่า
            </NuxtLink>
          </li>
      </ul>
    </div>
    <div class="container mx-auto p-4">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
function closeMobileMenu() {
  if (typeof document === 'undefined') return
  const active = document.activeElement as HTMLElement | null
  active?.blur()
}
</script>
