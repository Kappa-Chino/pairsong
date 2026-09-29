<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

// 先生が作成した Unity WebGL 地図を外部ページから埋め込む。
const MAP_APP_URL = 'https://event.jec.ac.jp/pairsong/SABAEMapAPP/'
const frameLoaded = ref(false)
let loadingFallback

// iframe の load が遅い環境でもローディング表示を残し続けないための保険。
function startLoadingFallback() {
  window.clearTimeout(loadingFallback)
  loadingFallback = window.setTimeout(() => {
    frameLoaded.value = true
  }, 2500)
}

onMounted(startLoadingFallback)
onBeforeUnmount(() => window.clearTimeout(loadingFallback))
</script>

<template>
  <section class="map-screen unity-map-screen">
    <PageHeader title="ふたりが歩いた道" />

    <!-- Unity 側の Canvas サイズは外部ページ内で管理される。 -->
    <div class="unity-map-shell">
      <iframe
        class="unity-map-frame"
        :src="MAP_APP_URL"
        title="SABAEMap ふたりのルート"
        allow="fullscreen"
        @load="frameLoaded = true"
      ></iframe>

      <!-- 初回ロード中だけ表示する案内。 -->
      <div v-if="!frameLoaded" class="unity-map-loading" role="status">
        <span class="unity-loading-ring" aria-hidden="true"></span>
        <strong>地図を読み込んでいます…</strong>
        <small>初回は少し時間がかかります</small>
      </div>
    </div>
  </section>
</template>
