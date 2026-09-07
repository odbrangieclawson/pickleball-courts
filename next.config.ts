import type {NextConfig} from 'next'
import {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

/*
  Rule 1: every page renders its full content, links and schema in raw HTML
  with JavaScript disabled. That is satisfied by static generation - every
  route is prerendered to HTML at build time.

  We deliberately do NOT set `output: 'export'`. Static export would also
  satisfy Rule 1, but it forecloses incremental revalidation, which this
  project will need: Rule 7 puts a date_checked on every fact and Import Gate
  I2 puts that date inside a cadence. Re-verifying one venue should be able
  to refresh one page without rebuilding the whole directory.

  Tracked as O6 in decisions.md > Open decisions. Reversible either way.
*/
/*
  THE VERCEL HOSTNAME REDIRECTS TO THE REAL ONE, ONCE THERE IS ONE.

  Vercel keeps serving the project at its generated *.vercel.app hostname
  after a custom domain is attached, which would leave a complete second
  copy of the site answering 200 on a host the canonicals do not name. A
  crawler that finds it has a duplicate of every page. So when SITE_ORIGIN
  is anything other than the Vercel hostname (or the placeholder), every
  request that arrives on the Vercel hostname is 301'd to the same path on
  the origin. §3 permits exactly that one response for a moved URL.

  While SITE_ORIGIN still IS the Vercel hostname this adds no rule at all,
  so today's deployment is unchanged. The hostname is written here rather
  than read from an environment variable because it is a fact about this
  project, recorded in DEPLOYMENT.md, and a redirect rule should be
  readable in a diff.
*/
const VERCEL_HOST = 'pickleball-courts-cyan.vercel.app'
const SITE_ORIGIN = String(process.env.SITE_ORIGIN ?? '').trim().replace(/\/+$/, '')
const originHost = SITE_ORIGIN.replace(/^https?:\/\//i, '')
const redirectVercelHost = /^https?:\/\//i.test(SITE_ORIGIN) &&
  originHost !== VERCEL_HOST && originHost !== 'example.invalid'

const nextConfig: NextConfig = {
  // Fail the build on type errors rather than shipping a broken page.
  typescript: {ignoreBuildErrors: false},

  async redirects() {
    if (!redirectVercelHost) return []
    return [
      {
        source: '/:path*',
        has: [{type: 'host', value: VERCEL_HOST}],
        destination: `${SITE_ORIGIN}/:path*`,
        permanent: true,
      },
    ]
  },

  /*
    The locked URL pattern in decisions.md section 1 is written with trailing
    slashes (/pickleball/us/{state}/), so the router must emit them. Rule 3
    of that section makes URLs permanent, which means this setting is
    effectively permanent too: flipping it later would change every URL on
    the site and require a 301 for each one.
  */
  trailingSlash: true,

  /*
    Pin the workspace root. Without this, Turbopack walks up past the repo
    and finds an unrelated package-lock.json in the user profile directory,
    then warns that it ignored it. Pinning removes the ambiguity.
  */
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
}

export default nextConfig
