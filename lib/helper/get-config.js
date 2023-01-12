const { hasEmoji, emojify } = require('node-emoji')
const _mergeWith = require('lodash.mergewith')
const _cloneDeep = require('lodash.clonedeep')
const _uniq = require('lodash.uniq')

const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)

const DEFAULT_CONFIG = require('../assets/default-config')
const TEMPLATE_DIR = path.join(__dirname, '../assets/templates')

function normalizeEmojis (arr = []) {
  return (Array.isArray(arr) ? arr : [arr])
    .filter(i => !!i)
    .filter(hasEmoji)
    .map(emojify)
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

module.exports = function getConfig (userConfig) {
  if (userConfig && 'releaseNotes' in userConfig && 'semver' in userConfig.releaseNotes && userConfig.releaseNotes.semver) {
    DEFAULT_CONFIG.releaseNotes.template = readFileAsync(path.join(TEMPLATE_DIR, 'default-template-semver.hbs'))
  }
  return _mergeWith(_cloneDeep(DEFAULT_CONFIG), userConfig, handleArrayConfig)
}
