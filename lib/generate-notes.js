const debug = require('./helper/debug')
const getConfig = require('./helper/get-config')

const ReleaseNotes = require('./release-notes')

module.exports = async function generateNotes (pluginConfig, context) {
  const { logger } = context
  const config = getConfig(pluginConfig, context)
  debug('[Generate notes] Effective config: %o', config)

  const notes = ReleaseNotes.get(context, config.releaseNotes)
  await notes.updateContext(context)

  logger.log('Release notes are generated.')

  return notes.toString()
}
