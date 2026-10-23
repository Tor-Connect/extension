# Repository instructions

## Anonymous pushes

- Treat every Git push as requiring anonymity: do not push through a direct, non-anonymizing network connection or expose the user's personal identity in commit metadata.
- Use only the repository's configured anonymizing Git transport for pushes. Never replace it with a direct remote or fallback transport.
- Before pushing, inspect the commits being sent for identifying author or committer names, email addresses, signatures, or other personal metadata. Do not rewrite history without the user's instruction.
- A hosting provider may still associate a push with the authenticated account or credentials used. Do not describe a push as fully anonymous unless that has been independently verified.
- If the configured transport or identity cannot meet these requirements, stop before pushing and explain the limitation.
