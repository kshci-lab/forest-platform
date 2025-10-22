import sys
import os
import json
import fitz  # PyMuPDF ライブラリ
from typing import List, Dict, Optional


def extract_text(pdf_path: str) -> str:
    """PDF からプレーンテキストを抽出して文字列で返す（PyMuPDF を使用）。常に文字列を返す。"""
    try:
        parts: List[str] = []
        with fitz.open(pdf_path) as doc:
            for page in doc:
                parts.append(page.get_text("text"))
        text = "\n".join(parts)
        # 改行コードを正規化
        return text.replace("\r\n", "\n").replace("\r", "\n").strip()
    except Exception as e:
        # 例外を送出せず、エラーメッセージ文字列を返す
        return f"[ERROR extracting {os.path.basename(pdf_path)}: {e}]"


def main() -> None:
    # PHPから渡される今回アップロードされたPDFのパス（省略可）。照合はbasenameで実施
    arg_path: Optional[str] = sys.argv[1] if len(sys.argv) > 1 else None
    current_basename: Optional[str] = os.path.basename(arg_path) if arg_path else None

    script_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(script_dir, "uploads")

    past_documents: List[Dict[str, str]] = []
    current_document: Optional[Dict[str, str]] = None

    if os.path.isdir(uploads_dir):
        # uploads/ 内のすべてのPDFを収集
        all_pdfs = [
            os.path.join(uploads_dir, f)
            for f in os.listdir(uploads_dir)
            if f.lower().endswith(".pdf")
        ]
        # 並び順を固定（ファイル名の辞書順）
        all_pdfs.sort(key=lambda p: os.path.basename(p))

        for pdf in all_pdfs:
            name = os.path.basename(pdf)
            text = extract_text(pdf)
            if current_basename and name == current_basename:
                current_document = {"name": name, "text": text}
            else:
                past_documents.append({"name": name, "text": text})
    else:
        # uploads/ が無い場合は空のまま
        pass

    # 全テキストをまとめた1本の文字列を生成
    past_section_parts: List[str] = []
    for doc in past_documents:
        header = f"--- {doc['name']} ---"
        past_section_parts.append(header + "\n" + (doc.get('text') or ""))
    past_section = "\n\n".join(past_section_parts) if past_section_parts else "(なし)"

    current_section = (current_document.get("text") if current_document else "").strip()
    if not current_section:
        current_section = "(なし)"

    combined_text = f"【過去資料】\n{past_section}\n\n【今回アップロード】\n{current_section}"

    payload = {
        "past_documents": past_documents,                  # 過去資料の配列（各要素: { name, text }）
        "current_document": current_document,              # 今回資料（ { name, text } ）または null
        "combined_text": combined_text                     # 全文を1つに結合した文字列
    }

    # PHP側の shell_exec が受け取れるようにJSONを標準出力へ出力
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
