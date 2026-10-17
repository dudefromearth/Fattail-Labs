# ⚠️ Live credential exposure on fattail.ai — found 2026-10-15

Found while reading the membership plugins for SPEC §18. **Unrelated to the native billing
project.** Worth acting on today.

## What is exposed

The **ActiveCampaign API key** is hardcoded in plugin source, and plugin source backups are
publicly readable. `.php.bak*` files are not executed by PHP, so the web server returns them
as **plain text** to anyone who requests them.

Verified over HTTPS — **10 URLs return HTTP 200, and 9 contain the key**:

| URL under `https://fattail.ai/wp-content/` | Bytes | Key |
|---|---|---|
| `plugins/membership-auto-upgrade/membership-auto-upgrade.php.bak.v1.3.0` | 33,300 | **yes** |
| `plugins/membership-auto-upgrade/…php.bak.preswitch` | 39,803 | **yes** |
| `plugins/membership-auto-upgrade/…php.bak.pre7864` | 39,028 | **yes** |
| `plugins/membership-auto-upgrade/…php.bak.presametier.20260927` | 39,793 | **yes** |
| `plugins/membership-auto-upgrade/…php.bak.preobshistory.20261001` | 44,177 | **yes** |
| `plugins/membership-auto-upgrade/…php.bak.prequarterly.20261002` | 49,057 | **yes** |
| `plugins/membership-auto-upgrade/…php.bak.quarterlytagname.20261005` | 50,589 | **yes** |
| `plugins/membership-auto-upgrade/…php.bak.predowngrade.202610061539` | 50,569 | **yes** |
| `mu-plugins/fotw-butterfly-lead.php.bak.preswitch` | 15,169 | **yes** |
| `themes/flatsome-child/functions.php.bak.preswitch` | 249,038 | no |

## Blast radius

An ActiveCampaign v3 `Api-Token` grants **full read/write** on contacts, lists, tags,
automations and campaigns. The account at `0dte.api-us1.com` is **shared between fattail.ai and
0-dte.com**, so the exposure covers both businesses: the whole contact database, and the ability
to send campaigns from either brand.

**Not exposed:** `wp-config.php` backups were probed under six common names and all correctly
return 403, so database credentials are not readable.

How long it has been exposed is unknown — the oldest of these files is dated **31 March 2026**.
There is no evidence of misuse either way; that would need an ActiveCampaign audit log review.

## Fix, in order

**1. Get the files out of the webroot** (fastest, stops the bleeding):
```bash
cd ~/domains/flyonthewall.ai/public_html/wp-content
mkdir -p ~/backups/plugin-source-$(date +%Y%m%d)
find plugins mu-plugins themes -name '*.bak*' -o -name '*.old' -o -name '*~' \
  | xargs -I{} mv {} ~/backups/plugin-source-$(date +%Y%m%d)/
```
Verify with `curl -o /dev/null -w '%{http_code}\n' <one of the URLs above>` → expect 404.

**2. Rotate the key in ActiveCampaign**, then update the two plugins that hold it:
`membership-auto-upgrade.php` and `fotw-butterfly-lead.php`. Rotation breaks tagging until both
are updated, so do them in the same change.

**3. Stop keeping the key in source.** Define it in `wp-config.php` and read it via a constant;
for Labs it belongs in the launchd plist with every other secret (SPEC §18.9).

**4. Check 0-dte.com** for the same pattern — same habit, same hosting account.

## The underlying habit

Keeping `.bak` copies beside live source has now caused two problems, not one. The Castaway
Discord system was silently dead for about three months because a removal hook appended to
`functions.php` was lost in a rewrite — the evidence for that sits in these very backup files.
Backups belong outside the webroot, and ideally the plugins belong in version control.
