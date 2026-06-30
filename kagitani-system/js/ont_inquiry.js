// 初期設定（allボタンを押した時の関数定義）
//動的ではない
//いったんHTMLを空にする
$(function(){

	$("div#testxml").html("");

});

// 【追加】グローバルな状態管理
window.inquiryData = [];
window.filterState = {
    textQuery: "",
    selectedTags: []
};

// XML読み込み
function c_xmlLoad(){

	// $("div#intention").html("");
	$("div#testxml").html("");

	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:c_parse_xml

	});

}

// XMLデータを取得
function c_parse_xml(xml,status){

	if(status!='success')return;
	window.inquiryData = []; // 初期化
	$(xml).find('W_CONCEPTS').each(function(){
		c_disp.call(this);
	});
	
	// データ生成完了後に初回描画
	window.renderInquiries();
	window.initSuggestDropdown();

	if (typeof document !== 'undefined') {
		document.dispatchEvent(new CustomEvent('inquiry-list-updated'));
	}
}

// 【新規】サジェストドロップダウンの初期化
window.initSuggestDropdown = function() {
    var dropdown = document.getElementById('searchSuggestDropdown');
    var input = document.getElementById('questionSearchInput');
    if(!dropdown || !input) return;

    var getKeyword = function(str) {
        if (!str) return '';
        var s = str;
        var suffixes = [
            'に落とし込めるかを考える',
            'に落とし込む',
            'に反していないかを考える',
            'をする',
            'を考える',
            'を位置づける',
            'を明確にする',
            'を見定める',
            'を振り返る',
            'を意識する',
            'に分解する',
            'を設定する',
            'を見つける',
            'を発見する',
            'を進める',
            'を解決する',
            'を行う',
            'を想定する'
        ];
        suffixes.forEach(function(suf) {
            if (s.endsWith(suf)) {
                s = s.slice(0, -suf.length);
            }
        });
        return s;
    };

    var concepts = [];
    var blockList = ['前回のMT内容', '取り組む意義がある問題か'];
    
    window.inquiryData.forEach(function(item) {
        var keyword = getKeyword(item.conceptContent);
        if(keyword && !concepts.includes(keyword) && keyword.length <= 15 && !blockList.includes(keyword)) {
            concepts.push(keyword);
        }
    });

    // 重要なキーワード（以前のチップにあったもの）を先頭に移動
    var priorityKeywords = ['論文', 'システム', '学習者', '困難性'];
    // 逆順で unshift することで、定義した通りの順序で先頭に並ぶようにする
    priorityKeywords.reverse().forEach(function(k) {
        var idx = concepts.indexOf(k);
        if (idx !== -1) {
            concepts.splice(idx, 1);
        }
        concepts.unshift(k);
    });

    // 最大表示数を制限（多すぎると邪魔になるため適度に30件程度）
    concepts = concepts.slice(0, 30);
    
    dropdown.innerHTML = '';
    concepts.forEach(function(c) {
        var item = document.createElement('div');
        item.className = 'suggest-dropdown-item';
        item.textContent = c;
        item.onmousedown = function(e) {
            e.preventDefault(); 
            input.value = c;
            window.updateFilter(c, []);
            dropdown.style.display = 'none';
        };
        dropdown.appendChild(item);
    });

    input.addEventListener('focus', function() {
        if(dropdown.children.length > 0) {
            dropdown.style.display = 'block';
        }
    });
    input.addEventListener('blur', function() {
        dropdown.style.display = 'none';
    });
    input.addEventListener('input', function() {
        var q = this.value.toLowerCase();
        var hasVisible = false;
        Array.from(dropdown.children).forEach(function(child) {
            if(child.textContent.toLowerCase().includes(q)) {
                child.style.display = 'block';
                hasVisible = true;
            } else {
                child.style.display = 'none';
            }
        });
        dropdown.style.display = hasVisible ? 'block' : 'none';
    });
};

