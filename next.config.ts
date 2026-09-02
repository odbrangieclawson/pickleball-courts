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
const nextConfig: NextConfig = {
  // Fail the build on type errors rather than shipping a broken page.
  typescript: {ignoreBuildErrors: false},

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
