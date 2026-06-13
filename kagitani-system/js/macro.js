//問いエリアの初期化とhozo.xmlの読み込み
function macro_xmlLoad(){

	$.ajax({

		url:'js/hozo_presentation.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:macro_parse_xml

	});

}


// hozo.xmlのパースが成功した場合に，<W_CONCEPTS>のそれぞれに指定関数を適用
function macro_parse_xml(xml,status){
	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(macro_disp);
}


// HTML生成関数
function macro_disp(){

	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	var $isa = $(this).find('ISA');
	var $slot_tag = $(this).find('SLOT');

	console.log($audience_model);

	for(var i=0; i<$label.length; i++){
		for(var j=0; j<$concept_tag[i].childNodes.length; j++){//子ノード（法造でいう部分概念）をまわしている
			if(j % 2 == 1){//jが奇数（textを除く）
				if($concept_tag[i].id == $audience_model){
					if($concept_tag[i].childNodes[j].getElementsByTagName('SLOT').length != 0){
						console.log($concept_tag[i].childNodes[j].getElementsByTagName('SLOT'));
						var slot = $concept_tag[i].childNodes[j].getElementsByTagName('SLOT');
					}
				}
			}
		}
	}

	for(var k=0; k<slot.length; k++){
		console.log(slot[k]);
		console.log(slot[k].getAttribute('class_constraint'));//出力：教育的妥当性がわかるように話されているか
		var perspec = [];
		perspec.push(slot[k].getAttribute('class_constraint'));
	}

	var rational = [];

	for(var i=0; i<perspec.length; i++){
		for(var j=0; j<$isa.length; j++){
			if($isa[j].getAttribute('parent') == perspec[i]){
				rational.push($isa[j].getAttribute('child'));
			}
		}
	}
	console.log(rational);//出力：["育成支援するスキル，システムの出力情報の合理性が話されているか", "研究目的，実践目的の合理性が話されているか"]
	var t = 0;

	for(var i=0; i<rational.length; i++){
		for(var j=0; j<$label.length; j++){
			for(var k=0; k<$concept_tag[j].childNodes.length; k++){//子ノード（法造でいう部分概念）をまわしている
				if(k % 2 == 1){//kが奇数（textを除く）
					if($label[j].textContent == rational[i]){
						if($concept_tag[j].childNodes[k].getElementsByTagName('SLOT').length != 0){
							console.log($concept_tag[j].childNodes[k].getElementsByTagName('SLOT'));
							var slot3 = $concept_tag[j].childNodes[k].getElementsByTagName('SLOT');
							console.log(slot3);
							var parts = [];
							for(var m=0; m<slot3.length; m++){
								console.log(slot3[m]);
								console.log(slot3[m].getAttribute('class_constraint'));
								parts.push(slot3[m].getAttribute('class_constraint'));
								console.log(parts);
							}
							var inner_label = "<div>今回の発表では，"+slot[0].getAttribute('class_constraint')+"が重要視されますが，"+parts[0]+"と"+parts[1]+"の合理性は十分に説明されていますか？</div>"+"<br>";
							console.log(inner_label);
							var fshow = $("#macro_feedback_area");
							fshow.append(inner_label);
							console.log("ok");
							console.log(fshow);
							console.log(document.getElementById("macro_feedback_area"));
						}
					}
				}
			}
		}
	}


}

//
// 教訓一覧ボタンのクリックイベント登録
(function(){
	function attachLessonsButton(){
		var btn = document.getElementById('show-lessons-btn');
		if(!btn) return;
		if(btn._lessonsBound) return; // 二重バインド防止
		btn.addEventListener('click', function(){
			if(typeof window.showLessonLearnedList === 'function'){
				window.showLessonLearnedList();
			} else {
				alert('教訓一覧モジュールが読み込まれていません');
			}
		});
		btn._lessonsBound = true;
	}

	if(document.readyState === 'loading'){
		document.addEventListener('DOMContentLoaded', attachLessonsButton);
	} else {
		attachLessonsButton();
	}
})();

