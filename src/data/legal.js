// Privacy and terms copy, shared by the page and the prerender so crawlers and
// carrier reviewers read the same words people do.
export const LEGAL_UPDATED = 'November 2026';

export const PRIVACY = {
  title: 'Privacy Policy',
  intro: 'This site belongs to Holly Griewahn, a REALTOR with Foundation Realty, 100 Walnut St, Manitou Beach, MI 49253. This page says what we collect, why, and who helps us handle it.',
  sections: [
    { h: 'What we collect', items: [
      'What you type into a form or the chat: your name, phone, email, the home or lake you are asking about, your budget, timing and notes.',
      'Texts and voicemails you send to Holly\'s site number, including a written transcript of voicemails.',
      'If you are Holly\'s client: the address, dates, notes and questions on your private transaction roadmap.',
      'Basic site activity: which pages were viewed, the site that sent you, your device type and an anonymous session number. We do not use advertising trackers on this site.',
    ] },
    { h: 'How we use it', items: [
      'To answer you, set up showings, prepare a home value, and keep you updated on what you asked about.',
      'To send the text messages you agreed to. See the Terms page for how texting works.',
      'To see which pages help people, so the site can improve.',
    ] },
    { h: 'Who helps us', p: 'We do not sell your information. A few service companies handle it for us, only to run these features: Vercel (website hosting and storage), Twilio (texts and calls), Resend (email), Notion (lead records), Deepgram (voicemail transcripts), Anthropic (the Heather chat assistant), and Google (maps and reviews). Foundation Realty may also receive records as Holly\'s broker, and information may be disclosed if the law requires it.' },
    { h: 'Text messaging privacy', p: 'Your mobile number and your consent to receive texts are never sold, and are not shared with third parties or affiliates for their marketing. They are shared only with the service companies that deliver our messages.' },
    { h: 'Your choices', p: 'Reply STOP to any text to end texts. To see, correct or delete what we hold about you, contact us below. We may need to keep some records that real estate rules require.' },
    { h: 'Contact', p: 'Holly Griewahn, (517) 403-3413. Foundation Realty office, (517) 252-5523, foundationmb@foundationlenawee.com.' },
  ],
};

export const TERMS = {
  title: 'Terms of Use and Text Message Terms',
  intro: 'By using this site you agree to these terms. Please also read the Privacy Policy.',
  sections: [
    { h: 'Text messages from Holly Griewahn', items: [
      'What you will get: replies to your request, showing details, updates on the lake or home you asked about, and, for clients, reminders about your transaction.',
      'You only get these if you ticked the texting box on a form or agreed with Holly directly. Texting is never required to work with Holly.',
      'How often: it varies with your request, usually a few messages a month.',
      'Message and data rates may apply.',
      'To stop, reply STOP. You will get one confirmation and no more texts. To start again, reply START.',
      'For help, reply HELP or call (517) 403-3413.',
      'Mobile carriers are not liable for delayed or undelivered messages.',
    ] },
    { h: 'Information on this site', p: 'Listings, sales figures, market reports and home values are offered in good faith but can change or contain errors. Please confirm anything important with Holly. A home value here is an opinion, not an appraisal. Nothing on this site is legal, tax or financial advice.' },
    { h: 'The Heather chat assistant', p: 'Heather is an automated assistant, not a person. It can make mistakes, so please confirm important details with Holly.' },
    { h: 'Your roadmap link', p: 'A transaction roadmap link is private to you. Anyone you share it with can see it, so please keep it to yourself. Dates are a guide and your signed agreement controls.' },
    { h: 'Governing law', p: 'These terms are governed by the laws of the State of Michigan.' },
  ],
};
