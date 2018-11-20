const debug = require('./helper/debug')
const getConfig = require('./helper/get-config')

const SYM_RELEASE_NOTES = require('./symbols')
const ReleaseNotes = require('./release-notes')

module.exports = function analyzeCommits (pluginConfig, context) {
  const { logger } = context
  const config = getConfig(pluginConfig, context)
  debug('[Analyze commits] Effective config: %o', config)

  context[SYM_RELEASE_NOTES] = context[SYM_RELEASE_NOTES] ||
    new ReleaseNotes(context, config.releaseNotes)

  const releaseType = context[SYM_RELEASE_NOTES].getReleaseType(config.releaseTypes)
  if (releaseType) {
    logger.log('The next release will be a "%s" release.', releaseType)
  } else {
    logger.log('There will be no new version.')
  }

  return releaseType
}