// 縦リサイズ機能（jsmind_container と process_network_container）
(function(){
	function initVerticalResize(){
		const resizeHandle = document.getElementById('vertical-resize-handle');
		const jsmindContainer = document.getElementById('jsmind_container');
		const processContainer = document.getElementById('process_network_container');
		
		if (!resizeHandle || !jsmindContainer || !processContainer) return;

		let isResizing = false;
		let startY = 0;
		let startJsmindHeight = 0;
		let startProcessHeight = 0;
		let hasBeenResized = false; // ユーザーが手動でリサイズしたかどうか

		// jsmind_containerの高さを計算する関数
		function getFullHeight() {
			return window.innerHeight - 73; // ヘッダー(35px) + jsmind_nav(38px)分を引いた高さ
		}

		// process_network_containerの表示状態を監視してリサイズハンドルを表示/非表示
		const observer = new MutationObserver(function(mutations) {
			// リサイズ中は無視
			if (isResizing) return;
			
			mutations.forEach(function(mutation) {
				if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
					const display = window.getComputedStyle(processContainer).display;
					if (display !== 'none') {
						// SRL整理マップが表示されたら
						resizeHandle.style.display = 'block';
						
						// まだ手動リサイズされていない場合のみ、半分に分割
						if (!hasBeenResized) {
							const totalHeight = getFullHeight();
							const halfHeight = Math.floor((totalHeight - 8) / 2); // 8はリサイズハンドルの高さ
							jsmindContainer.style.height = '';
							jsmindContainer.style.flex = '1 1 0%';
							processContainer.style.height = halfHeight + 'px';
							processContainer.style.flex = '0 0 ' + halfHeight + 'px';
						}
						
						// jsMindを再描画
						if (typeof _jm !== 'undefined' && _jm) {
							try { _jm.resize(); } catch(e) {}
						}
					} else {
						// SRL整理マップが非表示になったら、マインドマップを画面いっぱいに
						resizeHandle.style.display = 'none';
						hasBeenResized = false; // リセット
						jsmindContainer.style.height = '';
						jsmindContainer.style.flex = '';
						processContainer.style.height = '';
						processContainer.style.flex = '';
						
						// jsMindを再描画
						if (typeof _jm !== 'undefined' && _jm) {
							try { _jm.resize(); } catch(e) {}
						}
					}
				}
			});
		});
		observer.observe(processContainer, { attributes: true, attributeFilter: ['style'] });

		// 初期状態をチェック
		const initialDisplay = window.getComputedStyle(processContainer).display;
		if (initialDisplay !== 'none') {
			resizeHandle.style.display = 'block';
			const totalHeight = getFullHeight();
			const halfHeight = Math.floor((totalHeight - 8) / 2);
			jsmindContainer.style.height = '';
			jsmindContainer.style.flex = '1 1 0%';
			processContainer.style.height = halfHeight + 'px';
			processContainer.style.flex = '0 0 ' + halfHeight + 'px';
		} else {
			resizeHandle.style.display = 'none';
			// デフォルトは画面いっぱい
			jsmindContainer.style.height = '';
			jsmindContainer.style.flex = '';
			processContainer.style.height = '';
			processContainer.style.flex = '';
		}

		resizeHandle.addEventListener('mousedown', function(e) {
			e.preventDefault();
			isResizing = true;
			startY = e.clientY;
			startJsmindHeight = jsmindContainer.offsetHeight;
			startProcessHeight = processContainer.offsetHeight;
			
			document.body.style.cursor = 'ns-resize';
			document.body.style.userSelect = 'none';
			
			// ドラッグ中のイベントリスナー
			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
		});

		function onMouseMove(e) {
			if (!isResizing) return;
			
			const deltaY = e.clientY - startY;
			const totalHeight = getFullHeight();
			const minHeight = 150;
			const maxProcessHeight = totalHeight - 8 - minHeight;
			
			const newProcessHeight = Math.max(minHeight, Math.min(maxProcessHeight, startProcessHeight - deltaY));
			
			processContainer.style.flex = '0 0 ' + newProcessHeight + 'px';
			processContainer.style.height = newProcessHeight + 'px';
			
			jsmindContainer.style.flex = '1 1 0%';
			jsmindContainer.style.height = '';
			
			// vis.jsのネットワークをリサイズに対応させる
			if (typeof defaultThinkingProcess !== 'undefined' && defaultThinkingProcess.ownNetwork) {
				try {
					defaultThinkingProcess.ownNetwork.redraw();
					defaultThinkingProcess.ownNetwork.fit();
				} catch(e) {}
			}
		}

		function onMouseUp(e) {
			if (!isResizing) return;
			isResizing = false;
			hasBeenResized = true; // ユーザーが手動でリサイズした
			
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
			
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			
			// リサイズ完了後にネットワークを再描画
			if (typeof defaultThinkingProcess !== 'undefined' && defaultThinkingProcess.ownNetwork) {
				try {
					defaultThinkingProcess.ownNetwork.redraw();
				} catch(e) {}
			}
			
			// jsMindも再描画
			if (typeof _jm !== 'undefined' && _jm) {
				try {
					_jm.resize();
				} catch(e) {}
			}
		}

		// タッチデバイス対応
		resizeHandle.addEventListener('touchstart', function(e) {
			e.preventDefault();
			const touch = e.touches[0];
			isResizing = true;
			startY = touch.clientY;
			startJsmindHeight = jsmindContainer.offsetHeight;
			startProcessHeight = processContainer.offsetHeight;
			
			document.addEventListener('touchmove', onTouchMove, { passive: false });
			document.addEventListener('touchend', onTouchEnd);
		});

		function onTouchMove(e) {
			if (!isResizing) return;
			e.preventDefault();
			const touch = e.touches[0];
			const deltaY = touch.clientY - startY;
			const totalHeight = getFullHeight();
			const minHeight = 150;
			const maxProcessHeight = totalHeight - 8 - minHeight;
			
			const newProcessHeight = Math.max(minHeight, Math.min(maxProcessHeight, startProcessHeight - deltaY));
			
			processContainer.style.flex = '0 0 ' + newProcessHeight + 'px';
			processContainer.style.height = newProcessHeight + 'px';
			
			jsmindContainer.style.flex = '1 1 0%';
			jsmindContainer.style.height = '';
		}

		function onTouchEnd(e) {
			if (!isResizing) return;
			isResizing = false;
			hasBeenResized = true;
			
			document.removeEventListener('touchmove', onTouchMove);
			document.removeEventListener('touchend', onTouchEnd);
			
			// リサイズ完了後にネットワークを再描画
			if (typeof defaultThinkingProcess !== 'undefined' && defaultThinkingProcess.ownNetwork) {
				try {
					defaultThinkingProcess.ownNetwork.redraw();
				} catch(e) {}
			}
			if (typeof _jm !== 'undefined' && _jm) {
				try {
					_jm.resize();
				} catch(e) {}
			}
		}
	}

	if(document.readyState === 'loading'){
		document.addEventListener('DOMContentLoaded', initVerticalResize);
	} else {
		initVerticalResize();
	}
})();