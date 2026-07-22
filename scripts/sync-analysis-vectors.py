#!/usr/bin/env python3
"""Publish the paper's Python-generated analysis SVGs for the website."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


ANALYSIS_SVGS = {
    "top3_analysis.svg": "ranking-decomposition.svg",
    "input_conditions.svg": "input-sensitivity.svg",
    "failure_stages.svg": "failure-stages.svg",
    "effective_budget.svg": "effective-budget.svg",
    "agent_traces.svg": "agent-traces.svg",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--paper-root", type=Path, required=True)
    parser.add_argument(
        "--site-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
    )
    args = parser.parse_args()

    source_root = args.paper_root.resolve() / "figures"
    destination_root = (
        args.site_root.resolve() / "public" / "assets" / "analysis"
    )
    destination_root.mkdir(parents=True, exist_ok=True)

    for source_name, destination_name in ANALYSIS_SVGS.items():
        source = source_root / source_name
        if not source.is_file():
            raise FileNotFoundError(source)
        destination = destination_root / destination_name
        shutil.copy2(source, destination)
        print(f"Published {destination_name}")


if __name__ == "__main__":
    main()
