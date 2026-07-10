"""Build the static FRUS minerals and natural-resources discovery index.

The source authority supplies document-to-subject mappings. HistoryAtState's
lightweight table-of-contents files supply volume context for each document.
The output intentionally contains no document body text.

Example:
    python build_frus_subject_index.py \
        --subjects-root ../frus-subjects \
        --toc-root ../frus/frus-toc
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path


HERE = Path(__file__).resolve().parent
DEFAULT_OUTPUT = HERE / "assets" / "frus-subjects-index.js"

# The two broad authorities are the corpus boundary. Bauxite and Sea bed
# mining preserve narrower, directly relevant authority assignments, including
# a small number of records outside the broad-authority union.
SUBJECTS = (
    ("recBRpk2PnA6tnVFg", "Minerals and metals", 1),
    ("recXXD3sj2iBEhNCv", "Natural resources", 2),
    ("rec7ioEdqM9tjA4Dt", "Bauxite", 4),
    ("recrwQjqdJQ2sXaLO", "Sea bed mining", 8),
)


def _git_commit(path: Path) -> str:
    try:
        return subprocess.run(
            ["git", "-C", str(path), "rev-parse", "HEAD"],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def _volume_span(volume_id: str) -> tuple[int, int]:
    match = re.match(r"frus(\d{4})(?:-(\d{2}|\d{4}))?", volume_id)
    if not match:
        return (0, 0)
    start = int(match.group(1))
    raw_end = match.group(2)
    if not raw_end:
        return (start, start)
    if len(raw_end) == 4:
        return (start, int(raw_end))
    end = (start // 100) * 100 + int(raw_end)
    if end < start:
        end += 100
    return (start, end)


def _natural_key(value: str) -> tuple:
    return tuple(int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", value))


def _document_ids(value: str) -> list[str]:
    return [item for item in re.split(r"\s*,\s*", value.strip()) if item]


def _toc_contexts(toc_file: Path) -> dict[str, str]:
    """Return document id -> most specific official TOC heading."""
    candidates: dict[str, tuple[tuple[int, int, int], str]] = {}
    root = ET.parse(toc_file).getroot()
    for anchor in root.iter("a"):
        current_ids = anchor.attrib.get("data-template-current-ids", "").split()
        document_ids = [item for item in current_ids if item.startswith("d")]
        if not document_ids:
            continue
        label = " ".join(" ".join(anchor.itertext()).split())
        label = re.sub(r"\s*\(Documents?\s+[^)]*\)\s*$", "", label, flags=re.I)
        href = anchor.attrib.get("href", "")
        rank = (len(document_ids), 1 if "/comp" in href else 0, -len(label))
        for document_id in document_ids:
            previous = candidates.get(document_id)
            if previous is None or rank < previous[0]:
                candidates[document_id] = (rank, label)
    return {document_id: value[1] for document_id, value in candidates.items()}


def build(subjects_root: Path, toc_root: Path, output: Path) -> dict:
    mapping_path = subjects_root / "data" / "document_subjects.json"
    source = json.loads(mapping_path.read_text(encoding="utf-8"))
    mappings = source.get("subjects", {})

    masks: dict[tuple[str, str], int] = {}
    subject_metadata = []
    for subject_ref, name, bit in SUBJECTS:
        volume_docs = mappings.get(subject_ref)
        if not isinstance(volume_docs, dict):
            raise ValueError(f"Missing subject authority {subject_ref} ({name})")
        reference_count = 0
        for volume_id, raw_document_ids in volume_docs.items():
            document_ids = _document_ids(raw_document_ids)
            reference_count += len(document_ids)
            for document_id in document_ids:
                key = (volume_id, document_id)
                masks[key] = masks.get(key, 0) | bit
        subject_metadata.append(
            {
                "ref": subject_ref,
                "name": name,
                "bit": bit,
                "references": reference_count,
                "volumes": len(volume_docs),
            }
        )

    records = []
    missing_context = []
    for volume_id in sorted({volume for volume, _ in masks}, key=_natural_key):
        toc_file = toc_root / f"{volume_id}-toc.xml"
        if not toc_file.exists():
            raise FileNotFoundError(f"Missing HistoryAtState TOC: {toc_file}")
        contexts = _toc_contexts(toc_file)
        start, end = _volume_span(volume_id)
        volume_records = sorted(
            ((document_id, mask) for (volume, document_id), mask in masks.items() if volume == volume_id),
            key=lambda item: _natural_key(item[0]),
        )
        for document_id, mask in volume_records:
            context = contexts.get(document_id, "")
            if not context:
                missing_context.append(f"{volume_id}/{document_id}")
            records.append([volume_id, document_id, start, end, mask, context])

    if missing_context:
        sample = ", ".join(missing_context[:5])
        raise ValueError(f"Missing TOC context for {len(missing_context)} records: {sample}")

    records.sort(key=lambda item: (item[2], _natural_key(item[0]), _natural_key(item[1])))
    core_count = sum(1 for record in records if record[4] & 3)
    volume_count = len({record[0] for record in records})
    years = [record[2] for record in records if record[2]] + [record[3] for record in records if record[3]]
    payload = {
        "meta": {
            "schemaVersion": 1,
            "generated": source.get("generated", ""),
            "documents": len(records),
            "coreDocuments": core_count,
            "volumes": volume_count,
            "yearStart": min(years) if years else 0,
            "yearEnd": max(years) if years else 0,
            "subjectsCommit": _git_commit(subjects_root),
            "tocCommit": _git_commit(toc_root.parent),
            "subjectsSource": "https://github.com/therealjameswilson/frus-subjects",
            "tocSource": "https://github.com/HistoryAtState/frus/tree/master/frus-toc",
            "documentBase": "https://history.state.gov/historicaldocuments/",
            "caveat": (
                "Subject authority assignments are discovery signals, not proof that a document is "
                "centrally about a mineral. Open and review the FRUS document before citing it."
            ),
        },
        "subjects": subject_metadata,
        "records": records,
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    serialized = serialized.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    output.write_text(
        "// Auto-generated by build_frus_subject_index.py. Metadata only; no document body text.\n"
        f"window.FRUS_SUBJECTS_INDEX={serialized};\n",
        encoding="utf-8",
    )
    return payload["meta"]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--subjects-root", type=Path, required=True)
    parser.add_argument("--toc-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    summary = build(args.subjects_root, args.toc_root, args.output)
    for key, value in summary.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
