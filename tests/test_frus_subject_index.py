import json
from pathlib import Path

from build_frus_subject_index import build


ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "assets" / "frus-subjects-index.js"


def _load_index(path: Path) -> dict:
    source = path.read_text(encoding="utf-8")
    prefix = "window.FRUS_SUBJECTS_INDEX="
    assert prefix in source
    return json.loads(source.split(prefix, 1)[1].strip().removesuffix(";"))


def test_builder_joins_subject_mappings_to_toc_context(tmp_path):
    subjects_root = tmp_path / "subjects"
    toc_root = tmp_path / "frus" / "frus-toc"
    (subjects_root / "data").mkdir(parents=True)
    toc_root.mkdir(parents=True)
    mapping = {
        "generated": "2026-06-16",
        "subjects": {
            "recBRpk2PnA6tnVFg": {"frus1941v06": "d1, d2"},
            "recXXD3sj2iBEhNCv": {"frus1941v06": "d2, d3"},
            "rec7ioEdqM9tjA4Dt": {"frus1941v06": "d4"},
            "recrwQjqdJQ2sXaLO": {"frus1941v06": "d5"},
        },
    }
    (subjects_root / "data" / "document_subjects.json").write_text(json.dumps(mapping), encoding="utf-8")
    (toc_root / "frus1941v06-toc.xml").write_text(
        """<?xml version="1.0" encoding="UTF-8"?>
<div><a href="/historicaldocuments/frus1941v06/ch1"
data-template-current-ids="d1 d2 d3 d4 d5 ch1">Strategic resources
<span>(Documents 1-5)</span></a></div>""",
        encoding="utf-8",
    )
    output = tmp_path / "index.js"
    summary = build(subjects_root, toc_root, output)
    payload = _load_index(output)

    assert summary["documents"] == 5
    assert summary["coreDocuments"] == 3
    assert payload["records"][0] == ["frus1941v06", "d1", 1941, 1941, 1, "Strategic resources"]
    assert next(row for row in payload["records"] if row[1] == "d2")[4] == 3


def test_shipped_frus_index_is_complete_and_metadata_only():
    payload = _load_index(INDEX)
    meta = payload["meta"]
    records = payload["records"]

    assert meta["documents"] == 16811
    assert meta["coreDocuments"] == 16796
    assert meta["volumes"] == 545
    assert len(records) == 16811
    assert sum(1 for row in records if row[4] & 3) == 16796
    assert all(len(row) == 6 and row[0].startswith("frus") and row[1].startswith("d") for row in records)
    assert all(row[5].strip() for row in records)
    assert {subject["name"] for subject in payload["subjects"]} == {
        "Minerals and metals", "Natural resources", "Bauxite", "Sea bed mining"
    }
    assert "body" not in payload and "full_text" not in payload


def test_portal_loads_and_filters_the_frus_authority_index():
    html = (ROOT / "records-stage.html").read_text(encoding="utf-8")
    javascript = (ROOT / "assets" / "portal.js").read_text(encoding="utf-8")

    assert '<script src="assets/frus-subjects-index.js"></script>' in html
    assert 'id="frusSubject"' in html
    assert 'id="frusFromYear"' in html
    assert 'id="frusToYear"' in html
    assert "filteredFrus" in javascript
    assert 'query: "frus_q"' in javascript
    assert "restoreHashPosition" in javascript
