/**
 * 3文字のコード（L, R, C）を1文字の英数字にエンコードします。
 * 文字列の長さが3の倍数でない場合、末尾の余りの文字はそのまま残されます。
 * * @param {string} str エンコードする文字列
 * @returns {string} エンコードされた文字列
 */
const encode = (str) => {
    // 変換マップをconstで定義
    const ENCODE_MAP = {
        "LLL": "a", "LLR": "b", "LLC": "c",
        "LRL": "d", "LRR": "e", "LRC": "f",
        "LCL": "g", "LCR": "h", "LCC": "i",
        "RLL": "j", "RLR": "k", "RLC": "l",
        "RRL": "m", "RRR": "n", "RRC": "o",
        "RCL": "p", "RCR": "q", "RCC": "r",
        "CLL": "s", "CLR": "t", "CLC": "u",
        "CRL": "v", "CRR": "w", "CRC": "x",
        "CCL": "y", "CCR": "z", "CCC": "0",
    };

    let encodedStr = "";
    let remainingStr = str;

    // whileループとslice()で元のコードより簡潔に処理
    while (remainingStr.length >= 3) {
        // 先頭3文字を抽出
        const threeChars = remainingStr.slice(0, 3);
        
        // マップを使用してエンコードし、存在しない場合は空文字列を代入（元のコードのswitch文の動作を模倣）
        encodedStr += ENCODE_MAP[threeChars] || "";
        
        // 残りの文字列を更新
        remainingStr = remainingStr.slice(3);
    }

    // エンコードされた部分と、残りの文字列（3文字未満）を結合して返す
    return encodedStr + remainingStr;
};

// ----------------------------------------------------------------------------------------------------

/**
 * 1文字の英数字を3文字のコード（L, R, C）にデコードします。
 * マップにない文字はそのまま残されます。
 * * @param {string} str デコードする文字列
 * @returns {string} デコードされた文字列
 */
const decode = (str) => {
    // 変換マップをconstで定義
    const DECODE_MAP = {
        "a": "LLL", "b": "LLR", "c": "LLC",
        "d": "LRL", "e": "LRR", "f": "LRC",
        "g": "LCL", "h": "LCR", "i": "LCC",
        "j": "RLL", "k": "RLR", "l": "RLC",
        "m": "RRL", "n": "RRR", "o": "RRC",
        "p": "RCL", "q": "RCR", "r": "RCC",
        "s": "CLL", "t": "CLR", "u": "CLC",
        "v": "CRL", "w": "CRR", "x": "CRC",
        "y": "CCL", "z": "CCR", "0": "CCC",
    };

    // string.split('').map().join('') でループ処理を置き換え
    return str.split('').map(char => {
        // マップにキーが存在すればデコード、存在しなければ文字をそのまま返す
        return DECODE_MAP[char] || char;
    }).join('');
};

// 例
// console.log(encode("LLRCRCRCCCLLL")); // "bqa0a"
// console.log(decode("bqa0a"));       // "LLRCRCRCCCLLL"
