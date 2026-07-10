import json
from pathlib import Path

import build_cache
import cache_format
from crosswalks import load_yaml_crosswalk
from event_contract import validate_event
from parsers.critical_minerals_json_parser import parse_corpus
from scorer import score_event


ROOT = Path(__file__).resolve().parent.parent
SAMPLE = ROOT / "examples" / "critical_minerals_sample"


def test_parser_emits_valid_required_fields():
    events = list(parse_corpus(SAMPLE))
    assert len(events) >= 12
    assert all(validate_event(event) == [] for event in events)
    assert all("extra" in event for event in events)
    assert all("source_type" in event["extra"] for event in events)


def test_dates_normalize_correctly():
    events = list(parse_corpus(SAMPLE))
    ministerial = next(e for e in events if e["extra"]["record_id"] == "state-2026-critical-minerals-ministerial")
    assert ministerial["year"] == 2026
    assert ministerial["month"] == "02"
    assert ministerial["day"] == "04"


def test_scoring_returns_integer():
    event = next(iter(parse_corpus(SAMPLE)))
    score = score_event(event)
    assert isinstance(score, int)
    assert score >= 0


def test_extra_fields_survive_compact_cache(tmp_path):
    json_out = tmp_path / "events_cache.json"
    js_out = tmp_path / "events_cache.js"
    build_cache.build(SAMPLE, json_out, js_out)
    by_day = json.loads(json_out.read_text(encoding="utf-8"))
    compact = build_cache.build_compact(by_day)
    events = [event for day_events in compact.values() for event in day_events]
    assert any("mi" in event for event in events)
    assert any("cty" in event for event in events)
    assert any("st" in event for event in events)
    assert any("et" in event for event in events)
    assert any("ch" in event for event in events)
    assert any("fu" in event for event in events)
    assert any("ag" in event for event in events)
    assert any("cf" in event for event in events)
    assert cache_format.COMPACT_EXTRA_FIELDS["minerals"] == "mi"


def test_sample_data_builds_into_events_cache_json(tmp_path):
    json_out = tmp_path / "events_cache.json"
    js_out = tmp_path / "events_cache.js"
    summary = build_cache.build(SAMPLE, json_out, js_out)
    assert summary["raw_events"] >= 12
    assert summary["invalid_dropped"] == 0
    assert json_out.exists()
    assert js_out.exists()
    by_day = json.loads(json_out.read_text(encoding="utf-8"))
    assert "02-04" in by_day


def test_mineral_to_hs_crosswalk_loads_correctly():
    crosswalk = load_yaml_crosswalk("mineral_to_hs_codes")
    nickel = crosswalk["nickel"]
    codes = {row["code"]: row for row in nickel["hs_codes"]}
    assert "nickel matte" in nickel["aliases"]
    assert codes["260400"]["confidence"] == "high"
    assert codes["750210"]["caveat"].startswith("Refined product")


def test_verified_historical_seed_records_are_present():
    events = list(parse_corpus(SAMPLE))
    record_ids = {event["extra"]["record_id"] for event in events}
    assert "frus-1947-v1-d395-strategic-materials" in record_ids
    assert "frus-1950-v1-d95-stockpile-program" in record_ids
    assert "frus-1952-54-v11p1-d27-tropical-africa" in record_ids
    assert "frus-1964-68-v9-d344-stockpile-objectives" in record_ids


def test_landau_command_center_records_are_present_and_tiered():
    events = list(parse_corpus(SAMPLE))
    by_id = {event["extra"]["record_id"]: event for event in events}
    assert "white-house-2026-processed-critical-minerals-proclamation" in by_id
    assert "state-2026-landau-africa-travel" in by_id
    assert "dfc-2026-uzbekistan-joint-investment-framework" in by_id
    assert "white-house-2026-critical-minerals-workforce" in by_id
    report = by_id["landau-critical-minerals-2026-analytical-report"]
    assert report["extra"]["source_type"] == "Analytical Report"
    assert report["extra"]["evidence_type"] == "analytical_synthesis"
    assert "mixed source tiers" in report["extra"]["caveat"]


