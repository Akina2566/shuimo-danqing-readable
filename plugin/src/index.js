/**
 * Host half: intentionally empty.
 *
 * The playback gate is a pure browser concern (it touches one <video> element
 * and two DOM attributes), so this side registers nothing — no routes, no
 * tools, no ledger. The row still needs a host entry point because the bundle
 * patch mounts it as a plugin row.
 *
 * Mirrors the shape the family's other browser-only plugins use: a single
 * no-op `apply` and nothing else.
 *
 * @module dsh-plugin-bg-motion
 */

/**
 * Mount nothing.
 *
 * The client half is served from this package's `lib/client.js` and applied by
 * the web plugin roster; there is no host state to own.
 * @param _ctx - the plugin context (unused).
 */
function apply(_ctx) {}

export { apply }
