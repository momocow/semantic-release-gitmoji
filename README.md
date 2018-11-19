# semantic-release-gitmoji
A [semantic-release](https://github.com/semantic-release/semantic-release) plugin for gitmojis ✨🐛💥

Different from [conventional changelog](https://github.com/conventional-changelog/conventional-changelog), [Gitmoji](https://github.com/carloscuesta/gitmoji) commits are used to **determine a release type** and **generate release notes**.

| Step             | Description                                                                                                                  |
|------------------|------------------------------------------------------------------------------------------------------------------------------|
| `analyzeCommits` | Determine the type of release by analyzing commits with [Gitmoji](https://github.com/carloscuesta/gitmoji).                  |
| `generateNotes`  | Generate release notes for the commits added since the last release with [Gitmoji](https://github.com/carloscuesta/gitmoji). |
