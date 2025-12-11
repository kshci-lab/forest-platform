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

# PHPから標準入力(stdin)で送られたトリプル文字列（triangle）を受け取る。
# 受け取れなかった場合は環境変数から取得する。
stdin_error = None
triangle_text = None
try:
    _stdin = sys.stdin.read()
    if _stdin and _stdin.strip():
        triangle_text = _stdin.strip()
except Exception as e:
    # エラー詳細（メッセージ＋スタックトレース）を保持・stderrにも出力
    stdin_error = f"{repr(e)}\n{traceback.format_exc()}"
    print(f"STDIN_READ_ERROR: {stdin_error}", file=sys.stderr)
    triangle_text = None

# 追加: stdinで取得できない場合は環境変数TRIANGLE（なければSCENARIO）から取得
if not triangle_text:
    env_triangle = os.environ.get('TRIANGLE')
    if env_triangle and env_triangle.strip():
        triangle_text = env_triangle.strip()
    else:
        env_scenario = os.environ.get('SCENARIO')
        if env_scenario and env_scenario.strip():
            triangle_text = env_scenario.strip()

# --- 以前の論文シナリオ分岐を一時停止 ---
# if scenario_text:
#     messages = [
#         {"role": "system", "content": "あなたは論文の評論家です。論文シナリオに対して、内容に踏み込んだ専門的なコメントを行います。書かれていないことについて憶測で指摘することは禁止します。"},
#         {"role": "user", "content": f"これから論文シナリオを送ります。改善点があれば指摘してください。論文シナリオには以下の3点が含まれるべきです：1. 解決したい問題は何か、なぜその問題が重要なのか  2. 本研究で明らかにしたいこと（研究目的）  3. どのような手法で主張を裏付けるか（アプローチ）指摘する際には、必ず「1・2・3のどの観点からの指摘なのか」を明記してください。次に論文シナリオを送ります。\n\n--- 論文シナリオ ---\n{scenario_text}"}
#     ]
# else:
#     messages = [
#         {"role": "system", "content": "あなたは三角ロジックの評論家です。書かれていないことについて憶測で指摘することは禁止します。"},
#         {"role": "user", "content": "今から三角ロジックを送ります。主張がしっかりと裏付けされているか確認して改善点があれば教えて下さい。"}
#     ]

# --- 三角ロジックのみを評価するメッセージ ---
triangle_text = triangle_text or ''
# 追加: 受け取ったトリプル（triangle_text）をコンソールへ出力（stderr）
try:
    print(("[DEBUG triangle_text]\n" + triangle_text).encode("cp932", "ignore").decode("cp932"), file=sys.stderr)
except Exception:
    # エンコード失敗時はそのまま出力
    print("[DEBUG triangle_text]\n" + triangle_text, file=sys.stderr)
messages = [
    {
        "role": "system",
        "content": (
            "あなたは『三角ロジック（主張・根拠・理由付け）』の妥当性を評価する評論家です。\n"
            "三角ロジックとは、学習者が自身の論理構造を明確化し、外在化するための枠組みです。\n\n"
            "日々の研究活動の中では、学習者が自分の主張・根拠・理由付けの関係を常に意識して吟味しているとは限りません。\n"
            "そのため、三角ロジックとして『主張』『根拠』『理由付け』を明示的に記述することで、\n"
            "学習者は自身の思考過程を整理し、論理構造を外在化できます。\n"
            "これは、学習者自身にとってはメタ認知の補助となり、他者にとっては論理の共有化・対象化を助ける役割があります。\n\n"
            "【三角ロジックの構成要素】\n"
            "- 主張（Claim）：学習者が立証したい内容\n"
            "- 根拠（Fact）：主張の基礎となる客観的根拠・データ\n"
            "- 理由付け（Reason）：根拠が主張をどのように支持するかを説明する論理的つながり\n\n"
            "-----------------------------------------\n"
            "■ 評価者として守るべきルール\n"
            "-----------------------------------------\n\n"
            "1. 妥当でない可能性がある場合のみ指摘する。\n"
            "   妥当と判断した場合は一切コメントしない。\n\n"
            "2. 断定しない。\n"
            "   以下のような可能性ベースの表現にとどめる：\n"
            "   - 『〜でない可能性がある』\n"
            "   - 『〜の点で弱い可能性がある』\n"
            "   - 『〜に飛躍がある可能性がある』\n\n"
            "3. ひとつひとつの三角ロジックについて指摘してください。\n"
            "     指摘する場合の観点は以下の3つ：\n"
            "   - 根拠の妥当性（根拠が客観的か、主張と関係しているか）\n"
            "   - 理由付けの妥当性（根拠→主張の論理関係に飛躍がないか）\n"
            "   - 主張の妥当性（根拠と理由付けから主張が導けるか）\n\n"
            "-----------------------------------------\n"
            "■ 入力フォーマット\n"
            "-----------------------------------------\n\n"
            "入力は以下のトリプル形式で与えられる：\n\n"
            "[claim_id: , fact_id: , reason_id: ]\n\n"
            "同じ ID は同じ内容を参照しているものとして扱う。\n\n"
            "さらに、三角ロジックが階層的（ある要素が別の三角ロジックを含むなど）になっている場合は、\n"
            "その階層構造が論理的に適切かどうかも評価対象とする。\n\n"
            "-----------------------------------------\n"
            "■ 出力形式\n"
            "-----------------------------------------\n\n"
            "妥当でない可能性がある場合のみ、以下の形式で出力する：\n\n"
            "【「（主張の内容）」を主張とする三角ロジックについて】\n"
            "（理由）という理由で（指摘対象）が妥当でない可能性がある。\n"
            "「（主張の内容）」には、入力で与えられた主張（Claim）の文章をそのまま挿入すること。\n"
            "妥当と判断した場合は何も出力しない。"
        ),
    },
    {
        "role": "user",
        "content": (
            f"評価対象:\n{triangle_text}"
        ),
    },
]

payload = {
    "model": MODEL,
    "messages": messages,
    "temperature": 0.2,
}
# --- API送信は一時停止（コメントアウト） ---
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

# 代替: ダミー出力（API呼び出し停止中）
# out = f"[AI呼び出し停止中]\n{triangle_text}"
# print(out.encode("cp932", "ignore").decode("cp932"))
