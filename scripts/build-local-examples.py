#!/usr/bin/env python3
"""Build the curated SceneActBench website explorer from local read-only runs."""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


MODELS = [
    ("doubao-seed-2-pro-high", "doubao-seed-2.0-pro", "Doubao Seed 2.0 Pro High"),
    ("claude-opus-4-6-high", "claude-opus-4-6", "Claude Opus 4.6 High"),
    ("gpt-5-4-medium", "gpt-5.4", "GPT 5.4 Medium"),
    ("gpt-5-4-high", "gpt-5.4-high", "GPT 5.4 High"),
    ("qwen-3-7-plus-high", "qwen3.7-plus", "Qwen 3.7 Plus High"),
    ("gemini-3-1-pro-high", "gemini-3.1-pro", "Gemini 3.1 Pro High"),
    ("mimo-2-5-high", "mimo-v2.5-stepcurve", "MiMo 2.5 High"),
    ("kimi-k2-6-reason", "kimi-k2.6-stepcurve", "Kimi K2.6 Reason"),
    ("step-3-7-flash-high", "step-3.7-flash-high", "Step 3.7 Flash High"),
    ("claude-sonnet-5-high", "claude-sonnet-5-stepcurve", "Claude Sonnet 5 High"),
    ("minimax-m3-high", "minimax-m3", "MiniMax M3 High"),
]

CASES = {
    "layout": (
        "task1_single",
        "f877d2a1-678f-49a0-a90e-e99ff27134c7_DiningRoom-13034__task1_single",
        "DiningRoom-13034",
    ),
    "camera": (
        "task3_camera",
        "deaa4ac0-8d13-423f-930f-78fb25825e8d_Bedroom-5088__task3_camera",
        "Bedroom-5088",
    ),
    "articulated": (
        "task4_anim",
        "anim-acd_1a570da5ae0c4d1d51c94be81d7248f155a0dcef",
        "Kitchen cabinet ACD",
    ),
    "reconstruction": (
        "task5_recon",
        "e6534ac2-3e67-4cb1-8776-f1b5ae914105_SecondBedroom-5427__task5_recon",
        "SecondBedroom-5427",
    ),
    "dynamic": (
        "task6_anim",
        "t6anim-t6l1_castle_001",
        "Castle siege",
    ),
}

STATIC_SCENES = {
    "layout": (
        "f877d2a1-678f-49a0-a90e-e99ff27134c7_DiningRoom-13034",
        "DiningRoom-13034_full.glb",
    ),
    "camera": (
        "deaa4ac0-8d13-423f-930f-78fb25825e8d_Bedroom-5088",
        "Bedroom-5088_full.glb",
    ),
    "reconstruction": (
        "e6534ac2-3e67-4cb1-8776-f1b5ae914105_SecondBedroom-5427",
        "SecondBedroom-5427_full.glb",
    ),
}
ARTICULATED_SAMPLE = "acd_1a570da5ae0c4d1d51c94be81d7248f155a0dcef"
DYNAMIC_SAMPLE = "t6l1_castle_001"

LAYOUT_POSTERS = {
    "claude-opus-4-6": "t1_claude-opus-4-6.png",
    "doubao-seed-2.0-pro": "t1_doubao-seed-2.0-pro.png",
    "gemini-3.1-pro": "t1_gemini-3.1-pro.png",
    "gpt-5.4-high": "t1_gpt-5.4-high.png",
    "gpt-5.4": "t1_gpt-5.4.png",
    "minimax-m3": "t1_minimax-m3.png",
    "qwen3.7-plus": "t1_qwen3.7-plus.png",
}


def media(src: str, alt: str, poster: str | None = None) -> dict[str, str]:
    result = {"src": src, "alt": alt}
    if poster:
        result["poster"] = poster
    return result


def metric(
    metric_id: str,
    label: str,
    value: float | int | str,
    *,
    unit: str | None = None,
    direction: str = "lower",
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "id": metric_id,
        "label": label,
        "value": round(value, 4) if isinstance(value, float) else value,
        "direction": direction,
    }
    if unit:
        result["unit"] = unit
    return result


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def glb_has_animation(path: Path) -> bool:
    data = path.read_bytes()
    if len(data) < 20 or data[:4] != b"glTF":
        return False
    json_length = int.from_bytes(data[12:16], "little")
    document = json.loads(data[20 : 20 + json_length].decode("utf-8").rstrip("\x00 \t\r\n"))
    return any(
        animation.get("channels") and animation.get("samplers")
        for animation in document.get("animations", [])
    )


