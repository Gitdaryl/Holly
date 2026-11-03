// Holly's desk on her phone: make a roadmap from a signed purchase agreement, text it, then see it as the client does,
// and answer their question. One short sentence per step, said the way Holly would say it.
import { card } from '../lib/card.mjs'
import { IDS } from '../lib/demo.mjs'

const tab = (page, name) => page.locator('.adm-tab', { hasText: name })
export default {
  id: 'roadmaps',
  title: 'Roadmaps: your client\'s whole closing on one page',
  poster: 11,
  async ready(page, ui) {
    await ui.card(card({ kicker: "Holly's desk · how to", title: 'Roadmaps', sub: "Your client's whole closing, from accepted offer to keys, on one page they can open from a text." }))
  },
  steps: [
    { say: 'This is the roadmap. One page for each client under contract, with every step from accepted offer to keys.', caption: false },
    { say: 'Here is how you make one, and what your client sees.', caption: false },
    {
      before: async (page, ui) => { await ui.go('/admin?tab=deals'); await page.getByText('under contract').waitFor() },
      say: 'On your desk, the Deals tab holds every roadmap.',
      target: (page) => tab(page, 'Deals'),
    },
    { say: 'Each client shows how far along they are, and what is next.', target: (page) => page.locator('button.adm-card').first() },
    { say: 'To start one, tap New roadmap.', action: (page, ui) => ui.tap(page.getByRole('button', { name: 'New roadmap' })) },
    {
      say: 'The fastest way is to upload the signed purchase agreement.',
      target: (page) => page.locator('.adm-card', { hasText: 'Start from the purchase agreement' }),
      action: async (page, ui) => {
        await ui.wait(1800)
        await page.locator('input[type=file]').setInputFiles({ name: 'Purchase agreement, 123 Sample Shore Dr.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 demo') })
      },
    },
    { say: 'It reads the address, the price and the dates for you. It only fills them in. Check every date against the contract.', target: (page) => page.locator('.adm-card', { hasText: 'Start from the purchase agreement' }), action: async (page) => { await page.getByText('Filled in from the contract').waitFor({ timeout: 15000 }) } },
    { say: 'Pick buying or selling, mortgage or cash, and tick Lake home if it is on the water.', target: (page) => page.getByRole('button', { name: 'Client is buying' }).locator('xpath=ancestor::div[2]') },
    {
      say: "Check your client's name, and add their cell phone. The link and the reminders go to that phone.",
      action: async (page, ui) => {
        await ui.point(page.getByPlaceholder("Client's full name, or both names"))
        await ui.wait(1200)
        await ui.type(page.getByPlaceholder('Their cell number'), '517 555 0142')
      },
    },
    { say: 'Then tap Build the roadmap.', action: (page, ui) => ui.tap(page.getByRole('button', { name: 'Build the roadmap' })) },
    {
      say: 'Here is the roadmap. Every step already has its date, worked out from the contract.',
      target: (page) => page.locator('.adm-card', { hasText: 'Tick a step when it happens' }),
      action: async (page, ui) => { await ui.wait(1500); await page.mouse.wheel(0, 380) },
    },
    {
      say: 'Tap any step to change its words, who does it, or add a note your client will see.',
      action: async (page, ui) => {
        await ui.tap(page.locator('button', { hasText: 'Home inspection' }).first())
        await ui.retype(page.getByPlaceholder('A note your client will see on this step').first(), "9 am with Mike. I'll meet you there.")
      },
    },
    { say: 'Whenever you change something, tap Save at the bottom.', action: async (page, ui) => { await ui.tap(page.getByRole('button', { name: 'Save', exact: true })); await page.getByText('Saved. The client page is updated.').waitFor() } },
    {
      say: 'Now tap Text Pat the link. One text, nothing to download, and no password.',
      action: async (page, ui) => { await ui.scrollTop(); await ui.tap(page.getByRole('button', { name: 'Text Pat the link' })); await page.getByText('Texted.').waitFor() },
    },
    {
      before: async (page, ui) => { await ui.go(`/deal/${IDS.buyer}?k=demo-key-demo-key-12`); await page.getByText('Every step').waitFor() },
      say: 'This is what your client sees when they open that link.',
      target: (page) => page.locator('h1'),
    },
    { say: 'Up next shows the one thing that matters right now.', target: (page) => page.locator('section.hg-land') },
    { say: 'Below it, every step: the date, who does it, and exactly what to do.', target: (page) => page.locator('section.dl-card', { hasText: 'Every step' }) },
    { say: "They can add any date to their phone's calendar with one tap.", target: (page) => page.getByRole('link', { name: 'Add to calendar', exact: true }).first() },
    { say: 'When they have done their part, they tap I did this, and you get a text.', action: async (page, ui) => { await ui.tap(page.getByRole('button', { name: 'I did this' }).first()); await page.getByText('Told Holly you did this').waitFor() } },
    {
      say: 'And they can ask you anything, right on the page.',
      action: async (page, ui) => {
        await ui.type(page.locator('#dl-q'), 'Do we need to be at the inspection?')
        await ui.tap(page.getByRole('button', { name: 'Send to Holly' }))
        await page.getByText('Sent. Holly gets it as a text.').waitFor()
      },
    },
    {
      before: async (page, ui) => { await ui.go(`/admin?tab=deals&id=${IDS.buyer}`); await page.getByText('Questions from Pat').waitFor() },
      say: 'Their question comes to your phone as a text, and shows here on your desk.',
      target: (page) => page.locator('.adm-card', { hasText: 'Questions from Pat' }),
    },
    {
      say: 'Type your answer and tap Reply. It goes to their phone too.',
      action: async (page, ui) => {
        await ui.type(page.getByPlaceholder(/^Reply to Pat/), 'Yes, come for the last half hour.')
        await ui.tap(page.getByRole('button', { name: 'Reply', exact: true }))
      },
    },
    {
      say: 'As each step happens, tick it. Their page turns it green, and the next one lights up.',
      action: async (page, ui) => {
        await ui.check(page.getByLabel('Earnest money deposit done'))
        await ui.wait(900)
        await ui.tap(page.getByRole('button', { name: 'Save', exact: true }))
      },
    },
    { say: 'If the closing date moves, change it here, and every step moves with it.', target: (page) => page.locator('label').filter({ has: page.locator('span', { hasText: /^Closing$/ }) }).locator('input') },
    { say: 'Reminders go out on their own: a text to your client two days before each step, and a short list to you each morning.' },
    {
      before: async (page, ui) => ui.card(card({ kicker: 'Roadmaps', title: 'One link per client.', sub: 'Fewer "what happens next?" calls, and nobody misses a deadline. Watch again any time from the Deals tab.' })),
      say: "That's the roadmap. One link per client, and a lot fewer what happens next calls.",
      caption: false, pause: 1.2,
    },
  ],
}
