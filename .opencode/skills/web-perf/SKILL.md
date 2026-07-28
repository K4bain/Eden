---
name: web-perf
description: Analyzes web performance using Chrome DevTools MCP. Measures Core Web Vitals (LCP, INP, CLS) and supplementary metrics (FCP, TBT, Speed Index), identifies render-blocking resources, network dependency chains, layout shifts, caching issues, and accessibility gaps. Use when asked to audit, profile, debug, or optimize page load performance, Lighthouse scores, or site speed. Biases towards retrieval from current documentation over pre-trained knowledge.
---

# Web Performance Audit

Your knowledge of web performance metrics, thresholds, and tooling APIs may be outdated. **Prefer retrieval over pre-training** when citing specific numbers or recommendations.

## Retrieval Sources

| Source | How to retrieve | Use for |
|--------|----------------|---------|
| web.dev | `https://web.dev/articles/vitals` | Core Web Vitals thresholds, definitions |
| Chrome DevTools docs | `https://developer.chrome.com/docs/devtools/performance` | Tooling APIs, trace analysis |
| Lighthouse scoring | `https://developer.chrome.com/docs/lighthouse/performance/performance-scoring` | Score weights, metric thresholds |

## Key Guidelines

- **Be assertive**: Verify claims by checking network requests, DOM, or codebase—then state findings definitively.
- **Verify before recommending**: Confirm something is unused before suggesting removal.
- **Quantify impact**: Use estimated savings from insights. Don't prioritize changes with 0ms impact.
- **Skip non-issues**: If render-blocking resources have 0ms estimated impact, note but don't recommend action.
- **Be specific**: Say "compress hero.png (450KB) to WebP" not "optimize images".
- **Prioritize ruthlessly**: A site with 200ms LCP and 0 CLS is already excellent—say so.

## Quick Reference

| Task | Tool Call |
|------|-----------|
| Load page | `navigate_page(url: "...")` |
| Start trace | `performance_start_trace(autoStop: true, reload: true)` |
| Analyze insight | `performance_analyze_insight(insightSetId: "...", insightName: "...")` |
| List requests | `list_network_requests(resourceTypes: ["Script", "Stylesheet", ...])` |
| Request details | `get_network_request(reqid: <id>)` |
| A11y snapshot | `take_snapshot(verbose: true)` |

## Workflow

```
Audit Progress:
- [ ] Phase 1: Performance trace (navigate + record)
- [ ] Phase 2: Core Web Vitals analysis (includes CLS culprits)
- [ ] Phase 3: Network analysis
- [ ] Phase 4: Accessibility snapshot
- [ ] Phase 5: Codebase analysis (skip if third-party site)
```

### Phase 1: Performance Trace

1. Navigate to the target URL:
   ```
   navigate_page(url: "<target-url>")
   ```

2. Start a performance trace with reload to capture cold-load metrics:
   ```
   performance_start_trace(autoStop: true, reload: true)
   ```

3. Wait for trace completion, then retrieve results.

### Phase 2: Core Web Vitals Analysis

Use `performance_analyze_insight` to extract key metrics.

Common insight names:

| Metric | Insight Name | What to Look For |
|--------|--------------|------------------|
| LCP | `LCPBreakdown` | Time to largest contentful paint; breakdown of TTFB, resource load, render delay |
| CLS | `CLSCulprits` | Elements causing layout shifts (images without dimensions, injected content, font swaps) |
| Render Blocking | `RenderBlocking` | CSS/JS blocking first paint |
| Document Latency | `DocumentLatency` | Server response time issues |
| Network Dependencies | `NetworkRequestsDepGraph` | Request chains delaying critical resources |

**Key thresholds (good/needs-improvement/poor):**
- TTFB: < 800ms / < 1.8s / > 1.8s
- FCP: < 1.8s / < 3s / > 3s
- LCP: < 2.5s / < 4s / > 4s
- INP: < 200ms / < 500ms / > 500ms
- TBT: < 200ms / < 600ms / > 600ms
- CLS: < 0.1 / < 0.25 / > 0.25
- Speed Index: < 3.4s / < 5.8s / > 5.8s

### Phase 3: Network Analysis

List all network requests to identify optimization opportunities:
```
list_network_requests(resourceTypes: ["Script", "Stylesheet", "Document", "Font", "Image"])
```

**Look for:**

1. **Render-blocking resources**: JS/CSS in `<head>` without `async`/`defer`/`media` attributes
2. **Network chains**: Resources discovered late because they depend on other resources loading first
3. **Missing preloads**: Critical resources (fonts, hero images, key scripts) not preloaded
4. **Caching issues**: Missing or weak `Cache-Control`, `ETag`, or `Last-Modified` headers
5. **Large payloads**: Uncompressed or oversized JS/CSS bundles

### Phase 4: Accessibility Snapshot

Take an accessibility tree snapshot:
```
take_snapshot(verbose: true)
```

**Flag high-level gaps:**
- Missing or duplicate ARIA IDs
- Elements with poor contrast ratios (check against WCAG AA: 4.5:1 for normal text, 3:1 for large text)
- Focus traps or missing focus indicators
- Interactive elements without accessible names

## Output Format

Present findings as:

1. **Core Web Vitals Summary** - Table with metric, value, and rating (good/needs-improvement/poor)
2. **Top Issues** - Prioritized list of problems with estimated impact (high/medium/low)
3. **Recommendations** - Specific, actionable fixes with code snippets or config changes
