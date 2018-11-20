module.exports = function getCmpLink (host, owner, repo, prevTag, nextTag) {
  if (!owner || !repo || !prevTag || !nextTag) return ''
  switch (host) {
    case 'github.com':
      return `https://github.com/${owner}/${repo}/compare/${prevTag}...${nextTag}`
    default:
      return ''
  }
}
