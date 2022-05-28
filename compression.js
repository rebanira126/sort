function encode(str) {
	var strMoto;
	var str1;
	var encodeStr = "";
	strMoto = str;
	for (var i = 0; i < Math.floor(strMoto.length / 3); i++) {
		str1 = str.substring(0,3);
		switch (str1) {
			case "LLL" : encodeStr += "a"; break;
			case "LLR" : encodeStr += "b"; break;
			case "LLC" : encodeStr += "c"; break;
			case "LRL" : encodeStr += "d"; break;
			case "LRR" : encodeStr += "e"; break;
			case "LRC" : encodeStr += "f"; break;
			case "LCL" : encodeStr += "g"; break;
			case "LCR" : encodeStr += "h"; break;
			case "LCC" : encodeStr += "i"; break;
			case "RLL" : encodeStr += "j"; break;
			case "RLR" : encodeStr += "k"; break;
			case "RLC" : encodeStr += "l"; break;
			case "RRL" : encodeStr += "m"; break;
			case "RRR" : encodeStr += "n"; break;
			case "RRC" : encodeStr += "o"; break;
			case "RCL" : encodeStr += "p"; break;
			case "RCR" : encodeStr += "q"; break;
			case "RCC" : encodeStr += "r"; break;
			case "CLL" : encodeStr += "s"; break;
			case "CLR" : encodeStr += "t"; break;
			case "CLC" : encodeStr += "u"; break;
			case "CRL" : encodeStr += "v"; break;
			case "CRR" : encodeStr += "w"; break;
			case "CRC" : encodeStr += "x"; break;
			case "CCL" : encodeStr += "y"; break;
			case "CCR" : encodeStr += "z"; break;
			case "CCC" : encodeStr += "0"; break;
		}
		if (str.length >= 3) str = str.substring(3);
	}
	str = encodeStr + str;
	return str;
}

function decode(str) {
	var str1;
	var dencodeStr = "";
	for (var i = 0; i < str.length; i++) {
		str1 = str.substring(i, i+1);
		switch (str1) {
			case "a" : dencodeStr += "LLL"; break;
			case "b" : dencodeStr += "LLR"; break;
			case "c" : dencodeStr += "LLC"; break;
			case "d" : dencodeStr += "LRL"; break;
			case "e" : dencodeStr += "LRR"; break;
			case "f" : dencodeStr += "LRC"; break;
			case "g" : dencodeStr += "LCL"; break;
			case "h" : dencodeStr += "LCR"; break;
			case "i" : dencodeStr += "LCC"; break;
			case "j" : dencodeStr += "RLL"; break;
			case "k" : dencodeStr += "RLR"; break;
			case "l" : dencodeStr += "RLC"; break;
			case "m" : dencodeStr += "RRL"; break;
			case "n" : dencodeStr += "RRR"; break;
			case "o" : dencodeStr += "RRC"; break;
			case "p" : dencodeStr += "RCL"; break;
			case "q" : dencodeStr += "RCR"; break;
			case "r" : dencodeStr += "RCC"; break;
			case "s" : dencodeStr += "CLL"; break;
			case "t" : dencodeStr += "CLR"; break;
			case "u" : dencodeStr += "CLC"; break;
			case "v" : dencodeStr += "CRL"; break;
			case "w" : dencodeStr += "CRR"; break;
			case "x" : dencodeStr += "CRC"; break;
			case "y" : dencodeStr += "CCL"; break;
			case "z" : dencodeStr += "CCR"; break;
			case "0" : dencodeStr += "CCC"; break;
			default : dencodeStr += str1; break;
		}
	}
	return dencodeStr;
}