const { unemojify } = require('node-emoji')
const issueRegex = require('issue-regex')
const hbs = require('handlebars')
const parseGitUrl = require('git-url-parse')
const dateFormat = require('dateformat')

const resolveIssueRef = require('./helper/resolve-issue-refs')
const getCmpLink = require('./helper/get-cmp-link')
const eachGitmojis = require('./helper/each-gitmojis')
const debug = require('./helper/debug')

/**
 * @type {string[]}
 */
const RELEASE_TYPES = require('./assets/release-types.json')

module.exports = class ReleaseNotes {
  /**
   * @param {object} context
   * @param {string} template
   * @param {object} [partials]
   */
  constructor (context, template, partials = {}) {
    const { commits, lastRelease, nextRelease, options } = context
    const { owner, name: repo, source } = parseGitUrl(options.repositoryUrl)
    const prevTag = lastRelease.gitTag || lastRelease.gitHead
    const nextTag = nextRelease.gitTag || nextRelease.gitHead

    this._context = {
      owner,
      repo,
      lastRelease,
      nextRelease,
      compareUrl: getCmpLink(source, owner, repo, prevTag, nextTag),
      commits: commits.map()
    }

    Object.keys(partials).forEach(k => {
      hbs.registerPartial(k, partials[k])
    })

    hbs.registerHelper('datetime', function (format = 'UTC:yyyy-mm-dd') {
      return dateFormat(new Date(), format)
    })

    this._renderer = hbs.compile(template)
  }

  getReleaseType (releaseSchema) {
    // cache hits
    if (this._rtype) return this._rtype

    for (let RTYPE of RELEASE_TYPES.reverse()) {
      for (let gitmoji of releaseSchema[RTYPE]) {
        if (
          this._context.commits[gitmoji] &&
          this._context.commits[gitmoji].length > 0
        ) {
          this._rtype = RTYPE
          return RTYPE
        }
      }
    }
  }
}