def copy_asset(source: Path, destination: Path) -> str:
    if not source.is_file():
        raise FileNotFoundError(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    return f"/{destination.relative_to(SITE_ROOT / 'public').as_posix()}"


def example_dir(example_id: str) -> Path:
    return SITE_ROOT / "public" / "assets" / "examples" / example_id


def copy_shared_references(
    qualitative: Path,
    runs: Path,
    static_root: Path,
    articulated_root: Path,
    dynamic_root: Path,
) -> tuple[dict[str, list[dict[str, str]]], dict[str, dict[str, Any]]]:
    root = SITE_ROOT / "public" / "assets" / "references"
    if root.exists():
        shutil.rmtree(root)

    references: dict[str, list[dict[str, str]]] = {}
    layout = copy_asset(qualitative / "t1_gt_0.png", root / "layout" / "reference.png")
    references["layout"] = [media(layout, "Reference view for DiningRoom-13034.")]

    first_camera = runs / MODELS[0][1] / CASES["camera"][0] / CASES["camera"][1]
    camera_name = f"{CASES['camera'][1]}__gt_view.png"
    camera = copy_asset(first_camera / camera_name, root / "camera" / "reference.png")
    references["camera"] = [media(camera, "Ground-truth camera view for Bedroom-5088.")]

    articulated = []
    for index in (0, 2, 4):
        src = copy_asset(
            qualitative / f"t4_gt_{index}.png",
            root / "articulated" / f"reference-{index}.png",
        )
        articulated.append(media(src, f"Articulated reference state {index + 1}."))
    references["articulated"] = articulated

    first_recon = runs / MODELS[0][1] / CASES["reconstruction"][0] / CASES["reconstruction"][1]
    reconstruction = []
    for index in (0, 2):
        src = copy_asset(
            first_recon / "views" / f"gt_v{index}.png",
            root / "reconstruction" / f"reference-{index}.png",
        )
        reconstruction.append(media(src, f"Calibrated reconstruction reference view {index + 1}."))
    references["reconstruction"] = reconstruction

    dynamic = []
    for filename, alt in (
        ("t6_gt_0.png", "Low-poly Dynamic reference frame."),
        ("t7_gt_0.png", "Photo-realistic Dynamic reference frame."),
    ):
        src = copy_asset(qualitative / filename, root / "dynamic" / filename)
        dynamic.append(media(src, alt))
    references["dynamic"] = dynamic

    artifacts: dict[str, dict[str, Any]] = {}
    for task in ("layout", "camera", "reconstruction"):
        scene_id, filename = STATIC_SCENES[task]
        gt_glb = copy_asset(
            static_root / "scenes" / scene_id / "scene" / filename,
            root / task / "gt-scene.glb",
        )
        artifacts[task] = {
            "referenceGlb": media(gt_glb, f"Interactive ground-truth {task} scene."),
            "referenceGlbAnimated": False,
            "referenceVideos": [],
        }

    articulated_case = articulated_root / ARTICULATED_SAMPLE
    articulated_glb = copy_asset(
        articulated_case / "gt" / "gt_0016.glb",
        root / "articulated" / "gt-open.glb",
    )
    articulated_video = copy_asset(
        articulated_case / "reference.mp4",
        root / "articulated" / "reference.mp4",
    )
    artifacts["articulated"] = {
        "referenceGlb": media(
            articulated_glb,
            "Interactive ground-truth fully open articulated state.",
            references["articulated"][1]["src"],
        ),
        "referenceGlbAnimated": False,
        "referenceVideos": [
            media(
                articulated_video,
                "Ground-truth open-close articulated reference video.",
                references["articulated"][0]["src"],
            )
        ],
    }

    dynamic_case = dynamic_root / DYNAMIC_SAMPLE
    dynamic_glb = copy_asset(
        dynamic_case / "gt" / "gt_scene.glb",
        root / "dynamic" / "gt-scene.glb",
    )
    low_video = copy_asset(
        dynamic_case / "reference.mp4",
        root / "dynamic" / "reference-lowpoly.mp4",
    )
    photo_video = copy_asset(
        dynamic_case / "vision.mp4",
        root / "dynamic" / "reference-photoreal.mp4",
    )
    artifacts["dynamic"] = {
        "referenceGlb": media(
            dynamic_glb,
            "Interactive animated ground-truth Dynamic scene.",
            references["dynamic"][0]["src"],
        ),
        "referenceGlbAnimated": True,
        "referenceVideos": [
            media(
                low_video,
                "Ground-truth low-poly Dynamic reference video.",
                references["dynamic"][0]["src"],
            ),
            media(
                photo_video,
                "Photo-realistic Dynamic reference video.",
                references["dynamic"][1]["src"],
            ),
        ],
    }
    return references, artifacts


def build_layout(
    model_id: str,
    run_slug: str,
    model_name: str,
    case_dir: Path,
    score: dict[str, Any],
    references: list[dict[str, str]],
    qualitative: Path,
) -> dict[str, Any]:
    identifier = f"layout-{model_id}"
    output_dir = example_dir(identifier)
    poster_url = None
    output_images: list[dict[str, str]] = []
    poster_name = LAYOUT_POSTERS.get(run_slug)
    if poster_name:
        poster_url = copy_asset(qualitative / poster_name, output_dir / "output.png")
        output_images.append(media(poster_url, f"{model_name} reconstruction of DiningRoom-13034."))
    glb = copy_asset(case_dir / "agent_scene.glb", output_dir / "scene.glb")
    size = (case_dir / "agent_scene.glb").stat().st_size
    notes = None
    if size < 100_000:
        notes = "The submitted GLB is valid but nearly empty; this failure is preserved."
    elif size < 5_000_000:
        notes = "The submitted GLB is substantially smaller than the full asset set and may be partial."
    return {
        "id": identifier,
        "task": "layout",
        "modelId": model_id,
        "title": f"{model_name} · DiningRoom-13034",
        "sourceInstance": "DiningRoom-13034 · single-view Layout",
        "metrics": [
            metric("ADD-S", "ADD-S", score["score"]["mean_add_s"], unit=" m"),
            metric("Chamfer", "Chamfer", score["score"]["chamfer"], unit=" m"),
            metric("Placement", "Placement accuracy", score["score"]["placement_acc"], direction="higher"),
        ],
        "referenceImages": references,
        "outputImages": output_images,
        "outputGlb": media(
            glb,
            f"Interactive {model_name} Layout GLB.",
            poster_url or references[0]["src"],
        ),
        **({"notes": notes} if notes else {}),
    }


def build_camera(
    model_id: str,
    model_name: str,
    case_dir: Path,
    score: dict[str, Any],
    references: list[dict[str, str]],
) -> dict[str, Any]:
    identifier = f"camera-{model_id}"
    output_dir = example_dir(identifier)
    agent_name = f"{CASES['camera'][1]}__agent_view.png"
    agent = copy_asset(case_dir / agent_name, output_dir / "agent-view.png")
    pose = load_json(case_dir / "agent_camera.json")
    return {
        "id": identifier,
        "task": "camera",
        "modelId": model_id,
        "title": f"{model_name} · Bedroom-5088",
        "sourceInstance": "Bedroom-5088 · hidden camera extrinsics",
        "metrics": [
            metric("PE", "Position Error", score["score"]["cam_pos_error"], unit=" m"),
            metric("AE", "Angular Error", score["score"]["cam_angle_error_deg"], unit="°"),
        ],
        "referenceImages": references,
        "outputImages": [media(agent, f"Rendered view from {model_name}'s predicted camera.")],
        "poseJson": json.dumps(pose, indent=2),
    }


def build_articulated(
    model_id: str,
    run_slug: str,
    model_name: str,
    case_dir: Path,
    score: dict[str, Any],
    references: list[dict[str, str]],
    qualitative: Path,
) -> dict[str, Any]:
    identifier = f"articulated-{model_id}"
    output_dir = example_dir(identifier)
    keyframes: list[dict[str, str]] = []
    poster_url = None
    if run_slug == "claude-opus-4-6":
        for index in range(4):
            src = copy_asset(
                qualitative / f"t4_agent_{index}.png",
                output_dir / f"keyframe-{index}.png",
            )
            keyframes.append(media(src, f"Claude Opus articulated output state {index + 1}."))
        poster_url = keyframes[2]["src"]
    source_glb = case_dir / "agent_animation.glb"
    has_animation = glb_has_animation(source_glb)
    glb = copy_asset(source_glb, output_dir / "animation.glb")
    notes = (
        "The viewer uses the submitted 32-state animated GLB. "
        "Rendered output keyframes are available only for the paper's qualitative example."
        if has_animation
        else (
            "The submitted GLB contains no animated channels; "
            "the viewer preserves this static articulated failure."
        )
    )
    return {
        "id": identifier,
        "task": "articulated",
        "modelId": model_id,
        "title": f"{model_name} · Kitchen cabinet",
        "sourceInstance": "S2O ACD kitchen cabinet · 32 ordered states",
        "metrics": [
            metric("MPE", "Maximum Part Error", score["score"]["worst_part_err"], unit=" m"),
            metric("Mean Part", "Mean Part Error", score["score"]["mean_part_err"], unit=" m"),
            metric("Recall", "Movable recall", score["score"]["movable_recall"], direction="higher"),
        ],
        "referenceImages": references,
        "outputImages": keyframes[:1],
        "animatedGlb": media(
            glb,
            (
                f"Interactive animated {model_name} articulated GLB."
                if has_animation
                else f"Interactive static {model_name} articulated submission."
            ),
            poster_url or references[0]["src"],
        ),
        "hasAnimation": has_animation,
        "keyframes": keyframes,
        "notes": notes,
    }


def build_reconstruction(
    model_id: str,
    model_name: str,
    case_dir: Path,
    score: dict[str, Any],
    references: list[dict[str, str]],
) -> dict[str, Any]:
    identifier = f"reconstruction-{model_id}"
    output_dir = example_dir(identifier)
    output_images = []
    for index in (0, 2):
        src = copy_asset(
            case_dir / "views" / f"agent_v{index}.png",
            output_dir / f"agent-view-{index}.png",
        )
        output_images.append(media(src, f"{model_name} reconstruction from calibrated view {index + 1}."))
    glb = copy_asset(case_dir / "agent_scene.glb", output_dir / "scene.glb")
    return {
        "id": identifier,
        "task": "reconstruction",
        "modelId": model_id,
        "title": f"{model_name} · SecondBedroom-5427",
        "sourceInstance": "SecondBedroom-5427 · calibrated multi-view Reconstruction",
        "metrics": [
            metric("F@5%", "Object F@5%", score["score"]["obj_f@5%_matched"], direction="higher"),
            metric("Coverage", "Object coverage", score["score"]["object_coverage"], direction="higher"),
            metric("Centroid", "Mean centroid error", score["score"]["mean_pos_err"], unit=" m"),
        ],
        "referenceImages": references,
        "outputImages": output_images,
        "outputGlb": media(glb, f"Interactive {model_name} Reconstruction GLB.", output_images[0]["src"]),
    }


def build_dynamic(
    model_id: str,
    run_slug: str,
    model_name: str,
    case_dir: Path,
    score: dict[str, Any],
    references: list[dict[str, str]],
    qualitative: Path,
) -> dict[str, Any]:
    identifier = f"dynamic-{model_id}"
    output_dir = example_dir(identifier)
    low_poly: list[dict[str, str]] = []
    photorealistic: list[dict[str, str]] = []
    poster_url = None
    if run_slug == "claude-opus-4-6":
        for index in range(4):
            low = copy_asset(qualitative / f"t6_agent_{index}.png", output_dir / f"low-{index}.png")
            photo = copy_asset(qualitative / f"t7_agent_{index}.png", output_dir / f"photo-{index}.png")
            low_poly.append(media(low, f"Claude Opus low-poly output frame {index + 1}."))
            photorealistic.append(media(photo, f"Claude Opus photo-realistic output frame {index + 1}."))
        poster_url = low_poly[0]["src"]
    source_glb = case_dir / "agent_scene.glb"
    has_animation = glb_has_animation(source_glb)
    glb = copy_asset(source_glb, output_dir / "animation.glb")
    size = source_glb.stat().st_size
    notes = (
        "The interactive GLB and metrics use the low-poly base condition. "
        "Paired low-poly- and photo-realistic-input output strips are published only "
        "for the paper's qualitative example."
    )
    if not has_animation:
        notes = (
            "The submitted low-poly base-condition GLB contains no animation; "
            "the interactive viewer preserves this static-scene failure."
        )
    elif size < 100_000:
        notes = (
            "The submitted low-poly base-condition GLB is nearly empty; "
            "the interactive viewer preserves this failure."
        )
    return {
        "id": identifier,
        "task": "dynamic",
        "modelId": model_id,
        "title": f"{model_name} · Castle siege",
        "sourceInstance": "Castle siege · 144-frame low-poly Dynamic",
        "metrics": [
            metric("MME", "Maximum Mover Error", score["score"]["worst_vehicle_err"]),
            metric("AME", "Average Mover Error", score["score"]["mean_vehicle_err"], direction="diagnostic"),
            metric("LE", "Layout Error", score["score"]["layout_err"]),
        ],
        "referenceImages": references,
        "outputImages": low_poly[:1],
        "animatedGlb": media(
            glb,
            (
                f"Interactive animated {model_name} Dynamic GLB."
                if has_animation
                else f"Interactive static {model_name} Dynamic submission."
            ),
            poster_url or references[0]["src"],
        ),
        "hasAnimation": has_animation,
        "lowPolyPreviews": low_poly,
        "photorealisticPreviews": photorealistic,
        "notes": notes,
    }


def build_examples(
    runs: Path,
    legacy: Path,
    static_root: Path,
    articulated_root: Path,
    dynamic_root: Path,
) -> list[dict[str, Any]]:
    qualitative = legacy / "_figure_assets" / "qualitative_frames"
    output_root = SITE_ROOT / "public" / "assets" / "examples"
    if output_root.exists():
        shutil.rmtree(output_root)
    references, reference_artifacts = copy_shared_references(
        qualitative,
        runs,
        static_root,
        articulated_root,
        dynamic_root,
    )
    builders = {
        "layout": build_layout,
        "camera": build_camera,
        "articulated": build_articulated,
        "reconstruction": build_reconstruction,
        "dynamic": build_dynamic,
    }
    examples = []
    for model_id, run_slug, model_name in MODELS:
        for task, (task_dir, sample_id, _) in CASES.items():
            case_dir = runs / run_slug / task_dir / sample_id
            score = load_json(case_dir / "score.json")
            arguments = [
                model_id,
                run_slug,
                model_name,
                case_dir,
                score,
                references[task],
                qualitative,
            ]
            if task in {"camera", "reconstruction"}:
                arguments = [model_id, model_name, case_dir, score, references[task]]
            example = builders[task](*arguments)
            example.update(reference_artifacts[task])
            examples.append(example)
    return examples


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs-root", type=Path, required=True)
    parser.add_argument("--legacy-root", type=Path, required=True)
    parser.add_argument("--static-benchmark-root", type=Path, required=True)
    parser.add_argument("--articulated-benchmark-root", type=Path, required=True)
    parser.add_argument("--dynamic-benchmark-root", type=Path, required=True)
    parser.add_argument("--site-root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    global SITE_ROOT
    SITE_ROOT = args.site_root.resolve()
    examples = build_examples(
        args.runs_root.resolve(),
        args.legacy_root.resolve(),
        args.static_benchmark_root.resolve(),
        args.articulated_benchmark_root.resolve(),
        args.dynamic_benchmark_root.resolve(),
    )
    manifest = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "assetBase": "/assets/examples/",
        "examples": examples,
    }
    output = SITE_ROOT / "public" / "data" / "examples.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, indent=2) + "\n")
    total = sum(path.stat().st_size for path in (SITE_ROOT / "public" / "assets").rglob("*") if path.is_file())
    print(f"Built {len(examples)} examples ({total / 1024 / 1024:.1f} MB of public assets).")


SITE_ROOT = Path(__file__).resolve().parents[1]


if __name__ == "__main__":
    main()
