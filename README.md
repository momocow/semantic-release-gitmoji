# semantic-release-gitmoji
[![Build Status](https://travis-ci.org/momocow/semantic-release-gitmoji.svg?branch=master)](https://travis-ci.org/momocow/semantic-release-gitmoji)
[![npm](https://img.shields.io/npm/v/semantic-release-gitmoji.svg)](https://www.npmjs.com/semantic-release-gitmoji)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square)](https://gitmoji.carloscuesta.me/)

✨🐛💥 A [semantic-release](https://github.com/semantic-release/semantic-release) plugin for gitmojis.

Different from [conventional changelog](https://github.com/conventional-changelog/conventional-changelog), [Gitmoji](https://github.com/carloscuesta/gitmoji) commits are used to **determine a release type** and **generate release notes**.

| Step             | Description                                                                                                                  |
|------------------|------------------------------------------------------------------------------------------------------------------------------|
| `analyzeCommits` | Determine the type of release by analyzing commits with [Gitmoji](https://github.com/carloscuesta/gitmoji).                  |
| `generateNotes`  | Generate release notes for the commits added since the last release with [Gitmoji](https://github.com/carloscuesta/gitmoji). |

- [semantic-release-gitmoji](#semantic-release-gitmoji)
  - [Install](#install)
  - [Usage](#usage)
  - [Configuration](#configuration)
    - [ReleaseRules](#releaserules)
      - [Emoji](#emoji)
    - [ReleaseNotesOptions](#releasenotesoptions)
      - [TemplateContent](#templatecontent)
  - [Templates](#templates)
    - [Context](#context)
    - [CommitContext](#commitcontext)
    - [IssueLink](#issuelink)

## Install
```
npm install semantic-release-gitmoji -D
```

## Usage
The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/caribou/docs/usage/configuration.md#configuration):

```js
// in ".releaserc.js" or "release.config.js"

const { promisify } = require('util')
const readFileAsync = promisify(require('fs').readFile)

// Given a `const` variable `TEMPLATE_DIR` which points to "<semantic-release-gitmoji>/lib/assets/templates"

// the *.hbs template and partials should be passed as strings of contents
const template = readFileAsync(path.join(TEMPLATE_DIR, 'default-template.hbs'))
const commitTemplate = readFileAsync(path.join(TEMPLATE_DIR, 'commit-template.hbs'))

module.exports = {
  plugins: [
    [
      'semantic-release-gitmoji', {
        releaseRules: {
          major: [ ':boom:' ],
          minor: [ ':sparkles:' ],
          patch: [
            ':bug:',
            ':ambulance:',
            ':lock:'
          ]
        },
        releaseNotes: {
          template,
          partials: { commitTemplate },
          issueResolution: {
            template: '{baseUrl}/{owner}/{repo}/issues/{ref}',
            baseUrl: 'https://github.com',
            source: 'github.com'
          }
        }
      }
    ],
    '@semantic-release/github',
    '@semantic-release/npm'
  ]
}
```

This configuration is the same semantic as the default configuration of `semantic-release-gitmoji`.

`semantic-release-gitmoji` should be used in place of both [`@semantic-release/commit-analyzer`](https://github.com/semantic-release/commit-analyzer) and [`@semantic-release/release-notes-generator`](https://github.com/semantic-release/release-notes-generator) since the both plugins parse commits following the [conventional changelog](https://github.com/conventional-changelog/conventional-changelog) while this plugin requires [Gitmoji](https://github.com/carloscuesta/gitmoji) commits.

## Configuration
It is recommended to write the configuration in a **javascript** file since templates are required to be `string`s of their contents.

```ts
interface SemanticReleaseGitmojiOptions {
  releaseRules?: ReleaseRules
  releaseNotes?: ReleaseNotesOptions
}
```
### ReleaseRules
The `ReleaseRules` is a map from a [release type](./lib/assets/release-types.json) to a set of emojis.

```ts
interface ReleaseRules {
  major?:      Array<Emoji> | EmojiArrayModifier
  premajor?:   Array<Emoji> | EmojiArrayModifier
  minor?:      Array<Emoji> | EmojiArrayModifier
  preminor?:   Array<Emoji> | EmojiArrayModifier
  patch?:      Array<Emoji> | EmojiArrayModifier
  prepatch?:   Array<Emoji> | EmojiArrayModifier
  prerelease?: Array<Emoji> | EmojiArrayModifier
}
```

#### Emoji
`Emoji` is a string of valid **GitHub emoji markup** (e.g. `":boom:"`, `":collision:"`) or **raw emoji characters** (e.g. `"💥"`).

> No need to worry about which format to use since this plugin handles it for you!

> See https://github.com/omnidan/node-emoji for more information about emojis.

```ts
type Emoji = string
```

```ts
interface EmojiArrayModifier {
  include?: Array<Emoji>
  exclude?: Array<Emoji>
}
```

### ReleaseNotesOptions
`ReleaseNotesOptions` defines how to render the release notes from a given set of Gitmoji commits.

All templates file are compiled and renderered by [`handlebars`](http://handlebarsjs.com/), therefore you may need to get familiar with the `.hbs` format before starting to customize your own templates.

`partials` is a map from the partial name to the content of the partial template.

`issueResolution` defines how issues are resolved to. The default and the only supported source currently is `github.com`, or you can provide your own `issueResolution.template` to override the default resolution to GitHub.

There are four variables that can be used in `issueResolution.template`:
- `baseUrl`
- `owner`
- `repo`
- `ref`, which is the numeric ID of issue

```ts
interface ReleaseNotesOptions {
  template?: TemplateContent
  partials?: Record<string, TemplateContent>
  issueResolution?: {
    template?: string
    baseUrl?: string
    source?: 'github.com' | null // currently only GitHub is supported, PR welcome :)
  }
}
```

#### TemplateContent
```ts
type TemplateContent = string | Buffer | Promise<string> | Promise<Buffer>
```

## Templates

### Context
The context for templates is inherited from [`semantic-release` context](https://github.com/semantic-release/semantic-release/blob/caribou/docs/developer-guide/js-api.md#result) with some modifications such as `owner`, `repo` and `compareUrl`.

`commits` is a map from [`Emoji`](#emoji) *(don't worry about the format)* to a list of extended commits.
Values of `commits` are extended to contain more information related to Gitmoji. See [CommitContext](#commitcontext)

```ts
interface TemplateContext {
  owner: string
  repo: string
  source: string
  commits: Record<string, Array<CommitContext>>
  lastRelease: {
    gitHead: string
    version: string
    gitTag: string
  }
  nextRelease: {
    type: string
    gitHead: string
    version: string
    gitTag: string
  }
  compareUrl: string
}
```

### CommitContext
`CommitContext` is extended from [`SemanticReleaseCommitObj`](https://github.com/semantic-release/semantic-release/blob/caribou/docs/developer-guide/js-api.md#commits).

Note that emojis at the beginning of `message` and `subject` are trimmed, which are the same emoji in `gitmoji`.

`gitmoji` is a raw emoji since an emoji may have more than one GitHub emoji markup representation, e.g. `":boom:"` and `":collision:"` both represent for th emoji, `"💥"`.

```ts
interface CommitContext extends SemanticReleaseCommitObj {
  message: string
  subject: string
  owner: string
  repo: string
  source: string
  gitmoji: string
  issues: Array<IssueLink>
}
```

### IssueLink
```ts
interface IssueLink {
  text: string
  link: string
}
```