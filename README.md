# LOWCUT// Records — local SEO preview and portal catalogue synchronization

Nothing has been pushed or deployed. The original home layout, language selector,
Formspree form, audio previews and external streaming links are retained.

## Build

Requires Node.js 22 and `npm ci`; no private credentials. Sharp converts local
PNG/JPEG artwork to WebP automatically before npm build/build:fresh. Rendered images
use the generated variant map even when existing Firebase records still name PNGs.
Originals are retained for compatibility. Photographic/poster artwork uses quality 90;
logos use lossless compression. Dimensions and non-opaque transparency are checked.
The browser favicon/touch icon stays PNG for compatibility.

- `npm run build`: generate using the last saved **public, visible** catalogue snapshot.
- `npm run build:fresh`: read only `publicReleases` and visible `publicArtists`, with
  pagination. Regenerate the home, individual pages and sitemap. Request errors stop
  the build without falling back to stale caches. Empty collections are valid: hiding
  all entries must remove them. No Firebase rules are changed by the build.
- `npm run check`: validate generated HTML, metadata, sitemap, links and local assets.
- `npm run preview`: preview at http://127.0.0.1:4173/LOWCUT-Records/.
- `npm test`: catalogue validation and integration tests, entirely offline.
- `npm run package`: produce a public-only `_site/` artifact. Never deploy the whole repo.

Edit the home in `src/home.html`, then run the build. Root `index.html` and the
artist/release directories are generated. The existing unused `script.js` remains
untouched. Never re-enable its older translation/form logic alongside the home script.

## Current scope

The build creates the home, all visible roster pages, all visible release pages,
unique titles and descriptions, production canonical URLs, social metadata and an
automatic sitemap. URLs use persisted `slug` or stable document IDs, with compatibility
slugs for the four existing releases. Changing the title/name does not change its URL.
Public artist IDs connect the discography; aliases handle older name-only releases.
Only pages listed in the generated manifest may be removed by a later build when
the corresponding release is hidden/deleted. Asset files are never removed.

`_config.yml` excludes authoring sources from GitHub Pages branch/Jekyll builds.
If a later deployment uses direct artifact upload instead, upload only generated
public pages, assets, styles, browser scripts and sitemap; do not upload `src`,
`scripts` or `data` as public content.

Artist biographies now come from `data/artists.json` offline, or `publicArtists` in a
fresh build. Initial biographies were copied from the existing home, in both languages.
New artists require no HTML edit. The home language selector uses those public bios.
Discography/collaborations use only
the visible public catalogue. Lack is credited on Menta but no biography/artist profile
is invented. Dragho currently has no visible releases; hidden releases remain excluded.
Missing recording genres, credits and descriptions are not fabricated.

## Before an eventual publication

Run `npm run build:fresh` and `npm run check`. Review locally, including mobile,
audio and navigation. Obtain approval before pushing or publishing. The current
GitHub Pages publication configuration has not been changed. The prepared workflow
`.github/workflows/catalogue.yml` has two independent activation gates:
`ENABLE_CATALOGUE_SYNC=true` permits scheduled builds (roughly every 30 minutes),
and `ENABLE_SITE_PUBLISH=true` permits deployment. Neither has been set. Manual
dispatch defaults to a review artifact, with publication unchecked. GitHub schedules
can be delayed. Changed artifacts are compared against the published fingerprint;
unchanged catalogues/assets do not trigger deployments. No GitHub token goes into
the browser and no Firebase backend/billing upgrade is required by this design.

Current live Firebase returns 403 for publicArtists. Before activation, merge and
review the proposed rules fragment from the portal repository with the current
production rules, import the four existing public profiles via the admin editor,
and confirm existing publicReleases rules accept the added public fields (slug,
artistIds, description, genre, credits). Select GitHub Actions as the Pages source,
review an artifact, then explicitly authorize the two activation variables.
Never enable deployment before the initial artist import succeeds. The proposed
artist rules passed 12 isolated Firestore emulator assertions; the unknown existing
production rules still need to be reviewed when merging the fragment.

`robots.txt` is intentionally not created in the project subdirectory. Canonicals
and sitemap use https://lowcutrecords.github.io/LOWCUT-Records/. The local preview
server sends an HTTP `noindex` header only for the local preview; production files
have no `noindex` instruction.

Still outside this block: independent ES/EN routes and hreflang, image compression,
structured data, privacy policy, analytics and Search Console. Form HTML is preserved;
no real submission has been sent. No Lighthouse improvement is claimed.
