# U.S. Critical Minerals Intelligence Portal

A static-first historical intelligence portal for understanding how the United
States has pursued secure access to critical minerals and supply chains from
1861 to the present.

The primary audience is Foreign Service Officers and policy staff, but the site
is also designed for historians, journalists, congressional staff, researchers,
and students. It combines a historical timeline, global evidence map, mineral
and country intelligence indexes, administration comparison, a FRUS-first
discovery layer, and a filterable official-source record explorer.

Live site:
[therealjameswilson.github.io/critical-minerals-records-stage](https://therealjameswilson.github.io/critical-minerals-records-stage/)

## Historical Operating Picture

The portal is organized around a question, not a commodity list: how did U.S.
officials understand and secure access to strategically important materials as
war, technology, alliances, markets, and supplier geography changed?

The historical frame begins in 1861 and moves through:

- Civil War and industrial mobilization
- Industrial expansion and overseas war
- World War I and interwar mineral planning
- World War II procurement and strategic materials
- Early Cold War stockpiling, recovery, and decolonization
- Cold War assumptions about accessible foreign sources
- Post-Cold War trade integration
- The China WTO era
- Modern critical-minerals strategy
- The 2025-2026 ministerial era

Verified records and research gaps are visually distinct. A missing record is
treated as an indexing priority, not evidence that a policy concern did not
exist.

## Provenance

This repository is a standalone adaptation of
[therealjameswilson/toolkit-template](https://github.com/therealjameswilson/toolkit-template),
which descends from the FRUS On This Day toolkit. It preserves the parser,
scorer, event contract, taxonomy enrichment, and compact-cache build pattern
while replacing the social-media workflow with a historical intelligence
interface.

## Trust Model

The project is metadata-only. Do not put full FRUS, NARA, report, cable, or
publication text into `events_cache.json`, `events_cache.js`, or the HTML.
Store only the fields needed for discovery and citation:

- date and title
- source and source type
- short description
- subjects, minerals, countries, agencies, and supply-chain stages
- stable source and citation URLs
- record identifiers
- confidence and caveats

FRUS, NARA, Census, USGS, State, DOE, DLA, Federal Register, and other official
U.S. Government sources are prioritized. Placeholder search records and HS-code
proxies are visibly marked for review.

## Portal Sections

- **2025-2026 Command Center:** current diplomacy connected to historical
  precedents. The State Department ministerial record, White House policy
  instruments, DFC investment framework, and Landau analytical report are
  indexed with distinct source tiers and claim-level caveats.
- **Interactive Historical Timeline:** era-based questions and verified source
  records from 1861 to the present.
- **Global Operating Picture:** country relationships, source mix, supply-chain
  stages, mineral filters, and year scrubbing.
- **Mineral Encyclopedia:** entry points for lithium, cobalt, copper, graphite,
  rare earths, nickel, manganese, gallium, germanium, antimony, tin, tungsten,
  and chromium.
- **Country Intelligence:** coverage and research priorities for major producer
  and partner countries.
- **Administration Explorer:** indexed-record coverage by administration.
- **FRUS Critical Minerals Index:** 16,811 metadata-only document links across
  545 volumes. It includes every document assigned to the Minerals and metals
  or Natural resources authorities, plus exact Bauxite and Sea bed mining
  assignments, with official volume context and direct HistoryAtState links.
- **Evidence Explorer:** filterable records with confidence, caveats, official
  links, NARA discovery, and shareable URLs.

## Data Model

Each parser-emitted event must include:

- `source`
- `year`
- `month`
- `day`
- `title`
- `url`

Recommended fields are `description`, `subjects`, and `date_display`.
Critical-minerals fields live under `event["extra"]`:

- `minerals: list[str]`
- `countries: list[str]`
- `agencies: list[str]`
- `source_type`
- `evidence_type`
- `supply_chain_stage`
- `fso_use_case`
- `hs_codes: list[str]`
- `record_id`
- `retrieved_at`
- `citation_url`
- `caveat`
- `confidence: high | medium | low`

The browser cache surfaces these fields through
`cache_format.COMPACT_EXTRA_FIELDS` without embedding document body text.

## Repository Structure

- `records-stage.html`: GitHub Pages entry point with embedded compact metadata
- `assets/portal.css`: responsive, accessible portal design
- `assets/portal.js`: search, deep links, map, timeline, indexes, and filters
- `assets/frus-subjects-index.js`: generated FRUS subject-authority discovery index
- `data/portal-data.js`: eras, minerals, countries, administrations, and source roles
- `research/Landau-Critical-Minerals-2026.md`: supplied analytical report,
  preserved outside the metadata cache
- `examples/critical_minerals_sample/`: metadata-only sample and verified seeds
- `parsers/critical_minerals_json_parser.py`: date and field normalization
- `connectors/`: network-free source connector interfaces
- `data/crosswalks/`: mineral, HS-code, country, source, agency, and stage mappings
- `taxonomy-critical-minerals.json`: controlled subject vocabulary

## Run Locally

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python build_cache.py --source-root examples/critical_minerals_sample
python -m http.server 8000
open http://localhost:8000/records-stage.html
```

`build_cache.py` writes the ignored build artifacts `events_cache.json` and
`events_cache.js`, then embeds their compact metadata into
`records-stage.html`. The page remains fully compatible with GitHub Pages and
requires no database or live API for the demonstration.

## Rebuild The FRUS Subject Index

The deployed FRUS index is generated from the subject mappings in
[`therealjameswilson/frus-subjects`](https://github.com/therealjameswilson/frus-subjects)
and the official lightweight TOC files in
[`HistoryAtState/frus`](https://github.com/HistoryAtState/frus). It contains
identifiers, volume spans, subject flags, and chapter context only. It does not
contain document body text. The subject-mapping repository is currently private;
an authorized checkout is required to rebuild the generated index.

```bash
python build_frus_subject_index.py \
  --subjects-root ../frus-subjects \
  --toc-root ../frus/frus-toc
```

See `docs/frus-subject-index.md` for the corpus boundary, interpretation
caveats, provenance fields, and sparse-checkout commands.

## Records Studio

The original browser setup wrapper remains available for parser, scorer,
taxonomy, branding, and cache-build configuration:

```bash
. .venv/bin/activate
streamlit run app.py
```

## Add A Source

1. Add or update a connector interface under `connectors/`.
2. Return metadata shaped like the sample JSON.
3. Include stable source URLs, citation URLs, record IDs, retrieval dates,
   confidence, and caveats.
4. Save the result as JSON/CSV or feed it through a parser.
5. Run `python build_cache.py --source-root <path>`.
6. Verify the embedded Stage locally before publication.

Connector stubs do not make live network calls and never contain API keys. See
`docs/critical-minerals-data-sources.md` for the intended role of each source.

## NARA API Keys

NARA discovery works without credentials by opening the public Catalog search.
For later API ingestion, never commit credentials. Local keys belong in
`.nara_key`, which is ignored by git; deployed integrations should use a
server-side secret or prebuilt metadata, never browser JavaScript.

## Add A Mineral Or Taxonomy Term

- Minerals and aliases: `data/crosswalks/mineral_aliases.yml`
- HS mappings: `data/crosswalks/mineral_to_hs_codes.yml`
- Countries: `data/crosswalks/country_iso.yml`
- Source tiers: `data/crosswalks/source_tiers.yml`
- Agencies: `data/crosswalks/agencies.yml`
- Supply-chain stages: `data/crosswalks/supply_chain_stages.yml`
- Portal index labels: `data/portal-data.js`
- Subject taxonomy: `taxonomy-critical-minerals.json`

HS mappings must retain their confidence and caveat because product codes do
not necessarily identify mined origin.

## Tests

```bash
. .venv/bin/activate
python -m pytest tests/ -v
```

Tests cover parser validity, normalized dates, compact extra fields, scoring,
sample cache builds, crosswalk loading, and portal data-contract checks.
