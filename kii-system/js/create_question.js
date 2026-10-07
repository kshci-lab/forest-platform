function toi_create(deep_content){
	// $("#deep").html("");
	var deep_area = document.getElementById("testxml");

	var ultag = document.createElement("ul");
	ultag.className = "predict";
	ultag.state = "hide";
	//ultag.setAttribute("switch",false);
	deep_area.appendChild(ultag);

	var imgtag = document.createElement("img");
	imgtag.src = "image/list6.png";
	imgtag.style.width = 15;
	imgtag.style.height = 15;
	//imgtag.onclick = switching;
	ultag.appendChild(imgtag);

	var atag = document.createElement("a");
	atag.href = "#!";
	atag.id = Math.floor(Math.random() * 11);
	atag.onclick = add_node;
	atag.innerHTML = deep_content;
	ultag.appendChild(atag);
	// console.log("登録成功");
};





