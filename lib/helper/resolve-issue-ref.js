function getIssueUrlTemplate (source) {
  switch (source) {
    case 'github.com':
      return 'https://github.com/{owner}/{repo}/issues/{ref}'
    default:
      return '{baseUrl}//{owner}/{repo}/issues/{ref}'
  }
}

module.exports = function (shorthand = '', {
  owner,
  repo,
  baseUrl,
  template,
  regex,
  source = 'github.com'
} = {}) {
  const matched = shorthand.match(regex ?? /(?:(\w[\w-.]+)\/(\w[\w-.]+)|\B)#([1-9]\d*)\b/)
  if (matched) {
    const [issue, matchedOwner, matchedRepo, issueRef] = matched
    return (template || getIssueUrlTemplate(source))
      .replace('{baseUrl}', baseUrl || '')
      .replace('{owner}', matchedOwner || owner || '')
      .replace('{repo}', matchedRepo || repo || '')
      .replace('{ref}', issueRef || '')
      .replace('{issue}', issue)
  }
  return shorthand
}
