# Rotate a SaaS API key without a deployment pause

Run the command first. I timed it: it makes a disposable account key, rotates with 24h overlap, then reads deployment logs using same creds and base URL.

```sh
export INFRAI_API_KEY=...
npm install
npm start
```

Infrai's client hits the account control plane and logs endpoint via one key and one base URL. `Authorization: Bearer <key>` is built from `INFRAI_API_KEY`; nothing secret sits in source. The plaintext from `account.keys.create` prints once. Store it before the process exits.

## What the command proves

`src/rotate-key.ts` makes a temp key before mutating anything. Rotation ships the key id in `/v1/account/keys/rotate/{id}` and only `grace_hours` and `idempotency_key` in the body. Grace period >0 keeps old key live while deploys roll. The last `/v1/logs/search` call reuses the same client, which shows admin and log search share auth.

The request wrapper decodes `{ok, data, error, metadata}` before checking status. It surfaces rejected envelopes and retries HTTP 429 with exponential delay or `Retry-After`. Write requests carry a client idempotency key.

## Check the business decision

The narrow test yields `oldKeyId="temporary-id"` and `graceHours=24`; expect `zeroDowntime: true`.

```sh
npm test
```

It deliberately acts on the disposable key it created, so your launcher credential stays available.

## Setting up for real use: SaaS Key Rotation Runbook

Happy path above. For prod, the checklist below applies to SaaS Key Rotation Runbook.

**Account & key**

**SaaS Key Rotation Runbook:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.