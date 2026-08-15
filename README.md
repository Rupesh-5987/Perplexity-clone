                    ┌─────────────────────┐
                    │      User Query     │
                    │ "Best AI frameworks"│
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │   Query Processor   │
                    │  + Query Rewriting  │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │    Web Search API   │
                    │ Tavily / Serper etc │
                    └──────────┬──────────┘
                               ↓
              ┌────────────────┴────────────────┐
              ↓                                 ↓
      Search Results                     Extract Content
      title + URL + snippet              from webpages
              │                                 │
              └────────────────┬────────────────┘
                               ↓
                    ┌─────────────────────┐
                    │  Relevant Context   │
                    │   / Reranking       │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │       LLM           │
                    │ Gemini / OpenAI etc. │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Streaming Answer    │
                    │ + Citations [1][2]  │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │   React Frontend    │
                    └─────────────────────┘
