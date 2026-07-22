#!/usr/bin/env python3
"""Build a scalable static companion to the animated Step Curve panel."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


SERIES = (
    ("doubao-stepcurve", "Doubao Seed 2.0 Pro", "#245FA8"),
    ("minimax-stepcurve", "MiniMax M3", "#5D6FC1"),
    ("qwen-stepcurve", "Qwen 3.7 Plus", "#2F86B6"),
    ("mimo-v2.5-stepcurve", "MiMo 2.5", "#67A6C8"),
    ("kimi-k2.6-stepcurve", "Kimi K2.6", "#7C61C5"),
    ("claude-sonnet-5-stepcurve", "Claude Sonnet 5", "#4D739D"),
)
TASKS = (
    ("task1_single", "Layout"),
    ("task3_camera", "Camera"),
    ("task4_anim", "Articulated"),
    ("task5_recon", "Reconstruction"),
    ("task6_anim", "Dynamic"),
)


def style_axis(
    axis: plt.Axes,
    title: str,
    *,
    overall: bool = False,
    show_x: bool = False,
    show_y: bool = False,
) -> None:
    axis.set_title(title, loc="left", pad=8, fontsize=11.5, fontweight="semibold")
    axis.set_xlim(10, 150)
    axis.set_ylim((20, 68) if overall else (0, 100))
    axis.set_xticks([10, 50, 100, 150])
    axis.set_yticks([20, 40, 60] if overall else [0, 50, 100])
    axis.grid(axis="y", color="#DDE6EF", linewidth=0.8)
    axis.set_axisbelow(True)
    axis.spines[["top", "right"]].set_visible(False)
    axis.spines[["left", "bottom"]].set_color("#9BAFC1")
    axis.tick_params(length=3, color="#9BAFC1", labelsize=9)
    axis.set_xlabel("Agent steps" if show_x else "", fontsize=10)
    axis.set_ylabel("Score" if show_y else "", fontsize=10)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument(
        "--output",
        type=Path,
        default=(
            Path(__file__).resolve().parents[1]
            / "public"
            / "assets"
            / "analysis"
            / "step-curves.svg"
        ),
    )
    args = parser.parse_args()

    source = json.loads(args.data.read_text())
    budgets = np.asarray(source["budgets"], dtype=float)
    models = source["models"]

    plt.rcParams.update(
        {
            "font.family": "sans-serif",
            "font.sans-serif": ["Arial", "Helvetica", "DejaVu Sans", "sans-serif"],
            "font.size": 10,
            "axes.labelcolor": "#263E57",
            "text.color": "#263E57",
            "xtick.color": "#526A80",
            "ytick.color": "#526A80",
            "svg.fonttype": "none",
            "pdf.fonttype": 42,
            "legend.frameon": False,
        }
    )

    figure = plt.figure(figsize=(10.6, 7.6), facecolor="white")
    grid = figure.add_gridspec(
        3,
        3,
        height_ratios=(1.35, 1, 1),
        left=0.075,
        right=0.985,
        top=0.94,
        bottom=0.085,
        hspace=0.48,
        wspace=0.30,
    )
    overall_axis = figure.add_subplot(grid[0, :])
    task_axes = [
        figure.add_subplot(grid[1, 0]),
        figure.add_subplot(grid[1, 1]),
        figure.add_subplot(grid[1, 2]),
        figure.add_subplot(grid[2, 0]),
        figure.add_subplot(grid[2, 1]),
    ]
    legend_axis = figure.add_subplot(grid[2, 2])

    for model, label, color in SERIES:
        overall_axis.plot(
            budgets,
            models[model]["overall"],
            color=color,
            linewidth=2.4,
            marker="o",
            markersize=4.2,
            label=label,
        )
    style_axis(overall_axis, "Overall score under a shared step budget", overall=True, show_y=True)

    for (task, title), axis in zip(TASKS, task_axes):
        for model, _, color in SERIES:
            axis.plot(
                budgets,
                models[model][task],
                color=color,
                linewidth=1.55,
                alpha=0.96,
            )
        style_axis(
            axis,
            title,
            show_x=axis in task_axes[-2:],
            show_y=axis in {task_axes[0], task_axes[3]},
        )

    handles, labels = overall_axis.get_legend_handles_labels()
    legend_axis.legend(
        handles,
        labels,
        loc="center left",
        fontsize=10,
        handlelength=2.4,
        labelspacing=1.0,
    )
    legend_axis.axis("off")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(args.output, bbox_inches="tight", pad_inches=0.04)
    plt.close(figure)
    print(f"Published {args.output}")


if __name__ == "__main__":
    main()
