# nebve.com voice and identity standard

- **Status:** approved creative direction
- **Approved by:** Nicolas
- **Approved:** 2026-09-04
**Applies to:** every public page, article, project, photograph, caption, navigation label, metadata string, and site interaction

This is the authoritative standard for how `nebve.com` should sound, look, and behave. It turns the purpose recorded in [vision.md](vision.md) into concrete editorial and visual choices. A later explicit decision from Nicolas takes precedence; otherwise, implementation should follow this document rather than extrapolating from the current prototype.

The central idea is an engineer's annotated notebook: organized enough to inspect, personal enough to reveal a mind at work, and rigorous enough to be useful. This is an intellectual and editorial metaphor, not permission to decorate the site with graph paper, terminal windows, code rain, or other literal engineering motifs.

## Creative brief

`nebve.com` is a pseudonymous, evolving index of Nicolas's technical work, writing, and photography. It should feel curious and independent, giving an employer or capable peer a view into a well-studied mind without overwhelming them. Its intelligence may be quietly loud; its presentation must not be self-important, performative, narcissistic, or corny.

The experience remains **interesting, informative, and approachable**, in the sense established by the original proposal and Torrey Podmajersky's product-voice framework. It explains mechanisms alongside conclusions, preserves the lineage of work, records useful failures and practical consequences, and lets rigor accumulate through revision. The visual foundation is absolute black, near-white Times New Roman, precise rules, lime interaction states, original diagrams, and Nicolas's photography. The homepage is an index rather than a hero. The full personal identity belongs on About Me and CV; elsewhere, the site speaks as `nebve`.

## Identity and posture

- The public name is `nebve.com`, set plainly in lowercase Times New Roman at the top left. It links to Home.
- The favicon is a lowercase `n`. It should remain typographic and unembellished unless Nicolas later approves a different mark.
- `nebve` is a pseudonym derived from Nicolas's initials. The site need not continually explain the name.
- The full personal identity and appropriately self-presentational material belong on About Me and CV. The rest of the site should foreground work and thought rather than self-promotion.
- The intended reader is a capable peer examining a problem alongside the author. Computer-science fundamentals may be assumed; project-specific and unusually specialized terminology should be explained.
- The intended after-effect is the feeling of having spoken with someone well studied who can bring useful and interesting ideas to the table.

## Product voice

The three voice attributes are retained from the proposal. **Exact** is an editorial discipline, not a fourth personality trait.

| Dimension      | Interesting                                                                                                                               | Informative                                                                                                                                            | Approachable                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Concepts       | Show mechanisms, reasoning, original visual explanations, instructive failed approaches, and connections when they genuinely add insight. | State conclusions, evidence, lineage, limitations, practical consequences, and useful next steps.                                                      | Orient before going deep. Assume computer-science fundamentals, then define local or uncommon concepts where they enter the argument.                                                           |
| Vocabulary     | Prefer specific nouns and causal verbs to generic claims such as “innovative,” “powerful,” or “impactful.”                                | Use technical terms accurately. Make it possible to tell what was measured, observed, inferred, or judged whenever confusion would change the meaning. | Use familiar interface labels and plain explanations. Do not simplify away the mechanism, but do not use jargon as a credential.                                                                |
| Verbosity      | Spend words on reasoning, examples, and consequences rather than atmosphere or self-display.                                              | Include enough basis for the result to be useful or inspectable. Put worthwhile detours in notes when they would interrupt the main argument.          | Keep navigation and summaries concise. Let the reader choose greater depth through the article, annotations, sources, and related material.                                                     |
| Grammar        | Begin directly, usually with a declarative explanation. First person is available when the author's action or judgment matters.           | Use complete sentences and make the strength of a sentence match the strength of its support.                                                          | Write peer to peer. Avoid direct second person; use “the reader” only when needed. “Let us” or “let's” may support a genuine shared investigation, but should not become a habitual device.     |
| Punctuation    | Let sentence structure carry emphasis. Do not manufacture excitement with decorative punctuation.                                         | Use ordinary English punctuation and recognizable citation and footnote forms.                                                                         | Rhetorical questions should generally be avoided. Sentence fragments should not become a house style.                                                                                           |
| Capitalization | Preserve the spelling of code, protocols, project names, and cited work.                                                                  | Use standard prose capitalization so technical distinctions remain visible.                                                                            | `nebve.com`, the favicon `n`, and the photo-essay suffix `.txt` are deliberately lowercase. Heading and navigation case should be settled in the visual prototype, not improvised page by page. |

