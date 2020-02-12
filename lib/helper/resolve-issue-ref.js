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
  source = 'github.com'
} = {}) {
  const matched = shorthand.match(/(?:(\w[\w-.]+)\/(\w[\w-.]+)|\B)#([1-9]\d*)\b/)
  if (matched) {
    const [, matchedOwner, matchedRepo, issueRef] = matched
    return (template || getIssueUrlTemplate(source))
      .replace('{baseUrl}', baseUrl || '')
      .replace('{owner}', matchedOwner || owner || '')
      .replace('{repo}', matchedRepo || repo || '')
      .replace('{ref}', issueRef || '')
  }
  return shorthand
}