// HTML生成関数
function c_disp(){

	//console.log(this);　
	//上と下のthisは法造のノード情報，親子関係を全て取得している．

	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT');
	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	var $concept = $(this).find('SLOT').text();
	var $parent = $(this).find('R_CONST').text();

	// 言語切替用: グローバル window.currentLang (default 'ja')
	var lang = window.currentLang || 'ja';
	// 問い文の辞書
	var inquiryDict = {
	'時間的制約を考慮すると、その計画は現実的ですか？': { ja: '時間的制約を考慮すると、その計画は現実的ですか？', en: 'Considering time constraints, is the plan realistic?' },
	'実践は行いましたか？': { ja: '実践は行いましたか？', en: 'Did you carry out the practice?' },
	'どのようなスキルの向上を目掛けていますか？': { ja: 'どのようなスキルの向上を目掛けていますか？', en: 'What skills are you aiming to improve?' },
	'学習ドメインはどのようなものですか？': { ja: '学習ドメインはどのようなものですか？', en: 'What is the learning domain?' },
	'研究の着想はどのようなものですか？': { ja: '研究の着想はどのようなものですか？', en: 'What is the research idea?' },
	'実践対象者はどのような人を想定していますか？': { ja: '実践対象者はどのような人を想定していますか？', en: 'What kind of people are assumed as practice subjects?' },
	'学習教材はどのようなものですか？': { ja: '学習教材はどのようなものですか？', en: 'What are the learning materials?' },
	'学習者が取り組む活動はどのようなものですか？': { ja: '学習者が取り組む活動はどのようなものですか？', en: 'What activities do learners engage in?' },
	'システム上での学習者の入力はどのようなものですか？': { ja: 'システム上での学習者の入力はどのようなものですか？', en: 'What kind of input do learners provide in the system?' },
	'システムの内部処理はどのようなものですか？': { ja: 'システムの内部処理はどのようなものですか？', en: 'What is the internal processing of the system?' },
	'システムの出力情報はどのようなものですか？': { ja: 'システムの出力情報はどのようなものですか？', en: 'What is the output information of the system?' },
	'学びの困難性はどのようなものですか？': { ja: '学びの困難性はどのようなものですか？', en: 'What are the difficulties in learning?' },
	'技術的な困難性はどのようなものですか？': { ja: '技術的な困難性はどのようなものですか？', en: 'What are the technical difficulties?' },
	'研究目的達成のインパクトはどのようなものですか？': { ja: '研究目的達成のインパクトはどのようなものですか？', en: 'What is the impact of achieving the research purpose?' },
	'理想の学習者像はどのようなものですか？': { ja: '理想の学習者像はどのようなものですか？', en: 'What is the ideal image of a learner?' },
	'どのような信頼性がありますか？': { ja: 'どのような信頼性がありますか？', en: 'What kind of reliability does it have?' },
	'根拠は何ですか？': { ja: '根拠は何ですか？', en: 'What is the basis?' },
	'主張は何ですか？': { ja: '主張は何ですか？', en: 'What is the claim?' },
	'どのような新規性がありますか？': { ja: 'どのような新規性がありますか？', en: 'What kind of novelty does it have?' },
	'研究の新しい進捗はどのようなものですか？': { ja: '研究の新しい進捗はどのようなものですか？', en: 'What are the new research developments?' },
	'関連研究との違いはどのようなものですか？': { ja: '関連研究との違いはどのようなものですか？', en: 'What are the differences from related research?' },
	'解決手法は具体的に何ですか？': { ja: '解決手法は具体的に何ですか？', en: 'What is the specific solution method?' },
	'関連研究はどのようなものがありますか？': { ja: '関連研究はどのようなものがありますか？', en: 'What related research exists?' },
	'研究計画はどのようなものですか？': { ja: '研究計画はどのようなものですか？', en: 'What is the research plan?' },
	'システムの知的さは何ですか？': { ja: 'システムの知的さは何ですか？', en: 'What is the intelligence of the system?' },
	'学習者モデルはどのようなものですか？': { ja: '学習者モデルはどのようなものですか？', en: 'What is the learner model?' },
	'教授戦略はどのようなものですか？': { ja: '教授戦略はどのようなものですか？', en: 'What is the teaching strategy?' },
	'システムの支援機能はどのようなものですか？': { ja: 'システムの支援機能はどのようなものですか？', en: 'What are the support functions of the system?' },
	'学習課題はどのようなものですか？': { ja: '学習課題はどのようなものですか？', en: 'What are the learning tasks?' },
	'主張を支える根拠を考えられていますか？': { ja: '主張を支える根拠を考えられていますか？', en: 'Is the basis for the claim considered?' },
	'提案と前提の合理性について考えられていますか？': { ja: '提案と前提の合理性について考えられていますか？', en: 'Is the rationality of the proposal and premise considered?' },
	'事実に基づいて推測を考えられていますか？': { ja: '事実に基づいて推測を考えられていますか？', en: 'Is the speculation based on facts considered?' },
	'議論目的に沿った指針を考えられていますか？': { ja: '議論目的に沿った指針を考えられていますか？', en: 'Are guidelines in line with the discussion purpose considered?' },
	'それは実践に落とし込めますか？': { ja: 'それは実践に落とし込めますか？', en: 'Can this be put into practice?' },
	'それは論文に落とし込めますか？': { ja: 'それは論文に落とし込めますか？', en: 'Can this be put into a paper?' },
	'それはシステムに落とし込めますか？': { ja: 'それはシステムに落とし込めますか？', en: 'Can this be implemented in a system?' },
	'優先順位はどうなりますか？': { ja: '優先順位はどうなりますか？', en: 'What is the priority order?' },
	'これは本当に取り組む意義のある問題ですか？': { ja: 'これは本当に取り組む意義のある問題ですか？', en: 'Is this truly a meaningful problem to tackle?' },
	'それは研究に落とし込めますか？': { ja: 'それは研究に落とし込めますか？', en: 'Can this be applied to research?' },
	'他の選択肢は考えられますか？': { ja: '他の選択肢は考えられますか？', en: 'Are there other options?' },
	'要約するとどうなりますか？': { ja: '要約するとどうなりますか？', en: 'How would you summarize it?' },
	'これは倫理に反していませんか？': { ja: 'これは倫理に反していませんか？', en: 'Is this against ethics?' },
	// '前回のMTの内容はどのようなものでしたか？': { ja: '前回のMTの内容はどのようなものでしたか？', en: 'What was discussed in the previous MT?' },
	'今の自分の能力はどれくらいですか？': { ja: '今の自分の能力はどれくらいですか？', en: 'What is your current ability level?' },
	'議論参加者の観点から考えられていますか？': { ja: '議論参加者の観点から考えられていますか？', en: 'Is this considered from the participants’ perspective?' },
	'査読者の観点から考えられていますか？': { ja: '査読者の観点から考えられていますか？', en: 'Is this considered from the reviewers’ perspective?' },
	'どのような妥当性がありますか？': { ja: 'どのような妥当性がありますか？', en: 'What kind of validity does it have?' },
	'どのような有用性がありますか？': { ja: 'どのような有用性がありますか？', en: 'What kind of usefulness does it have?' },
	'どのような汎用性がありますか？': { ja: 'どのような汎用性がありますか？', en: 'What kind of generality does it have?' },
	'原因は何ですか？': { ja: '原因は何ですか？', en: 'What is the cause?' },
	'必要条件は何ですか？': { ja: '必要条件は何ですか？', en: 'What are the necessary conditions?' },
	'議論すべき内容は何ですか？': { ja: '議論すべき内容は何ですか？', en: 'What should be discussed?' },
	// '議論目的は何ですか': { ja: '議論目的は何ですか', en: 'What is the purpose of the discussion?' },
	'今後の課題は何ですか？': { ja: '今後の課題は何ですか？', en: 'What are the future issues?' },
	'なぜそう考えるのですか？': { ja: 'なぜそう考えるのですか？', en: 'Why do you think so?' },
	'目的は何ですか？': { ja: '目的は何ですか？', en: 'What is the purpose?' },
	'なぜこれらは合理的であるといえるのですか？': { ja: 'なぜこれらは合理的であるといえるのですか？', en: 'Why can these be considered rational?' },
	// Section headers
	'【理由・目的】': { ja: '【理由・目的】', en: '[Reason/Purpose]' },
	'【合理性】': { ja: '【合理性】', en: '[Rationality]' },
	'研究仮説は何ですか？': { ja: '研究仮説は何ですか？', en: 'What is the research hypothesis?' },
	'サブゴールは何ですか？': { ja: 'サブゴールは何ですか？', en: 'What is the sub-goal?' },
	'学習目標は何ですか？': { ja: '学習目標は何ですか？', en: 'What is the learning objective?' },
	'研究目的は何ですか？': { ja: '研究目的は何ですか？', en: 'What is the research purpose?' },
	'システムデザインはどのようなものですか？': { ja: 'システムデザインはどのようなものですか？', en: 'What is the system design like?' },
	'問題を課題に分解するとどうなりますか？': { ja: '問題を課題に分解するとどうなりますか？', en: 'How does the problem break down into tasks?' },
	'評価方法はどのようなものですか？': { ja: '評価方法はどのようなものですか？', en: 'What are the evaluation_good methods?' },
	'特徴は何ですか？': { ja: '特徴は何ですか？', en: 'What are the characteristics?' },
	'実践のデザインはどのようなものですか？': { ja: '実践のデザインはどのようなものですか？', en: 'What is the design of the practice?' },
	'研究背景はどのように位置づけられますか？': { ja: '研究背景はどのように位置づけられますか？', en: 'How is the research background positioned?' },
	'自分の研究はどのようなものですか？': { ja: '自分の研究はどのようなものですか？', en: 'What is your research about?' },
	'どのような問題を発見しましたか？': { ja: 'どのような問題を発見しましたか？', en: 'What problems did you find?' },
	'どのように課題を解決しますか？': { ja: 'どのように課題を解決しますか？', en: 'How will you solve the issues?' },
	'学習支援の方法は何ですか？': { ja: '学習支援の方法は何ですか？', en: 'What are the learning support methods?' },
	'共通点は何ですか？': { ja: '共通点は何ですか？', en: 'What are the common points?' },
	'相違点は何ですか？': { ja: '相違点は何ですか？', en: 'What are the differences?' },
	'実践方法はどのようなものですか？': { ja: '実践方法はどのようなものですか？', en: 'What are the practical methods?' },
	'これは目的を達成できていますか？': { ja: 'これは目的を達成できていますか？', en: 'Is this achieving the objective?' },
	'時間的制約を考慮すると、その計画は現実的ですか？': { ja: '時間的制約を考慮すると、その計画は現実的ですか？', en: 'Considering time constraints, is the plan realistic?' },
	'実践は行いましたか？': { ja: '実践は行いましたか？', en: 'Did you carry out the practice?' },
	'どのようなスキルの向上を目掛けていますか？': { ja: 'どのようなスキルの向上を目掛けていますか？', en: 'What skills are you aiming to improve?' },
	'学習ドメインはどのようなものですか？': { ja: '学習ドメインはどのようなものですか？', en: 'What is the learning domain?' },
	'研究の着想はどのようなものですか？': { ja: '研究の着想はどのようなものですか？', en: 'What is the research idea?' },
	'実践対象者はどのような人を想定していますか？': { ja: '実践対象者はどのような人を想定していますか？', en: 'What kind of people are assumed as practice subjects?' },
	'学習教材はどのようなものですか？': { ja: '学習教材はどのようなものですか？', en: 'What are the learning materials?' },
	'学習者が取り組む活動はどのようなものですか？': { ja: '学習者が取り組む活動はどのようなものですか？', en: 'What activities do learners engage in?' },
	'システム上での学習者の入力はどのようなものですか？': { ja: 'システム上での学習者の入力はどのようなものですか？', en: 'What kind of input do learners provide in the system?' },
	'システムの内部処理はどのようなものですか？': { ja: 'システムの内部処理はどのようなものですか？', en: 'What is the internal processing of the system?' },
	'システムの出力情報はどのようなものですか？': { ja: 'システムの出力情報はどのようなものですか？', en: 'What is the output information of the system?' },
	'学びの困難性はどのようなものですか？': { ja: '学びの困難性はどのようなものですか？', en: 'What are the difficulties in learning?' },
	'技術的な困難性はどのようなものですか？': { ja: '技術的な困難性はどのようなものですか？', en: 'What are the technical difficulties?' },
	'研究目的達成のインパクトはどのようなものですか？': { ja: '研究目的達成のインパクトはどのようなものですか？', en: 'What is the impact of achieving the research purpose?' },
	'理想の学習者像はどのようなものですか？': { ja: '理想の学習者像はどのようなものですか？', en: 'What is the ideal image of a learner?' },
	'どのような信頼性がありますか？': { ja: 'どのような信頼性がありますか？', en: 'What kind of reliability does it have?' },
	'根拠は何ですか？': { ja: '根拠は何ですか？', en: 'What is the basis?' },
	'主張は何ですか？': { ja: '主張は何ですか？', en: 'What is the claim?' },
	'どのような新規性がありますか？': { ja: 'どのような新規性がありますか？', en: 'What kind of novelty does it have?' },
	'研究の新しい進捗はどのようなものですか？': { ja: '研究の新しい進捗はどのようなものですか？', en: 'What are the new research developments?' },
	'関連研究との違いはどのようなものですか？': { ja: '関連研究との違いはどのようなものですか？', en: 'What are the differences from related research?' },
	'解決手法は具体的に何ですか？': { ja: '解決手法は具体的に何ですか？', en: 'What is the specific solution method?' },
	'関連研究はどのようなものがありますか？': { ja: '関連研究はどのようなものがありますか？', en: 'What related research exists?' },
	'研究計画はどのようなものですか？': { ja: '研究計画はどのようなものですか？', en: 'What is the research plan?' },
	'システムの知的さは何ですか？': { ja: 'システムの知的さは何ですか？', en: 'What is the intelligence of the system?' },
	'学習者モデルはどのようなものですか？': { ja: '学習者モデルはどのようなものですか？', en: 'What is the learner model?' },
	'教授戦略はどのようなものですか？': { ja: '教授戦略はどのようなものですか？', en: 'What is the teaching strategy?' },
	'システムの支援機能はどのようなものですか？': { ja: 'システムの支援機能はどのようなものですか？', en: 'What are the support functions of the system?' },
	'学習課題はどのようなものですか？': { ja: '学習課題はどのようなものですか？', en: 'What are the learning tasks?' },
	'主張を支える根拠を考えられていますか？': { ja: '主張を支える根拠を考えられていますか？', en: 'Is the basis for the claim considered?' },
	'提案と前提の合理性について考えられていますか？': { ja: '提案と前提の合理性について考えられていますか？', en: 'Is the rationality of the proposal and premise considered?' },
	'事実に基づいて推測を考えられていますか？': { ja: '事実に基づいて推測を考えられていますか？', en: 'Is the speculation based on facts considered?' },
	'議論目的に沿った指針を考えられていますか？': { ja: '議論目的に沿った指針を考えられていますか？', en: 'Are guidelines in line with the discussion purpose considered?' },
		'議論目的は何ですか？': { ja: '議論目的は何ですか？', en: 'What is the purpose of the discussion?' },
		'実践の目的は何ですか？': { ja: '実践の目的は何ですか？', en: 'What is the purpose of the practice?' },
		'これは事実ですか？推測ですか？': { ja: 'これは事実ですか？推測ですか？', en: 'Is this a fact or a speculation?' },
		'具体例はどのようなものがありますか？': { ja: '具体例はどのようなものがありますか？', en: 'What are some concrete examples?' },
		'言い換えるとどのようになりますか？': { ja: '言い換えるとどのようになりますか？', en: 'How would you rephrase it?' },
		'この言葉の定義は何ですか？': { ja: 'この言葉の定義は何ですか？', en: 'What is the definition of this term?' },
		'反論としてはどのようなものが考えられますか？': { ja: '反論としてはどのようなものが考えられますか？', en: 'What counterarguments can be considered?' },
		'前提条件は何ですか？': { ja: '前提条件は何ですか？', en: 'What are the prerequisites?' },
		// '自分の興味は何ですか？': { ja: '自分の興味は何ですか？', en: 'What are your interests?' },
		// '悩んでいることは何ですか？': { ja: '悩んでいることは何ですか？', en: 'What are you worried about?' },
		'メリットは何ですか？': { ja: 'メリットは何ですか？', en: 'What are the advantages?' },
		'デメリットは何ですか？': { ja: 'デメリットは何ですか？', en: 'What are the disadvantages?' },
		'学習者はどのような人を想定していますか？': { ja: '学習者はどのような人を想定していますか？', en: 'What kind of learners are assumed?' },
		'評価者はどのような人を想定していますか？': { ja: '評価者はどのような人を想定していますか？', en: 'What kind of evaluators are assumed?' },
		'実践仮説は何ですか？': { ja: '実践仮説は何ですか？', en: 'What is the practical hypothesis?' },
		'実践の手順はどのようなものですか？': { ja: '実践の手順はどのようなものですか？', en: 'What are the steps of the practice?' },
		'実践の理想の結果は何ですか？': { ja: '実践の理想の結果は何ですか？', en: 'What is the ideal outcome of the practice?' },
		'実践の考察は何ですか？': { ja: '実践の考察は何ですか？', en: 'What are the reflections on the practice?' },
	};
	window.inquiryDict = inquiryDict;

	for(var i=0; i<$concept_tag.length; i++){
		// 属性が存在するか、あるいはnull/undefinedでないかを正しく判定する
		if($concept_tag[i].getAttribute('instantiation') != null){
			var $id = $concept_tag[i].id;
			var $inquiry_content = $label[i].childNodes[0].nodeValue;
			var $isa = $(this).find('ISA');
			
			for(var j=0; j<$isa.length; j++){
				if($isa[j].getAttribute('child') == $inquiry_content){
					var $concept_content = $isa[j].getAttribute('parent');
					for(var k=0; k<$label.length; k++){
						if($label[k].childNodes[0].nodeValue == $concept_content){
							var $concept_id = $concept_tag[k].id;
							
							var targetCategory = 'testxml'; // 【情報の表出化】
							if($inquiry_content == 'なぜそう考えるのですか？' || $inquiry_content == '目的は何ですか？'){
								targetCategory = 'intention'; // 【理由・目的】
							} else if($inquiry_content == 'なぜこれらは合理的であるといえるのですか？'){
								targetCategory = 'rationality'; // 【合理性】
							}
							
							var ignoredQuestions = [
								'自分の興味は何ですか？',
								'悩んでいることは何ですか？',
								'前回のMTの内容はどのようなものでしたか？',
								'時間的制約を考慮すると，その計画は現実的ですか？',
								'時間的制約を考慮すると、その計画は現実的ですか？',
								'議論目的に沿った指針を考えられていますか？',
								'議論目的は何ですか',
								'議論目的は何ですか？',
								'議論すべき内容は何ですか？',
								'議論参加者の観点から考えられていますか？'
							];
							
							if (ignoredQuestions.indexOf($inquiry_content) === -1) {
								window.inquiryData.push({
									id: $id,
									conceptId: $concept_id,
									content: $inquiry_content,
									conceptContent: $concept_content,
									category: targetCategory,
									tags: []
								});
							}
						}
					}
				}
			}
		}
	}
}

