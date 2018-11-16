const { emojify } = require('node-emoji')
const _last = require('lodash.last')

const debug = require('./helper/debug')
const getConfig = require('./helper/get-config')
const maxRelease = require('./helper/max-release')

const notes = require('./release-notes')

const RELEASE_TYPES = require('./helper/release-types.json')
const HIGHEST_RELEASE_TYPE = _last(RELEASE_TYPES)

module.exports = function analyzeCommits (pluginConfig, context) {
  const { commits, logger } = context
  const config = getConfig(pluginConfig)

  debug('Ready to analyze %d commits', commits.length)

  const specReleaseTypes = config.releaseTypes
  let nextReleaseType
  for (let commit of commits) {
    const { message, commit: { short } } = commit
    debug('Commit["%s"] "%s"', short, message)
    for (let releaseType of RELEASE_TYPES) {
      debug('Test against release type "%s"', releaseType)
      for (let emoji of specReleaseTypes[releaseType]) {
        debug('Test against emoji "%s"', emoji)
        const literalEmoji = message.startsWith(emoji) ? message.substr(0, emoji.length) : ''
        const emojified = emojify(emoji)
        const unicodeEmoji = message.startsWith(emojified) ? message.substr(0, emojified.length) : ''
        if (literalEmoji || unicodeEmoji) {
          nextReleaseType = maxRelease(nextReleaseType, releaseType)
          logger.log('Commit["%s"]: a starting "%s" is detected, the release type is now "%s"',
            short, emojify(emoji), nextReleaseType)
          debug('Set the next release type to "%s"', nextReleaseType)

          if (nextReleaseType === HIGHEST_RELEASE_TYPE) {
            debug('The highest release type "%s" is reached.', HIGHEST_RELEASE_TYPE)
            return nextReleaseType
          }
        }
      }
    }
  }
  return nextReleaseType
}
