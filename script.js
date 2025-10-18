// script.js

// バージョン管理
const Ver = '5';
// 楽曲リスト (グローバル変数として定義)
let loveliveSongs = [];
let loveliveSunshineSongs = [];
let nijigakuSongs = [];
let loveliveSuperStarSongs = [];
let loveliveHasunosoraSongs = [];
let schoolIdolMusicalSongs = [];
let yohaneSongs = [];
let loveliveOtherSongs = [];

// ソート状態変数
let loveliveAllSong = [];
let lstMember = []; // マージソート対象のリスト配列
let equal = []; // 引き分けを記録する配列 (曲のインデックスを格納)
let rec = []; // 一時マージ結果用
let cmp1, cmp2; // 比較対象リストのインデックス
let head1, head2; // 比較対象リスト内の要素インデックス (ヘッド)
let nrec = 0; // rec配列内の要素数

let numQuestion = 1;
let totalSize = 0;
let finishSize = 0;
let finishFlag = 0;
let cookieRec = ""; // ソート結果記録用 ('L', 'R', 'C'のシーケンス)
let currentChoiceResolver = null; // Promiseの解決関数

// =========================================================================
// Cookie / Compression Utility (元のコードから統合)
// =========================================================================

function writeCookie(name, value, expdays) {
    const t = new Date();
    t.setTime(t.getTime() + expdays * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${escape(value)}; expires=${t.toGMTString()}; path=/`;
}

function readCookie(name) {
    const allcookie = document.cookie + ';';
    const start1 = allcookie.indexOf(name);
    if (start1 !== -1) {
        const target = allcookie.substring(start1, allcookie.length);
        const start2 = target.indexOf('=', 0) + 1;
        const end = target.indexOf(';', start2);
        return unescape(target.substring(start2, end));
    }
    return "";
}

function CookieDel() {
    const date1 = new Date();
    date1.setTime(0);
    document.cookie = `sortFlag=;expires=${date1.toGMTString()}; path=/`;
    document.cookie = `sortRec=;expires=${date1.toGMTString()}; path=/`;
    document.cookie = `Ver=;expires=${date1.toGMTString()}; path=/`;
}

// 圧縮関数 (元のcompression.jsから統合)
function encode(str) {
    let encodeStr = "";
    let strMoto = str;
    let i = 0;
    while (i < Math.floor(strMoto.length / 3) * 3) {
        let str1 = strMoto.substring(i, i + 3);
        switch (str1) {
            case "LLL": encodeStr += "a"; break;
            case "LLR": encodeStr += "b"; break;
            case "LLC": encodeStr += "c"; break;
            case "LRL": encodeStr += "d"; break;
            case "LRR": encodeStr += "e"; break;
            case "LRC": encodeStr += "f"; break;
            case "LCL": encodeStr += "g"; break;
            case "LCR": encodeStr += "h"; break;
            case "LCC": encodeStr += "i"; break;
            case "RLL": encodeStr += "j"; break;
            case "RLR": encodeStr += "k"; break;
            case "RLC": encodeStr += "l"; break;
            case "RRL": encodeStr += "m"; break;
            case "RRR": encodeStr += "n"; break;
            case "RRC": encodeStr += "o"; break;
            case "RCL": encodeStr += "p"; break;
            case "RCR": encodeStr += "q"; break;
            case "RCC": encodeStr += "r"; break;
            case "CLL": encodeStr += "s"; break;
            case "CLR": encodeStr += "t"; break;
            case "CLC": encodeStr += "u"; break;
            case "CRL": encodeStr += "v"; break;
            case "CRR": encodeStr += "w"; break;
            case "CRC": encodeStr += "x"; break;
            case "CCL": encodeStr += "y"; break;
            case "CCR": encodeStr += "z"; break;
            case "CCC": encodeStr += "0"; break;
        }
        i += 3;
    }
    encodeStr += strMoto.substring(i);
    return encodeStr;
}

function decode(str) {
    let dencodeStr = "";
    for (let i = 0; i < str.length; i++) {
        let str1 = str.substring(i, i + 1);
        switch (str1) {
            case "a": dencodeStr += "LLL"; break;
            case "b": dencodeStr += "LLR"; break;
            case "c": dencodeStr += "LLC"; break;
            case "d": dencodeStr += "LRL"; break;
            case "e": dencodeStr += "LRR"; break;
            case "f": dencodeStr += "LRC"; break;
            case "g": dencodeStr += "LCL"; break;
            case "h": dencodeStr += "LCR"; break;
            case "i": dencodeStr += "LCC"; break;
            case "j": dencodeStr += "RLL"; break;
            case "k": dencodeStr += "RLR"; break;
            case "l": dencodeStr += "RLC"; break;
            case "m": dencodeStr += "RRL"; break;
            case "n": dencodeStr += "RRR"; break;
            case "o": dencodeStr += "RRC"; break;
            case "p": dencodeStr += "RCL"; break;
            case "q": dencodeStr += "RCR"; break;
            case "r": dencodeStr += "RCC"; break;
            case "s": dencodeStr += "CLL"; break;
            case "t": dencodeStr += "CLR"; break;
            case "u": dencodeStr += "CLC"; break;
            case "v": dencodeStr += "CRL"; break;
            case "w": dencodeStr += "CRR"; break;
            case "x": dencodeStr += "CRC"; break;
            case "y": dencodeStr += "CCL"; break;
            case "z": dencodeStr += "CCR"; break;
            case "0": dencodeStr += "CCC"; break;
            default: dencodeStr += str1; break;
        }
    }
    return dencodeStr;
}


// =========================================================================
// Data Loading / Initialization
// =========================================================================

/** 楽曲ファイルを非同期で読み込む */
async function getFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
        }
        const text = await response.text();
        // 改行コードで分割し、空行を除去してトリム
        return text.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0);
    } catch (error) {
        console.error(error);
        return [];
    }
}

/** 初期化と楽曲リストのセットアップ */
function initList(config) {
    lstMember = [];
    equal = [];
    rec = [];
    loveliveAllSong = [];

    // 選択された楽曲を結合
    if (config.lovelive) loveliveAllSong = loveliveAllSong.concat(loveliveSongs);
    if (config.loveliveSunshine) loveliveAllSong = loveliveAllSong.concat(loveliveSunshineSongs);
    if (config.nijigaku) loveliveAllSong = loveliveAllSong.concat(nijigakuSongs);
    if (config.loveliveSuperStar) loveliveAllSong = loveliveAllSong.concat(loveliveSuperStarSongs);
    if (config.loveliveHasunosora) loveliveAllSong = loveliveAllSong.concat(loveliveHasunosoraSongs);
    if (config.schoolIdolMusical) loveliveAllSong = loveliveAllSong.concat(schoolIdolMusicalSongs);
    if (config.yohane) loveliveAllSong = loveliveAllSong.concat(yohaneSongs);
    if (config.loveliveOther) loveliveAllSong = loveliveAllSong.concat(loveliveOtherSongs);

    if (loveliveAllSong.length === 0) {
        alert('楽曲が選択されていません。最低1つチェックを入れてください。');
        return false;
    }

    // 1曲ずつを要素とするリストを作成
    for (let i = 0; i < loveliveAllSong.length; i++) {
        lstMember.push([i]); // 曲のインデックスを格納
        equal.push(-1); // 全て-1で初期化
    }

    totalSize = loveliveAllSong.length;
    nrec = 0;

    // 最初の比較対象のインデックスを設定 (要素が1つ以上のリストのみを対象とする)
    if (lstMember.length > 1) {
        cmp1 = lstMember.length - 2;
        cmp2 = lstMember.length - 1;
    } else {
        // 曲が1曲しかない場合は即終了
        finishFlag = 1;
        showResult();
        return true;
    }

    head1 = 0;
    head2 = 0;
    numQuestion = 1;
    finishSize = 0;
    finishFlag = 0;
    cookieRec = "";
    rec = new Array(loveliveAllSong.length);

    // DOMの表示/非表示を切り替え
    document.getElementById("resultField").classList.add('hidden');
    document.getElementById("mainBattleArea").classList.remove('hidden');

    return true;
}

// =========================================================================
// Sorting Core (バグ修正ロジック)
// =========================================================================

/** * リストのソート（マージソートの1ステップ）を実行する
 * @param {number} flag -1:左勝ち, 0:引き分け, 1:右勝ち
 */
function sortList(flag) {
    if (finishFlag === 1) return;

    // 1. ソート情報の記録
    let sortrecValue;
    if (flag === 1) {
        sortrecValue = "R";
    } else if (flag === 0) {
        sortrecValue = "C";
    } else if (flag === -1) {
        sortrecValue = "L";
    }
    cookieRec += sortrecValue;

    // 2. レコードの格納とヘッドの更新 
    
    if (flag < 0) { // 左が勝ち (L)
        rec[nrec++] = lstMember[cmp1][head1++];
    } else if (flag > 0) { // 右が勝ち (R)
        rec[nrec++] = lstMember[cmp2][head2++];
    } else { // 引き分け (C)
        // 引き分けの場合は、両方の要素を格納し、equalを設定
        equal[lstMember[cmp1][head1]] = lstMember[cmp2][head2];
        equal[lstMember[cmp2][head2]] = lstMember[cmp1][head1]; // 双方向で設定
        rec[nrec++] = lstMember[cmp1][head1++];
        rec[nrec++] = lstMember[cmp2][head2++];
    }
    
    // 3. 引き分けの連鎖処理 (recに格納された要素を基に、次の要素が同順位なら追加)
    // 最後にrecに追加された要素の同順位チェックをheadが進むまで繰り返す
    
    // (A) リスト1の要素が残っていて、かつ、直前の要素と引き分け連鎖しているかチェック
    while (head1 < lstMember[cmp1].length && equal[rec[nrec - 1]] === lstMember[cmp1][head1]) {
        rec[nrec++] = lstMember[cmp1][head1++];
    }
    // (B) リスト2の要素が残っていて、かつ、直前の要素と引き分け連鎖しているかチェック
    while (head2 < lstMember[cmp2].length && equal[rec[nrec - 1]] === lstMember[cmp2][head2]) {
        rec[nrec++] = lstMember[cmp2][head2++];
    }


    // 4. 片方のリストを走査し終えた後の処理（残りの要素をコピー）
    if (head1 === lstMember[cmp1].length) {
        // リストcmp1が走査済 - リストcmp2の残りを全てコピー
        while (head2 < lstMember[cmp2].length){
            rec[nrec++] = lstMember[cmp2][head2++];
        }
    } else if (head2 === lstMember[cmp2].length) {
        // リストcmp2が走査済 - リストcmp1の残りを全てコピー
        while (head1 < lstMember[cmp1].length){
            rec[nrec++] = lstMember[cmp1][head1++];
        }
    }
    
    // 5. マージ完了の判定と次の比較へ
    if (head1 === lstMember[cmp1].length && head2 === lstMember[cmp2].length) {
        // マージ完了
        
        // lstMember[cmp1]にrecの内容を上書き
        lstMember[cmp1].length = 0;
        for (let i = 0; i < nrec; i++) {
            lstMember[cmp1].push(rec[i]);
        }
        
        // cmp2を削除
        lstMember.splice(cmp2, 1);
        
        // 次の比較対象リストのインデックスを更新
        cmp1--; 
        cmp2 = cmp1 + 1;
        head1 = 0;
        head2 = 0;
        finishSize++;

        nrec = 0;
        rec = new Array(loveliveAllSong.length); // recを再初期化
        
        // 終了判定
        if (lstMember.length === 1) {
            finishFlag = 1;
            showResult();
        } else if (cmp2 >= lstMember.length) {
            // 現在のcmp1のリストが最後のリストの場合、次の比較は最初のリストから開始
            cmp1 = 0;
            cmp2 = 1;
        }
    }

    if (finishFlag === 0) {
        numQuestion++;
    }

    saveState();
}

// =========================================================================
// UI / Display
// =========================================================================

/** 楽曲がどの作品かを取得 */
function getSongGenre(songName) {
    if (loveliveSongs.includes(songName)) return "ラブライブ！";
    if (loveliveSunshineSongs.includes(songName)) return "ラブライブ！サンシャイン!!";
    if (nijigakuSongs.includes(songName)) return "ラブライブ！虹ヶ咲学園スクールアイドル同好会";
    if (loveliveSuperStarSongs.includes(songName)) return "ラブライブ！スーパースター!!";
    if (loveliveHasunosoraSongs.includes(songName)) return "ラブライブ！蓮ノ空女学院スクールアイドルクラブ";
    if (schoolIdolMusicalSongs.includes(songName)) return "スクールアイドルミュージカル";
    if (yohaneSongs.includes(songName)) return "幻日のヨハネ";
    if (loveliveOtherSongs.includes(songName)) return "その他(共通楽曲)";
    return "不明";
}

/** 比較する2曲を表示 */
function showImage() {
    if (finishFlag === 1) return;

    const percent = Math.floor(finishSize * 100 / (totalSize > 1 ? totalSize - 1 : 1));
    const str0 = `Sort No.${numQuestion}<br>${percent}% sorted.`;

    // 比較対象の曲名を取得
    const str1 = loveliveAllSong[lstMember[cmp1][head1]];
    const str2 = loveliveAllSong[lstMember[cmp2][head2]];
    
    document.getElementById("battleNumber").innerHTML = str0;
    document.getElementById("leftField").innerHTML = str1;
    document.getElementById("rightField").innerHTML = str2;
}

/** 結果の表示 */
function showResult() {
    let ranking = 1;
    let sameRank = 1;
    let str = "";
    
    str += `<h2 class="result-title">ソート結果</h2>`;
    str += `<table class="result-table">`;
    str += `<thead><tr><th>順位<\/th><th>曲名<\/th><th>作品<\/th><\/tr></thead><tbody>`;

    // 最終結果はlstMember[0]に格納
    for (let i = 0; i < loveliveAllSong.length; i++) {
        const songIndex = lstMember[0][i];
        const songName = loveliveAllSong[songIndex];
        const genre = getSongGenre(songName);

        str += `<tr><td>${ranking}<\/td><td>${songName}<\/td><td>${genre}<\/td><\/tr>`;
        
        if (i < loveliveAllSong.length - 1) {
            // 引き分け判定
            if (equal[songIndex] === lstMember[0][i + 1]) {
                sameRank++;
            } else {
                ranking += sameRank;
                sameRank = 1;
            }
        }
    }
    str += `</tbody><\/table>`;
    
    document.getElementById("resultField").innerHTML = str;
    
    document.getElementById("resultField").classList.remove('hidden');
    document.getElementById("mainBattleArea").classList.add('hidden');
}


// =========================================================================
// Main Loop / State Management
// =========================================================================

/** ユーザーの選択を待機するPromise */
function waitForChoice() {
    return new Promise(resolve => {
        currentChoiceResolver = resolve;
    });
}

/** 選択ボタンクリックハンドラ */
function handleChoiceClick(event) {
    if (currentChoiceResolver && finishFlag === 0) {
        const choice = parseInt(event.currentTarget.dataset.choice);
        currentChoiceResolver(choice);
        currentChoiceResolver = null;
    }
}

/** メインソート処理 */
async function startSortProcess(startFromScratch = true) {
    if (startFromScratch) {
        const config = readConfigFromDOM();
        if (!initList(config)) {
            return;
        }
    } else {
        // 復元処理はsortRestartで対応
    }

    // ソートが完了するまでループ
    while (finishFlag === 0) {
        showImage();
        const choice = await waitForChoice();
        sortList(choice);
    }
}

/** 設定の読み取り */
function readConfigFromDOM() {
    return {
        lovelive: document.getElementById('ckLovelive').checked,
        loveliveSunshine: document.getElementById('ckLoveliveSunshine').checked,
        nijigaku: document.getElementById('ckNijigaku').checked,
        loveliveSuperStar: document.getElementById('ckLoveliveSuperStar').checked,
        loveliveHasunosora: document.getElementById('ckLoveliveHasunosora').checked,
        schoolIdolMusical: document.getElementById('ckSchoolIdolMusical').checked,
        yohane: document.getElementById('ckYohane').checked,
        loveliveOther: document.getElementById('ckLoveliveOther').checked
    };
}

/** 状態をCookieに保存 */
function saveState() {
    const config = readConfigFromDOM();
    const flag = Object.values(config).map(val => val ? '1' : '0').join('');

    writeCookie('sortFlag', flag, 365);
    writeCookie('sortRec', encode(cookieRec), 365);
    writeCookie('Ver', Ver, 365);
}

/** 状態の復元 (sortRestart) */
function sortRestart(flagRes) {
    const configFlag = readCookie('sortFlag');
    const config = {};
    const configKeys = ['lovelive', 'loveliveSunshine', 'nijigaku', 'loveliveSuperStar', 'loveliveHasunosora', 'schoolIdolMusical', 'yohane', 'loveliveOther'];

    if (configFlag.length !== configKeys.length) {
        console.error("Config flag length mismatch. Resetting.");
        CookieDel();
        return;
    }

    configKeys.forEach((key, i) => {
        const isChecked = configFlag.charAt(i) === '1';
        config[key] = isChecked;
        document.getElementById(`ck${key.charAt(0).toUpperCase() + key.slice(1)}`).checked = isChecked;
    });

    if (!initList(config)) {
        return;
    }
    
    let recordedRec = readCookie('sortRec');
    recordedRec = decode(recordedRec);
    let resLenCnt = recordedRec.length;

    if (flagRes === -1) {
        // アンドゥ処理
        resLenCnt = resLenCnt - 1;
    }
    
    CookieDel(); // 古いCookieをクリアし、sortListで新しいCookieを書き込む準備

    // 復元処理の実行 (Promiseベースではないため、ループで実行)
    for (let i = 0; i < resLenCnt; i++) {
        const choice = recordedRec.substring(i, i + 1);
        let flag;
        if (choice === "L") flag = -1;
        else if (choice === "R") flag = 1;
        else if (choice === "C") flag = 0;
        
        sortList(flag); 
        // sortList内でnumQuestionがインクリメントされ、状態が更新される
    }

    // 復元後、メインソートプロセスを再開
    startSortProcess(false);
}

// =========================================================================
// Event Listeners / Initial Load
// =========================================================================

/** 初期ロード処理 */
async function initialLoad() {
    // 楽曲リストの読み込み
    loveliveSongs = await getFile("lovelive.txt");
    loveliveSunshineSongs = await getFile("lovelive_sunshine.txt");
    nijigakuSongs = await getFile("nijigaku.txt");
    loveliveSuperStarSongs = await getFile("lovelive_superstar.txt");
    loveliveHasunosoraSongs = await getFile("lovelive_hasunosora.txt");
    schoolIdolMusicalSongs = await getFile("school_idol_musical.txt");
    yohaneSongs = await getFile("yohane.txt");
    loveliveOtherSongs = await getFile("lovelive_other.txt");

    // 初期チェックボックス設定（全てOFF）
    document.getElementById('ckLovelive').checked = false;
    document.getElementById('ckLoveliveSunshine').checked = false;
    document.getElementById('ckNijigaku').checked = false;
    document.getElementById('ckLoveliveSuperStar').checked = false;
    document.getElementById('ckLoveliveHasunosora').checked = false;
    document.getElementById('ckSchoolIdolMusical').checked = false;
    document.getElementById('ckYohane').checked = false;
    document.getElementById('ckLoveliveOther').checked = false;
    
    // 曲数表示の更新
    document.getElementById('loveliveCnt').textContent = `(${loveliveSongs.length}曲)`;
    document.getElementById('loveliveSunshineCnt').textContent = `(${loveliveSunshineSongs.length}曲)`;
    document.getElementById('nijigakuCnt').textContent = `(${nijigakuSongs.length}曲)`;
    document.getElementById('loveliveSuperStarCnt').textContent = `(${loveliveSuperStarSongs.length}曲)`;
    document.getElementById('loveliveHasunosoraCnt').textContent = `(${loveliveHasunosoraSongs.length}曲)`;
    document.getElementById('schoolIdolMusicalCnt').textContent = `(${schoolIdolMusicalSongs.length}曲)`;
    document.getElementById('yohaneCnt').textContent = `(${yohaneSongs.length}曲)`;
    document.getElementById('loveliveOtherCnt').textContent = `(${loveliveOtherSongs.length}曲)`;

    // イベントリスナーの設定
    document.getElementById('startButton').addEventListener('click', () => {
        if (readCookie('sortRec') !== "") {
            if (window.confirm('最初からやり直しになりますがよろしいですか？')) {
                CookieDel();
                startSortProcess(true);
            }
        } else {
            startSortProcess(true);
        }
    });

    document.getElementById('resetCookieLink').addEventListener('click', (e) => {
        e.preventDefault();
        CookieDel();
        alert('ソート結果をリセットしました。');
        // ページをリロードするか、設定画面に戻るなどの処理を追加しても良い
        document.getElementById("resultField").classList.add('hidden');
        document.getElementById("mainBattleArea").classList.add('hidden');
    });

    // 選択ボタンのイベントリスナー
    document.querySelectorAll('.choice-button, .middle-button').forEach(button => {
        if (button.dataset.choice !== undefined) {
            button.addEventListener('click', handleChoiceClick);
        }
    });

    // アンドゥボタンのイベントリスナー
    document.getElementById('undoButton').addEventListener('click', () => {
        if (finishFlag === 0 && cookieRec.length > 0) {
            // 現在のソートセッションを中断し、一つ前の状態から復元
            if (currentChoiceResolver) {
                // 待機中のPromiseを解決せずにnullにする
                currentChoiceResolver = null;
            }
            sortRestart(-1);
        }
    });


    // 中断データからの復元チェック
    if (readCookie('sortFlag') !== "" && readCookie('sortRec') !== "") {
        if (Ver === readCookie('Ver')) {
            if (window.confirm('中断しているデータがあるようです。復元しますか？')) {
                sortRestart(0);
            } else {
                CookieDel();
            }
        } else {
            alert('楽曲データが更新されたので中断データを正しく復元できませんでした。');
            CookieDel();
        }
    }
}

// ページロード時の処理
window.addEventListener('load', initialLoad);
