import os
import json
import ssl
import urllib.request
import urllib.error
import sys
sys.stdout.reconfigure(encoding='utf-8')

API_KEY = "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"

API_BASE = os.environ.get('OPENAI_API_BASE', 'https://api.openai.com/v1').rstrip('/')
MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')  # 旧gpt-3.5-turboは非推奨のため既定を変更

payload = {
    "model": MODEL,
    "messages": [
        {"role": "system", "content": "あなたはさいころです"},
        {"role": "user", "content": "さいころを振って、出た目の数を教えて。"}
    ],
    "temperature": 0.7
}

url = f"{API_BASE}/chat/completions"
data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(
    url,
    data=data,
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    method="POST",
)

# 任意: 証明書検証の一時無効化（開発用）OPENAI_INSECURE_SSL=true で有効
ctx = None
if str(os.environ.get("OPENAI_INSECURE_SSL", "false")).lower() in ("1", "true", "yes"):
    ctx = ssl._create_unverified_context()

try:
    with urllib.request.urlopen(req, context=ctx, timeout=int(os.environ.get("OPENAI_TIMEOUT", "60"))) as resp:
        body = resp.read().decode("utf-8", errors="replace")
        obj = json.loads(body)
        print(obj["choices"][0]["message"]["content"].encode("cp932", "ignore").decode("cp932"))

except urllib.error.HTTPError as e:
    err = e.read().decode("utf-8", errors="replace") if hasattr(e, "read") else ""
    raise SystemExit(f"HTTPError {e.code}: {e.reason}\n{err}")
except urllib.error.URLError as e:
    raise SystemExit(f"URLError: {e.reason}")
