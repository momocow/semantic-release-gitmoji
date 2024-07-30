const issueRegex = require('issue-regex')
const emojiRegex = require('emoji-regex')
const escapeStringRegex = require('escape-string-regexp')
const { emojify } = require('node-emoji')
const { gitmojis } = require('gitmojis')

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

const IMAGE_STYLE_SELECTOR = String.fromCharCode(0xfe0f)

/**
 * Newer version of gitmojis may contains selector 0xfe0f (image style)
 * however we need to support gitmoji from older version of gitmojis
 *
 * @see https://github.com/carloscuesta/gitmoji/pull/753
 */
function matchEmoji (emoji) {
  return (spec) => spec.emoji === emoji || spec.emoji === emoji + IMAGE_STYLE_SELECTOR
}

function parseGitmoji ({ subject = '', message = '', body = '' } = {}, issues = []) {
  subject = emojify(subject.trim())
  if (issues.length > 0) {
    subject = issues.reduce((acc, curr) => acc.replace(curr.text, ''), subject).trim()
  }

  const matched = emojiRegex().exec(subject)
  if (!matched || matched.index !== 0) return null

  const gitmoji = matched[0]
  const semver = gitmojis.find(matchEmoji(gitmoji))?.semver || 'other'
  subject = subject.replace(new RegExp('^' + escapeStringRegex(gitmoji)), '')

  return { subject, message: subject + '\n\n' + body, gitmoji, semver }
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
      if (options.semver) {
        if (!Array.isArray(acc[commit.semver])) acc[commit.semver] = []
        acc[commit.semver].push(commit)

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
        return acc
      } else {
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
      }
    }, {})
}
