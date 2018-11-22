const test = require('ava')
const sinon = require('sinon')
const dateFormat = require('dateformat')

const { generateNotes } = require('../..')
const ReleaseNotes = require('../../lib/release-notes')
const getContext = require('./fixtures/contexts')

const { readFileSync } = require('fs')
const path = require('path')

const now = new Date()

function readNotesSync (name) {
  return readFileSync(path.join(__dirname, 'fixtures', 'notes', `notes-${name}.md`), 'utf8')
    .replace(/\{datetime\}/g, dateFormat(now, 'yyyy-mm-dd'))
}

const stub = sinon.stub(ReleaseNotes, 'get')
// to avoid singleton for tests
stub.callsFake(function (...args) {
  return new ReleaseNotes(...args)
})

test.after(function () {
  stub.restore()
})

const CASES = [
  {
    name: 'default config + common context w/ patch updates',
    pluginConfig: {},
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
    pluginConfig: {},
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
    pluginConfig: {},
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
    pluginConfig: {},
    context: getContext('wip', {
      nextRelease: {
        version: '1.0.0',
        gitTag: 'v1.0.0'
      }
    }),
    expectedNotes: readNotesSync('wip')
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
