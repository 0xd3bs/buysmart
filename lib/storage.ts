import type { Position } from './positions'

export interface StorageAdapter {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
  getAll(): Promise<Record<string, string>>
}

class LocalStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(key)
  }

  async set(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, value)
  }

  async delete(key: string): Promise<void> {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  }

  async getAll(): Promise<Record<string, string>> {
    if (typeof window === 'undefined') return {}
    const result: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) result[key] = localStorage.getItem(key) || ''
    }
    return result
  }
}

// Placeholder Redis adapter
/* eslint-disable @typescript-eslint/no-unused-vars */
class RedisStorageAdapter implements StorageAdapter {
  async get(_key: string): Promise<string | null> { throw new Error('Redis not implemented') }
  async set(_key: string, _value: string): Promise<void> { throw new Error('Redis not implemented') }
  async delete(_key: string): Promise<void> { throw new Error('Redis not implemented') }
  async getAll(): Promise<Record<string, string>> { throw new Error('Redis not implemented') }
}

class StorageService {
  private adapter: StorageAdapter = new LocalStorageAdapter()
  private readonly STORAGE_KEY = 'cbc_positions'
  private readonly STORAGE_VERSION = '1.0'

  private getVersionedKey(): string {
    return `${this.STORAGE_KEY}_v${this.STORAGE_VERSION}`
  }

  async getPositions(): Promise<Position[]> {
    try {
      const data = await this.adapter.get(this.getVersionedKey())
      if (!data) return []
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? (parsed as Position[]) : []
    } catch {
      return []
    }
  }

  async savePositions(positions: Position[]): Promise<void> {
    try {
      const data = JSON.stringify(positions)
      await this.adapter.set(this.getVersionedKey(), data)
    } catch (err) {
      console.error('Failed to save positions', err)
      throw new Error('Failed to save positions')
    }
  }

  async addPosition(position: Position): Promise<void> {
    const positions = await this.getPositions()
    positions.push(position)
    await this.savePositions(positions)
  }

  async updatePosition(id: string, updates: Partial<Position>): Promise<boolean> {
    const positions = await this.getPositions()
    const index = positions.findIndex(p => p.id === id)
    if (index === -1) return false
    positions[index] = { ...positions[index], ...updates }
    await this.savePositions(positions)
    return true
  }

  async deletePosition(id: string): Promise<boolean> {
    const positions = await this.getPositions()
    const filtered = positions.filter(p => p.id !== id)
    if (filtered.length === positions.length) return false
    await this.savePositions(filtered)
    return true
  }
}

export const storageService = new StorageService()
