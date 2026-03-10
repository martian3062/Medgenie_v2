import re
from typing import Any, Dict, List

REGION_KEYWORDS = {
    "head": ["brain", "head", "skull", "sinus", "eye", "optic", "ear", "thyroid", "cervical", "neck"],
    "chest": ["lung", "lungs", "pulmonary", "pleura", "heart", "cardiac", "chest", "mediastinum", "breast", "coronary"],
    "abdomen": ["liver", "hepatic", "gallbladder", "pancreas", "spleen", "kidney", "renal", "stomach", "bowel", "intestine", "colon", "appendix", "abdomen"],
    "pelvis": ["pelvis", "pelvic", "bladder", "prostate", "uterus", "ovary", "cervix", "rectum"],
    "arms": ["arm", "arms", "shoulder", "clavicle", "humerus", "elbow", "wrist", "hand"],
    "legs": ["leg", "legs", "hip", "femur", "knee", "ankle", "foot", "feet", "tibia", "fibula"],
}

LAB_MAP = {
    "hb": ("CBC", "Hemoglobin", "g/dL", 12.0, 17.5),
    "hemoglobin": ("CBC", "Hemoglobin", "g/dL", 12.0, 17.5),
    "haemoglobin": ("CBC", "Hemoglobin", "g/dL", 12.0, 17.5),
    "wbc": ("CBC", "WBC", "/cumm", 4000, 11000),
    "tlc": ("CBC", "WBC", "/cumm", 4000, 11000),
    "platelet": ("CBC", "Platelets", "/cumm", 150000, 450000),
    "platelets": ("CBC", "Platelets", "/cumm", 150000, 450000),
    "rbc": ("CBC", "RBC", "M/uL", 4.0, 6.0),
    "glucose": ("KFT", "Glucose", "mg/dL", 70, 140),
    "blood sugar": ("KFT", "Glucose", "mg/dL", 70, 140),
    "creatinine": ("KFT", "Creatinine", "mg/dL", 0.6, 1.3),
    "urea": ("KFT", "Urea", "mg/dL", 15, 40),
    "blood urea": ("KFT", "Urea", "mg/dL", 15, 40),
    "sodium": ("KFT", "Sodium", "mmol/L", 135, 145),
    "potassium": ("KFT", "Potassium", "mmol/L", 3.5, 5.1),
    "bilirubin": ("LFT", "Bilirubin", "mg/dL", 0.2, 1.2),
    "total bilirubin": ("LFT", "Bilirubin", "mg/dL", 0.2, 1.2),
    "alt": ("LFT", "ALT/SGPT", "U/L", 7, 56),
    "sgpt": ("LFT", "ALT/SGPT", "U/L", 7, 56),
    "ast": ("LFT", "AST/SGOT", "U/L", 10, 40),
    "sgot": ("LFT", "AST/SGOT", "U/L", 10, 40),
    "alp": ("LFT", "ALP", "U/L", 44, 147),
    "protein": ("LFT", "Total Protein", "g/dL", 6.0, 8.3),
    "albumin": ("LFT", "Albumin", "g/dL", 3.4, 5.4),
}

GENERIC_PATTERNS = [
    re.compile(r"(?P<name>hemoglobin|haemoglobin|hb)\s*[:\-]?\s*(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>g/dl|gm/dl|g%)?", re.I),
    re.compile(r"(?P<name>wbc|tlc)\s*[:\-]?\s*(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>/cumm|cells/mm3|x10\^?3/?ul)?", re.I),
    re.compile(r"(?P<name>platelet(?:s)?)\s*[:\-]?\s*(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>lakh/cumm|/cumm|x10\^?5/?ul)?", re.I),
    re.compile(r"(?P<name>rbc)\s*[:\-]?\s*(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>million/cumm|m/ul|m/µl)?", re.I),
    re.compile(r"(?P<name>glucose|blood sugar|creatinine|urea|blood urea|sodium|potassium|bilirubin|total bilirubin|alt|sgpt|ast|sgot|alp|protein|albumin)\s*[:\-]?\s*(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>mg/dl|mmol/l|u/l|g/dl)?", re.I),
]

ABNORMAL_TERMS = [
    "high", "low", "elevated", "decreased", "abnormal", "positive", "mild", "moderate",
    "severe", "lesion", "mass", "nodule", "opacity", "infection", "fracture", "effusion",
    "stone", "fatty", "inflamed"
]


