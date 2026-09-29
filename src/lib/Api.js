// ルート登録など、ふたり音 API 共通の基準 URL。
export const API_BASE_URL = 'https://event.jec.ac.jp/pairsong_api/public/api'

// fetch の URL・HTTP メソッド・JSON ヘッダーをまとめる小さなラッパー。
class Api {
  #url
  #method
  #headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  constructor(path, method = 'GET') {
    const normalizedPath = String(path).replace(/^\/+/, '')
    this.#url = `${API_BASE_URL}/${normalizedPath}`
    this.#method = method
  }

  // body がある場合だけ JSON に変換して送信する。
  async request(body) {
    const options = {
      method: this.#method,
      headers: this.#headers,
    }

    if (body !== undefined) {
      options.body = JSON.stringify(body)
    }

    return fetch(this.#url, options)
  }
}

export default Api
