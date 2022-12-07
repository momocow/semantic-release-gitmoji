const issueRegex = require('issue-regex')
const emojiRegex = require('emoji-regex/text')
const { emojify } = require('node-emoji')

const resolveIssueRef = require('./resolve-issue-ref')

function parseIssuesAndTasks ({ message = '' } = {}, options) {
  const matched = message.match(/(?:^|\s)wip(#\w[\w-_]*)(?:$|\s)/)

  // e.g. replace wip#1 to #1
  const issues = (message.replace(/wip(#\d+)/g, '$1').match(options.regex ?? issueRegex()) || [])
    .map((issue) => ({
      text: issue,
      link: resolveIssueRef(issue, options)
    }))

  return {
    issues,
    task: matched
      ? matched[0]
      : issues.length === 1 && issues[0].text.startsWith('#')
        ? issues[0].text
        : null
  }
}

function parseGitmoji ({ subject = '', message = '', body = '' } = {}, issues = []) {
  subject = emojify(subject.trim())
  if (issues.length > 0) {
    subject = issues.reduce((acc, curr) => acc.replace(curr.text, ''), subject).trim()
  }

  const matched = emojiRegex().exec(subject)
  if (!matched || matched.index !== 0) return null

  const gitmoji = matched[0]
  subject = subject.replace(new RegExp('^' + gitmoji), '')

  return { subject, message: subject + '\n\n' + body, gitmoji }
}

module.exports = function parseCommits (commits = [], mixins = {}, options = {}) {
  const taskMap = new Map()
  return commits
    .map(c => {
      const issues = parseIssuesAndTasks(c, options.issues)
      return {
        ...c,
        ...mixins,
        ...parseGitmoji(c, options?.issues?.removeFromCommit ? issues.issues : []),
        ...issues,
        wip: []
      }
    })
    .reduce((acc, commit) => {
      if (commit.gitmoji) {
        if (!Array.isArray(acc[commit.gitmoji])) acc[commit.gitmoji] = []
        acc[commit.gitmoji].push(commit)

        if (commit.task) {
          // commits are in the descending order
          if (!taskMap.has(commit.task) && commit.gitmoji !== '🚧') {
            // it is the final commit if it has not been in the task map
            taskMap.set(commit.task, commit)
          } else if (taskMap.has(commit.task) && commit.gitmoji === '🚧') {
            // the final commit exists so this commit is the releted wip commits
            taskMap.get(commit.task).wip.push(commit)
          }
        }
      }
      return acc
    }, {})
}
