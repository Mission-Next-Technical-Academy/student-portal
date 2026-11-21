# Vendored spell-check (admin Submission Sheet, S6)

Copied unmodified from npm registry tarballs (`npm pack --ignore-scripts`,
extracted in scratch directories, no package scripts run, no npm install).

| File | Source package | Version | Licence |
|---|---|---|---|
| `typo.js` | `typo-js` (Typo.js, Christopher Finke) | 1.4.0 | BSD-3-Clause (`LICENSE-typo-js.txt`; the tarball has no LICENSE file, text reconstructed from package.json/README) |
| `en_US.aff`, `en_US.dic` | `dictionary-en` (`index.aff`/`index.dic`, SCOWL-derived en_US Hunspell, 2020.12.07) | 4.0.0 | package declares `(MIT AND BSD)`; full SCOWL/Hunspell notice in `LICENSE-dictionary-en_US.txt` |

`en_US.dic` is byte-identical to the en_US dictionary bundled in typo-js 1.4.0.
Sizes: `typo.js` 47 KB, `en_US.aff` 3 KB, `en_US.dic` 552 KB.

Loaded lazily by `portal/admin-sheet-spelling.js`, only when an admin sheet
with narrative fields is on the page. Same-origin files only; student text is
never sent anywhere.
