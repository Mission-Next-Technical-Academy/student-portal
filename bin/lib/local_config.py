#!/usr/bin/env python3
"""Write the supabase-config.js that bin/dev.sh serves locally.

Starts from portal/supabase-config.js and writes a copy (never the original)
pointed at the requested target, plus a corner badge naming that target:

  staging     URL and key lines replaced with staging's; the result must not
              mention the production ref anywhere.
  production  URL and key lines kept as they are in the repo (the repo file
              is the production config); the URL must be production's.

Exits non-zero with a STOPPED message if the config's format has changed, so
a silent no-op swap can never serve production by accident.
"""

import argparse
import re
import sys

URL_LINE = re.compile(r"^const MNT_SUPABASE_URL = '[^']*';$", re.M)
KEY_LINE = re.compile(r"^const MNT_SUPABASE_ANON_KEY = '[^']*';$", re.M)

BADGES = {
    # target: (text, background colour). ASCII-only (· is the middle dot)
    # so the file's encoding can never garble it.
    'STAGING': ('STAGING (LOCAL) \\u00b7 synthetic data only', '#b45309'),
    'PRODUCTION': ('PRODUCTION (LOCAL) \\u00b7 real student data', '#b91c1c'),
}

BADGE_SCRIPT = """
/* Added by bin/dev.sh; not in the repo file. Names the Supabase project this
 * local portal is connected to. window.MNT_LOCAL_TARGET lets scripts and
 * agents check it too. */
window.MNT_LOCAL_TARGET = '%(target)s';
(function () {
  function addBadge() {
    if (document.getElementById('mnt-local-target-badge')) return;
    var el = document.createElement('div');
    el.id = 'mnt-local-target-badge';
    el.setAttribute('role', 'note');
    el.setAttribute('data-target', '%(target)s');
    el.textContent = '%(text)s';
    el.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;' +
      'pointer-events:none;padding:6px 10px;border-radius:6px;background:%(colour)s;' +
      'color:#fff;font:600 12px/1.2 system-ui,sans-serif;letter-spacing:.04em;' +
      'box-shadow:0 1px 4px rgba(0,0,0,.25)';
    document.body.appendChild(el);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addBadge);
  } else {
    addBadge();
  }
})();
"""


def stop(message):
    sys.exit('STOPPED: ' + message)


def build(source, target, production_ref, staging_url, staging_key):
    if len(URL_LINE.findall(source)) != 1 or len(KEY_LINE.findall(source)) != 1:
        stop('portal/supabase-config.js format changed: expected exactly one '
             'MNT_SUPABASE_URL line and one MNT_SUPABASE_ANON_KEY line.')

    if target == 'STAGING':
        text = URL_LINE.sub(lambda _: "const MNT_SUPABASE_URL = '%s';" % staging_url, source)
        text = KEY_LINE.sub(lambda _: "const MNT_SUPABASE_ANON_KEY = '%s';" % staging_key, text)
    else:
        production_url = "const MNT_SUPABASE_URL = 'https://%s.supabase.co';" % production_ref
        if URL_LINE.search(source).group(0) != production_url:
            stop('portal/supabase-config.js does not point at the production project.')
        text = source

    text_badge, colour = BADGES[target]
    text = text.rstrip('\n') + '\n' + BADGE_SCRIPT % {
        'target': target, 'text': text_badge, 'colour': colour}

    if target == 'STAGING':
        if production_ref in text:
            stop('the generated staging config still mentions production (%s).' % production_ref)
        if staging_url not in text:
            stop('the staging URL is missing from the generated config.')
    elif production_ref not in text:
        stop('the generated production config does not mention production.')
    return text


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--target', required=True, choices=sorted(BADGES))
    parser.add_argument('--source', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--production-ref', required=True)
    parser.add_argument('--staging-url', required=True)
    parser.add_argument('--staging-key', required=True)
    args = parser.parse_args()

    with open(args.source, encoding='utf-8') as f:
        source = f.read()
    text = build(source, args.target, args.production_ref, args.staging_url, args.staging_key)
    with open(args.out, 'w', encoding='utf-8') as f:
        f.write(text)


if __name__ == '__main__':
    main()
