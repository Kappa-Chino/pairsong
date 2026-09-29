<script setup>
defineProps({
  title: { type: String, required: true },
  backTo: { type: String, default: '/' },
})
</script>

<template>
  <header class="page-header">
    <div class="page-title-row">
      <RouterLink class="back-button" :to="backTo" aria-label="戻る">
        <svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg>
      </RouterLink>
      <h1>{{ title }}</h1>
      <div class="header-spacer"></div>
    </div>
  </header>
</template>
