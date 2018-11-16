const RELEASE_TYPES = require('./release-types.json')

module.exports = function maxRelease (type1, type2) {
  const idx1 = RELEASE_TYPES.indexOf(type1)
  const idx2 = RELEASE_TYPES.indexOf(type2)
  return RELEASE_TYPES[Math.max(idx1, idx2)]
}
