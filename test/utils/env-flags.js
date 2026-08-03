export function isEnvTrue(name, { defaultValue = false } = {}) {
  const raw = process.env[name]
  if (raw == null || raw === '') return defaultValue
  return String(raw).trim().toLowerCase() === 'true'
}
