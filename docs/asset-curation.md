# Curating SceneActBench examples

The explorer reads `/public/data/examples.json` at runtime. Adding examples never requires a React component change.

## Inputs

Prepare a local JSON manifest that conforms to `docs/examples-manifest.schema.json`. Asset paths in this input file are relative to the manifest itself. Keep the raw run tree outside this repository.

Every example includes:

- `id`, `task`, `modelId`, `title`, and `sourceInstance`
- task-native `metrics` copied from the evaluated case
- `referenceImages` and `outputImages`
- task-specific artifacts:
  - Layout/Reconstruction: optional `outputGlb`
  - Camera: `poseJson` and images only
  - Articulated: optional `animatedGlb`, required `hasAnimation`, plus `keyframes`
  - Dynamic: optional `animatedGlb`, required `hasAnimation`, `lowPolyPreviews`, and `photorealisticPreviews`

Media records have `src`, meaningful `alt`, and an optional image `poster`. Do not insert remote URLs, unpublished scores, or paths that point back into the private raw run tree.

## Validate and copy

```bash
npm run curate:examples -- /absolute/path/to/curated/examples.json --dry-run
npm run curate:examples -- /absolute/path/to/curated/examples.json
```

The script:

1. validates task and model identifiers;
2. rejects path traversal, remote media, unsupported formats, and oversized files;
3. copies selected images and GLBs into `public/assets/examples/<example-id>/`;
4. rewrites local paths to GitHub Pages root paths; and
5. writes `public/data/examples.json` with a generation timestamp.

Images are limited to 12 MB each, GLBs to 40 MB each, and the curated set to 180 MB. Optimize geometry, textures, and posters before curation rather than committing the full raw run tree.

## Review checklist

- Native metrics exactly match the reproducibility snapshot for the selected case.
- Reference and output images identify the same source instance.
- Camera examples contain no GLB.
- Articulated `hasAnimation` matches non-empty animation channels in the submitted GLB; static failures are labelled explicitly.
- Published Articulated keyframes show the requested state and align with the submitted example.
- Dynamic `hasAnimation` matches the submitted GLB; static-scene failures remain published and are labelled explicitly.
- When both Dynamic preview strips are present, they represent the paired low-poly- and photo-realistic-input runs of the same scene.
- Every visual has useful alt text and every GLB has a poster when practical.
- `npm run check:content`, `npm test`, and `npm run build` pass.
