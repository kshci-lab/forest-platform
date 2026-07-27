import re

filepath = '/Applications/MAMP/htdocs/forest-platform/kagitani-system/js/object-network.js'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Replace addNodeBetweenEdge
pattern1 = re.compile(r'    // エッジの間にノードを追加\n    addNodeBetweenEdge\(edgeId\) \{.*?(?=    // モーダル一元管理（追加・編集・接続）)', re.DOTALL)

replacement1 = '''    // エッジの間にノードを追加
    addNodeBetweenEdge(edgeId) {
        console.log(`エッジ ${edgeId} の間にノードを追加中...`);
        
        // エッジが存在するかチェック
        const edge = this.edges.get(edgeId);
        if (!edge) {
            console.error(`エッジ ${edgeId} が見つかりません`);
            return;
        }
        
        // プラスボタンを非表示
        this.hideAddEdgeButton();
        
        // モーダルを開く
        this.openActionModal({
            mode: 'insert',
            targetEdgeId: edgeId
        });
    }

'''
content = pattern1.sub(replacement1, content)

# 2. Add 'insert' mode to openActionModal setup
pattern2 = re.compile(r'(            } else \{\n                parentNode = editNode; // フォールバック\n            \}\n            \n            // 既存の理由を取得 \(providedReason がない場合\).*?\n        \})', re.DOTALL)

replacement2 = r'''\1 else if (mode === 'insert') {
            const edge = this.edges.get(config.targetEdgeId);
            if (!edge) return;
            parentNode = this.nodes.get(edge.from);
            btnSubmit.textContent = '間に手段追加';
        }'''
content = pattern2.sub(replacement2, content)

# 3. Add 'insert' to inputs reset
pattern3 = re.compile(r'(        \} else if \(mode === \'connect\'\) \{\n            const rawLabel = editNode\.label \|\| editNode\.topic \|\| \'\';\n            inputName\.value = rawLabel\.replace\(/\\r\?\\n\|\\r/g, \'\'\);\n            inputReason\.value = \'\';\n        \})')

replacement3 = r'''\1 else if (mode === 'insert') {
            inputName.value = '';
            inputReason.value = '';
        }'''
content = pattern3.sub(replacement3, content)

with open(filepath, 'w') as f:
    f.write(content)

print("Done replacing the rest.")
