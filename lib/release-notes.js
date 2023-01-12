const hbs = require('handlebars')
const parseGitUrl = require('git-url-parse')
const dateFormat = require('dateformat')
const { find: findEmoji, emojify } = require('node-emoji')

const parseCommits = require('./helper/parse-commits')
const getCmpLink = require('./helper/get-cmp-link')
const debug = require('./helper/debug')

function proxifyCommitsMap (commits) {
  return new Proxy(commits, {
    get (target, prop) {
      const emoji = findEmoji(prop)
      if (emoji) {
        return target[emoji.emoji]
      }
      return undefined
    }
  })
}

/**
 * @type {string[]}
 */
const RELEASE_TYPES = require('./assets/release-types.json')

module.exports = class ReleaseNotes {
  /**
   * @param {object} context
   */
  constructor (context, { issueResolution, template, partials, helpers, semver } = {}) {
    debug('Found %d commits', context.commits.length)

    const { owner, name: repo, source } = parseGitUrl(context.options.repositoryUrl)

    debug('Git remote: %s', source)
    debug('Repository: %s/%s', owner, repo)

    this._semver = semver
    this._template = template
    this._partials = partials
    this._helpers = {
      datetime: function (format = 'UTC:yyyy-mm-dd') {
        return dateFormat(new Date(), format)
      },
      ...helpers
    }

    this._context = {
      owner,
      repo,
      source,
      commits: parseCommits(context.commits, { owner, repo, source }, {
        issues: { owner, repo, source, ...issueResolution },
        semver: this._semver
      })
    }

    Object.values(this._context.commits)
      .forEach(commits => commits.reverse())

    debug('Gitmoji commits:')
    Object.keys(this._context.commits)
      .map(gitmoji => `* ${gitmoji}: ${this._context.commits[gitmoji].length} commit(s)`)
      .forEach(msg => debug(msg))
  }

  getReleaseType (releaseSchema) {
    // cache hits
    if (this._rtype) return this._rtype

    if (this._semver) {
      for (const RTYPE of RELEASE_TYPES) {
        debug('Testing against release type "%s"', RTYPE)
        if (
          this._context.commits[RTYPE] &&
          this._context.commits[RTYPE].length > 0
        ) {
          debug('Release type is now "%s".', RTYPE)
          this._rtype = RTYPE
          return RTYPE
        }
      }
    } else {
      for (const RTYPE of RELEASE_TYPES) {
        debug('Testing against release type "%s"', RTYPE)
        for (let gitmoji of releaseSchema[RTYPE]) {
          gitmoji = emojify(gitmoji)
          debug('Testing against gitmoji "%s "', gitmoji)
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
      const v = this._partials[k] instanceof Promise ? await this._partials[k] : this._partials[k]
      hbs.registerPartial(k, v.toString())
      debug('Partial registered: "%s" (#%d)', k, i + 1)
    })

    await Promise.all(promises)

    let helperCount = 0
    for (const helper of Object.keys(this._helpers)) {
      hbs.registerHelper(helper, this._helpers[helper])
      debug('Helper registered: "%s" (#%d)', helper, ++helperCount)
    }

    if (this._template instanceof Promise) {
      this._template = await this._template
    }
    this._renderer = hbs.compile(this._template.toString())
  }

  toString () {
    if (this._semver) {
      return this._renderer({
        ...this._context,
        commits: this._context.commits
      }, {
        allowProtoPropertiesByDefault: true
      })
        .replace(/\n{3,}/g, '\n\n') // allow a blank line
    } else {
      return this._renderer({
        ...this._context,
        commits: proxifyCommitsMap(this._context.commits)
      }, {
        allowProtoPropertiesByDefault: true
      })
        .replace(/\n{3,}/g, '\n\n') // allow a blank line
    }
  }

  /**
   * @return {ReleaseNotes}
   */
  static get (context, releaseNotesOptions) {
    ReleaseNotes._instance = ReleaseNotes._instance || new ReleaseNotes(context, releaseNotesOptions)
    return ReleaseNotes._instance
  }
}
