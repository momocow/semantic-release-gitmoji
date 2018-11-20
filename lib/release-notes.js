const hbs = require('handlebars')
const parseGitUrl = require('git-url-parse')
const dateFormat = require('dateformat')

const parseCommits = require('./helper/parse-commits')
const getCmpLink = require('./helper/get-cmp-link')
const debug = require('./helper/debug')

/**
 * @type {string[]}
 */
const RELEASE_TYPES = require('./assets/release-types.json')

module.exports = class ReleaseNotes {
  /**
   * @param {object} context
   */
  constructor (context, { issueResolution, template, partials } = {}) {
    debug('Found %d commits', context.commits.length)

    const { owner, name: repo, source } = parseGitUrl(context.options.repositoryUrl)

    debug('Git remote: %s', source)
    debug('Repository: %s/%s', owner, repo)

    this._template = template
    this._partials = partials

    this._context = {
      owner,
      repo,
      source,
      commits: parseCommits(context.commits, { owner, repo }, {
        issues: { owner, repo, source, ...issueResolution }
      })
    }

    debug('Gitmoji commits:')
    Object.keys(this._context.commits)
      .map(gitmoji => `* ${gitmoji}: ${this._context.commits[gitmoji].length} commit(s)`)
      .forEach(msg => debug(msg))
  }

  getReleaseType (releaseSchema) {
    // cache hits
    if (this._rtype) return this._rtype

    for (let RTYPE of RELEASE_TYPES.reverse()) {
      debug('Testing against release type "%s"', RTYPE)
      for (let gitmoji of releaseSchema[RTYPE]) {
        gitmoji = gitmoji.replace(/(?:^:|:$)/g, '')
        debug('Testing against gitmoji "%s"', gitmoji)
        if (
          this._context.commits[gitmoji] &&
          this._context.commits[gitmoji].length > 0
        ) {
          debug('Release type is now "%s".', RTYPE)
          this._rtype = RTYPE
          return RTYPE
        }
      }
    }
  }

  /**
   * @param {object} context
   */
  async updateContext (context) {
    const { lastRelease, nextRelease } = context
    const prevTag = lastRelease.gitTag || lastRelease.gitHead
    const nextTag = nextRelease.gitTag || nextRelease.gitHead

    debug('Previous tag: "%s"', prevTag)
    debug('Next tag: "%s"', nextTag)

    const { source, owner, repo } = this._context

    this._context = {
      ...this._context,
      lastRelease,
      nextRelease,
      compareUrl: getCmpLink(source, owner, repo, prevTag, nextTag)
    }

    debug('Release notes context: %o', this._context)

    const promises = Object.keys(this._partials).map(async (k, i) => {
      let v = this._partials[k] instanceof Promise ? await this._partials[k] : this._partials[k]
      hbs.registerPartial(k, v.toString())
      debug('Partial registered: "%s" (#%d)', k, i + 1)
    })

    await Promise.all(promises)

    hbs.registerHelper('datetime', function (format = 'UTC:yyyy-mm-dd') {
      return dateFormat(new Date(), format)
    })

    if (this._template instanceof Promise) {
      this._template = await this._template
    }

    this._renderer = hbs.compile(this._template.toString())
  }

  toString () {
    return this._renderer(this._context).replace(/\n{2,}/g, '\n')
  }
}