def test_portal_shell_has_historical_research_sections_and_no_operational_ui():
    html = (ROOT / "records-stage.html").read_text(encoding="utf-8")
    assert "Strategic Resources Diplomacy" in html
    assert "How the United States used diplomacy to secure access to strategic resources" in html
    assert "Recurring diplomatic problems" in html
    assert "FRUS Pathways" in html
    assert "Strategic-resource diplomacy across time" in html
    assert "Full FRUS strategic-resources index" in html
    assert "Evidence Explorer" in html
    assert "How to read FRUS and this portal" in html
    assert 'id="navToggle"' in html
    assert 'aria-expanded="false"' in html
    assert "2025-2026 Command Center" not in html
    assert "Implementation workstreams" not in html
    assert "Diplomatic operating tempo" not in html
    assert "Anthropic API Key" not in html
    assert "Clearance Status" not in html
    assert "Export Notes as Word" not in html
    assert "Analytical Notes" not in html
    assert "Historical question" not in html
    assert "historical questions" not in html.lower()


def test_portal_data_covers_full_historical_frame():
    source = (ROOT / "data" / "portal-data.js").read_text(encoding="utf-8")
    assert 'id: "civil-war"' in source
    assert "start: 1861" in source
    assert 'id: "ministerial-era"' in source
    assert "end: 2026" in source
    assert source.count("symbol:") >= 13
    assert source.count("focus:") >= 16
    assert "diplomaticProblems" in source
    assert "frusPathways" in source
    assert "frusAnnotations" in source
    assert "presentContext" in source
    assert "historicalQuestion" not in source
    assert "priorities:" in source
    assert source.count('status: "verified"') >= 9
    assert source.count('status: "research"') >= 12


def test_curated_frus_annotations_only_reference_verified_seed_records():
    source = (ROOT / "data" / "portal-data.js").read_text(encoding="utf-8")
    expected = {
        "frus-1947-v1-d395-strategic-materials",
        "frus-1950-v1-d95-stockpile-program",
        "frus-1952-54-v11p1-d27-tropical-africa",
        "frus-1964-68-v9-d344-stockpile-objectives",
    }
    annotation_block = source.split("frusAnnotations:", 1)[1].split("presentContext:", 1)[0]
    for record_id in expected:
        assert f'"{record_id}"' in annotation_block
    assert "frus-1981-88-v41-d116-example" not in annotation_block
    assert "frus-1969-76-ve01-d430-example" not in annotation_block
    assert "policyProblem" in annotation_block
    assert "criticalDifference" in source


def test_guided_search_and_mobile_navigation_contracts_are_present():
    javascript = (ROOT / "assets" / "portal.js").read_text(encoding="utf-8")
    css = (ROOT / "assets" / "portal.css").read_text(encoding="utf-8")
    assert "function openLens" in javascript
    assert "function openFrusQuery" in javascript
    assert "function setNavOpen" in javascript
    assert 'searchState.query = query.trim()' in javascript
    assert 'frusState.query = searchState.query' not in javascript
    assert '.primary-nav.open' in css
    assert ".nav-toggle" in css
    assert "Evidence coverage only" in javascript


def test_landau_report_is_preserved_outside_browser_cache():
    report = ROOT / "research" / "Landau-Critical-Minerals-2026.md"
    text = report.read_text(encoding="utf-8")
    assert text.startswith("# Deputy Secretary Landau and the Critical Minerals Imperative")
    assert "## Executive Summary" in text
    assert "## References" in text
    assert len(text.splitlines()) == 191
    html = (ROOT / "records-stage.html").read_text(encoding="utf-8")
    assert "The critical tension identified by multiple analysts" not in html