### How exactness appears

The prose does not need a ritual label for every observation, inference, or opinion. It does need to prevent material ambiguity.

- Use a plain claim when the surrounding evidence and scope make its status clear.
- Use language such as “the trace shows,” “this suggests,” “I believe,” or “in my view” when a reader could otherwise mistake an inference or judgment for established fact.
- “I believe” is sufficient for a genuine opinion; it is not a substitute for evidence when the sentence makes an empirical claim.
- Strong judgments are welcome when they are genuinely Nicolas's and their status as judgments is clear.
- Candid admissions belong where they improve the account: an incorrect assumption, a failed approach, or a remaining uncertainty. They should not become performative humility.

### Formality and rigor

The site uses high intellectual integrity and moderate genre formality. It is neither casual chatter nor a scientific paper by default.

A first publication should have a specific subject or question, useful reasoning or evidence, appropriate attribution, and honest limitations. It does not require a literature review, a definitive conclusion, or academic-paper ceremony. Articles may become more formal through revision without implying that earlier useful versions were illegitimate.

Each article displays:

- `first published`, which remains the date of the first public version; and
- `last revised`, shown only after a substantive revision.

The authoring workflow may prompt for a revised date, but must not equate every Git commit or typographic correction with a substantive revision.

### House-style constraints

- Contractions are occasional, not banned and not constant.
- Humor may appear when it is natural, but the writing must not depend on jokes or cute asides.
- Rhetorical questions are exceptional. State the question under investigation directly instead.
- Prefer complete sentences over fragments.
- Avoid habitual direct address. Instructions may use an imperative when that is the clearest form.
- Prefer mechanisms and conclusions in support of one another. Do not force a choice between them.
- Treat practical consequences and instructive failed approaches as central material when the subject supplies them.
- Show the lineage of work through dates, revision notes, citations, and project relationships. Connections between ideas are useful but need not dominate every page.

### Editorial examples

These examples illustrate form, not publishable claims.

| Avoid                                                                         | Prefer                                                                                                                                            |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Welcome to my corner of the internet, where I explore groundbreaking ideas.” | “This site collects technical work, explanations, and photographs that are worth keeping in public.”                                              |
| “Have you ever wondered why this queue is so fast? Let's dive in!”            | “The interesting part is not the final throughput number but the mechanism that produced it.”                                                     |
| “It is demonstrated herein that the alternative implementation is inferior.”  | “In this benchmark, the alternative spent more time contending on the shared state. That result is narrower than a general claim of inferiority.” |
| “Obviously, this design is better.”                                           | “I prefer this design because it exposes the failure mode and makes the recovery path inspectable.”                                               |
| “A revolutionary, cutting-edge solution.”                                     | Name the mechanism, constraint, and observed consequence.                                                                                         |

## Editorial tone by surface

- **Navigation and metadata:** short, literal, and quietly typographic. No playful renaming of familiar destinations.
- **Homepage:** orient rapidly, then expose current or featured work. It should read like an index, not a pitch deck.
- **Technical writing:** direct explanation, visible reasoning, appropriate sources, and room for detail.
- **Research and project pages:** stable orientation first; role, mechanism, results, limitations, and routes to verification as material becomes available.
- **About Me:** personal but factual. It may use “I” and provide context without making the entire site a self-portrait.
- **CV:** explicit and evidence-forward. This is the surface allowed to advocate most directly for Nicolas.
- **Photography and photo essays:** use the same clear voice. Context may be personal or observational, but no automatic poetic or enigmatic register should be imposed on the images.
- **Errors and empty states:** plain and useful. Avoid mascot copy, jokes, and fake intimacy.

