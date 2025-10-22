// let output_input = {};
// const output_list = [];
// //問いエリアの初期化とhozo.xmlの読み込み
// function choose_input_xmlLoad(){
// 	$.ajax({
// 		url:'js/hozo.xml',
// 		type:'get',
// 		dataType:'xml',
// 		timeout:1000,
// 		success:choose_input_parse_xml
// 	});
// }

// // hozo.xmlのパースが成功した場合に，<W_CONCEPTS>のそれぞれに指定関数を適用
// function choose_input_parse_xml(xml,status){
// 	if(status!='success')return;
// 	$(xml).find('W_CONCEPTS').each(choose_input_disp);
// }

// // HTML生成関数
// function choose_input_disp(){
// 	// const output_content = [];
// 	const label = $(this).find('LABEL');
// 	const isa = $(this).find('ISA');
// 	// const choose_sub_cognition = (return_slot) => {
// 	// 	if(return_slot.getAttribute("role") === "出力"){
// 	// 		// console.log(return_slot.getAttribute("class_constraint"))
// 	// 	}else if(return_slot.getAttribute("role") === "サブ認知活動"){
// 	// 		label.map((index_label, content_label)=>{
// 	// 			if(content_label.childNodes[0].nodeValue === return_slot.getAttribute("class_constraint")){
// 	// 				const slot_content = Array.from(content_label.parentNode.getElementsByTagName("SLOT"));
// 	// 				slot_content.map((content_slot) => {
// 	// 					choose_sub_cognition(content_slot);
// 	// 				})
// 	// 				return;
// 	// 			}
// 	// 		});
// 	// 	}
// 	// }
// 	const rationaly_record = (return_slot) => {
// 		let rationaly_label;
// 		let input_count = 0;
// 		for(var i=0; i<return_slot.length; i++){
// 			if(return_slot[i].getAttribute("role") === "入力"){
// 				label.map((index_label2, content_label2) => {
// 					if(return_slot[i].getAttribute('class_constraint') === content_label2.childNodes[0].nodeValue){
// 						const slot_content = Array.from(content_label2.parentNode.getElementsByTagName("SLOT"));
// 						slot_content.map((content_slot2) => {
// 							if(content_slot2.getAttribute("role") === "出力"){
// 								if(!output_list.includes(content_slot2.getAttribute("class_constraint"))) {
// 									output_list.push(content_slot2.getAttribute("class_constraint"));
// 								}
// 								if(input_count == 0){
// 									rationaly_label = content_slot2.getAttribute("class_constraint");
// 								}else{
// 									output_input[rationaly_label] = content_slot2.getAttribute("class_constraint");
// 									output_input[content_slot2.getAttribute("class_constraint")] = rationaly_label;
// 								}
// 							}
// 						});
// 					return;
// 					}
// 				});
// 				input_count += 1;
// 			}
// 		}
// 	}
// 	//hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
// 	isa.map((index, content)=>{
// 		if(content.getAttribute('parent') === "合理性を考える"){
// 			label.map((index_label, content_label) => {
// 				if(content.getAttribute('child') === content_label.childNodes[0].nodeValue){
// 					rationaly_record(Array.from(content_label.parentNode.getElementsByTagName("SLOT")))
// 					return;
// 				}
// 			})
// 		}
// 			// if(return_slot.getAttribute("") === "出力"){
// 			// 	// console.log(return_slot.getAttribute("class_constraint"))
// 			// }else if(return_slot.getAttribute("role") === "サブ認知活動"){
// 			// 	label.map((index_label, content_label)=>{
// 			// 		if(content_label.childNodes[0].nodeValue === return_slot.getAttribute("class_constraint")){
// 			// 			const slot_content = Array.from(content_label.parentNode.getElementsByTagName("SLOT"));
// 			// 			slot_content.map((content_slot) => {
// 			// 				choose_sub_cognition(content_slot);
// 			// 			})
// 			// 			return;
// 			// 		}
// 			// 	});
// 			// }
// 			// choose_isa_cognition(content.getAttribute('child'));
// 		// }else if(content.getAttribute('parent') === "複合活動_認知活動"){
// 		// 	label.map((index_label, content_label)=>{
// 		// 		if(content_label.childNodes[0].nodeValue === content.getAttribute('child')){
// 		// 			const slot_content = Array.from(content_label.parentNode.getElementsByTagName("SLOT"));
// 		// 			slot_content.map((content_slot) => {
// 		// 				choose_sub_cognition(content_slot);
// 		// 			})
// 		// 			return;
// 		// 		}
// 		// 	})
// 		// }
// 	})
// 	// const isa_parent=[];
// 	// isa.map((index, content)=>{
// 	// 	isa_parent.push(content.getAttribute('parent'));
// 	// })
// 	// const choose_isa_cognition = (child_content) => {
// 	// 	label.map((index_label, content_label)=>{
// 	// 		if(content_label.childNodes[0].nodeValue === child_content){
// 	// 			const slot_content = Array.from(content_label.parentNode.getElementsByTagName("SLOT"));
// 	// 			const input_content = [];
// 	// 			slot_content.map((content_slot) => {
// 	// 				if(content_slot.getAttribute("role") === "入力"){
// 	// 					input_content.push(content_slot.getAttribute("class_constraint"));
// 	// 				}
// 	// 			});
// 	// 			if(input_content.length !== 0){
// 	// 				slot_content.map((content_slot) => {
// 	// 					if(content_slot.getAttribute("role") === "出力"){
// 	// 						if(output_content.includes(content_slot.getAttribute("class_constraint"))) {
// 	// 							const input_array = output_input[content_slot.getAttribute("class_constraint")];
// 	// 							input_content.map((n)=>{
// 	// 								if(!input_array.includes(n)) {
// 	// 									input_array.push(n);
// 	// 								}
// 	// 							})
// 	// 							output_input[content_slot.getAttribute("class_constraint")] = input_array;
// 	// 						}else{
// 	// 							output_content.push(content_slot.getAttribute("class_constraint"));
// 	// 							output_input[content_slot.getAttribute("class_constraint")] = input_content;
// 	// 						}
// 	// 					}
// 	// 				})
// 	// 			}
// 	// 			if(isa_parent.includes(content_label.childNodes[0].nodeValue)){
// 	// 				isa.map((index, content)=>{
// 	// 					if(content.getAttribute('parent') === content_label.childNodes[0].nodeValue){
// 	// 						choose_isa_cognition(content.getAttribute('child'));
// 	// 					}
// 	// 				});
// 	// 			}
// 	// 			return;
// 	// 		}
// 	// 	});
// 	// } 

// 	// //hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
// 	// isa.map((index, content)=>{
// 	// 	if(content.getAttribute('parent') === "素活動_認知活動"){
// 	// 		choose_isa_cognition(content.getAttribute('child'));
// 	// 	}else if(content.getAttribute('parent') === "複合活動_認知活動"){
// 	// 		label.map((index_label, content_label)=>{
// 	// 			if(content_label.childNodes[0].nodeValue === content.getAttribute('child')){
// 	// 				const slot_content = Array.from(content_label.parentNode.getElementsByTagName("SLOT"));
// 	// 				slot_content.map((content_slot) => {
// 	// 					choose_sub_cognition(content_slot);
// 	// 				})
// 	// 				return;
// 	// 			}
// 	// 		})
// 	// 	}
// 	// })
// 	output_list.map((n) => {
// 		const selectElement = document.getElementById("selectionlist");
// 		const optionElement = document.createElement('option');
// 		optionElement.value = n;
// 		optionElement.text = n;
// 		selectElement.appendChild(optionElement);
// 	})
// 	console.log(output_list,output_input)
// }
