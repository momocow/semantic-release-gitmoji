const issueRegex = require('issue-regex')
const emojiRegex = require('emoji-regex')
const { emojify } = require('node-emoji')

const resolveIssueRef = require('./resolve-issue-ref')

function parseIssues ({ message = '' } = {}, options) {
  return (message.match(issueRegex()) || [])
    .map((issue) => ({
      text: issue,
      link: resolveIssueRef(issue, options)
    }))
}

function parseGitmoji ({ subject = '', message = '', body = '' } = {}) {
  subject = emojify(subject.trim())
  const matched = emojiRegex().exec(subject)
  if (!matched || matched.index !== 0) return null

  const gitmoji = matched[0]
  subject = subject.replace(new RegExp('^' + gitmoji), '')

  return { subject, message: subject + '\n\n' + body, gitmoji }
}

module.exports = function parseCommits (commits = [], mixins = {}, options = {}) {
  return commits
    .map(c => ({
      ...c,
      ...mixins,
      ...parseGitmoji(c),
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
