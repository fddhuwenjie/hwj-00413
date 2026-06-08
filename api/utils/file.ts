import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface EntityWithId {
  id: number
}

export async function readJSON<T>(filePath: string): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [] as T
    }
    throw error
  }
}

export async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  const json = JSON.stringify(data, null, 2)
  await fs.writeFile(filePath, json, 'utf-8')
}

export function getNextId(entities: EntityWithId[]): number {
  if (entities.length === 0) {
    return 1
  }
  return Math.max(...entities.map((e) => e.id)) + 1
}

export function getDataPath(): string {
  return path.resolve(__dirname, '../data')
}
