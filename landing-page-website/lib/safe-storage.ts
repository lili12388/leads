function isBrowser() {
  return typeof window !== "undefined"
}

export function safeLocalStorageGet(key: string): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeLocalStorageSet(key: string, value: string): boolean {
  if (!isBrowser()) return false
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function safeLocalStorageRemove(key: string): boolean {
  if (!isBrowser()) return false
  try {
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function safeSessionStorageGet(key: string): string | null {
  if (!isBrowser()) return null
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSessionStorageSet(key: string, value: string): boolean {
  if (!isBrowser()) return false
  try {
    window.sessionStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}
