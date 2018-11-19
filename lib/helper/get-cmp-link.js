module.exports = function getCmpLink (host, owner, repo, prevTag, nextTag) {
  switch (host) {
    case 'github.com':
      return `https://github.com/${owner}/${repo}/compare/${prevTag}...${nextTag}`
    default:
      return ''
  }
}
