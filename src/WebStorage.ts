// TODO Implement encryption and decryption

export interface Options {
  expires?: number // Expiration time, the unit is day
  isOnce?: boolean // Whether to remove the data after reading it once
}

export interface RealStorageValue<T> {
  value: T
  timestamp: number
  options: Options
}

export class WebStorage {
  constructor(private storage: Storage, private prefixKey: string) {}

  private _getInputData<T>(value: T, options: Options) {
    const _value = {
      value,
      timestamp: new Date().getTime(),
      options,
    }

    return JSON.stringify(_value)
  }

  private _getOutputData<T>(value: string) {
    const _value = JSON.parse(value) as RealStorageValue<T>

    return _value
  }

  private _getData<T>(_key: string) {
    const _value = this.storage.getItem(_key)

    if (_value === null)
      return null

    return this._getOutputData<T>(_value)
  }

  private _getKey(key: string) {
    return `${this.prefixKey}${key}`
  }

  private _remove(_key: string) {
    this.storage.removeItem(_key)
  }

  private _isExpired<T>(_key: string, _value: RealStorageValue<T>) {
    const { timestamp, options } = _value

    const { expires } = options

    if (!expires)
      return false

    return timestamp + expires * 24 * 3600 * 1000 - new Date().getTime() < 0
  }

  private _isOnce<T>(_key: string, _value: RealStorageValue<T>) {
    const { options } = _value

    const { isOnce } = options

    return !!isOnce
  }

  get<T = any>(key: string): T | undefined

  get<T>(key: string, def: T): T extends infer F ? F : never

  /**
   * Get the value corresponding to the key in the storage
   * @param key - key
   * @param def - A default value that is returned if the key does not exist in storage
   */
  get<T>(key: string, def?: T) {
    const _key = this._getKey(key)
    const _value = this._getData<T>(_key)

    if (!_value)
      return def

    const isExpired = this._isExpired<T>(_key, _value)
    const isOnce = this._isOnce<T>(_key, _value)

    if (isExpired || isOnce)
      this._remove(_key)

    return isExpired ? def : _value.value
  }

  /**
   * Set the value corresponding to the key in the storage
   * @param key - key
   * @param value - value
   * @param options - Configuration item. For details, see Type
   */
  set<T>(key: string, value: T, options: Options = {}) {
    const _key = this._getKey(key)
    const _value = this._getInputData<T>(value, options)

    this.storage.setItem(_key, _value)
  }

  /**
   * Set a key-value pairs that is removed after being read once
   * @param key - key
   * @param value - value
   * @param options - Configuration item. For details, see Type
   */
  once<T>(key: string, value: T, options: Omit<Options, 'isOnce'> = {}) {
    this.set(key, value, Object.assign(options, {
      isOnce: true,
    }))
  }

  /**
   * Remove a key from storage
   */
  remove(key: string) {
    const _key = this._getKey(key)

    this._remove(_key)
  }

  /**
   * Traverse all key-value pairs within the current instance
   */
  each(callbackfn: (key: string, value: any) => void) {
    for (let i = this.storage.length - 1; i >= 0; i--) {
      const _key = this.storage.key(i)!

      if (_key.startsWith(this.prefixKey)) {
        const key = _key.split(this.prefixKey, 2)[1]

        callbackfn(key, this.get(key))
      }
    }
  }

  /**
   * Traverse Remove all key-value pairs within the current instance
   */
  clearAll() {
    this.each((key) => {
      this.remove(key)
    })
  }
}
