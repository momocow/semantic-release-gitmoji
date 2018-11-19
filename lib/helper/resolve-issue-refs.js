module.exports = function (shorthand = '', {
  owner,
  repo,
  baseUrl = 'https://github.com',
  template = '{baseUrl}/{owner}/{repo}/issues/{ref}'
} = {}) {
  const matched = shorthand.match(/(?:(\w[\w-.]+)\/(\w[\w-.]+)|\B)#([1-9]\d*)\b/)
  if (matched) {
    const [ , matchedOwner = owner, matchedRepo = repo, issueRef ] = matched
    return template
      .replace('{baseUrl}', baseUrl)
      .replace('{owner}', matchedOwner)
      .replace('{repo}', matchedRepo)
      .replace('{ref}', issueRef)
  }
  return ''
}
