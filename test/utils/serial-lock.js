import fs from 'node:fs/promises'
import path from 'node:path'

function lockFileFor(key) {
  const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, '_')
  return path.join(process.cwd(), 'test-results', `.serial-${safeKey}.lock`)
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function stealIfStale(lockFile) {
  try {
    const pid = Number((await fs.readFile(lockFile, 'utf8')).trim())
    if (!pid || !isPidAlive(pid)) {
      await fs.unlink(lockFile)
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

export async function acquireSerialLock(key = 'unscoped') {
  const lockFile = lockFileFor(key)
  await fs.mkdir(path.dirname(lockFile), { recursive: true })

  while (true) {
    await stealIfStale(lockFile)

    try {
      const handle = await fs.open(lockFile, 'wx')
      await handle.writeFile(`${process.pid}\n`)
      await handle.close()
      return
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
}

export async function releaseSerialLock(key = 'unscoped') {
  const lockFile = lockFileFor(key)

  try {
    const pid = Number((await fs.readFile(lockFile, 'utf8')).trim())
    if (pid === process.pid) {
      await fs.unlink(lockFile)
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}
