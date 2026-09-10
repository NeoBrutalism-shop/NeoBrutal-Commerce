# NeoBrutal Commerce Development Roadmap

This is the canonical development sequence for NeoBrutal Commerce. Work moves through these milestones **step by step, one by one**. Later milestones do not replace unfinished acceptance criteria in earlier milestones.

The architectural progression is:

`Components → Blocks → Pages → Applications`

Every layer must be designed for both **humans and LLMs**, and every permanent showcase must remain hosted and verified on GitHub Pages.

## Current position

Verified main at the time this roadmap was adopted: `31be4996ed374ffa26dd3641162ed1fc668221f6`.

The repository has already built substantial v1.0–v1.4 foundations, but the original target breadth for several milestones is larger than the currently shipped baseline. Those gaps remain roadmap work rather than being silently treated as complete.

| Milestone | Current shipped baseline | Roadmap status |
| --- | --- | --- |
| v1.0 showcase | Flagship, component explorer, Page Lab, production routes, multi-engine Browser QA and public smoke are live | Complete / frozen |
| v1.1 Components + Blocks | 47/47 registered components have explicit live previews; 18 first-class Blocks are registered and previewed | **Expansion required** to reach the 25–35 Block target and full per-component demo depth |
| v1.2 Pages | 10/10 frozen production routes have route-complete Page contracts and Page Lab coverage | **Expansion required** to reach roughly 15–20 prebuilt page templates and the broader state/template catalog below |
| v1.3 Interaction System | Canonical interaction contract plus public Motion & Interaction Lab; 4 production interaction patterns and accessibility degradation are enforced | **Expansion required** to cover the broader interaction language below where it is not yet first-class |
| v1.4 Agent / LLM First | Canonical `storefront/agents.json`, authority-by-concern workflow, Agent Execution Lab, composition tracing and anti-guess rules | **Expansion/audit required** against the full metadata and machine-readable recipe goals below |
| v1.5 Theme + Brand | Not started as a milestone | Blocked until earlier milestone acceptance gaps are reconciled |
| v2.0 Commerce Platform | Not started | Future major milestone |

### Immediate rule

Because this roadmap is now canonical, the next development work should reconcile the earliest unfinished milestone before advancing. **The next target is v1.1 Block/component showcase expansion**, beginning from the current 18-Block baseline and working toward the 25–35 first-class Block target with no regression to the frozen Commerce 1.0 runtime/API.

---

## 0. Finish the current blocker first — v1.0 showcase patch

The final v1.0 showcase patch must establish:

- flagship live on GitHub Pages
- `/components.html`
- `/demo/v10.html`
- all production routes reachable online
- Browser QA green across Chromium, mobile Chromium, Firefox and WebKit
- accessibility clean
- final screenshot review
- merge to `main`
- verify every GitHub Pages URL

**Status:** Complete and frozen. Subsequent documentation-system work must not weaken this layer.

---

## v1.1 — Component + Blocks Showcase

This is the first major documentation-system development release after the v1.0 showcase freeze.

### Components

Every one of the 47 components must have a complete demo covering:

- all variants
- all states
- disabled / loading / error / success
- light + dark
- desktop / tablet / mobile
- hover / pressed / focus behavior
- accessibility notes
- design tokens used
- props / API
- action contracts
- copy-ready HTML / CSS / JS
- LLM-readable usage instructions

The component explorer should feel like a real product, not documentation bolted onto the repository.

**Current baseline:** all 47 registered components have explicit live previews and machine-readable component/showcase contracts. Continue auditing the depth of each demo against every item above rather than assuming preview presence alone equals completion.

### Blocks

Formalize reusable compositions instead of leaving them embedded inside Pages.

Target roughly **25–35 first-class Blocks**, including:

- Store Hero
- Announcement Bar
- Product Grid
- Featured Product
- Product Gallery
- Product Details
- Variant Selector
- Pricing Cards
- Pricing Comparison
- Trust Strip
- Review Grid
- Testimonials
- Guarantee
- FAQ
- CTA Band
- Cart Drawer
- Cart Page
- Order Summary
- Checkout Form
- Payment Recovery
- Order Confirmation
- Account Summary
- Purchase History
- Downloads
- License Card
- License Dashboard
- Seat Manager
- Subscription Manager
- Ownership Timeline
- Footer
- Navigation

Each Block receives a stable ID and machine-readable contract just like Components.

**Current baseline:** 18 stable Blocks with explicit previews and machine-readable contracts. The target breadth above remains unfinished.

### v1.1 exit gate

Do not mark v1.1 target-complete until:

1. all 47 component demos have been audited against the complete demo checklist;
2. the Block library reaches the intended roughly 25–35 reusable compositions or an explicit reviewed decision documents why a listed composition is intentionally represented another way;
3. every Block has stable machine-readable identity, live preview, responsive/theme/accessibility guidance, and component membership;
4. Quality, four-engine Browser QA, public smoke, and screenshot review stay green.

---

## v1.2 — Page Templates

Turn Blocks into a proper Pages library.

Target about **15–20 prebuilt Pages**:

