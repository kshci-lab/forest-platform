(function(window){
	'use strict';

	var excludedInquiryLabels = {
		'前回のMTの内容はどのようなものでしたか？': true,
		'議論参加者の観点から考えられていますか？': true,
		'議論すべき内容は何ですか？': true,
		'議論目的は何ですか': true,
		'議論目的に沿った指針を考えられていますか？': true
	};

	window.filterForestInquiryOntology = function(xml){
		if(!xml || typeof xml.getElementsByTagName !== 'function'){
			return xml;
		}

		var concepts = xml.getElementsByTagName('CONCEPT');
		for(var i = concepts.length - 1; i >= 0; i--){
			var labels = concepts[i].getElementsByTagName('LABEL');
			var label = labels.length ? String(labels[0].textContent || '').trim() : '';
			if(excludedInquiryLabels[label] && concepts[i].parentNode){
				concepts[i].parentNode.removeChild(concepts[i]);
			}
		}

		return xml;
	};
})(window);