function showGeneration(){
	//問い一覧箇所の表示
	$("div#testxml").html("");		//[情報の表出化]　を空白に
	$("div#intention").html("");	//[理由・目的]　を空白に
	$("div#rationality").html("");	//[合理性]　を空白に
	// console.log("showGeneration");
	c_xmlLoad();
	var dict = window.inquiryDict || {};
	// Section header for 【理由・目的】
	var lang = window.currentLang || 'ja';
	var reasonHeader = dict['【理由・目的】'] ? dict['【理由・目的】'][lang] : (lang === 'en' ? '[Reason/Purpose]' : '【理由・目的】');
	$("div#intention").html('<div style="background-color: #69a7ff; color: white; padding: 3px 6px; text-align: center; font-weight: bold; margin-bottom: 7px; margin-top: 10px; border-radius: 4px; font-size: 12px;">' + reasonHeader + '</div>');
	// Section header for 【合理性】
	var rationalityHeader = dict['【合理性】'] ? dict['【合理性】'][lang] : (lang === 'en' ? '[Rationality]' : '【合理性】');
	$("div#rationality").html('<div style="background-color: #69a7ff; color: white; padding: 3px 6px; text-align: center; font-weight: bold; margin-bottom: 7px; margin-top: 10px; border-radius: 4px; font-size: 12px;">' + rationalityHeader + '</div>');
}

