import os
import json
import ssl
import urllib.request
import urllib.error
import sys
import traceback

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
stdin_error = None
scenario_text = None
try:
    _stdin = sys.stdin.read()
    if _stdin and _stdin.strip():
        scenario_text = _stdin.strip()
except Exception as e:
    # エラー詳細（メッセージ＋スタックトレース）を保持・stderrにも出力
    stdin_error = f"{repr(e)}\n{traceback.format_exc()}"
    print(f"STDIN_READ_ERROR: {stdin_error}", file=sys.stderr)
    scenario_text = None

# 追加: stdinで取得できない場合は環境変数SCENARIOから取得
if not scenario_text:
    env_scenario = os.environ.get('SCENARIO')
    if env_scenario and env_scenario.strip():
        scenario_text = env_scenario.strip()

# 受け取ったシナリオをプロンプトへ埋め込む
if scenario_text:
    messages = [
        {"role": "system", "content": "あなたは論文の評論家です。論文シナリオに対して、内容に踏み込んだ専門的なコメントを行います。書かれていないことについて憶測で指摘することは禁止します。"},
        {"role": "user", "content": f"これから論文シナリオを送ります。改善点があれば指摘してください。論文シナリオには以下の3点が含まれるべきです：1. 解決したい問題は何か、なぜその問題が重要なのか  2. 本研究で明らかにしたいこと（研究目的）  3. どのような手法で主張を裏付けるか（アプローチ）指摘する際には、必ず「1・2・3のどの観点からの指摘なのか」を明記してください。次に論文シナリオを送ります。\n\n--- 論文シナリオ ---\n{scenario_text}"}
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

        # 画面にはAI応答のみ出力
        out = reply

        print(out.encode("cp932", "ignore").decode("cp932"))
except urllib.error.HTTPError as e:
    err = e.read().decode("utf-8", errors="replace") if hasattr(e, "read") else ""
    raise SystemExit(f"HTTPError {e.code}: {e.reason}\n{err}")
except urllib.error.URLError as e:
    raise SystemExit(f"URLError: {e.reason}")
