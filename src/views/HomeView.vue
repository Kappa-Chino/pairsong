<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Leafony from '@/lib/Leafony'
import Api from '@/lib/Api'
import store from '@/reactive/store'

const router = useRouter()
const logoUrl = `${import.meta.env.BASE_URL}assets/img/logo.png`

// ペンダント接続から音楽生成までの進行状態と案内メッセージ。
const connectionState = ref('idle')
const connectionMessage = ref('')
let activeLeafony = null

const busyStates = ['connecting', 'collecting', 'submitting', 'generating']
const isBusy = computed(() => busyStates.includes(connectionState.value))
const buttonLabel = computed(() => ({
  idle: 'ペンダントとつなぐ',
  connecting: '接続しています…',
  collecting: 'GPSデータを受信中…',
  submitting: 'ルートを登録中…',
  generating: '音楽を作っています…',
  ready: '音楽ができました',
  error: 'もう一度つなぐ',
})[connectionState.value] || 'ペンダントとつなぐ')

// Leafony が送信する終了データを判定する。
function isTerminator(point) {
  return Number(point.date) === 0
}

function formatLeafonyTime(value) {
  const digits = String(value).replace(/\D/g, '')
  if (digits.length !== 14) return null

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)} ${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12, 14)}`
}

// Leafony のデータをルート登録 API の形式に変換する。
function createRoutePayload(dataSet) {
  return dataSet
    .filter(point => !isTerminator(point))
    .map(point => ({
      time: formatLeafonyTime(point.date),
      lat: String(point.lat),
      lng: String(point.lng),
    }))
    .filter(point => point.time && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng)))
}

function wait(milliseconds) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds))
}

// API は音楽生成前に URL を返すため、再生可能になるまで定期確認する。
async function waitForMusic(musicUrl) {
  const maximumAttempts = 30

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      const response = await fetch(musicUrl, {
        method: 'HEAD',
        cache: 'no-store',
      })

      if (response.ok) return
    } catch {
      // The file may not exist yet or the server may still be generating it.
    }

    connectionMessage.value = `音楽を作っています…（確認 ${attempt}/${maximumAttempts}）`
    if (attempt < maximumAttempts) await wait(10000)
  }

  throw new Error('音楽の生成に時間がかかっています。しばらくしてからもう一度お試しください。')
}

// GPS ルートを送信し、完成した音楽 URL を保存して QR ページへ進む。
async function registerRoute(routePoints) {
  connectionState.value = 'submitting'
  connectionMessage.value = `${routePoints.length}件のGPSデータを送信しています…`

  try {
    const response = await new Api('/route/1', 'POST').request(routePoints)

    if (!response.ok) {
      throw new Error(`ルート登録に失敗しました（${response.status}）`)
    }

    const result = await response.json()
    if (result.status !== 'success' || !result.music_url) {
      throw new Error('APIから音楽URLを取得できませんでした')
    }

    store.setRouteResult({
      routeId: result.route_id,
      musicUrl: result.music_url,
      routePoints,
    })

    activeLeafony?.disconnect()
    connectionState.value = 'generating'
    connectionMessage.value = 'ルートを登録しました。音楽を作っています…'

    await waitForMusic(result.music_url)
    store.setMusicReady(true)
    connectionState.value = 'ready'
    connectionMessage.value = 'ふたりの音楽ができました'
    await router.push({ name: 'qr' })
  } catch (error) {
    activeLeafony?.disconnect()
    connectionState.value = 'error'
    connectionMessage.value = error instanceof Error ? error.message : '処理に失敗しました'
  }
}

// Web Bluetooth で Leafony に接続し、GPS データを受信する。
async function connectPendant() {
  if (!navigator.bluetooth) {
    connectionState.value = 'error'
    connectionMessage.value = 'この端末ではBluetooth接続を利用できません'
    return
  }

  connectionState.value = 'connecting'
  connectionMessage.value = 'ペンダントを探しています…'

  try {
    const leafony = new Leafony()
    activeLeafony = leafony
    let routeSubmitted = false

    leafony.onStateChange(dataSet => {
      if (routeSubmitted) return

      const routePoints = createRoutePayload(dataSet)
      const completed = dataSet.some(isTerminator)

      connectionState.value = 'collecting'
      connectionMessage.value = `GPSデータを受信中…（${routePoints.length}件）`

      if (!completed) return

      if (routePoints.length === 0) {
        connectionState.value = 'error'
        connectionMessage.value = '有効なGPSデータが見つかりませんでした'
        return
      }

      routeSubmitted = true
      void registerRoute(routePoints)
    })

    await leafony.connect()
    if (connectionState.value === 'connecting') {
      connectionState.value = 'collecting'
      connectionMessage.value = '接続しました。GPSデータを受信しています…'
    }
  } catch (error) {
    connectionState.value = 'error'
    connectionMessage.value = error instanceof Error && error.message
      ? `接続できませんでした：${error.message}`
      : '接続をキャンセルしました'
  }
}
</script>

<template>
  <section class="home-screen">
    <!-- 背景画像の文字やボタンを読みやすくする薄いレイヤー。 -->
    <div class="home-scrim"></div>

    <!-- 画面サイズにかかわらず中央に配置するロゴ画像。 -->
    <div class="home-logo">
      <img :src="logoUrl" alt="ふたり音">
      <p class="home-tagline">鯖江を巡ったふたりの思い出を、<br>一曲の音楽に。</p>
    </div>

    <!-- ペンダント接続ボタンと現在の処理状態。 -->
    <div class="home-action">
      <!-- ボタンの右上に添える手書き風メッセージ。 -->
      <button
        type="button"
        class="primary-pill"
        :class="{ connected: connectionState === 'ready' }"
        :disabled="isBusy"
        @click="connectPendant"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9.4 14.6-2 2a3 3 0 1 1-4.2-4.2l3.2-3.2a3 3 0 0 1 4.2 0M14.6 9.4l2-2a3 3 0 1 1 4.2 4.2l-3.2 3.2a3 3 0 0 1-4.2 0M8.8 15.2l6.4-6.4" />
        </svg>
        <span>{{ buttonLabel }}</span>
        <svg class="button-arrow" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>
      </button>
      <p v-if="connectionMessage" class="connection-message" :class="connectionState">
        {{ connectionMessage }}
      </p>
    </div>
  </section>
</template>
