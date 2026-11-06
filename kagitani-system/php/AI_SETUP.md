# AI goal and means suggestions

The suggestion endpoint does not read from or write to the application database. It sends the selected node and its immediate connected nodes to the OpenAI Responses API and returns suggestions for display. The request sets `store` to `false`. AI responses and unused suggestions are not saved. If the user clicks a suggestion of type `手段`, that chosen item is added as a normal map node and edge through the existing map persistence and undo flows.

The endpoint first reads `ai_api_key` from the repository-root `php/sso_local.php`, then falls back to `OPENAI_API_KEY` in the PHP/Apache environment. `OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`. Keep the local config out of version control and do not put the API key in JavaScript.

The endpoint requires PHP cURL and mbstring extensions, and an authenticated Kagitani system session.
