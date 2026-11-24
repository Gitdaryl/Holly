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