// 言語切替イベント (index.php から呼び出し)
window.setInquiryLang = function(lang) {
	window.currentLang = lang;
	showGeneration();
};

// index.phpを読み込むたびに関数実行
$(function(){
	c_xmlLoad();
});

// 【新規】検索時の状態更新
window.updateFilter = function(text, tags) {
    console.log("--- 検索イベント発火 ---", text);
    window.filterState.textQuery = text.toLowerCase();
    if (tags) {
        window.filterState.selectedTags = tags;
    }
    window.renderInquiries();
};

// 【新規】再描画処理
window.renderInquiries = function() {
    var lang = window.currentLang || 'ja';
    var dict = window.inquiryDict || {};

    var testxml = document.getElementById("testxml");
    var intention = document.getElementById("intention");
    var rationality = document.getElementById("rationality");
    
    if(testxml) testxml.innerHTML = "";
    if(intention) {
        var reasonHeader = dict['【理由・目的】'] ? dict['【理由・目的】'][lang] : (lang === 'en' ? '[Reason/Purpose]' : '【理由・目的】');
        intention.innerHTML = '<div class="category-header" style="background-color: #69a7ff; color: white; padding: 3px 6px; text-align: center; font-weight: bold; margin-bottom: 7px; margin-top: 10px; border-radius: 4px; font-size: 12px;">' + reasonHeader + '</div>';
    }
    if(rationality) {
        var rationalityHeader = dict['【合理性】'] ? dict['【合理性】'][lang] : (lang === 'en' ? '[Rationality]' : '【合理性】');
        rationality.innerHTML = '<div class="category-header" style="background-color: #69a7ff; color: white; padding: 3px 6px; text-align: center; font-weight: bold; margin-bottom: 7px; margin-top: 10px; border-radius: 4px; font-size: 12px;">' + rationalityHeader + '</div>';
    }

    var filtered = window.inquiryData.filter(function(item) {
        var translatedContent = dict[item.content] ? dict[item.content][lang] : item.content;
        var matchText = translatedContent.toLowerCase().includes(window.filterState.textQuery);
        if (window.filterState.textQuery.length > 0) {
            console.log("データ比較中:", translatedContent, " vs ", window.filterState.textQuery, " -> ", matchText);
        }
        var matchTag = window.filterState.selectedTags.length === 0 || 
                       window.filterState.selectedTags.some(function(tag) { return item.tags.includes(tag); });
        
        return matchText && matchTag;
    });

    console.log("フィルタリング結果件数:", filtered.length);

    filtered.forEach(function(item) {
        var container = document.getElementById(item.category);
        if(!container) return;

        var ultag = document.createElement('ul');
        ultag.className = item.conceptId + ' inquiry-item';
        ultag.setAttribute('data-inquiry', item.content);
        ultag.setAttribute('data-concept', item.conceptContent);
        ultag.state = 'hide';
        container.appendChild(ultag);

        var imgtag = document.createElement('img');
        imgtag.src = 'image/list6.png';
        imgtag.style.width = '15px';
        imgtag.style.height = '15px';
        ultag.appendChild(imgtag);

        var atag = document.createElement('a');
        atag.href = '#';
        atag.id = item.id;
        atag.onclick = window.add_node;
        
        if (dict[item.content]) {
            atag.innerHTML = dict[item.content][lang];
        } else {
            atag.innerHTML = item.content;
        }
        ultag.appendChild(atag);
    });

    var areaTitle = document.getElementById('inquiryAreaTitle');
    var areaTitleContainer = areaTitle ? areaTitle.parentNode : null;

    if (filtered.length === 0) {
        if (testxml) {
            testxml.innerHTML = '<div style="text-align: center; color: #64748b; font-size: 12px; margin: 40px 10px; line-height: 1.6;">該当する問いが見つかりませんか？<br>左上の「問いノード追加」ボタンから、<br>自分だけの問いを作ってみましょう！</div>';
        }
        if (intention) intention.innerHTML = '';
        if (rationality) rationality.innerHTML = '';
        if (areaTitleContainer) areaTitleContainer.style.display = 'none';
        
        // フッターを非表示にする（結果0件の時はEmpty Stateがその役割を担うため）
        var footerTip = document.querySelector('.inquiry-list-footer-tip');
        if (footerTip) footerTip.style.display = 'none';
    } else {
        if (areaTitleContainer) areaTitleContainer.style.display = 'block';
        
        // フッターを表示する
        var footerTip = document.querySelector('.inquiry-list-footer-tip');
        if (footerTip) footerTip.style.display = 'block';
        
        // もしカテゴリー内に一件もヒットしていなければ、そのカテゴリーのヘッダーも隠す処理（任意）
        ['intention', 'rationality'].forEach(function(catId) {
            var cat = document.getElementById(catId);
            if(cat) {
                var items = cat.querySelectorAll('ul.inquiry-item');
                if(items.length === 0) {
                    cat.innerHTML = ''; // ヘッダーごと消す
                }
            }
        });
    }
};
