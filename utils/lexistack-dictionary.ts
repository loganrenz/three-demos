export type Edge = [string, number]

export interface CompressedNode {
  edges: Edge[]
  word?: 1
}

export interface WordLengthLimits {
  minLength: number
  maxLength: number
}

export interface WordlistPayload {
  locale: string
  version: string
  rootIndex: number
  nodes: CompressedNode[]
  profanity: string[]
  limits: WordLengthLimits
}

export interface WordValidationOptions {
  locale?: string
  minLength?: number
  maxLength?: number
  allowProfanity?: boolean
}

export interface WordValidationResult {
  valid: boolean
  reason?: string
}

const DEFAULT_LOCALE = 'en-US'
const DB_NAME = 'lexistack-dictionary'
const STORE_NAME = 'wordlists'
const DB_VERSION = 1

const WORDLIST_LOADERS: Record<string, () => Promise<{ default?: WordlistPayload; WORDLIST_EN?: WordlistPayload }>> = {
  'en-US': () => import('./lexistack-wordlist-en')
}

const inMemoryCache = new Map<string, Promise<WordlistPayload>>()

const supportsIndexedDB = () => typeof indexedDB !== 'undefined'

const openDatabase = (): Promise<IDBDatabase | null> => {
  if (!supportsIndexedDB()) return Promise.resolve(null)

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'locale' })
      }
    }

    request.onerror = () => {
      console.warn('[lexistack] IndexedDB open failed:', request.error)
      resolve(null)
    }
    request.onsuccess = () => resolve(request.result)
  })
}

const readCachedWordlist = async (locale: string): Promise<WordlistPayload | null> => {
  const db = await openDatabase()
  if (!db) return null

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(locale)

    request.onerror = () => resolve(null)
    request.onsuccess = () => resolve((request.result as WordlistPayload | undefined) ?? null)
  })
}

const writeCachedWordlist = async (payload: WordlistPayload) => {
  const db = await openDatabase()
  if (!db) return

  return new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(payload)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
}

const loadWordlist = async (locale: string): Promise<WordlistPayload> => {
  if (inMemoryCache.has(locale)) {
    return inMemoryCache.get(locale) as Promise<WordlistPayload>
  }

  const loader = WORDLIST_LOADERS[locale]
  if (!loader) {
    throw new Error(`Unsupported locale: ${locale}`)
  }

  const promise = (async () => {
    const cached = await readCachedWordlist(locale)
    let payload: WordlistPayload | null = cached

    try {
      const module = await loader()
      const loaded = (module.WORDLIST_EN ?? module.default) as WordlistPayload
      if (!payload || loaded.version !== payload.version) {
        payload = loaded
        await writeCachedWordlist(loaded)
      }
    } catch (error) {
      console.warn('[lexistack] Failed to refresh wordlist, using cache if available.', error)
    }

    if (!payload) {
      throw new Error('Unable to load dictionary wordlist')
    }

    return payload
  })()

  inMemoryCache.set(locale, promise)
  return promise
}

const containsWord = (word: string, nodes: CompressedNode[], rootIndex: number) => {
  let index = rootIndex
  for (const char of word) {
    const node = nodes[index]
    if (!node) return false
    const next = node.edges.find(([edgeChar]) => edgeChar === char)
    if (!next) return false
    index = next[1]
  }
  return Boolean(nodes[index]?.word)
}

export const preloadDictionary = async (locale = DEFAULT_LOCALE) => {
  await loadWordlist(locale)
}

export const validateWord = async (
  word: string,
  options: WordValidationOptions = {}
): Promise<WordValidationResult> => {
  const locale = options.locale ?? DEFAULT_LOCALE
  const payload = await loadWordlist(locale)
  const minLength = options.minLength ?? payload.limits.minLength
  const maxLength = options.maxLength ?? payload.limits.maxLength
  const allowProfanity = options.allowProfanity ?? false

  const normalized = word.trim().toUpperCase()

  if (!normalized) {
    return { valid: false, reason: 'Please enter a word.' }
  }

  if (normalized.length < minLength) {
    return { valid: false, reason: `Words must be at least ${minLength} letters.` }
  }

  if (normalized.length > maxLength) {
    return { valid: false, reason: `Words cannot exceed ${maxLength} letters.` }
  }

  if (!allowProfanity && payload.profanity.includes(normalized)) {
    return { valid: false, reason: 'That word is blocked for profanity.' }
  }

  const valid = containsWord(normalized, payload.nodes, payload.rootIndex)
  return valid
    ? { valid: true }
    : { valid: false, reason: `${normalized} is not in the ${locale} dictionary.` }
}
