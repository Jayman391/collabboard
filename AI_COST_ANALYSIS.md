# AI Cost Analysis — CollabBoard

## Development & Testing Costs

### LLM API Costs (Anthropic)

| Category | Model | Input Tokens | Output Tokens | Cost |
|----------|-------|-------------|---------------|------|
| AI Agent testing (dev) | Claude Sonnet 4.5 | ~200K | ~80K | ~$1.40 |
| Development via Claude Code | Claude Opus 4 / Sonnet | ~2M | ~500K | ~$35-50 |
| **Total development spend** | | | | **~$37-52** |

### Cost Breakdown by Activity
- **AI agent development & testing:** Multiple iterations of SWOT, kanban, and grid commands during testing. ~50 API calls to Anthropic during development.
- **Claude Code usage:** Full project development over ~1 week, including architecture, implementation, debugging, and documentation.

### Other AI-Related Costs
- Supabase (free tier): $0
- Vercel (free tier): $0
- Render (free tier): $0

## Production Cost Projections

### Assumptions

| Parameter | Value |
|-----------|-------|
| AI commands per user per session | 5 |
| Sessions per user per month | 8 |
| AI commands per user per month | 40 |
| Avg input tokens per command | 3,000 (system prompt + board state + user message) |
| Avg output tokens per command | 1,500 (tool calls + final response) |
| Avg iterations per command | 2.5 (getBoardState + create/modify + response) |
| Model | Claude Sonnet 4.5 |
| Sonnet pricing | $3/M input, $15/M output |

### Per-Command Cost Calculation

Each AI command involves ~2.5 Claude API calls on average:

| Per command | Tokens | Cost |
|-------------|--------|------|
| Input tokens | 3,000 x 2.5 = 7,500 | $0.0225 |
| Output tokens | 1,500 x 2.5 = 3,750 | $0.0563 |
| **Total per command** | | **$0.079** |

### Monthly Cost by Scale

| Users | Commands/Month | API Cost | Supabase | Hosting | **Total** |
|-------|---------------|----------|----------|---------|-----------|
| 100 | 4,000 | $316 | $0 (free) | $0 (free) | **~$316/mo** |
| 1,000 | 40,000 | $3,160 | $25 (Pro) | $7 (Render) | **~$3,192/mo** |
| 10,000 | 400,000 | $31,600 | $25 (Pro) | $25 (Render) | **~$31,650/mo** |
| 100,000 | 4,000,000 | $316,000 | $599 (Team) | $85 (Render) | **~$316,684/mo** |

### Cost Optimization Strategies

1. **Caching board state** — Cache `getBoardState` results for 5s to avoid redundant DB reads. Saves ~1 API call per command for simple operations.

2. **Prompt caching** — Anthropic's prompt caching can reduce input token costs by 90% for the system prompt (~800 tokens repeated every call).

3. **Model tiering** — Use Haiku for simple single-step commands (create one object), Sonnet for complex multi-step commands. Could reduce costs by ~60% since most commands are simple.

4. **Rate limiting** — Already implemented at 10 commands/min per board. Could be tightened per-user.

5. **Batch operations** — Encouraging users to make complex requests ("create a SWOT analysis") rather than individual ones reduces per-object API overhead.

### With Optimizations Applied

| Users | Without Optimization | With Caching + Tiering | Savings |
|-------|---------------------|----------------------|---------|
| 100 | $316/mo | ~$130/mo | 59% |
| 1,000 | $3,192/mo | ~$1,300/mo | 59% |
| 10,000 | $31,650/mo | ~$12,900/mo | 59% |
| 100,000 | $316,684/mo | ~$129,000/mo | 59% |

### Non-AI Infrastructure Costs at Scale

| Component | 100 Users | 1K Users | 10K Users | 100K Users |
|-----------|-----------|----------|-----------|------------|
| Supabase | Free | $25/mo | $25/mo | $599/mo |
| Vercel | Free | Free | $20/mo | $20/mo |
| Render | Free | $7/mo | $25/mo | $85/mo |
| Domain/SSL | $12/yr | $12/yr | $12/yr | $12/yr |

Infrastructure costs are negligible compared to AI API costs. The primary cost driver at every scale is the Anthropic API spend.
