# Harry Potter Portal

A browsing-and-personal-annotation app over the PotterDB character corpus.

## Language

**Character**:
A person in the PotterDB corpus, identified by its PotterDB id/slug. The only browsable entity in v1.
_Avoid_: Wizard, person, entry, record

**PotterDB**:
The external third-party API (`api.potterdb.com`) that owns character attributes; this app does not author them.
_Avoid_: the API, upstream, the source

**User**:
An account holder, identified by email address, who logs in with email and password.
_Avoid_: account, member, profile

**Favorite**:
A User's private mark on a Character. No other User can ever see it and it is never counted publicly.
_Avoid_: Like, bookmark, save, star

**Note**:
A User's private text about a Character. At most one per User and Character, re-savable in place, with no history and no version visible to anyone.
_Avoid_: Comment, review, post, message
