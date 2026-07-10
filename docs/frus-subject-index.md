# FRUS Minerals and Natural Resources Index

The portal ships a metadata-only discovery index built from two source layers:

1. [`therealjameswilson/frus-subjects`](https://github.com/therealjameswilson/frus-subjects) supplies the Office of the Historian subject-authority mappings from subjects to FRUS volume and document identifiers.
2. [`HistoryAtState/frus`](https://github.com/HistoryAtState/frus) supplies the official lightweight table-of-contents files used to attach the most specific available volume or chapter context to each document identifier.

The deployed artifact is `assets/frus-subjects-index.js`. It contains 16,811
unique document links across 545 volumes:

- every one of the 16,796 unique documents assigned to **Minerals and metals** or **Natural resources**;
- all exact **Bauxite** and **Sea bed mining** assignments, including 15 relevant records outside the two-authority union.

## Interpretation

A subject assignment is a discovery signal. It does not establish that a
document is centrally about a mineral, endorse a modern commodity label, or
replace document-level review. Table-of-contents headings are displayed as
volume context, not as document titles. Volume year spans are navigation aids,
not exact document dates.

The portal uses exact titles and summaries only for the small number of seed
records independently verified against official FRUS metadata. Every result
links directly to the document on HistoryAtState for review and citation.

## Metadata-Only Constraint

The static index stores only:

- FRUS volume identifier;
- document identifier;
- volume year span;
- subject-authority bit mask;
- official table-of-contents context.

It does not store document body text, footnotes, source notes, or page images.

## Rebuild

Use an authorized local checkout of the source mapping repository and a sparse
checkout of the public HistoryAtState repository. The source mapping repository
is private at the time of this build, so GitHub authentication is required:

```bash
git clone https://github.com/therealjameswilson/frus-subjects.git ../frus-subjects
git clone --depth 1 --filter=blob:none --sparse https://github.com/HistoryAtState/frus.git ../frus
git -C ../frus sparse-checkout set frus-toc

python build_frus_subject_index.py \
  --subjects-root ../frus-subjects \
  --toc-root ../frus/frus-toc
```

The generator fails if an authority is missing, a required TOC file is absent,
or any indexed document lacks a context heading. The generated artifact records
the source mapping date and both repository commits for provenance.
