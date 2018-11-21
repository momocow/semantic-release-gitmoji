const _set = require('lodash.set')
const _shuffle = require('lodash.shuffle')

module.exports = function getContext (name, patch = {}) {
  if (patch.commits) {
    patch.commits = _shuffle(
      Object.keys(patch.commits)
        .reduce((commits, type) => {
          while (patch.commits[type]--) {
            commits.push(require(`./commit-${type}.json`))
          }
          return commits
        }, [])
    )
  }

  return Object.keys(patch)
    .reduce((ctxt, k) => {
      return _set(ctxt, k, patch[k])
    }, {
      ...require(`./context-${name}.json`),
      logger: {
        log () { }
      }
    })
}
