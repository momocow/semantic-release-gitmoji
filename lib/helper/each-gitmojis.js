const { emojify } = require('node-emoji')

const debug = require('./helper/debug')

module.exports = function eachGitmojis (commits, targetGitmojis = [], onFound = () => true) {
  let count = 0
  for (let commit of commits) {
    count++
    const { message, commit: { short } } = commit
    debug('Commit["%s"] "%s"', short, message)

    for (let target of targetGitmojis) {
      debug('Test against emoji "%s"', target)

      const rawTarget = emojify(target)

      const gitmoji = message.startsWith(target) || message.startsWith(rawTarget) ? {
        literal: target,
        raw: rawTarget
      } : null

      if (onFound({ ...commit, gitmoji }) === false) return count
    }
  }

  return count
}
