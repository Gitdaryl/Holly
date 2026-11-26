// node --import ./test/register.mjs <test file>
// Sends every import of '@vercel/blob' to the in-memory mock.
import { register } from 'node:module'
register('./hooks.mjs', import.meta.url)
