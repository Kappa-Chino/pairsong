<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 下部ナビゲーションに表示する主要ページ。
const navItems = [
  { name: 'home', label: 'ホーム', path: '/', icon: 'home' },
  { name: 'map', label: '地図', path: '/map', icon: 'map' },
  { name: 'qr', label: '音楽', path: '/qr', icon: 'music' },
]

// 音楽再生ページでは「音楽」タブを選択状態にする。
const activeNav = computed(() => route.name === 'music' ? 'qr' : route.name)

// 現在のページに合わせて active / inactive アイコンを切り替える。
function navIconUrl(item) {
  const state = activeNav.value === item.name ? 'active' : 'inactive'
  return `${import.meta.env.BASE_URL}assets/img/${item.icon}_${state}.png`
}
</script>

<template>
  <div class="app-shell">
    <main class="app-content">
      <RouterView />
    </main>

    <!-- 全画面で共通使用する下部ナビゲーション。 -->
    <nav class="bottom-nav" aria-label="メインナビゲーション">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        class="nav-item"
        :class="{ active: activeNav === item.name }"
        :aria-label="item.label"
      >
        <span
          class="nav-image"
          :class="`nav-image-${item.icon}`"
          :style="{ backgroundImage: `url(${navIconUrl(item)})` }"
          aria-hidden="true"
        ></span>
      </RouterLink>
    </nav>
  </div>
</template>
