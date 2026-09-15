#!/bin/bash
# Launchd wrapper for the daily help auto-close job. Loads the SAME env the API
# runs with (DB + SMTP live in the API launchd plist, not repo .env), then runs
# the module. Extra args pass through (e.g. --dry-run, --silent).
cd /Users/ernie/Fattail-Labs/server || exit 1
eval "$(/usr/bin/python3 -c 'import plistlib,shlex,os
d=plistlib.load(open(os.path.expanduser("~/Library/LaunchAgents/ai.fattail.labs.api.plist"),"rb"))
for k,v in d.get("EnvironmentVariables",{}).items(): print("export "+k+"="+shlex.quote(str(v)))')"
exec .venv/bin/python -m help_autoclose "$@"
