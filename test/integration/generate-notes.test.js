const test = require('ava')
const sinon = require('sinon')
const dateFormat = require('dateformat')

const { generateNotes } = require('../..')
const ReleaseNotes = require('../../lib/release-notes')
const getContext = require('./fixtures/contexts')

const { readFileSync } = require('fs')
const path = require('path')

const now = new Date()
const templateDir = '../../lib/assets/templates'
const template = readFileSync(path.join(__dirname, templateDir, 'default-template-semver.hbs'))

function readNotesSync (name) {
  return readFileSync(path.join(__dirname, 'fixtures', 'notes', `notes-${name}.md`), 'utf8')
    .replace(/\{datetime\}/g, dateFormat(now, 'UTC:yyyy-mm-dd'))
}

const stub = sinon.stub(ReleaseNotes, 'get')
// to avoid singleton for tests
stub.callsFake(function (...args) {
  return new ReleaseNotes(...args)
})

test.after(function () {
  stub.restore()
})

const commitUrlTemplate = 'https://{source}/{owner}/{repo}/commit/{commit}'

const CASES = [
  {
    name: 'default config + common context w/ patch updates',
    pluginConfig: {
      releaseNotes: {
        commitUrlTemplate
      }
    },
    context: getContext('common', {
      commits: { boring: 2, patch: 4 },
      nextRelease: {
        version: '0.0.1',
        gitTag: 'v0.0.1'
      }
    }),
    expectedNotes: readNotesSync('patch')
  },
  {
    name: 'default config + common context w/ minor updates',
    pluginConfig: {
      releaseNotes: {
        commitUrlTemplate
      }
    },
    context: getContext('common', {
      commits: { boring: 2, patch: 4, minor: 2 },
      nextRelease: {
        version: '0.1.0',
        gitTag: 'v0.1.0'
      }
    }),
    expectedNotes: readNotesSync('minor')
  },
  {
    name: 'default config + common context w/ major updates',
    pluginConfig: {
      releaseNotes: {
        commitUrlTemplate
      }
    },
    context: getContext('common', {
      commits: { boring: 2, patch: 4, minor: 2, major: 1 },
      nextRelease: {
        version: '1.0.0',
        gitTag: 'v1.0.0'
      }
    }),
    expectedNotes: readNotesSync('major')
  },
  {
    name: 'default config + WIP context w/ minor updates',
    pluginConfig: {
      releaseNotes: {
        commitUrlTemplate
      }
    },
    context: getContext('wip', {
      nextRelease: {
        version: '1.0.0',
        gitTag: 'v1.0.0'
      }
    }),
    expectedNotes: readNotesSync('wip')
  },
  {
    name: 'custom helper config + common context w/ patch updates',
    pluginConfig: {
      releaseNotes: {
        template: '{{capitalize "cUSTOM"}} Helpers',
        commitUrlTemplate,
        helpers: {
          capitalize: function (str = '') {
            return str.length > 0 ? str[0].toUpperCase() + str.slice(1).toLowerCase() : str
          }
        }
      }
    },
    context: getContext('common', {
      commits: { boring: 2, patch: 4 },
      nextRelease: {
        version: '0.0.1',
        gitTag: 'v0.0.1'
      }
    }),
    expectedNotes: readNotesSync('custom-helper')
  },
  {
    name: 'default config + custom issueResolution',
    pluginConfig: {
      releaseNotes: {
        commitUrlTemplate,
        issueResolution: {
          removeFromCommit: true,
          regex: /CUSTOM-\d{4}/g,
          template: 'https://custom-url/{issue}'
        }
      }
    },
    context: getContext('custom', {
      nextRelease: {
        version: '0.1.0',
        gitTag: 'v0.1.0'
      }
    }),
    expectedNotes: readNotesSync('custom')
  },
  {
    name: 'default config + common context w/ patch updates using gitmoji semver',
    pluginConfig: {
      releaseNotes: {
        semver: true,
        commitUrlTemplate,
        template: template
      }
    },
    context: getContext('common', {
      commits: { boring: 2, patch: 4 },
      nextRelease: {
        version: '0.0.1',
        gitTag: 'v0.0.1'
      }
    }),
    expectedNotes: readNotesSync('patch-semver')
  },
  {
    name: 'default config + common context w/ minor updates using gitmoji semver',
    pluginConfig: {
      releaseNotes: {
        semver: true,
        commitUrlTemplate,
        template
      }
    },
    context: getContext('common', {
      commits: { boring: 2, patch: 4, minor: 2 },
      nextRelease: {
        version: '0.1.0',
        gitTag: 'v0.1.0'
      }
    }),
    expectedNotes: readNotesSync('minor-semver')
  },
  {
    name: 'default config + common context w/ major updates using gitmoji semver',
    pluginConfig: {
      releaseNotes: {
        semver: true,
        commitUrlTemplate,
        template
      }
    },
    context: getContext('common', {
      commits: { boring: 2, patch: 4, minor: 2, major: 1 },
      nextRelease: {
        version: '1.0.0',
        gitTag: 'v1.0.0'
      }
    }),
    expectedNotes: readNotesSync('major-semver')
  },
  {
    name: 'default config + WIP context w/ minor updates using gitmoji semver',
    pluginConfig: {
      releaseNotes: {
        semver: true,
        commitUrlTemplate,
        template
      }
    },
    context: getContext('wip', {
      nextRelease: {
        version: '1.0.0',
        gitTag: 'v1.0.0'
      }
    }),
    expectedNotes: readNotesSync('wip-semver')
  },
  {
    name: 'default config + custom issueResolution using gitmoji semver',
    pluginConfig: {
      releaseNotes: {
        semver: true,
        commitUrlTemplate,
        template,
        issueResolution: {
          removeFromCommit: true,
          regex: /CUSTOM-\d{4}/g,
          template: 'https://custom-url/{issue}'
        }
      }
    },
    context: getContext('custom', {
      nextRelease: {
        version: '0.1.0',
        gitTag: 'v0.1.0'
      }
    }),
    expectedNotes: readNotesSync('custom-semver')
  }
]

async function macro (t, { pluginConfig, context, expectedNotes }) {
  context.logger.log = t.log
  t.is(await generateNotes(pluginConfig, context), expectedNotes)
}

macro.title = function title (t, { name }) {
  return name
}

CASES.forEach(c => test(macro, c))
