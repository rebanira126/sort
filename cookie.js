/**
 * 指定された名前と値を持つクッキーを設定します。
 * 有効期限は指定された日数に基づいて設定されます。
 *
 * @param {string} name クッキーの名前
 * @param {string} value クッキーの値
 * @param {number} expdays クッキーの有効期限（日数）
 */
const writeCookie = (name, value, expdays) => {
    // const/let の使用
    const t = new Date();
    // 有効期限をミリ秒で計算し、Dateオブジェクトに設定
    t.setTime(t.getTime() + expdays * 24 * 60 * 60 * 1000);

    // 非推奨の escape() の代わりに encodeURIComponent() を使用
    // 非推奨の toGMTString() の代わりに toUTCString() を使用
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${t.toUTCString()}; path=/`;
};

// ----------------------------------------------------------------------------------------------------

/**
 * 指定された名前のクッキーの値を読み取ります。
 *
 * @param {string} name 読み取るクッキーの名前
 * @returns {string} クッキーの値、または見つからない場合は空文字列
 */
const readCookie = (name) => {
    // モダンなクッキー読み込みロジック (正規表現)
    // クッキー名の後に = と値が続くパターンを探す正規表現
    const nameEQ = encodeURIComponent(name) + "=";
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        // クッキーの先頭の空白をトリム
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }

        if (c.indexOf(nameEQ) === 0) {
            // 非推奨の unescape() の代わりに decodeURIComponent() を使用
            // 値部分を抽出し、デコードして返す
            const cookieValue = c.substring(nameEQ.length, c.length);
            return decodeURIComponent(cookieValue);
        }
    }

    return "";
};

// ====================================================================================================

// より簡潔な readCookie の別解 (正規表現を使用)
/*
const readCookieRegex = (name) => {
    // クッキー名をエスケープし、その名前からセミコロンか文字列の末尾までをキャプチャする正規表現
    const nameEQ = encodeURIComponent(name);
    const regex = new RegExp(`(?:^|;)\\s*${nameEQ}=([^;]*)`);
    const match = document.cookie.match(regex);
    
    // マッチすれば、キャプチャグループ1をデコードして返す。そうでなければ空文字列。
    return match ? decodeURIComponent(match[1]) : "";
};
*/

// 例:
// writeCookie('userName', '太郎&花子', 7);
// console.log(readCookie('userName'));
