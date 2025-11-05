import os
import json
import ssl
import urllib.request
import urllib.error
import sys

# 追加: 親ディレクトリを辿って .env を読み込み（最長6階層）
def _load_dotenv_from_parents(max_up=6):
    base = os.path.abspath(os.path.dirname(__file__))
    for _ in range(max_up + 1):
        env_path = os.path.join(base, '.env')
        if os.path.isfile(env_path):
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith('#') or '=' not in line:
                            continue
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip('\'"')
                        if k and k not in os.environ:
                            os.environ[k] = v
            except Exception:
                pass
            break
        parent = os.path.dirname(base)
        if parent == base:
            break
        base = parent

# 出力/入力のエンコーディング調整
sys.stdout.reconfigure(encoding='utf-8')
try:
    sys.stdin.reconfigure(encoding='utf-8')
except Exception:
    pass

# ここで .env を取り込み
_load_dotenv_from_parents()

# 変更: ハードコーディング撤去し、環境変数から取得
API_KEY = os.environ.get('OPENAI_API_KEY', '').strip()
if not API_KEY:
    print("ERROR: OPENAI_API_KEY が未設定です。.env に OPENAI_API_KEY=... を設定してください。", file=sys.stderr)
    sys.exit(2)

API_BASE = os.environ.get('OPENAI_API_BASE', 'https://api.openai.com/v1').rstrip('/')
MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')  # 旧gpt-3.5-turboは非推奨のため既定を変更

# PHPから標準入力(stdin)で送られた論文シナリオを受け取る。
# 受け取れなかった場合は固定プロンプトで実行する。
scenario_text = None
try:
    _stdin = sys.stdin.read()
    if _stdin and _stdin.strip():
        scenario_text = _stdin.strip()
except Exception:
    scenario_text = None

# 受け取ったシナリオをプロンプトへ埋め込む
if scenario_text:
    messages = [
        {"role": "system", "content": "あなたは論文の評論家です。"},
        {"role": "user", "content": f"書いている内容に踏み込んで欠点を指摘してください。書いていないものについては指摘しないでください\n\n--- 論文シナリオ ---\n{scenario_text}"}
    ]
else:
    messages = [
        {"role": "system", "content": "あなたは論文の評論家です。"},
        {"role": "user", "content": "この論文シナリオの改善点を教えてください。"}
    ]

payload = {
    "model": MODEL,
    "messages": messages,
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
        reply = obj["choices"][0]["message"]["content"]

        # 送信したシナリオのプレビューも出す（本当に渡っているか画面で確認できる）
        if scenario_text:
            preview = scenario_text[:500]
            out = f"【送信シナリオ(先頭500文字)】\n{preview}\n\n【AI応答】\n{reply}"
        else:
            out = reply

        print(out.encode("cp932", "ignore").decode("cp932"))
except urllib.error.HTTPError as e:
    err = e.read().decode("utf-8", errors="replace") if hasattr(e, "read") else ""
    raise SystemExit(f"HTTPError {e.code}: {e.reason}\n{err}")
except urllib.error.URLError as e:
    raise SystemExit(f"URLError: {e.reason}")