## Visual system

### Color

- The foundation is absolute black: `#000000`.
- Text is near-white, not a warm cream. The final near-white value is a prototype decision that must meet WCAG 2.2 AA contrast.
- Resting links may be near-white or blue according to context. Hover and focus move to lime green.
- Exact blue, lime, secondary-text, rule, selection, and focus values remain prototype gates. They belong in one author-controlled token file, not in page-local CSS.
- There is one default public scheme. Nicolas may later enable per-article token overrides, but visitors do not receive a theme configurator in the initial design.
- Color is never the only indication that an item is linked, focused, selected, or connected to an essay.

### Typography

- Every non-code word—including navigation, metadata, captions, headings, labels, and controls—uses the system stack `"Times New Roman", Times, serif`.
- Code and code-adjacent data use a monospace stack.
- Do not load a webfont merely to normalize Times New Roman across operating systems. Platform variation is accepted as part of the choice.
- Hierarchy should come from scale, measure, weight, spacing, rules, and placement. Avoid using many font families or weights to simulate distinction.
- Body measure should remain readable rather than expanding to fill a wide display. The gallery and diagrams may use the full available width when their content benefits.

### Density and composition

- The site is compact enough to feel like an index and generous enough to support careful reading.
- Prefer visible structure—rules, alignment, columns, numbering, and spatial relationships—over rounded containers around every piece of content.
- The homepage begins with `nebve.com`, the five approved navigation destinations, a concise orientation, and immediate access to current or featured work. It is not a giant image or slogan hero.
- Use asymmetry or eccentric placement when it makes a relationship memorable or inspectable. Eccentricity should arise from content and interaction, not from arbitrary rotation, collision, or illegibility.

### Name and navigation treatment

- `nebve.com` remains at the top left with the primary navigation.
- It is plain lowercase Times New Roman, not a logo lockup, badge, pill, monogram, or gradient wordmark.
- Home is reached through `nebve.com`; it is not a sixth primary-navigation label.
- The initial favicon is a plain lowercase `n` derived from the same typographic posture.

## Interaction language

The page should remind a visitor that it is an interactive medium without behaving like a demo reel.

### Links

On hover or keyboard focus, a link should appear to spring forward: its text changes from near-white or blue to lime, a border becomes visible without moving neighboring layout, and a small restrained transform or equivalent depth cue gives it physical lift. “Centering” the object means concentrating the reader's attention, not scrolling or moving it to the center of the viewport.

- Reserve border space or use an outline/pseudo-element so the layout does not jump.
- Keyboard focus receives at least the same visible information as pointer hover.
- Under `prefers-reduced-motion`, preserve the color and border state but remove the springing motion.
- Inline prose links must remain recognizable when not hovered.
- Touch interfaces must not depend on a hover-only revelation.

### Article annotations

Wide article layouts use a primary reading column and one collapsible annotated column.

- The rail is open by default when annotations exist.
- Notes may align approximately with their references when that remains stable and readable.
- One control collapses or restores the complete rail; it does not require operating every note independently.
- On narrow screens, annotations become inline disclosures near their references rather than a squeezed side column.
- The article remains complete and navigable without client-side JavaScript.

### Footnotes and terms

Footnotes use familiar authoring syntax such as `[^label]`. Visible footnote numbers are generated by the order of first reference, not embedded manually in the prose.

- Hover or keyboard focus may show a short preview when it fits without covering most of the viewport or obstructing navigation.
- Clicking or activating the reference always follows an ordinary anchor to the canonical note in the footnote section.
- Each canonical note links back to its reference.
- On small screens, coarse pointers, or long notes, omit the preview and preserve the anchor behavior.
- A preview must be dismissible, hoverable, and persistent as required by WCAG 2.2's content-on-hover-or-focus guidance. Escape dismisses it.
- With CSS or JavaScript unavailable, numbered links and the bottom footnote list still work.

Reusable terminology is separate from citations. A term may open a concise definition and project-specific context, but the ordinary sentence must still be intelligible. If the same explanation is valuable in several articles, it belongs in a validated term source rather than being copied into each file.

