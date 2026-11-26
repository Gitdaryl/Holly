const MOCK = new URL('./blob-mock.mjs', import.meta.url).href
export async function resolve(specifier, context, next) {
  if (specifier === '@vercel/blob') return { url: MOCK, shortCircuit: true }
  return next(specifier, context)
}
