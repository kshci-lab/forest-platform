var clickedType="";

function make_micro_strat(node) {
    node.addEventListener('click', function(event) {
        
        clickedType = event.target.getAttribute('type');
        // console.log(clickedType);
        var nodeid= event.target.getAttribute("nodeid");
		document.getElementById("make_micro_strat_form").setAttribute("type", clickedType);
		document.getElementById("make_micro_strat_form").setAttribute("nid", nodeid);

        if (clickedType === 'other_answer') {
            // クリックされた要素のnodeidを取得
            var nodeid = event.target.getAttribute('nodeid');
            var text = "この解釈について，①なぜこのような解釈に至らなかったのか②どのようなことを意識して読解することで考えられるようになるか考えてみましょう";
            $("#ref_guidance").text(text);
            $("#make_micro_strat_form").css("display", "block");
            
			
        }
        if (clickedType === 'other_question') {
            // クリックされた要素のnodeidを取得
            var nodeid = event.target.getAttribute('nodeid');
            var text = "この問いについて，①なぜ思いつけなかったのか，②どのようなことを意識して読解することで立てられるようになるか考えてみましょう";
            $("#ref_guidance").text(text);
            $("#make_micro_strat_form").css("display", "block");		
        }
    });    
}

getData();

function getData(){

	var id_array = new Array();
		concept_id_array = new Array();
		content_array = new Array();
		type_array = new Array();
		parent_id_array = new Array();
		class_array = new Array();
		s_id_array = new Array();
		e_id_array = new Array();

	$.ajax({

	    url: "php/open_data.php",
	    type: "POST",
	    data: { val : "id"},
	    success: function(arr){
			var parse = JSON.parse(arr);
	    	id_array = parse;
	    	showNode(id_array,"id");

		},
			error: function(){
				console.log("ajaxエラー");
	    }

	});

	$.ajax({

		url: "php/open_data.php",
	    type: "POST",
	    data: { val : "concept_id" },
	    success: function(arr){
			var parse = JSON.parse(arr);
			concept_id_array = parse;
			showNode(concept_id_array,"concept_id");

		},
		error: function(){
			console.log("ajaxエラー");

	    }

	});

	$.ajax({

	    url: "php/open_data.php",
	    type: "POST",
	    data: { val : "content" },
	    success: function(arr){
			var parse = JSON.parse(arr);
	    	content_array = parse;
	    	showNode(content_array,"content");

		},
		error: function(){
			console.log("ajaxエラー");

	    }

	});

	$.ajax({

	    url: "php/open_data.php",
	    type: "POST",
	    data: { val : "type" },
	    success: function(arr){
			var parse = JSON.parse(arr);
	    	type_array = parse;
	    	showNode(type_array,"type");
		},
 		error: function(){
	 		console.log("ajaxエラー");
	    }

	});

	$.ajax({

	    url: "php/open_data.php",
	    type: "POST",
	    data: { val : "parent_id" },
	    success: function(arr){
			var parse = JSON.parse(arr);
	    	parent_id_array = parse;
	    	showNode(parent_id_array,"parent_id");
		},
		error: function(){
			console.log("ajaxエラー");

	    }

	});

	$.ajax({

	    url: "php/open_data.php",
	    type: "POST",
	    data: { val : "class" },
	    success: function(arr){
			var parse = JSON.parse(arr);
	    	class_array = parse;
	    	showNode(class_array,"class");
		},
		error: function(){
			console.log("ajaxエラー");

	    }

	});

	$.ajax({

	    url: "php/open_data.php",
	    type: "POST",
	    data: { val : "start_char_id" },
	    success: function(arr){
			var parse = JSON.parse(arr);
			s_id_array = parse;
			showNode(s_id_array,"start_char_id");
				
		},
		error: function(){
			console.log("ajaxエラー");
	    }

	});
	$.ajax({

	    url: "php/open_data.php",
	    type: "POST",
	    data: { val : "end_char_id" },
	    success: function(arr){
			var parse = JSON.parse(arr);
			s_id_array = parse;
			showNode(s_id_array,"start_char_id");
		},
		error: function(){
			console.log("ajaxエラー");
	    }

	});

	$.ajax({

	    url: "php/open_data.php",
	    type: "POST",
	    data: { val : "edited_nodes" },
	    success: function(arr){
			var parse = JSON.parse(arr);
	    	edited_node_ids = parse;
	    	showNode(edited_node_ids,"edited_nodes");
		},
		error: function(){
			console.log("ajaxエラー");
	    }

	});

	

}

