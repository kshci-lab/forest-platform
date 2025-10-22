//問い一覧表示に使用

getInquiry();

function getInquiry(){

	$("#testxml").html("");

	i_count = 0;
	concept_id_array = new Array();
	inquiry_content_array = new Array();
	inquiry_id_array = new Array();

	$.ajax({

	    url: "php/show_inquiry.php",
	    type: "POST",
	    data: { val : "concept_id" },
	    success: function(arr){

	    	var parse = JSON.parse(arr);

	    	showInquiry(parse,"concept_id");

	    }

	});

	$.ajax({

	    url: "php/show_inquiry.php",
	    type: "POST",
	    data: { val : "inquiry_content" },
	    success: function(arr){

	    	var parse = JSON.parse(arr);
	    	showInquiry(parse,"inquiry_content");

	    }

	});

	$.ajax({

	    url: "php/show_inquiry.php",
	    type: "POST",
	    data: { val : "inquiry_id" },
	    success: function(arr){

	    	var parse = JSON.parse(arr);
	    	showInquiry(parse,"inquiry_id");

	    }

	});

}

var i_count = 0;
var concept_id_array = new Array();
	inquiry_content_array = new Array();
	inquiry_id_array = new Array();

function showInquiry(arr,mode){

	if(mode == "concept_id"){

		concept_id_array = arr;
		i_count += 1;

	}else if(mode == "inquiry_content"){

		inquiry_content_array = arr;
		i_count += 1;

	}else if(mode == "inquiry_id"){

		inquiry_id_array = arr;
		i_count += 1;

	}

	if(i_count >= 3){

		showIntention();

		showGeneration();

	}

}


function showIntention(){

	$("#intention").html("");

	for(var i=0; i<concept_id_array.length; i++){



		if(concept_id_array[i] == "26742" || concept_id_array[i] == "62636"){


			var intention = document.getElementById("intention");

			var ultag = document.createElement("ul");
			ultag.className = concept_id_array[i];
			ultag.state = "hide";
			ultag.setAttribute("switch",false);
			intention.appendChild(ultag);

			var imgtag = document.createElement("img");
			imgtag.src = "image/list6.png";
			imgtag.style.width = 15;
			imgtag.style.height = 15;
			imgtag.onclick = switching;
			ultag.appendChild(imgtag);

			var atag = document.createElement("a");
			atag.href = "#";
			atag.id = inquiry_id_array[i];
			atag.onclick = add_node;
			atag.innerHTML = inquiry_content_array[i];
			ultag.appendChild(atag);


		}

	}

}

// function showGeneration(){

	/*$("#property").html("");
	$("#elements").html("");
	$("#testxml").html("");

	for(var i=0; i<concept_id_array.length; i++){

		if(concept_id_array[i] != "26742" && concept_id_array[i] != "62636" && concept_id_array[i] != "89974"){

			var testxml = document.getElementById("testxml");

			var ultag = document.createElement("ul");
			ultag.className = concept_id_array[i];
			ultag.state = "hide";
			ultag.setAttribute("switch",false);
			testxml.appendChild(ultag);

			var imgtag = document.createElement("img");
			imgtag.src = "image/list6.png";
			imgtag.style.width = 15;
			imgtag.style.height = 15;
			imgtag.onclick = switching;
			ultag.appendChild(imgtag);

			var atag = document.createElement("a");
			atag.href = "#";
			atag.id = inquiry_id_array[i];
			atag.onclick = add_node;
			atag.innerHTML = inquiry_content_array[i];
			ultag.appendChild(atag);


		}

	}

	//子の問いをもっている場合は行頭記号の種類を変える
	checkChildInquiry();*/

	/*c_disp();*/

// }

//is-a関係の問いがある場合はわかるように
function checkChildInquiry(){

	//各クラスの値を取得して，それと一致するparent_idを探索し，それがidと一致しなかったらimageを変更
	var testxml = document.getElementById("testxml");
	var ul = testxml.getElementsByTagName("ul");

	for(var i=0; i<ul.length; i++){

		$.ajax({

            url: "php/get_data.php",
            type: "POST",
            data: { val : "child_inquiry",
            		parent_id : ul[i].className },
            success: function(bool){

            	if(bool != 0){

            		var c_has_ul = document.getElementsByClassName(bool);

            		for(var i=0; i<c_has_ul.length; i++){

            			//今のところは一つの概念に対して一つの問いであるが，二つ以上になったら考える必要がある
            			var img = c_has_ul[i].getElementsByTagName("img");

            			for(var j=0; j<img.length; j++){

            				img[j].src = "image/list7.png";

            			}

            		}

            	}

            }

        });

	}

}


var thisId;

function switching(){

	thisId = this.nextSibling.id;

	var switch_mode = this.parentNode.getAttribute("switch");
	var concept_id = this.parentNode.className;

	if(switch_mode == "false"){

		this.parentNode.setAttribute("switch",true);

		c_count = 0;
		c_concept_id_array = new Array();
		c_inquiry_content_array = new Array();
		c_inquiry_id_array = new Array();

		$.ajax({

		    url: "php/show_inquiry.php",
		    type: "POST",
		    data: { val : "c_concept_id",
		    		id : concept_id },
		    success: function(arr){

		    	var parse = JSON.parse(arr);
		    	showChildInquiry(parse,"concept_id");

		    }

		});

		$.ajax({

		    url: "php/show_inquiry.php",
		    type: "POST",
		    data: { val : "c_inquiry_content",
		    		id : concept_id },
		    success: function(arr){

		    	var parse = JSON.parse(arr);
		    	showChildInquiry(parse,"inquiry_content");

		    }

		});

		$.ajax({

		    url: "php/show_inquiry.php",
		    type: "POST",
		    data: { val : "c_inquiry_id",
		    		id : concept_id },
		    success: function(arr){

		    	var parse = JSON.parse(arr);
		    	showChildInquiry(parse,"inquiry_id");

		    }

		});

	}else{

		this.parentNode.setAttribute("switch",false);

		thisId = this.nextSibling.id;

		var thId = document.getElementById(thisId);
		var ptag = thId.parentNode;

		var ultag = ptag.getElementsByTagName("ul");

		var ul_num = ultag.length;

		for(var i=0; i<ul_num; i++){

			ptag.removeChild(ultag[0]);

		}

	}

}

var c_count = 0;
var c_concept_id_array = new Array();
	c_inquiry_content_array = new Array();
	c_inquiry_id_array = new Array();

function showChildInquiry(arr,mode){

	if(mode == "concept_id"){

		c_concept_id_array = arr;
		c_count += 1;

	}else if(mode == "inquiry_content"){

		c_inquiry_content_array = arr;
		c_count += 1;

	}else if(mode == "inquiry_id"){

		c_inquiry_id_array = arr;
		c_count += 1;

	}

	if(c_count >= 3){

		var thId = document.getElementById(thisId);
		var ptag = thId.parentNode;

		for(var i=0; i<c_concept_id_array.length; i++){

			var ultag = document.createElement("ul");
			ultag.className = c_concept_id_array[i];
			ultag.state = "hide";
			ultag.setAttribute("switch",false);
			ptag.appendChild(ultag);

			var imgtag = document.createElement("img");
			imgtag.src = "image/list6.png";
			imgtag.style.width = 15;
			imgtag.style.height = 15;
			imgtag.onclick = switching;
			ultag.appendChild(imgtag);

			var atag = document.createElement("a");
			atag.href = "#";
			atag.id = c_inquiry_id_array[i];
			atag.onclick = add_node;
			atag.innerHTML = c_inquiry_content_array[i];
			ultag.appendChild(atag);

		}

	}


}
