<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import store from '@/reactive/store'

const route = useRoute()
const router = useRouter()
const qrcode = ref('')

// URL クエリを優先し、なければ接続フローで保存した音楽 URL を使う。
const musicUrl = computed(() => {
  const queryUrl = Array.isArray(route.query.src) ? route.query.src[0] : route.query.src
  return queryUrl || store.musicUrl
})

// QR コードから、このサイトの音楽再生ページを開ける URL を作る。
function createMusicPageUrl(source) {
  const appUrl = `${window.location.origin}${import.meta.env.BASE_URL}#/music`
  return source ? `${appUrl}?src=${encodeURIComponent(source)}` : appUrl
}

// QRious を使い、音楽 URL を含む QR コード画像を生成する。
function generateQrCode() {
  const legacyUrl = Array.isArray(route.query.url) ? route.query.url[0] : route.query.url
  const value = legacyUrl || createMusicPageUrl(musicUrl.value)

  if (window.QRious) {
    const qr = new window.QRious({
      value,
      size: 320,
      level: 'H',
      background: '#ffffff',
      foreground: '#142942',
      padding: 22,
    })
    qrcode.value = qr.toDataURL()
  }
}

// 同じ端末では QR を読まずに音楽再生ページへ移動する。
function openMusic() {
  router.push({
    name: 'music',
    query: musicUrl.value ? { src: musicUrl.value } : {},
  })
}

watch([musicUrl, () => route.query.url], generateQrCode, { immediate: true })
</script>

<template>
  <section class="qr-screen decorative-screen">
    <PageHeader title="ふたりの音を持ち帰る" />

    <!-- 背景を飾る五線と音符。 -->
    <div class="staff-lines staff-lines-top" aria-hidden="true"><i>♪</i></div>
    <div class="staff-lines staff-lines-bottom" aria-hidden="true"><i>♫</i></div>

    <div class="qr-content">
      <!-- QR コードの説明文。 -->
      <div class="qr-copy">
        <span class="eyebrow">OUR MEMORY, OUR MUSIC</span>
        <h2>今日のふたりの音が<br>できました。</h2>
        <p>このQRコードを読み取ると、<br>ふたりが歩いた道の思い出から生まれた<br>音楽をいつでも聴くことができます。</p>
      </div>

      <!-- 生成済み QR コードと中央の音楽マーク。 -->
      <div class="qr-card">
        <div v-if="qrcode" class="qr-frame">
          <img :src="qrcode" alt="音楽を開くQRコード">
          <span class="qr-music-mark">
            <svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></svg>
          </span>
        </div>
        <div v-else class="qr-placeholder">QR</div>
      </div>

      <!-- QR を使わず現在の端末で再生する導線。 -->
      <button class="text-link-button" type="button" @click="openMusic">
        この端末で音楽を聴く
        <svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>
      </button>
    </div>
  </section>
</template>