def _normalize(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def _classify(name: str, value: float) -> str:
    meta = LAB_MAP.get(_normalize(name))
    if not meta:
        return "unknown"
    _, _, _, low, high = meta
    if value < low:
        return "low"
    if value > high:
        return "high"
    return "normal"


def _special_value(name: str, value: float, unit: str) -> float:
    unit = _normalize(unit)
    if _normalize(name) in {"platelet", "platelets"} and unit == "lakh/cumm":
        return value * 100000
    return value


def parse_lab_tables(text: str) -> Dict[str, List[Dict[str, Any]]]:
    rows = []
    lines = [line.strip() for line in (text or "").splitlines() if line.strip()]

    for line in lines:
        m = re.match(
            r"^(?P<name>[A-Za-z /]+?)\s+[:\-]?\s*(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>[A-Za-z/%^0-9\.]+)?(?:\s+(?P<ref>\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?))?$",
            line
        )
        if m:
            name = _normalize(m.group("name"))
            if name in LAB_MAP:
                raw_value = float(m.group("value"))
                raw_unit = m.group("unit") or LAB_MAP[name][2]
                value = _special_value(name, raw_value, raw_unit)
                panel, display_name, ref_unit, ref_min, ref_max = LAB_MAP[name]
                rows.append({
                    "panel": panel,
                    "name": display_name,
                    "normalized_name": name,
                    "value": value,
                    "display_value": raw_value,
                    "unit": raw_unit,
                    "status": _classify(name, value),
                    "ref_min": ref_min,
                    "ref_max": ref_max,
                    "ref_unit": ref_unit,
                })

    seen = {(r["normalized_name"], r["display_value"]) for r in rows}

    for pattern in GENERIC_PATTERNS:
        for match in pattern.finditer(text or ""):
            name = _normalize(match.group("name"))
            raw_value = float(match.group("value"))
            raw_unit = match.groupdict().get("unit") or (LAB_MAP[name][2] if name in LAB_MAP else "")
            key = (name, raw_value)

            if name in LAB_MAP and key not in seen:
                seen.add(key)
                value = _special_value(name, raw_value, raw_unit)
                panel, display_name, ref_unit, ref_min, ref_max = LAB_MAP[name]
                rows.append({
                    "panel": panel,
                    "name": display_name,
                    "normalized_name": name,
                    "value": value,
                    "display_value": raw_value,
                    "unit": raw_unit,
                    "status": _classify(name, value),
                    "ref_min": ref_min,
                    "ref_max": ref_max,
                    "ref_unit": ref_unit,
                })

    panels = {"CBC": [], "LFT": [], "KFT": []}
    for row in rows:
        panels.setdefault(row["panel"], []).append(row)
    return panels


def score_regions(text: str) -> List[Dict[str, Any]]:
    lower = (text or "").lower()
    scored = []

    for region, words in REGION_KEYWORDS.items():
        hits, score = [], 0
        for word in words:
            count = lower.count(word)
            if count:
                hits.append(word)
                score += count
        if score:
            scored.append({
                "region": region,
                "score": score,
                "keywords": hits[:8],
                "severity": "high" if score >= 5 else "medium" if score >= 2 else "low",
            })

    return sorted(scored, key=lambda x: x["score"], reverse=True)


def extract_findings(text: str) -> List[Dict[str, Any]]:
    findings = []
    sentences = re.split(r"(?<=[.!?])\s+", (text or "").strip())

    for sentence in sentences:
        lower = sentence.lower()
        if any(term in lower for term in ABNORMAL_TERMS):
            related = []
            for region, words in REGION_KEYWORDS.items():
                if any(w in lower for w in words):
                    related.append(region)
            findings.append({
                "text": sentence.strip(),
                "regions": related or ["general"],
            })

    return findings[:16]


def marker_overlays(regions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    pos = {
        "head": [0, 1.8, 0.02],
        "chest": [0, 1.05, 0.15],
        "abdomen": [0, 0.55, 0.15],
        "pelvis": [0, 0.15, 0.12],
        "arms": [-0.7, 1.0, 0],
        "legs": [0.0, -0.9, 0.15],
    }

    overlays = []
    for item in regions:
        overlays.append({
            "region": item["region"],
            "position": pos.get(item["region"], [0, 0, 0]),
            "intensity": min(1.0, 0.25 + item["score"] / 6.0),
        })
    return overlays


def make_summary(text: str, labs_by_panel: Dict[str, List[Dict[str, Any]]], regions: List[Dict[str, Any]], findings: List[Dict[str, Any]]) -> str:
    pieces = []

    if regions:
        pieces.append(f"Most likely affected region: {regions[0]['region'].title()}.")

    abnormal = [x for panel in labs_by_panel.values() for x in panel if x["status"] in {"high", "low"}]
    if abnormal:
        names = ", ".join(x["name"] for x in abnormal[:4])
        pieces.append(f"Potential abnormal lab markers detected: {names}.")

    if findings:
        pieces.append(f"Report phrases with concern cues detected: {findings[0]['text'][:140]}")

    if not pieces:
        pieces.append("Basic report extraction completed. No strong abnormal cues were confidently detected from rule-based analysis.")

    return " ".join(pieces)


def analyze_report_text(text: str) -> Dict[str, Any]:
    text = text or ""

    labs_by_panel = parse_lab_tables(text)
    all_labs = [x for panel in labs_by_panel.values() for x in panel]
    abnormal = [x for x in all_labs if x["status"] in {"high", "low"}]
    regions = score_regions(text)
    findings = extract_findings(text)
    summary = make_summary(text, labs_by_panel, regions, findings)

    return {
        "summary": summary,
        "regions": regions,
        "primary_region": regions[0]["region"] if regions else None,
        "findings": findings,
        "lab_values": all_labs,
        "lab_panels": labs_by_panel,
        "abnormal_labs": abnormal,
        "risk_notes": [
            f"{x['name']} appears {x['status']} against a general reference range."
            for x in abnormal[:8]
        ],
        "recommendations": [
            "Review this report with a qualified doctor.",
            "Confirm extracted values against the original report formatting.",
            "Interpret symptoms, imaging, and labs together rather than in isolation.",
        ],
        "markers": marker_overlays(regions),
    }