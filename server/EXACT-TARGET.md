# ExactTarget Deployments

## Merge Variables

**Deployment ID**
Merge Variable: `%%_emailid%%` (integer)
Send Object Property: `Email.ID`
Email Object Propery: `ID`
Notes: Send previews _will_ include a valid `%%_emailid%%` value.

**Job ID**
Merge Variable: `%%jobid%%` (integer)
Send Object Propery: `ID`
Email Object Property: N/A
Notes: Send previews will **not** include a valid `%%jobid%%` value and instead will set it to `0`.

**Subscriber ID**
Merge Variable: `%%subscriberid%%` (integer)
Subscriber Object Property: `ID`

**Email Address**
Merge Variable: `%%emailaddr%%` (string)
Subscriber Object Property: `EmailAddress`


## API Send Object
Documention: https://developer.salesforce.com/docs/atlas.en-us.mc-apis.meta/mc-apis/send.htm
A single deployment (identifed by `Email.ID`) can be sent multiple times. Each send is considered a "job," and is identified using a Job ID.

## Import Process
1. User clicks a link within a deployment, containing a `dep=%%jobid%%` URL parameter.
2. User lands on tracking endpoint and the JobID is extracted from the URL.
3. The redirect destination is determined, a background import process is started, and the user is redirected.
4. Within the background process, retrieve the `Send` object from the API where the `ID` property equals the `%%jobid%%` value.
5. Upsert the deployment by `Email.ID` and `ID` (unique key)

## Business Logic
Newsletters generally need to be displayed as _one_ deployment, even when multiple jobs/splits are sent. Blasts, however, need to display their metrics and leads per _individual_ job. Examples:

Newsletter X is sent on March 23rd, 2018 two times. The metrics and leads should be rolled-up into _one_ deployment for March 23rd.
Blast X is sent on March 26th and March 28th, 2018. The metrics and leads should be seperated for treated as a different deployment.
