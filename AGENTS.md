# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

- `npm run build` — Vite library build (ESM + CJS) plus bundled `.d.ts`/`.d.cts`. `npm start` is the same in watch mode.
- `npm run lint` — runs all `lint:*` in parallel: `lint:eslint` (ESLint, includes Prettier + JSON/Markdown linting), `lint:typecheck` (`tsc --noEmit`), `lint:attw` (are-the-types-wrong on a packed tarball; needs a build).
- `npm test` — Vitest in watch mode. A positional arg filters by path substring: `npm test unit`, `npm test integration`, `npx vitest run tests/unit/SchemaBuilder.test.ts`, `npx vitest run -t "test name"`.
- `npm run test-coverage` — single run with V8 coverage (CI runs `unit` and `integration` separately and uploads each as its own Codecov flag).

## Architecture

This is a *framework* library: it has no knowledge of any concrete syntax. Everything concrete (markdown, HTML, …) lives in downstream packages such as prosemirror-remark, which supply `Extension` subclasses. `src/index.ts` is the entire public API surface.

`ProseMirrorUnified` is a thin facade. Its constructor takes a flat list of extensions, wraps them in an `ExtensionManager`, then eagerly builds one collaborator per concern and stores the results:

- `ExtensionManager` — recursively expands `extension.dependencies()` and buckets extensions into node / mark / other maps keyed by `constructor.name`, which deduplicates repeated extensions. Consequently `syntaxExtensions()` returns nodes before marks, and that ordering is what conversion iterates over.
- `SchemaBuilder` → the single `Schema` instance shared by everything (`schema()`), built from each extension's node/mark specs (`null` name or spec means the extension contributes nothing to the schema). If two extensions of different classes both provide a spec for the same node/mark name, the last one wins and a `console.warn` is emitted — that usually means a package providing extensions is duplicated in the dependency tree. Several extensions sharing a name where only one provides the spec is a supported pattern and stays silent.
- `UnistToProseMirrorConverter` (`parse`) — depth-first: find the first extension whose `unistToProseMirrorTest` matches, convert children, then call `unistNodeToProseMirrorNodes` with the already-converted children plus a mutable context object shared across the whole document. After the tree is done, every syntax extension gets `postUnistToProseMirrorHook(context)`. An unmatched node produces a `console.warn` and is dropped; a root that doesn't convert to exactly one node throws.
- `ProseMirrorToUnistConverter` (`serialize`) — mirror image, but only `NodeExtension`s convert nodes; each mark on a ProseMirror node is then applied by the matching `MarkExtension.processConvertedUnistNode`, in unspecified order.
- `UnifiedBuilder` — folds `unifiedInitializationHook` over a `unified()` processor; this is where downstream extensions plug in remark/rehype.
- `InputRulesBuilder`, `KeymapBuilder`, `NodeViewBuilder` — collect `proseMirrorInputRules` / `proseMirrorKeymap` / `proseMirrorNodeView` into ProseMirror plugins. `KeymapBuilder` also layers in prosemirror-commands base bindings.

The unist/ProseMirror asymmetry drives the class hierarchy: unist has no marks, so `MarkExtension` maps a unist node (e.g. `strong`) to a ProseMirror *mark*, while `NodeExtension` maps to a ProseMirror *node*. Shared machinery lives in `SyntaxExtension`; `Extension` itself only carries `dependencies()` and the unified hook. `MarkInputRule` and `createProseMirrorNode` are helpers for extension authors.

`README.md` doubles as the API reference — any change to a public class, method signature, or default behaviour must be reflected there.

## Conventions

- ESLint is strict: `typescript-eslint` strict + stylistic, `perfectionist` (natural sorting of imports, object keys, class members — expect churn if you add members out of order), `prefer-arrow-functions`, and eslint-comments requiring a description on every disable directive (`-- reason`).
- Explicit return types and `public`/`private` modifiers everywhere; type-only imports use `import type`.
- Tests: `tests/unit/` mirrors `src/` file-by-file and uses the `vi.fn`-backed extension doubles in `tests/mocks/`; `tests/integration/` builds a small real syntax (Root/Text/Paragraph/Bold/Link extensions) and drives it through `ProseMirrorUnified` with `vitest-prosemirror`, mocking `unified` itself. jsdom environment, `mockReset: true`, `tests/setup.ts` polyfills `Range` rects for ProseMirror.
- Tests state `expect.assertions(n)` up front.
