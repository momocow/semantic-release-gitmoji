const path = require('path')
const fs = require('fs')

const tplFile = path.resolve(__dirname, 'build/release-notes.hbs')

module.exports = {
  branches: [
    "main",
  ],
  plugins: [
    [
      'semantic-release-gitmoji',
      {
        releaseRules: {
          patch: {
            include: [':bento:', ':arrow_up:', ':lock:'],
          },
        },
        releaseNotes: {
          template: fs.readFileSync(tplFile, 'utf-8'),
        }
      }
    ],
    '@semantic-release/github',
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        message: [
          ':bookmark: v${nextRelease.version} [skip ci]',
          '',
          'https://github.com/momocow/semantic-release-gitmoji/releases/tag/${nextRelease.gitTag}'
        ].join('\n')
      }
    ]
  ]
}