var count = 0;
var id_array = new Array();
	parent_id_array = new Array();
	concept_id_array = new Array();
	content_array = new Array();
	type_array = new Array();
	class_array = new Array();
	s_id_array = new Array();
	e_id_array = new Array();
	edited_node_ids = new Array();

function showNode(arr,mode){

	if(mode == "id"){

		id_array = arr;
		count += 1;
	}else if(mode == "parent_id"){
		
		parent_id_array = arr;
		count += 1;
		
	}else if(mode == "content"){
		
		content_array = arr;
		count += 1;
		
	}else if(mode == "concept_id"){
		
		concept_id_array = arr;
		count += 1;
		
	}else if(mode == "type"){

		type_array = arr;
		count += 1;

	}else if(mode == "class"){

		class_array = arr;
		count += 1;

	}
	else if(mode == "start_char_id"){

		s_id_array = arr;
		count += 1;

	}
	else if(mode == "end_char_id"){

		e_id_array = arr;
		count += 1;

	}
	else if(mode == "edited_nodes"){

		edited_node_ids = arr;
		count += 1;

	}

	if(count >= 9){

		var n = 1;

		for(var i=0; i<type_array.length; i++){

			if(parent_id_array[i] == "root"){

				// rootを親に持つノードを表示
				// mindmap.jsへ受け渡す
				var isEdited = edited_node_ids.indexOf(id_array[i]) !== -1;
				show_node(id_array[i],parent_id_array[i],content_array[i],concept_id_array[i],type_array[i],class_array[i],s_id_array[i], e_id_array[i], isEdited);
				n++;
				// console.log(content_array[i]);
				// console.log("a");
				// nishdia


			}

		}

		var jmnode = document.getElementsByTagName("jmnode");

		for(i=0; i<jmnode.length; i++){

			for(var j=0; j<parent_id_array.length; j++){

				//入れ子構造で全検索
				if(jmnode[i].getAttribute("nodeid") == parent_id_array[j]){

					// rootを親に持たないノードを表示
					if(parent_id_array[j] != "root"){
						//mindmap.jsへ受け渡す
						var isEdited = edited_node_ids.indexOf(id_array[j]) !== -1;
						show_node(id_array[j],parent_id_array[j],content_array[j],concept_id_array[j],type_array[j],class_array[j], s_id_array[j], e_id_array[j], isEdited);
						jmnode = document.getElementsByTagName("jmnode");
						n++;

					}

				}

			}

		}
		mouseoverNode();
		change_select_Cnode("onload");
		var node_info = document.querySelectorAll("jmnode");

		node_info.forEach(function(value, index) {
			make_micro_strat(value);
		});
		
	}

}

