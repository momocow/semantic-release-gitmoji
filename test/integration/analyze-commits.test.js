const test = require('ava')
const sinon = require('sinon')

const { analyzeCommits } = require('../..')
const ReleaseNotes = require('../../lib/release-notes')
const getContext = require('./fixtures/contexts')

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
    name: 'default config + common context w/o updates',
    pluginConfig: {},
    context: getContext('common', { commits: { boring: 2 } }),
    expectedRelease: undefined
  },
  {
    name: 'default config + common context w/ patch updates',
    pluginConfig: {},
    context: getContext('common', { commits: { boring: 2, patch: 4 } }),
    expectedRelease: 'patch'
  },
  {
    name: 'default config + common context w/ minor updates',
    pluginConfig: {},
    context: getContext('common', { commits: { boring: 2, patch: 4, minor: 2 } }),
    expectedRelease: 'minor'
  },
  {
    name: 'default config + common context w/ major updates',
    pluginConfig: {},
    context: getContext('common', { commits: { boring: 2, patch: 4, minor: 2, major: 1 } }),
    expectedRelease: 'major'
  },
  {
    name: 'default config + common context w/o updates using gitmoji semver',
    pluginConfig: {
      semver: true
    },
    context: getContext('common', { commits: { boring: 2 } }),
    expectedRelease: undefined
  },
  {
    name: 'default config + common context w/ patch updates using gitmoji semver',
    pluginConfig: {
      semver: true
    },
    context: getContext('common', { commits: { boring: 2, patch: 4 } }),
    expectedRelease: 'patch'
  },
  {
    name: 'default config + common context w/ minor updates using gitmoji semver',
    pluginConfig: {
      semver: true
    },
    context: getContext('common', { commits: { boring: 2, patch: 4, minor: 2 } }),
    expectedRelease: 'minor'
  },
  {
    name: 'default config + common context w/ major updates using gitmoji semver',
    pluginConfig: {
      semver: true
    },
    context: getContext('common', { commits: { boring: 2, patch: 4, minor: 2, major: 1 } }),
    expectedRelease: 'major'
  },
  {
    name: 'default config + common context w/ star in commit subject',
    pluginConfig: {
      semver: true
    },
    context: getContext('common', { commits: { star: 1 } }),
    expectedRelease: undefined
  }
]

async function macro (t, { pluginConfig, context, expectedRelease }) {
  context.logger.log = t.log
  t.is(await analyzeCommits(pluginConfig, context), expectedRelease)
}

macro.title = function title (t, { name }) {
  return name
}

CASES.forEach(c => test(macro, c))
