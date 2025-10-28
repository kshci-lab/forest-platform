import os
from typing import List
from openai import OpenAI
from openai import APIConnectionError, APIStatusError
from dotenv import load_dotenv

PURPOSE = "assistants"  # 必要に応じて 'fine-tune' などに変更


def list_pdfs(folder: str) -> List[str]:
    if not os.path.isdir(folder):
        return []
    files: List[str] = []
    for name in os.listdir(folder):
        if name.lower().endswith(".pdf"):
            files.append(os.path.join(folder, name))
    files.sort()
    return files


def main() -> None:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # .env を読み込む（なければ何もしない）
    load_dotenv(os.path.join(base_dir, '.env'))
    uploads_dir = os.path.join(base_dir, "uploads")
    pdf_paths = list_pdfs(uploads_dir)

    if not pdf_paths:
        print("uploads にPDFが見つかりません。")
        return

    client = OpenAI()  # 環境変数 OPENAI_API_KEY を使用

    print(f"アップロード対象: {len(pdf_paths)} 件")
    for path in pdf_paths:
        fname = os.path.basename(path)
        try:
            with open(path, "rb") as f:
                resp = client.files.create(file=f, purpose=PURPOSE)
            print(f"[OK] {fname} -> file_id: {resp.id}")
        except (APIConnectionError, APIStatusError) as e:
            print(f"[NG] {fname} -> APIエラー: {e}")
        except Exception as e:
            print(f"[NG] {fname} -> 例外: {e}")


if __name__ == "__main__":
    main()
