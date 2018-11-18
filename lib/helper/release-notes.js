const { unemojify } = require('node-emoji')

const DEFAULT_TEMPLATE = `# Changelog`

const DEFAULT_SCHEMA = {
  template: '',
  titles: {
    ':sparkles:': '✨ New Features'
  }
}

const DEFAULT

module.exports = class ReleaseNotes {
  constructor (stringifySchema = DEFAULT_SCHEMA) {
    /**
     * Map from emojis to messages
     * @type {Map<string, string[]>}
     */
    this._commits = new Map()
    this._schema = stringifySchema
  }

  push (emoji, message) {
    emoji = unemojify(emoji)
    message = unemojify(message).replace(new RegExp('^' + emoji), '')

    if (!this._commits.has(emoji)) this._commits.set(emoji, [])
    this._commits.get(emoji).push(message)

    return this
  }

  valueOf () {
    return this.toString()
  }

  toString () {
    return this._value
  }
}
