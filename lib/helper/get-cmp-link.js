module.exports = function getCmpLink (host, owner, repo, prevTag, nextTag) {
  if (!owner || !repo || !prevTag || !nextTag) return ''
  switch (host) {
    case 'github.com':
      return `https://github.com/${owner}/${repo}/compare/${prevTag}...${nextTag}`
    case 'gitlab.com':
      return `https://gitlab.com/${owner}/${repo}/compare/${prevTag}...${nextTag}`
    case 'bitbucket.org':
      return `https://bitbucket.org/${owner}/${repo}/compare/${nextTag}..${prevTag}`
    default:
      return ''
  }
}