function getData2(mapid){
	$("#jsmind_container2").empty();
	open_empty2();

    // set_root メソッドを呼び出す

	var id_array = new Array();
		concept_id_array = new Array();
		content_array = new Array();
		type_array = new Array();
		parent_id_array = new Array();
		class_array = new Array();
		pmap_id_array = new Array();

	$.ajax({

	    url: "php/open_data2.php",
	    type: "POST",
	    data: { val : "id",
				mapid : mapid},
	    success: function(arr){

	    	var parse = JSON.parse(arr);
	    	id_array = parse;
	    	showNode2(id_array,"id");

			},
			error: function(){
				console.log("ajaxエラー");
	    }

	});

	$.ajax({

		url: "php/open_data2.php",
	    type: "POST",
	    data: { val : "concept_id" ,
				mapid : mapid},
	    success: function(arr){

	    	var parse = JSON.parse(arr);
	    	concept_id_array = parse;
	    	showNode2(concept_id_array,"concept_id");


			},
			error: function(){
			console.log("ajaxエラー");

	    }

	});

	$.ajax({

	    url: "php/open_data2.php",
	    type: "POST",
	    data: { val : "content",
				mapid : mapid },
	    success: function(arr){

	    	var parse = JSON.parse(arr);
	    	content_array = parse;
	    	showNode2(content_array,"content");

			},
			error: function(){
			console.log("ajaxエラー");

	    }

	});

	$.ajax({

	    url: "php/open_data2.php",
	    type: "POST",
	    data: { val : "type",
				mapid : mapid },
	    success: function(arr){

	    	var parse = JSON.parse(arr);
	    	type_array = parse;
				//	console.log(parse);
	    	showNode2(type_array,"type");

			},
 		error: function(){
	 	console.log("ajaxエラー");

	    }

	});

	$.ajax({

	    url: "php/open_data2.php",
	    type: "POST",
	    data: { val : "parent_id",
				mapid : mapid },
	    success: function(arr){

	    	var parse = JSON.parse(arr);
	    	parent_id_array = parse;
			//	console.log(parse);
	    	showNode2(parent_id_array,"parent_id");

			},
			error: function(){
			console.log("ajaxエラー");

	    }

	});

	$.ajax({

	    url: "php/open_data2.php",
	    type: "POST",
	    data: { val : "class",
				mapid : mapid },
	    success: function(arr){

	    	var parse = JSON.parse(arr);
	    	class_array = parse;
	    	showNode2(class_array,"class");

			},
			error: function(){
			console.log("ajaxエラー");

	    }

	});

	$.ajax({

	    url: "php/open_data2.php",
	    type: "POST",
	    data: { val : "start_char_id",
				mapid : mapid },
	    success: function(arr){

	    	var parse = JSON.parse(arr);
	    	s_id_array = parse;
	    	showNode2(s_id_array,"start_char_id");

			},
			error: function(){
			console.log("ajaxエラー");

	    }

	});

	$.ajax({

	    url: "php/open_data2.php",
	    type: "POST",
	    data: { val : "end_char_id",
				mapid : mapid },
	    success: function(arr){

	    	var parse = JSON.parse(arr);
	    	e_id_array = parse;
			console.log(e_id_array);
	    	showNode2(e_id_array,"end_char_id");

			},
			error: function(){
			console.log("ajaxエラー");

	    }

	});
	$.ajax({

	    url: "php/open_data2.php",
	    type: "POST",
	    data: { val : "parent_map_id",
				mapid : mapid },
	    success: function(arr){

	    	var parse = JSON.parse(arr);
	    	pmap_id_array = parse;
			console.log(pmap_id_array);
	    	showNode2(pmap_id_array,"parent_map_id");

			},
			error: function(){
			console.log("ajaxエラー");

	    }

	});

	
	

}

var count = 0;
var id_array = new Array();
	parent_id_array = new Array();
	concept_id_array = new Array();
	content_array = new Array();
	type_array = new Array();
	class_array = new Array();
	pmap_id_array = new Array();


function showNode2(arr,mode){

	if(mode == "id"){

		id_array = arr;
		count += 1;
	}else if(mode == "parent_id"){
		
		parent_id_array = arr;
		count += 1;
		
	}else if(mode == "content"){
		
		content_array = arr;
		count += 1;
		
	}else if(mode == "concept_id"){
		
		concept_id_array = arr;
		count += 1;
		
	}else if(mode == "type"){

		type_array = arr;
		count += 1;

	}else if(mode == "class"){

		class_array = arr;
		count += 1;

	}
	else if(mode == "start_char_id"){

		s_id_array = arr;
		count += 1;

	}
	else if(mode == "end_char_id"){

		e_id_array = arr;
		count += 1;

	}
	else if(mode == "parent_map_id"){

		pmap_id_array = arr;
		count += 1;

	}

	if(count >= 9){

		var n = 1;

		for(var i=0; i<type_array.length; i++){

			if(parent_id_array[i] == "root"){

				// rootを親に持つノードを表示
				// mindmap.jsへ受け渡す
				show_node2(id_array[i],parent_id_array[i],content_array[i],concept_id_array[i],type_array[i],class_array[i],s_id_array[i], e_id_array[i],pmap_id_array[i]);
				n++;
				// console.log(content_array[i]);
				// console.log("a");
				// nishdia


			}

		}

		var jmnode = document.getElementsByTagName("jmnode");

		for(i=0; i<jmnode.length; i++){

			for(var j=0; j<parent_id_array.length; j++){

				//入れ子構造で全検索
				if(jmnode[i].getAttribute("nodeid") == parent_id_array[j]){

					// rootを親に持たないノードを表示
					if(parent_id_array[j] != "root"){
						//mindmap.jsへ受け渡す
						show_node2(id_array[j],parent_id_array[j],content_array[j],concept_id_array[j],type_array[j],class_array[j],s_id_array[j],e_id_array[j], pmap_id_array[j]);
						jmnode = document.getElementsByTagName("jmnode");
						n++;

					}

				}

			}

		}

		

	}
	jump_node();

}
