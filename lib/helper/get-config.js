const path = require('path')
const { hasEmoji, unemojify } = require('node-emoji')
const _mergeWith = require('lodash.mergewith')
const _cloneDeep = require('lodash.clonedeep')
const _uniq = require('lodash.uniq')

const DEFAULT_CONFIG = require('../assets/default-config.json')
const TEMPLATE_DIR = path.join(__dirname, 'assets', 'templates')

function normalizeEmojis (arr = []) {
  return (Array.isArray(arr) ? arr : [ arr ])
    .filter(i => !!i)
    .filter(hasEmoji)
    .map(unemojify)
}

function handleArrayConfig (dest, src) {
  if (Array.isArray(dest)) {
    if (Array.isArray(src)) return normalizeEmojis(src)
    if (typeof src === 'object') {
      const include = normalizeEmojis(src.include)
      const exclude = normalizeEmojis(src.exclude)
      return _uniq(dest.concat(include).filter(e => !exclude.includes(e)))
    }
    return dest
  }
}

function resolveTemplatePath (releaseNotesConfig, basePath) {
  if (releaseNotesConfig.template) {
    releaseNotesConfig.template = path.resolve(basePath, releaseNotesConfig.template)
  }
  if (typeof releaseNotesConfig.partials === 'object') {
    for (let [ partialName, partialPath ] of Object.entries(releaseNotesConfig.partials)) {
      releaseNotesConfig.partials[partialName] = path.resolve(basePath, partialPath)
    }
  }
  return releaseNotesConfig
}

// @see https://github.com/semantic-release/semantic-release/issues/990
module.exports = function getConfig (userConfig, { configFile = process.cwd() } = {}) {
  const basePath = path.dirname(configFile)
  const config = _cloneDeep(DEFAULT_CONFIG)
  config.releaseNotes = resolveTemplatePath(config.releaseNotes, TEMPLATE_DIR)
  userConfig.releaseNotes = resolveTemplatePath(userConfig.releaseNotes, basePath)
  return _mergeWith(config, userConfig, handleArrayConfig)
}
