const test = require('ava')

const { analyzeCommits, generateNotes } = require('../..')
const ReleaseNotes = require('../../lib/release-notes')
const getContext = require('./fixtures/contexts')

// These tests intentionally exercise the real ReleaseNotes.get (no stub)
// to reproduce the singleton state leak that occurs when semantic-release
// runs analyzeCommits / generateNotes twice within the same process
// (e.g. when adding a channel to an existing tag on a maintenance branch).

test.beforeEach(function () {
  ReleaseNotes._instance = null
})

test.serial.failing(
  'analyzeCommits: pass 2 must not inherit release type cached from pass 1',
  async function (t) {
    // GIVEN pass 1 yields a "minor" release (`:sparkles:` commit present)
    const pass1 = getContext('common', { commits: { boring: 1, minor: 1 } })
    pass1.logger.log = t.log
    t.is(await analyzeCommits({}, pass1), 'minor')

    // WHEN pass 2 runs with only commits that match no release rule
    const pass2 = getContext('common', { commits: { boring: 2 } })
    pass2.logger.log = t.log

    // THEN pass 2 must yield no release
    // Actual (buggy): returns 'minor' because `_rtype` is cached on the singleton.
    t.is(await analyzeCommits({}, pass2), undefined)
  }
)

test.serial.failing(
  'generateNotes: pass 2 must render only commits from its own context',
  async function (t) {
    // GIVEN pass 1 rendered notes for a minor release including `:sparkles:` commits
    const pass1 = getContext('common', {
      commits: { boring: 1, minor: 1 },
      nextRelease: { version: '1.1.0', gitTag: 'v1.1.0' }
    })
    pass1.logger.log = t.log
    await analyzeCommits({}, pass1)
    const pass1Notes = await generateNotes({}, pass1)
    t.true(pass1Notes.includes('Add a new feature'))

    // WHEN pass 2 generates notes for a context with no `:sparkles:` commit
    const pass2 = getContext('common', {
      commits: { boring: 1 },
      nextRelease: { version: '1.1.1', gitTag: 'v1.1.1' }
    })
    pass2.logger.log = t.log

    // THEN pass 2 notes must not include the `:sparkles:` commit from pass 1
    // Actual (buggy): the singleton's `_context.commits` is frozen from pass 1,
    // so the `:sparkles:` commit leaks into pass 2 notes.
    const pass2Notes = await generateNotes({}, pass2)
    t.false(pass2Notes.includes('Add a new feature'))
  }
)