## Imagery and diagrams

Original visual reasoning is the leading form of imagery for technical work. Diagrams should explain mechanisms or relationships; they are not decorative proof that engineering occurred.

- Author diagrams in draw.io specifically for this site, or provide hand-drawn work when that is the better artifact.
- Preserve the editable `.drawio` source alongside exported media when it is intended to remain maintainable.
- Prefer a responsive SVG export in the article and offer a PDF link where the artifact benefits from a printable or downloadable version.
- Use raster output for hand-drawn or texture-dependent material, with responsive sizes and intrinsic dimensions.
- Use an inline PDF viewer only when the document is genuinely multi-page or its page behavior matters. It must have a direct download/open link.
- Every meaningful figure needs a concise alternative text description, a caption, and—when the mechanism cannot be conveyed briefly—a nearby long description.
- Figures should conform to the site's palette when authored for `nebve.com`; the site should not change its layout or palette to accommodate arbitrary diagrams.

## Photography

The photography index is a filterless grid of all selected public images. It preserves portrait and landscape proportions and does not impose destructive crops.

- Every photograph is clickable and can open in a full-viewport viewer.
- A gallery tile lifts and gains a link-like border on hover or focus.
- A photograph with an essay carries a `.txt` marker in its top-left corner. This supplement to shape and text must not rely on color alone.
- Nicolas controls selection, sequence, captions, crop decisions, and public metadata.

### Photo-essay reading behavior

- Keep a minimal black navigation bar pinned at the top; do not overlay it on the photograph.
- Pin the photograph below that bar while its accompanying black essay surface rises over it with the document scroll.
- Set the essay label as `essay title.txt`, with `.txt` after the title so it resembles a file path.
- The essay surface may begin as a small bar at the bottom and eventually cover the photograph as the reader continues.
- This behavior adapts the spatial principle demonstrated by the supplied Sorapure reference screenshots; it must not copy that site's identity, code, typography, or exact composition.
- The ordinary gallery needs no special replacement header. Its full-screen viewer retains normal, minimal navigation and a clear close/back action.

## Authoring system target

This section specifies the intended workflow; it does not claim that the current prototype implements it.

Markdown-compatible files are the source of truth, built locally and prerendered by SvelteKit. GitHub rendering is not a requirement. The lowest-cost extensible path is MDsveX or an equivalent Markdown-plus-Svelte pipeline:

```text
src/content/
├── pages/
│   ├── about.svx
│   └── cv.svx
├── projects/
│   └── ubq.svx
├── writing/
│   └── article-slug.svx
└── photo-essays/
    └── essay-slug.svx
```

Ordinary content remains ordinary Markdown. A piece that needs custom behavior imports and uses a standard Svelte component:

```svelte
<script>
	import Slider from '$lib/components/content/Slider.svelte';
</script>

## A normal Markdown section

<Slider min={0} max={64} value={8} />
```

Do not create a custom “call a function” notation or miniature language before repeated authoring friction justifies it. Native component syntax keeps Svelte's type checking, accessibility expectations, and future customization available at a lower maintenance cost.

Content metadata is frontmatter validated at build time. A writing entry should be able to express at least:

```yaml
title: 'Supplied title'
slug: 'supplied-slug'
summary: 'Supplied summary.'
published: YYYY-MM-DD
updated: YYYY-MM-DD # optional; substantive revisions only
tags: []
relatedProjects: []
featured: false
draft: true
```

The target ergonomic workflow should eventually provide:

1. a scaffold command that creates the correct file and required frontmatter;
2. a fast content-validation command with errors that name the file and field;
3. a local preview that includes drafts without exposing them in production;
4. a publication step that preserves `published`; and
5. a revision prompt that offers—but never blindly overwrites—`updated`.

The visual token system should have an author-only central default with a typed per-article override shape reserved for future use. The initial content model always uses the default, so extensibility does not become immediate interface complexity.

## Avoiding generic AI-site signals

