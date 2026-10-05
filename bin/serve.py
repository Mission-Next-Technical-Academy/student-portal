#!/usr/bin/env python3
"""Static file server for local development, with caching turned off.

`python -m http.server` sends Last-Modified and no Cache-Control, so browsers
apply heuristic caching: roughly 10% of the file's age. The simulator's oldest
and largest files (views.js, data.js) are exactly the ones that get cached for
hours, while a newly added file is always fetched fresh. That mix is what breaks
a session — new code navigating to a route the cached views.js never registered,
which surfaces as "No view registered for #/...".

No-store on every response keeps local development honest. Nothing here reaches
the deployed site; the Pages workflow copies portal/ and ui/ only.

--override URLPATH=FILE (repeatable) serves FILE in place of URLPATH; the query
string is ignored. bin/dev.sh uses it to swap in a generated
/supabase-config.js that points at staging while every other file is served
live from the repo. A request that resolves to the shadowed file by another
spelling (case, "./", "%73") gets the override too, so the repo copy behind it
is never served.
"""

import argparse
import os
import posixpath
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote, urlsplit


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, overrides=(), **kwargs):
        # (url path, shadowed file under --directory, replacement file)
        self.overrides = overrides
        super().__init__(*args, **kwargs)

    def translate_path(self, path):
        url_path = posixpath.normpath(unquote(urlsplit(path).path))
        real = super().translate_path(path)
        for override_path, shadowed, replacement in self.overrides:
            if url_path == override_path:
                return replacement
            try:
                if os.path.samefile(real, shadowed):
                    return replacement
            except OSError:
                pass
        return real

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    # One line per request is fine; the full common-log format is noise here.
    def log_message(self, fmt, *args):
        pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('port', type=int)
    parser.add_argument('--bind', default='127.0.0.1')
    parser.add_argument('--directory', required=True)
    parser.add_argument('--override', action='append', default=[], metavar='URLPATH=FILE',
                        help='serve FILE for requests to URLPATH (repeatable)')
    args = parser.parse_args()

    overrides = []
    for spec in args.override:
        url_path, sep, replacement = spec.partition('=')
        if not sep or not url_path.startswith('/') or not os.path.isfile(replacement):
            parser.error('--override needs /URLPATH=EXISTING_FILE, got %r' % spec)
        shadowed = os.path.join(args.directory, url_path.lstrip('/'))
        overrides.append((posixpath.normpath(url_path), shadowed, os.path.abspath(replacement)))

    handler = partial(NoCacheHandler, directory=args.directory, overrides=tuple(overrides))
    HTTPServer((args.bind, args.port), handler).serve_forever()


if __name__ == '__main__':
    main()
