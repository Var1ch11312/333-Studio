# Agent Skills (vendored)

The `skills/`, `commands/`, and `agents/` here are vendored from
**Addy Osmani's agent-skills** plugin:

- Source: https://github.com/addyosmani/agent-skills
- License: MIT (see `LICENSE.agent-skills`)
- Vendored: 24 skills, 8 slash commands, 4 subagents

## Why vendored instead of plugin-installed

The official install uses the Claude Code plugin marketplace:

```
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```

That writes to your local Claude config and is the right path for a **local
CLI**. In this repo / web-session setup we vendor the files into `.claude/`
instead so they are version-controlled and available in **every** session
(web, CLI, teammates) without a per-machine install step.

The only change made during vendoring: the `agent-skills:` plugin namespace in
the command files was rewritten to bare skill names so the vendored commands
resolve correctly.

## What you get

Lifecycle workflow: **Define → Plan → Build → Verify → Review → Ship**

| Slash command | Purpose |
|---|---|
| `/spec` | Write a PRD before coding |
| `/plan` | Break a spec into verifiable tasks |
| `/build` (`/build auto`) | Incremental, test-driven implementation |
| `/test` | Browser/runtime testing |
| `/review` | Five-axis code review |
| `/code-simplify` | Reduce complexity, keep behavior |
| `/webperf` | Core Web Vitals optimization |
| `/ship` | Pre-launch checklist + staged rollout |

Skills auto-activate by description (e.g. `test-driven-development`,
`security-and-hardening`, `debugging-and-error-recovery`). Subagents:
`code-reviewer`, `security-auditor`, `test-engineer`, `web-performance-auditor`.

To update: re-download the repo tarball and re-copy, or switch to the
marketplace install above.
