// Holly's desk on her phone: write "An offer came in" for a seller from their roadmap, read it, print it, text it.
import { card } from '../lib/card.mjs'
import { IDS } from '../lib/demo.mjs'

const previewFrame = async (page) => (await page.$('iframe[title="Letter preview"]')).contentFrame()
export default {
  id: 'stationery',
  title: 'Stationery: letters on your paper, in plain words',
  poster: 8,
  async ready(page, ui) {
    await ui.card(card({ kicker: "Holly's desk · how to", title: 'Stationery', sub: 'Letters on your own paper, in plain words, ready to print, save or text in about two minutes.' }))
  },
  steps: [
    { say: 'Stationery is your letterhead, with the letters you send most already written, in plain words.', caption: false },
    {
      before: async (page, ui) => { await ui.go('/admin?tab=stationery'); await page.getByText('Recent letters').waitFor() },
      say: 'On your desk, open the Stationery tab.',
      target: (page) => page.locator('.adm-tab', { hasText: 'Stationery' }),
    },
    { say: 'Each letter says who it is for, and when to send it.', target: (page) => page.locator('button.adm-card', { hasText: 'An offer came in' }) },
    { say: "Let's write An offer came in, for a seller.", action: (page, ui) => ui.tap(page.locator('button.adm-card', { hasText: 'An offer came in' })) },
    {
      say: "Pick the client's roadmap, and their name, address and dates fill in by themselves.",
      action: async (page, ui) => {
        await ui.pick(page.locator('label', { hasText: 'Pull the names' }).locator('select'), IDS.seller)
        await page.waitForFunction(() => document.querySelector('input[placeholder="Street address and town"]')?.value.includes('Sample Point'))
      },
    },
    {
      say: 'Fill in the few blanks left, like the deposit and what the buyer is asking for.',
      action: async (page, ui) => {
        await ui.type(page.getByPlaceholder('Dollar amount of the deposit'), '5000')
        await ui.type(page.getByPlaceholder('One per line: seller concession, home warranty, the boat lift, and so on'), 'A $3,000 seller concession\nThe boat lift stays')
      },
    },
    {
      say: "Then your read, in two or three sentences, the way you'd say it on the phone.",
      action: (page, ui) => ui.type(page.getByPlaceholder(/^Two or three sentences: how this offer compares/), 'A solid offer from a pre-approved buyer. I would counter the concession and keep the lift.'),
    },
    { say: 'The letter writes itself. You can change any word, right here.', target: (page) => page.locator('label', { hasText: 'The letter (fix any word here)' }).locator('textarea') },
    {
      say: 'The preview is exactly what your client gets: your letterhead, Foundation Realty beside your name, and big, clear type.',
      target: (page) => page.locator('iframe[title="Letter preview"]'),
      action: async (page, ui) => { await ui.wait(2200); await (await previewFrame(page)).evaluate(() => window.scrollTo({ top: 520, behavior: 'smooth' })) },
    },
    {
      say: 'At the end, Words in this letter explains each term in one plain sentence, so nobody has to call and ask.',
      target: (page) => page.locator('iframe[title="Letter preview"]'),
      action: async (page) => (await previewFrame(page)).evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })),
    },
    { say: 'To print it, or save it as a PDF for an email, tap Print, Save as PDF.', action: async (page, ui) => { await ui.tap(page.getByRole('button', { name: 'Print / Save as PDF' })); await ui.noRing() } },
    {
      say: 'It opens on its own page. Tap Print there, and choose Save as PDF if you want a file to attach.',
    },
    {
      before: async (page) => { await page.evaluate(() => document.getElementById('__tour-popup')?.remove()) },
      say: 'Or tap Text the short version. It goes from your desk number, and their reply lands in your Texts.',
      action: (page, ui) => ui.tap(page.getByRole('button', { name: 'Text the short version' })),
    },
    {
      say: 'Read it over, then tap Text.',
      action: async (page, ui) => {
        await ui.point(page.locator('.adm-card', { hasText: 'Print / Save as PDF' }).locator('textarea'))
        await ui.wait(1000)
        await ui.tap(page.getByRole('button', { name: /^Text \(517\)/ }))
        await page.getByText('Texted.').waitFor()
      },
    },
    { say: 'Once email is switched on, this button sends the letter itself. Until then, use Print, or Open in your email app.', target: (page) => page.getByRole('button', { name: 'Open in your email app' }) },
    {
      say: 'Every letter you send is listed under Recent letters, so you can always see what went out.',
      action: async (page, ui) => {
        await ui.tap(page.getByRole('button', { name: 'All letters' }))
        await ui.point(page.locator('.adm-card', { hasText: 'Recent letters' }))
      },
    },
    {
      before: async (page, ui) => ui.card(card({ kicker: 'Stationery', title: 'Pick it, fill it, read it, send it.', sub: 'Every letter explains its own words. Watch again any time from the Stationery tab.' })),
      say: "That's Stationery. Pick a letter, fill in the blanks, read it, and send it.",
      caption: false, pause: 1.2,
    },
  ],
}
