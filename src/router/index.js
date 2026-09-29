import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import MapView from '@/views/MapView.vue'
import QRCodeView from '@/views/QRCodeView.vue'
import MusicView from '@/views/MusicView.vue'

// GitHub Pages / サブディレクトリ配信でも動く Hash Router。
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  // 設定ページを除いた現在の4画面。
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/map', name: 'map', component: MapView },
    { path: '/qr', name: 'qr', component: QRCodeView },
    { path: '/music', name: 'music', component: MusicView },
    // 旧形式の数値 URL は音楽再生ページへ引き継ぐ。
    { path: '/:id(\\d+)', redirect: { name: 'music' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
