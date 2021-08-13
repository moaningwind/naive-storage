import { WebStorage } from './WebStorage'

let localInstance: WebStorage, sessionInstance: WebStorage

function createStorage(storage: Storage = localStorage, prefixKey = '__naive_storage__') {
  return new WebStorage(storage, prefixKey)
}

export function createLocalStorage() {
  if (!localInstance)
    localInstance = createStorage()

  return localInstance
}

export function createSessionStorage() {
  if (!sessionInstance)
    sessionInstance = createStorage(sessionStorage)
  return sessionInstance
}
