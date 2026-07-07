
function getData(){

	var id_array = new Array();
		concept_id_array = new Array();
		content_array = new Array();
		type_array = new Array();
		parent_id_array = new Array();
		class_array = new Array();

	$.ajax({

	    url: "php/open_data.php",
	    type: "POST",
	    data: { val : "id" },
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
				//	console.log(parse);
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
			//	console.log(parse);
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

	}else if(mode == "edited_nodes"){

		edited_node_ids = arr;
		count += 1;

	}

	if(count >= 7){

		var n = 1;

		for(var i=0; i<type_array.length; i++){

			if(parent_id_array[i] == "root"){

				// rootを親に持つノードを表示
				// mindmap.jsへ受け渡す
				var isEdited = edited_node_ids.indexOf(id_array[i]) !== -1;
				show_node(id_array[i],parent_id_array[i],content_array[i],concept_id_array[i],type_array[i],class_array[i], isEdited);
				n++;

				// console.log(content_array[i]);

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
						show_node(id_array[j],parent_id_array[j],content_array[j],concept_id_array[j],type_array[j],class_array[j], isEdited);
						jmnode = document.getElementsByTagName("jmnode");
						n++;

					}

				}

			}

		}

	}

}