The site should not resemble the recurring defaults found in AI landing-page and portfolio template galleries. Avoid:

- warm off-white or cream surfaces paired with tasteful green as an automatic “editorial” palette;
- purple-blue gradients, blurred glowing orbs, gradient text, or ambient glow as substitute identity;
- glass panels, floating translucent navigation, and soft shadows on every surface;
- rounded cards and pill labels used as the default container or vocabulary;
- a giant slogan hero followed by two calls to action and repeated three-card or bento sections;
- literal terminal windows, graph-paper backgrounds, code rain, or monospaced decoration used to signify technical credibility;
- generic sans-serif typography, especially when paired with inflated marketing language;
- scroll-reveal choreography, novelty cursors, magnetic controls, or continuous motion that does not explain content;
- generic icon collections, fabricated metrics, fake testimonials, or stock copy standing in for real evidence; and
- uniform “premium” polish that removes evidence of the author, the artifact, or the work's history.

Use these alternatives:

- flat black and near-white with a small, deliberate interaction palette;
- Times New Roman used without apology;
- rules, numbering, alignment, annotations, and open composition;
- layouts shaped by the actual article, diagram, photograph, or project relationship;
- real artifacts, original diagrams, photographs, sources, revisions, and instructive failures; and
- interaction concentrated on links, annotations, terms, custom demonstrations, and photo-essay reading.

The current cream/green prototype, card treatment, background grid, large hero, uppercase eyebrow labels, and provisional `N` favicon are implementation artifacts. They are not precedents and must not survive the identity pass by inertia.

## Prototype gates

The creative direction is approved. These details still require a small visual prototype and Nicolas's review before they become lasting tokens or motion rules:

1. exact near-white, blue, lime, secondary-text, rule, selection, and focus colors;
2. Times New Roman sizes, measures, leading, weights, and heading/navigation capitalization at narrow and wide viewports;
3. the distance, timing, easing, and border geometry of the link lift;
4. homepage index density and featured-work ordering;
5. annotation-rail width, alignment tolerance, collapse control, and mobile disclosure form;
6. mixed-aspect gallery spacing, full-screen viewer controls, and `.txt` marker geometry; and
7. the pinned-image/advancing-essay transition across short, tall, touch, keyboard, and reduced-motion environments.

A prototype succeeds only if it remains legible without motion, keyboard-complete, stable without layout jumps, useful without client-side JavaScript where specified, and visually attributable to this body of work rather than to a current template trend.

## Reference principles

- Torrey Podmajersky's product-voice chart informs the voice dimensions and the idea of interface text as an intentional conversation: [Podmajersky voice chart](https://lmu.pressbooks.pub/app/uploads/sites/33/2025/06/Podmajersky-Voice.pdf) and [UXPod interview](https://uxpod.com/episodes/ux-writing-an-interview-with-torrey-podmajersky.html).
- WCAG 2.2 governs the footnote and term previews: [Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html).
- Times New Roman begins as an installed system font; the site should not redistribute font files casually: [Microsoft font licensing FAQ](https://learn.microsoft.com/en-us/typography/fonts/font-faq).
- MDsveX is the current reference implementation for Markdown with Svelte components: [MDsveX](https://github.com/pngwn/MDsveX/tree/main/packages/mdsvex).
- draw.io's maintainable source and export workflow informs the diagram pipeline: [export a diagram](https://www.drawio.com/docs/manual/export/export-diagram/) and [export to SVG](https://www.drawio.com/docs/manual/export/export-to-svg/).
- Maggie Appleton's site is a reference for making links visibly responsive, not a source to copy: [public source repository](https://github.com/MaggieAppleton/maggieappleton.com-V3).
- The supplied Sorapure page and four ordered screenshots are a reference for a photograph giving way to scrolling text: [Sorapure Writing 155A](https://sorapure.net/155a/).
- Public template galleries were reviewed only to identify recurring conventions to avoid: [v0 landing-page templates](https://v0.app/templates/newest/landing-pages) and [Lovable portfolio templates](https://lovable.dev/templates/websites/portfolio).
