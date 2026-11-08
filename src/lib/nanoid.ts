/** Simple nanoid-compatible ID generator */
export function nanoid(size = 21): string {
  const chars = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  return Array.from(bytes, (b) => chars[b & 63]).join('')
}
