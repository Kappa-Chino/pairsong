echo "# pairsong" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/Kappa-Chino/pairsong.git
git push -u origin main<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import store from '@/reactive/store'

const route = useRoute()

// audio 要素と再生 UI が共有する状態。
const audioPlayer = ref(null)
const duration = ref(0)
const currentTime = ref(0)
const isPlaying = ref(false)
const shuffle = ref(false)
const repeat = ref(false)

// URL クエリを優先し、なければセッション内に保存した音楽 URL を使う。
const musicUrl = computed(() => {
  const queryUrl = Array.isArray(route.query.src) ? route.query.src[0] : route.query.src
  return queryUrl || store.musicUrl
})
const progress = computed(() => duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0)

// 秒数をプレイヤー表示用の m:ss 形式に変換する。
function formatTime(total) {
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0
  const minutes = Math.floor(safeTotal / 60)
  const seconds = String(safeTotal % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

// 円形画像と中央ボタンの両方から再生・一時停止を切り替える。
async function togglePlayback() {
  const player = audioPlayer.value
  if (!player || !musicUrl.value) return

  if (player.paused) {
    try {
      await player.play()
    } catch {
      isPlaying.value = false
    }
  } else {
    player.pause()
  }
}

// シークバーと前後15秒ボタンから再生位置を変更する。
function seek(event) {
  const value = Number(event.target.value)
  currentTime.value = value
  if (audioPlayer.value) audioPlayer.value.currentTime = value
}

function skip(amount) {
  const player = audioPlayer.value
  if (!player) return

  player.currentTime = Math.min(duration.value || 0, Math.max(0, player.currentTime + amount))
  currentTime.value = player.currentTime
}

// audio 要素のイベントを Vue の表示状態へ反映する。
function updateMetadata() {
  duration.value = Number.isFinite(audioPlayer.value?.duration) ? audioPlayer.value.duration : 0
}

function updateCurrentTime() {
  currentTime.value = audioPlayer.value?.currentTime || 0
}

// リピート状態を audio 要素の loop 設定にも反映する。
function toggleRepeat() {
  repeat.value = !repeat.value
  if (audioPlayer.value) audioPlayer.value.loop = repeat.value
}

function handleEnded() {
  isPlaying.value = false
  if (!repeat.value) currentTime.value = duration.value
}

// 別の音楽 URL に変わった場合は再生状態を初期化する。
watch(musicUrl, () => {
  currentTime.value = 0
  duration.value = 0
  isPlaying.value = false
})

onBeforeUnmount(() => audioPlayer.value?.pause())
</script>

<template>
  <section class="music-screen decorative-screen">
    <PageHeader title="鯖江の思い出" back-to="/qr" />

    <audio
      v-if="musicUrl"
      ref="audioPlayer"
      :src="musicUrl"
      type="audio/mpeg"
      preload="metadata"
      autoplay
      @loadedmetadata="updateMetadata"
      @durationchange="updateMetadata"
      @timeupdate="updateCurrentTime"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="handleEnded"
    ></audio>

    <div class="player-content">
      <!-- 支給画像を使った円形ジャケット兼再生ボタン。 -->
      <div class="record-wrap">
        <div class="record-disc" aria-hidden="true"></div>
        <button
          class="record-play"
          :class="{ 'is-playing': isPlaying }"
          type="button"
          :disabled="!musicUrl"
          :aria-label="isPlaying ? '一時停止' : '再生'"
          @click="togglePlayback"
        >
          <svg v-if="isPlaying" viewBox="0 0 24 24"><path d="M8 6h3v12H8zM14 6h3v12h-3z" /></svg>
        </button>
      </div>

      <!-- 曲名と音楽 URL の準備状態。 -->
      <div class="track-info">
        <span class="eyebrow">FUTARINE ORIGINAL</span>
        <h2>鯖江の思い出</h2>
        <p>{{ musicUrl ? 'ふたりの今日を、音に。' : '音楽URLを待っています。' }}</p>
      </div>

      <!-- 再生位置、経過時間、曲の長さ。 -->
      <div class="progress-wrap">
        <div class="range-shell" :style="{ '--progress': `${progress}%` }">
          <input
            type="range"
            min="0"
            :max="Math.max(duration, 1)"
            :value="currentTime"
            :disabled="!musicUrl"
            aria-label="再生位置"
            @input="seek"
          >
        </div>
        <div class="time-row"><span>{{ formatTime(currentTime) }}</span><span>{{ formatTime(duration) }}</span></div>
      </div>

      <!-- シャッフル、15秒移動、再生、一時停止、リピート操作。 -->
      <div class="player-controls">
        <button type="button" :class="{ active: shuffle }" aria-label="シャッフル" @click="shuffle = !shuffle">
          <svg viewBox="0 0 24 24"><path d="M4 7h3c4 0 5 10 9 10h4M17 14l3 3-3 3M4 17h3c1.4 0 2.5-1.2 3.4-2.8M14 7.8C14.7 7.3 15.3 7 16 7h4M17 4l3 3-3 3" /></svg>
        </button>
        <button type="button" aria-label="15秒戻る" @click="skip(-15)">
          <svg viewBox="0 0 24 24"><path d="M6 8v5h5M6.5 12a6 6 0 1 0 2-4.5L6 10" /></svg>
        </button>
        <button class="main-play" type="button" :disabled="!musicUrl" :aria-label="isPlaying ? '一時停止' : '再生'" @click="togglePlayback">
          <svg v-if="!isPlaying" viewBox="0 0 24 24"><path d="m9 6 9 6-9 6z" /></svg>
          <svg v-else viewBox="0 0 24 24"><path d="M8 6h3v12H8zM14 6h3v12h-3z" /></svg>
        </button>
        <button type="button" aria-label="15秒進む" @click="skip(15)">
          <svg viewBox="0 0 24 24"><path d="M18 8v5h-5M17.5 12a6 6 0 1 1-2-4.5L18 10" /></svg>
        </button>
        <button type="button" :class="{ active: repeat }" aria-label="リピート" @click="toggleRepeat">
          <svg viewBox="0 0 24 24"><path d="M17 4l3 3-3 3M4 11V9a2 2 0 0 1 2-2h14M7 20l-3-3 3-3M20 13v2a2 2 0 0 1-2 2H4" /></svg>
        </button>
      </div>
    </div>
  </section>
</template>
