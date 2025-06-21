<template>
  <div class="min-h-screen">
    <nav class="navbar bg-base-100 shadow-sm">
      <div class="navbar-start">
        <div class="dropdown text-lg">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <ul tabindex="0" class="menu menu-lg dropdown-content bg-base-200 rounded-box z-1 mt-3 w-52 p-2 shadow bodered border-2 border-gray-300">
            <li>
              <NuxtLink to="/"><Icon name="icon-park-outline:flash-payment" />  My Flash Card</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/cards"><Icon name="icon-park-outline:setting-config" /> จัดการคำศัพท์</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/all-words"><Icon name="icon-park-twotone:file-word" /> คำศัพท์ทั้งหมด</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/practice"><Icon name="material-symbols:play-circle" /> ทายคำ</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/settings"><Icon name="material-symbols:settings-heart-outline" /> ตั้งค่า</NuxtLink>
            </li>
          </ul>
        </div>
      </div>
      <div class="navbar-center">
        <NuxtLink to="/" class="btn btn-warning text-xl"><Icon name="icon-park-outline:flash-payment" /> My Flash Card</NuxtLink>
      </div>
      <div class="navbar-end">
        <ul class="hidden lg:menu lg:menu-horizontal px-1">
          <li>
            <NuxtLink to="/cards"><Icon name="icon-park-outline:setting-config" />จัดการคำศัพท์</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/all-words"><Icon name="icon-park-twotone:file-word" />คำศัพท์ทั้งหมด</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/practice"><Icon name="material-symbols:play-circle" />ทายคำ</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/settings"><Icon name="material-symbols:settings-heart-outline" />ตั้งค่า</NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
    <div class="container mx-auto p-4">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
// Your component logic here
</script>
