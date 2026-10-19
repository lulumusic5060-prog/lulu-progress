---
name: lulu-progress
description: Generate transparent chapter progress overlay videos from SRT/VTT subtitles or chapter timestamps, with three customizable avatar themes, a local visual editor, compact MOV/WebM export and six classic presets. Use for 视频进度条、章节进度条、透明进度条素材.
---

# LuLu Progress

Create editable configs and transparent overlay videos. Resolve all project paths relative to this skill. Use a working copy for each user's output. Requires Node.js, a package manager, Remotion's browser runtime and Python 3 for subtitle parsing.

## Workflow

For visual editing, run `pnpm editor` and open its printed local URL. The editor uses the same AvatarBar as exported videos. It supports image uploads, two expressions, colors, sizes, chapter edits, config import/download and export jobs. Read [installation](references/installation.md) for setup and [configuration](references/configuration.md) for settings.

- Reuse choices already supplied. Accept timed SRT/VTT or chapter labels/start times plus actual total duration. Plain text supports planning only; never invent synchronization. The last subtitle end is an estimate and may omit a silent tail.
- Ask only for missing canvas size and visual preference. If delegated, use the LuLu theme and 1080×1920, and disclose those choices. Position defaults to top; fps defaults to 30 unless source metadata supplies it.
- Parse subtitles with `python3 scripts/prepare_subtitles.py input.srt out/cues.json`. Group topics semantically using the actual cue times; the script does not infer chapters. Keep titles brief and faithful. The local editor only proposes boundaries from subtitle pauses and placeholder titles; it does not perform semantic chapter inference. When this skill is invoked, the agent must still read and group the actual content.
- Copy `examples/demo.json` into the output directory. Set dimensions, fps, duration and chapters. First chapter begins at 0; starts must increase and remain below duration. Avatar themes: `lulu` continuous timeline, `lulu-hop` equal chapter cells with transition jumps, `lulu-cells` equal cells filled by local chapter progress. Use `image` and optional `alternateImage` relative to public; omit both for the generic star. Set avatarSize, barHeight, margin, offset and labelMode as needed. LuLu uses `style: lulu`, rose #e52a85, pink #f9d9e8 and ink #79204b. Classic styles: line, segments, type, fill, cream, burger.
- Install locked dependencies with `pnpm install --frozen-lockfile` when a lockfile exists; first setup without one uses `pnpm install`. `npm install` is an alternative. Do not claim this skill is installed persistently merely because files exist in a project folder.
- Preview using `pnpm preview -- --props out/config.json` and select Overlay. Inspect start, both sides of chapter transitions and final frame. Check clipping, readable titles, avatar position and light/dark background visibility. LuLu avatars are intentionally circular portraits; their source background is not removed.
- Export with `node scripts/export.mjs out/config.json out/progress.mov`. Existing authorization to produce the video suffices. MOV exports ProRes 4444 with alpha. Optional `.webm` exports VP9 alpha for smaller files, only when the target editor supports it. Never substitute ordinary H.264 for transparent output. `--compact` crops the canvas to the strip region; explain that users must position the strip manually above their footage. Preserve original timing.
- Verify output duration/dimensions/codec/alpha using ffprobe/FFmpeg when available, and inspect decoded frames. Report unverified checks clearly. Deliver config and MOV links. Place MOV on a track above the main video, aligned at time zero; editor compatibility must be tested in the user's actual editor before claiming it.

Default public packages use the generic star; personalized packages may include LuLu images. Package using scripts/package_skill.py, never copy out/, uploads/, node_modules or customer subtitles into shared artifacts. The bundled LuLu images are user-provided IP assets. They are for this personalized working copy. Public distribution must follow the asset notice in README; do not assume the upstream code's MIT license licenses these images.
