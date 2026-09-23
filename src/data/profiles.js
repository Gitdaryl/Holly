// Every public place Holly exists, in one file.
//
// These feed the `sameAs` list in her schema, which is how Google and the AI
// assistants decide that the Google profile, the Facebook page, the Manitou
// Beach directory listing and this site all describe ONE person. That
// agreement across sources is what earns her a name in an answer instead of
// a hedge; it is not a link-building trick and it does not need reciprocal
// links to work.
//
// Sourced Sep 2026 from her own site (hollygriewahn.com) and her Google
// Business Profile. Add a URL here only if you have loaded it and seen her on
// it: a dead link in sameAs is worse than a short list.
//
// MIGRATION: when hollygriewahn.com becomes this site, it stops being an
// "other profile" and must not appear in sameAs. buildSameAs() drops any
// entry that lives on the site's own domain, so that happens by itself the
// moment PUBLIC_SITE_URL changes. Do not hand-edit it out.

export const PROFILES = [
  { name: 'Google Business Profile', url: 'https://maps.google.com/?cid=16517987812903164506' },
  { name: 'Facebook', url: 'https://www.facebook.com/hollygriewahnrealtor' },
  { name: 'Instagram', url: 'https://www.instagram.com/hollygriewahnrealtor' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/holly-griewahn-818564a7/' },
  { name: 'Manitou Beach business directory', url: 'https://manitoubeachmichigan.com/business/holly-griewahn-foundation-realty' },
  { name: 'Current public site', url: 'https://hollygriewahn.com' },
];

export const BROKERAGE = {
  name: 'Foundation Realty',
  url: 'https://www.foundationlenawee.com/',
  address: { street: '100 Walnut St', city: 'Manitou Beach', region: 'MI', postal: '49253' },
};

export const PHONE = '+1-517-403-3413';

// Profiles that are not this site, whatever this site's domain happens to be.
export function buildSameAs(siteUrl) {
  let host = '';
  try { host = new URL(siteUrl).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
  return PROFILES
    .filter((p) => {
      try { return new URL(p.url).hostname.replace(/^www\./, '') !== host; } catch { return false; }
    })
    .map((p) => p.url);
}
