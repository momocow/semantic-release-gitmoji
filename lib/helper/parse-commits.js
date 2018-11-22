const issueRegex = require('issue-regex')
const emojiRegex = require('emoji-regex')
const { emojify } = require('node-emoji')

const resolveIssueRef = require('./resolve-issue-ref')

function parseTask ({ message = '' } = {}) {
  const matched = message.match(/(?:^|\s)wip#(\w[\w-_]*)(?:$|\s)/)
  return matched ? matched[1] : null
}

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
  const taskMap = new Map()
  return commits
    .map(c => ({
      ...c,
      ...mixins,
      ...parseGitmoji(c),
      task: parseTask(c),
      wip: [],
      issues: parseIssues(c, options.issues)
    }))
    .reduce((acc, commit) => {
      if (commit.gitmoji) {
        if (!Array.isArray(acc[commit.gitmoji])) acc[commit.gitmoji] = []
        acc[commit.gitmoji].push(commit)

        if (commit.task) {
          // commits are in the descending order
          if (!taskMap.has(commit.task)) {
            // it is the final commit if it has not been in the task map
            taskMap.set(commit.task, commit)
          } else {
            // the final commit exists so this commit is the releted wip commits
            taskMap.get(commit.task).wip.push(commit)
          }
        }
      }
      return acc
    }, {})
}
