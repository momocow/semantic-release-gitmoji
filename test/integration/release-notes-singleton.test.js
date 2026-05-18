const test = require('ava')

const { analyzeCommits, generateNotes } = require('../..')
const getContext = require('./fixtures/contexts')

// Regression: semantic-release runs analyzeCommits / generateNotes twice
// within the same process when adding a channel to an existing tag (e.g.
// maintenance branch creation). State must not leak between passes.

test.serial(
  'analyzeCommits: pass 2 must not inherit release type cached from pass 1',
  async function (t) {
    // GIVEN pass 1 yields a "minor" release (`:sparkles:` commit present)
    const pass1 = getContext('common', { commits: { boring: 1, minor: 1 } })
    pass1.logger.log = t.log
    t.is(await analyzeCommits({}, pass1), 'minor')

    // WHEN pass 2 runs with only commits that match no release rule
    const pass2 = getContext('common', { commits: { boring: 2 } })
    pass2.logger.log = t.log

    // THEN pass 2 must yield no release (would inherit 'minor' under the
    // previous singleton + `_rtype` cache).
    t.is(await analyzeCommits({}, pass2), undefined)
  }
)

test.serial(
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
    // (would leak under the previous singleton whose `_context.commits` was
    // frozen at first construction).
    const pass2Notes = await generateNotes({}, pass2)
    t.false(pass2Notes.includes('Add a new feature'))
  }
)
