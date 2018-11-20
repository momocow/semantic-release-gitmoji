const debug = require('./helper/debug')
const getConfig = require('./helper/get-config')

const SYM_RELEASE_NOTES = require('./symbols')
const ReleaseNotes = require('./release-notes')

module.exports = async function generateNotes (pluginConfig, context) {
  const { logger } = context
  const config = getConfig(pluginConfig, context)
  debug('[Generate notes] Effective config: %o', config)

  context[SYM_RELEASE_NOTES] = context[SYM_RELEASE_NOTES] ||
    new ReleaseNotes(context, config.releaseNotes)

  await context[SYM_RELEASE_NOTES].updateContext(context)

  logger.log('Release notes are generated.')

  return context[SYM_RELEASE_NOTES].toString()
}
