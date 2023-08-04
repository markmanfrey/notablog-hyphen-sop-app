/**
 * Return a random integer K, with -max <= K <= +max. 
 * @param {Number} max - Absolute value of max random integer. 
 */
function randomInt(max) {
  if (max === 0) return 0
  max = Math.floor(max)
  let dev = Math.floor(Math.random() * (max + 1))
  let negative = (Math.random() < 0.5)
  return negative ? (-1) * dev : dev
}

/**
 * Print debug messages.
 */
function log() {
  let args = Array.from(arguments)
  args.unshift('[D/task-manager]')
  console.log.apply(console, args)
}

module.exports = { randomInt, log }