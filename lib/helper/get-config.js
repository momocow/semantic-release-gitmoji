const { hasEmoji, unemojify } = require('node-emoji')
const _mergeWith = require('lodash.mergewith')
const _cloneDeep = require('lodash.clonedeep')
const _uniq = require('lodash.uniq')

const DEFAULT_CONFIG = require('../assets/default-config')

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

module.exports = function getConfig (userConfig) {
  return _mergeWith(_cloneDeep(DEFAULT_CONFIG), userConfig, handleArrayConfig)
}
