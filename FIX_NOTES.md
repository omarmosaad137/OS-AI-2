# Fix Notes

## Template preview issue

Cause:
The previous seed templates stored line breaks as literal backslash-n text (`\n`), so the preview displayed `\n` instead of actual paragraph breaks.

Fix:
- Added `normalizeText()`.
- Added `normalizeStoredData()` migration.
- `fillTemplate()` now converts literal `\n` into real newlines.
- Template preview textarea was enlarged.

## AI issue

Cause:
The API route was returning only a generic `OpenAI API request failed`.
Common triggers:
- Missing or invalid `OPENAI_API_KEY`
- Vercel environment variable added but project not redeployed
- Model access issue
- API credit/billing issue
- Selected model not available to the account

Fix:
- `/api/ai` now gives a detailed checklist.
- Uses `OPENAI_MODEL` env var if provided.
- Defaults to `gpt-5.2`.
- Returns a demo response if no API key is configured.

## Vercel environment variables

Add these in Vercel > Project > Settings > Environment Variables:

OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5.2

Then redeploy.
