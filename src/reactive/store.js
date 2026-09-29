import { reactive } from 'vue'

const STORAGE_KEY = 'futarioto-route'

// ページを移動しても音楽 URL を保持できるよう、セッションから復元する。
function loadSavedRoute() {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

const savedRoute = loadSavedRoute()

// ホーム、QR、音楽ページの間で共有するルート登録結果。
const store = reactive({
  routeId: savedRoute.routeId || null,
  musicUrl: savedRoute.musicUrl || '',
  routePoints: savedRoute.routePoints || [],
  musicReady: Boolean(savedRoute.musicReady),

  // API が返したルート ID と音楽 URL、送信済み GPS データを保存する。
  setRouteResult({ routeId, musicUrl, routePoints }) {
    this.routeId = routeId
    this.musicUrl = musicUrl
    this.routePoints = routePoints
    this.musicReady = false
    this.persistRoute()
  },

  // 音楽ファイルが再生可能になった時点を保存する。
  setMusicReady(value) {
    this.musicReady = value
    this.persistRoute()
  },

  // リロードでは消えず、ブラウザを閉じると消える sessionStorage を使用する。
  persistRoute() {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      routeId: this.routeId,
      musicUrl: this.musicUrl,
      routePoints: this.routePoints,
      musicReady: this.musicReady,
    }))
  },
})

export default store
