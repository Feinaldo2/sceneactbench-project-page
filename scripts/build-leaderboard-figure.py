#!/usr/bin/env python3
"""Reuse the paper reproduction bundle to publish the leaderboard SVG."""

from __future__ import annotations

import argparse
import importlib
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--paper-root", type=Path, required=True)
    parser.add_argument(
        "--output",
        type=Path,
        default=(
            Path(__file__).resolve().parents[1]
            / "public"
            / "assets"
            / "analysis"
            / "leaderboard.svg"
        ),
    )
    args = parser.parse_args()

    figures_root = (
        args.paper_root.resolve() / "paper_figure_repro_bundle" / "figures"
    )
    if not (figures_root / "gen_ranking.py").is_file():
        raise FileNotFoundError(figures_root / "gen_ranking.py")

    sys.path.insert(0, str(figures_root))
    ranking = importlib.import_module("gen_ranking")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    ranking.OUT = args.output.resolve()
    # The paper generator normally mirrors its PDF into the manuscript. The
    # website sync must remain read-only with respect to the paper repository.
    ranking.shutil.copy2 = lambda _source, _destination: None
    ranking.main()


if __name__ == "__main__":
    main()
