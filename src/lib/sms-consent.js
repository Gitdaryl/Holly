// One source of truth for the texting opt-in wording.
// Used by: the form checkbox (components/TextConsent.jsx), the consent record
// the API stores with each lead (api/lib/sms.js), and the campaign filing.
// Change the wording => bump SMS_CONSENT_VERSION so each stored record says
// exactly which text the person saw.

export const SMS_CONSENT_VERSION = '2026-11-24';

export const SMS_LABEL = 'Holly Griewahn can text me about this request.';

// Shown beside the box; the Privacy and Terms links are appended by the component.
export const SMS_SMALL_PRINT =
  'Optional. Message frequency varies. Message and data rates may apply. Reply STOP to end, HELP for help.';

// What a form sends to the API alongside its other fields.
export function consentFields(checked) {
  return {
    smsConsent: Boolean(checked),
    consentPage: typeof window !== 'undefined' ? window.location.pathname : null,
    consentVersion: SMS_CONSENT_VERSION,
  };
}

// The one text Holly sends a transaction client to ask for texting permission.
// This must stay character for character the same as Sample message #4 filed
// with the carrier campaign; if you change it, the filing has to change too.
// Nothing else goes to a roadmap client until they reply YES.
export const DEAL_CONSENT_VERSION = '2026-11-25';

export const DEAL_CONSENT_TEXT =
  "Holly Griewahn, Foundation Realty: I'm so excited to be working with you! Communication is a big part of making your home buying or selling experience as smooth and stress-free as possible. With your permission, I'd love to communicate with you via text throughout the process, including important updates, appointment reminders, inspections, deadlines, closing details, and other information related to your real estate transaction. Is it OK if I send you these text messages? Please reply YES to confirm your consent. Message frequency varies. Message and data rates may apply. You may reply STOP at any time to opt out or HELP for assistance.";
