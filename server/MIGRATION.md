## Users
Passwords will not be retained from PHP to Node.js. Will need to reset all users passwords with temp passwords. Correction: change the prefix from 2y to 2b

# Identities
Some identities (~48) are missing the `attributes.ID` value. These were likely bots or users who had dupe key errors on insert. Attempt to look them up in ET again. If not found, skip them and remove any references to them.

Also, there are ~118 entries (account for ~237 individual identity records) where `attributes.ID` are the same. This is because, previously, the email address was used as the unique key, not the subscriber ID. If a user were to change their profile (including email address), this would cause dupes.

## Extracted URLs
Many URLs did not properly decoded HTML entities, such as `&amp;`. These should be fixed through some kind of processor. The original `_id` value needs to be preserved, however.

160 have `/&amp;/` in `values.original.url`
158 in `values.resolved.url`

413 have `/leads\.ien\.com/` in `values.original.url`
33 have `click\.reply\.ien\.com` in `values.original.url`

Some URLs were also "re-processed," meaning the URL was already tracked from ExactTarget or from Leads, and were being re-tracked by Leads again. This should be prevented.

Short IDs need to be added to all URLs.

## To Import
`event-email-clicks`

