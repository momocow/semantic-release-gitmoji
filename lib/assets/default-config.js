const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)

const TEMPLATE_DIR = path.join(__dirname, 'templates')

module.exports = {
  releaseRules: {
    major: [
      ':boom:'
    ],
    premajor: [],
    minor: [
      ':sparkles:'
    ],
    preminor: [],
    patch: [
      ':bug:',
      ':ambulance:',
      ':lock:'
    ],
    prepatch: [],
    prerelease: []
  },
  releaseNotes: {
    semver: false,
    template: readFileAsync(path.join(TEMPLATE_DIR, 'default-template.hbs')),
    partials: {
      commitTemplate: readFileAsync(path.join(TEMPLATE_DIR, 'commit-template.hbs'))
    },
    issueResolution: {
      // template
      // baseUrl
      // source
      // removeFromCommit
      // regex
    }
  }
}
