import { triggerRebuild } from './lib/deploy-hook.js'

// Daily rebuild so the prerendered pages a crawler reads are never more than a
// day behind the live data behind them - the events feed above all, which
// changes without anyone deploying.
//
// Note for whoever reads the deployment list later: from here on, a deployment
// appearing at 5:30am with nobody at the keyboard is this. It ships whatever is
// on the production branch, so a broken commit left unpushed-over will be
// retried daily; a failing build does not promote, so the failure mode is a
// stale site, not a broken one.

export default async function handler(req, res) {
  const auth = req.headers.authorization || ''
  const secret = process.env.ADMIN_SECRET
  const isVercelCron = req.headers['user-agent']?.includes('vercel-cron')
  if (!isVercelCron && (!secret || auth !== `Bearer ${secret}`)) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const result = await triggerRebuild('daily')
  return res.status(200).json({ ok: true, ...result })
}
