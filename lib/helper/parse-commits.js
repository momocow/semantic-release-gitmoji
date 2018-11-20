const issueRegex = require('issue-regex')
const emojiRegex = require('emoji-regex')
const { emojify, unemojify } = require('node-emoji')

const resolveIssueRef = require('./resolve-issue-ref')

function parseIssues ({ message = '' } = {}, options) {
  return (message.match(issueRegex()) || [])
    .map((issue) => ({
      text: issue,
      link: resolveIssueRef(issue, options)
    }))
}

function getGitmoji ({ message = '' } = {}) {
  const [ gitmoji ] = emojify(message).match(emojiRegex()) || []

  if (!gitmoji) return null

  const literal = unemojify(gitmoji)
  return gitmoji && (message.startsWith(gitmoji) || message.startsWith(literal))
    ? literal.replace(/(?:^:|:$)/g, '') : null
}

module.exports = function parseCommits (commits = [], mixins = {}, options = {}) {
  return commits
    .map(c => ({
      ...c,
      ...mixins,
      gitmoji: getGitmoji(c),
      issues: parseIssues(c, options.issues)
    }))
    .reduce((acc, commit) => {
      if (commit.gitmoji) {
        if (!Array.isArray(acc[commit.gitmoji])) acc[commit.gitmoji] = []
        acc[commit.gitmoji].push(commit)
      }
      return acc
    }, {})
}