- Store homepage
- Catalog
- Collection / category
- Search results
- Product detail
- SaaS / product pricing
- Cart
- Checkout
- Failed payment
- Recovery checkout
- Order success
- Account dashboard
- Purchase history
- Downloads
- License detail
- Subscription management
- Seat / team management
- Gift / transfer ownership
- Empty / error / offline states

The Page Lab must let users switch:

- Desktop / Tablet / Mobile
- Light / Dark
- Normal / Loading / Empty / Error / Success

**Current baseline:** 10 route-keyed Page contracts cover all 10 frozen production routes and compose the current 18 Blocks. Route states remain authoritative in `storefront/routes.json` and are exposed in Page Lab without duplicating them into `storefront/pages.json`.

### v1.2 exit gate

Do not mark the roadmap target complete until the broader 15–20 Page/template intent above has been reconciled. New templates may be documentation-layer Pages without changing frozen production route IDs, but they must not invent a second route authority.

---

## v1.3 — Commerce Interaction System

NeoBrutal Commerce must have an explicit interaction language:

- hover = compress downward
- active = physically seated
- tactile shadows collapse
- buttons never float upward
- cards respond differently from controls
- toggles have mechanical movement
- drawers feel anchored
- progress communicates direction
- loading states preserve layout
- destructive actions require deliberate physical hierarchy
- reduced-motion behavior built in

Maintain a dedicated **Motion & Interaction Lab** demonstrating these laws.

**Current baseline:** `storefront/interactions.json` defines the canonical v1.3 interaction authority; the public Motion Lab demonstrates tactile press, latched selection, processing feedback and result feedback, with a documented non-production drag-lift exception plus reduced-motion/forced-colors enforcement.

### v1.3 exit gate

Audit every interaction-language item above. Where an item is not already represented by one of the canonical patterns, either add a real production-backed pattern and lab demonstration or document why it is a specialization of an existing law. Do not invent demos for behavior that does not actually ship.

---

## v1.4 — Agent / LLM First Commerce

Every Component, Block and Page should expose structured information sufficient for deterministic composition, including concepts such as:

`component → allowed states → actions → tokens → accessibility → compatible blocks → recommended contexts`

The goal is that an LLM can reliably receive an instruction such as:

> Build a digital-product checkout using NeoBrutal Commerce.

and resolve the correct Components and Blocks without inventing APIs.

Required agent-first assets include:

- `blocks.json`
- `pages.json`
- stronger `AGENTS.md`
- stronger `LLMS.md`
- composition rules
- anti-pattern rules
- deterministic examples
- machine-readable recipes

**Current baseline:** Components, Blocks, Pages, states, interactions and route authorities are machine-readable; `storefront/agents.json` coordinates authority-by-concern and deterministic Route → Page → Block → Component execution; the public Agent Execution Lab validates all-route composition traces and anti-guess rules.

### v1.4 exit gate

Audit the full Component/Block/Page metadata graph against the intended fields above, especially compatibility/recommended-context relationships and machine-readable recipes. Keep global execution rules in `storefront/agents.json` and domain data in the manifest that owns that concern; do not duplicate the same truth in multiple contracts.

---

## v1.5 — Theme + Brand System

Once v1.1–v1.4 acceptance gaps are reconciled, make Commerce adaptable without losing its identity through tokens rather than component forks.

Target capabilities:

- semantic color themes
- radius scales
- border weight scales
- shadow depth
- spacing density
- typography presets
- accent families
- expressive vs restrained modes
- light / dark parity

### v1.5 laws

- Theme variation must be token-driven.
- Components must not fork merely to create a brand flavor.
- Tactile press-down physics and accessibility behavior remain invariant unless an explicit semantic reason requires otherwise.
- Light/dark and forced-colors behavior remain first-class quality gates.

---

## v2.0 — Commerce Platform

Only after the system above is exceptionally solid should Commerce expand into larger platform capabilities:

- marketplace patterns
- subscriptions
- team billing
- B2B purchasing
- invoicing
- usage-based billing
- trials
- upgrade / downgrade
- refunds
- disputes
- tax / VAT states
- multi-currency
- localization
- advanced account / ownership lifecycle
- richer AI / agent commerce contracts

v2.0 is where breaking public-contract work may be considered deliberately. The frozen Commerce 1.0 API must not be eroded piecemeal on the way there.

---

## Development sequence

The canonical sequence is:

**v1.0 showcase freeze → v1.1 Components + Blocks → v1.2 Pages → v1.3 Interaction System → v1.4 Agent contracts → v1.5 Theme + Brand → v2.0 Commerce Platform**

The priority is not to build a large number of unrelated features early. The opportunity is to make the system we already created **visible, explorable, reusable and impossible to misunderstand**.

For every milestone and remediation slice:

1. start from the latest independently verified `main` SHA;
2. preserve `Components → Blocks → Pages → Applications` authority boundaries;
3. use canonical manifests rather than copied taxonomies;
4. add permanent static/browser/public coverage with the feature;
5. never weaken failing assertions to make CI green;
6. inspect exact-head artifacts before merge when visual surfaces change;
7. merge with exact-head protection;
8. independently verify Quality, Browser QA, public smoke and Pages deployment on the resulting exact `main` SHA;
9. inspect exact-main artifacts before declaring the slice closed.
