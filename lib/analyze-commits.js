const { promisify } = require('util')
const fs = require('fs')
const readFileAsync = promisify(fs.readFile)

const debug = require('./helper/debug')
const getConfig = require('./helper/get-config')

const ReleaseNotes = require('./release-notes')

module.exports = async function analyzeCommits (pluginConfig, context) {
  const { logger } = context
  const config = getConfig(pluginConfig, context)
  debug('Effective config: %o', config)

  let template = ''
  const partials = {}
  const promises = [
    readFileAsync(config.releaseNotes.template, 'utf8')
      .then(content => { template = content })
  ]
  promises.concat(
    Object.entries(config.releaseNotes.partials)
      .map(([ partialName, partialPath ]) => readFileAsync(partialPath, 'utf8')
        .then(content => {
          partials[partialName] = content
        })
      )
  )
  await Promise.all(promises)

  context.notes = new ReleaseNotes(context, template, partials)
  const releaseType = context.notes.getReleaseType(config.releaseTypes)
  logger.log('The next release will be a "%s" release.', releaseType)

  return releaseType
}
