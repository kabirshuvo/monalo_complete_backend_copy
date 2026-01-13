// Simple logger wrapper for server code.
// Avoid direct console.log usage across the codebase; import this module instead.
const isDev = process.env.NODE_ENV !== 'production'

function formatArgs(args: unknown[]) {
  return args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
}

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) console.info('[info]', formatArgs(args))
  },
  warn: (...args: unknown[]) => {
    console.warn('[warn]', formatArgs(args))
  },
  error: (...args: unknown[]) => {
    console.error('[error]', formatArgs(args))
  },
}

export default logger
