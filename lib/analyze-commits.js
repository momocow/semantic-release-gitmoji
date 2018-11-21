const debug = require('./helper/debug')
const getConfig = require('./helper/get-config')

const ReleaseNotes = require('./release-notes')

module.exports = function analyzeCommits (pluginConfig, context) {
  const { logger } = context
  const config = getConfig(pluginConfig, context)
  debug('[Analyze commits] Effective config: %o', config)

  const notes = ReleaseNotes.get(context, config.releaseNotes)

  const releaseType = notes.getReleaseType(config.releaseRules)
  if (releaseType) {
    logger.log('The next release will be a "%s" release.', releaseType)
  } else {
    logger.log('There will be no new version.')
  }

  return releaseType
}
