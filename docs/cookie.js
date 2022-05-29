function writeCookie(name, value,expdays) {
	t = new Date;
	t.setTime(t.getTime() + expdays * 24 * 60 * 60 * 1000);
	document.cookie = name + '=' + escape(value) + '; expires=' + t.toGMTString();
}

function readCookie(name) {
	allcookie = document.cookie + ';'
	start1 = allcookie.indexOf(name);
	if (start1 != -1) {
		target = allcookie.substring(start1, allcookie.length);
		start2 = target.indexOf('=', 0) + 1;
		end = target.indexOf(';', start2);
	return(unescape(target.substring(start2, end)));
	}
	return("");
}