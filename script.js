// script.js
// 勝ち抜き戦＋再戦方式(ツリー選択ソート)による楽曲ソート
//  1. ランダムな組み合わせで勝ち抜き戦を行い、1位を決める
//  2. 1位が直接倒した曲だけが2位候補。候補どうしを再戦させて2位を決める。以後も同様
//  3. 次の組み合わせは「直前に出た曲を避け、勝った回数が少ない曲を優先、同条件はランダム」で選ぶ
//  4. 引き分けなし。終了位置を指定すると、その順位まで決めた時点で終了する(圏外は非表示)
// 途中経過は localStorage に「乱数の種 + 回答履歴」として保存し、同じ手順を再生して復元する。

'use strict';

const STORAGE_KEY = 'loveliveSort.v2';
const SCHEMA = 2;

// シリーズ定義 (表示順 = チェックボックスの並び順)
const SERIES = [
    { key: 'lovelive',     file: 'lovelive.txt',            checkId: 'ckLovelive',           cntId: 'loveliveCnt',           label: 'ラブライブ！' },
    { key: 'sunshine',     file: 'lovelive_sunshine.txt',   checkId: 'ckLoveliveSunshine',   cntId: 'loveliveSunshineCnt',   label: 'サンシャイン!!' },
    { key: 'nijigaku',     file: 'nijigaku.txt',            checkId: 'ckNijigaku',           cntId: 'nijigakuCnt',           label: '虹ヶ咲' },
    { key: 'superstar',    file: 'lovelive_superstar.txt',  checkId: 'ckLoveliveSuperStar',  cntId: 'loveliveSuperStarCnt',  label: 'スーパースター!!' },
    { key: 'hasunosora',   file: 'lovelive_hasunosora.txt', checkId: 'ckLoveliveHasunosora', cntId: 'loveliveHasunosoraCnt', label: '蓮ノ空' },
    { key: 'bluebird',     file: 'lovelive_bluebird.txt',   checkId: 'ckLoveliveBluebird',   cntId: 'loveliveBluebirdCnt',   label: 'イキヅライブ！' },
    { key: 'musical',      file: 'school_idol_musical.txt', checkId: 'ckSchoolIdolMusical',  cntId: 'schoolIdolMusicalCnt',  label: 'ミュージカル' },
    { key: 'yohane',       file: 'yohane.txt',              checkId: 'ckYohane',             cntId: 'yohaneCnt',             label: '幻日のヨハネ' },
    { key: 'other',        file: 'lovelive_other.txt',      checkId: 'ckLoveliveOther',      cntId: 'loveliveOtherCnt',      label: 'その他合同等' },
];

let session = null; // { seriesKeys, topN, seed, sig }  ※topN: 0 = 全順位
let st = null;      // ソート状態

// =========================================================================
// Utility
// =========================================================================

/** シード付き乱数 (mulberry32)。同じシードなら同じ列を返す */
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** 楽曲リスト(テキスト)を非同期で読み込む */
async function getFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
        const text = (await response.text()).replace(/^\uFEFF/, '');
        return text.split(/\r?\n/).map(x => x.trim()).filter(x => x.length > 0);
    } catch (error) {
        console.error(error);
        return [];
    }
}

/** 曲リストの内容から署名を作る (リスト更新で中断データが合わなくなるのを検出する) */
function signature(songs) {
    const str = songs.map(s => s.key + '|' + s.name).join('\n');
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = (((h << 5) + h) + str.charCodeAt(i)) | 0;
    }
    return songs.length + ':' + (h >>> 0).toString(36);
}

/** 選択されたシリーズから曲オブジェクトの配列を作る (同名曲もシリーズ別に別の曲として扱う) */
function buildSongs(seriesKeys) {
    const songs = [];
    for (const s of SERIES) {
        if (!seriesKeys.includes(s.key)) continue;
        for (const name of (s.songs || [])) {
            songs.push({ name, key: s.key, label: s.label });
        }
    }
    return songs;
}

// =========================================================================
// Storage (localStorage)
// =========================================================================

function saveState() {
    if (!session || !st) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            schema: SCHEMA,
            series: session.seriesKeys,
            topN: session.topN,
            seed: session.seed,
            sig: session.sig,
            answers: st.answers,
            resultId: session.resultId || null,
        }));
    } catch (e) {
        console.warn('保存に失敗しました', e);
    }
}

function loadSaved() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const d = JSON.parse(raw);
        if (!d || d.schema !== SCHEMA || !Array.isArray(d.series) || typeof d.answers !== 'string') return null;
        if (!d.series.every(k => SERIES.some(s => s.key === k))) return null;
        return d;
    } catch (e) {
        return null;
    }
}

function clearSaved() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
}

/** 旧バージョン(Cookie保存)の中断データを削除する */
function clearLegacyCookies() {
    try {
        for (const name of ['sortFlag', 'sortRec', 'remRec', 'remCnt', 'Ver']) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
    } catch (e) { /* ignore */ }
}

// =========================================================================
// Sorting core
// =========================================================================

function newState(songs, topN, seed) {
    const n = songs.length;
    return {
        songs,
        n,
        target: (topN > 0 && topN < n) ? topN : n, // 何位まで決めるか
        rng: mulberry32(seed),
        ch: Array.from({ length: n }, () => []),   // ch[x] = xが直接勝った曲(子)
        roots: Array.from({ length: n }, (_, i) => i), // まだ誰にも負けていない曲(次の順位の候補)
        last: [-1, -1],                            // 直前の質問に出た2曲
        out: [],                                   // 確定した順位 (out[0]が1位)
        answers: '',                               // 回答履歴 'L' / 'R'
        q: null,                                   // 現在の質問 { left, right }
        done: false,
    };
}

/** 次の質問を用意する。必要なら候補が1曲に絞られた時点で順位を確定させる */
function advance(s) {
    while (true) {
        if (s.out.length >= s.target || s.roots.length === 0) {
            s.done = true;
            s.q = null;
            return;
        }
        if (s.roots.length === 1) {
            // 候補が1曲 = この曲が次の順位。取り出して、その曲が直接倒した曲を新しい候補にする
            const r = s.roots[0];
            s.out.push(r);
            s.roots = s.ch[r];
            continue;
        }
        s.q = pickPair(s);
        return;
    }
}

/** 次に比較する2曲を選ぶ: 直前の曲を避け、勝った回数が少ない曲を優先、同条件はランダム */
function pickPair(s) {
    let pool = s.roots.filter(x => x !== s.last[0] && x !== s.last[1]);
    if (pool.length < 2) pool = s.roots;

    let a = -1, b = -1, ka = null, kb = null;
    const less = (x, y) => x[0] < y[0] || (x[0] === y[0] && x[1] < y[1]);
    for (const x of pool) {
        const k = [s.ch[x].length, s.rng()];
        if (ka === null || less(k, ka)) {
            b = a; kb = ka;
            a = x; ka = k;
        } else if (kb === null || less(k, kb)) {
            b = x; kb = k;
        }
    }
    // 左右の配置もランダム
    return s.rng() < 0.5 ? { left: a, right: b } : { left: b, right: a };
}

/** 回答を反映する ('L' = 左を選択, 'R' = 右を選択) */
function answer(s, side) {
    if (s.done || !s.q) return;
    const w = side === 'L' ? s.q.left : s.q.right;
    const l = side === 'L' ? s.q.right : s.q.left;
    s.ch[w].push(l);
    s.roots = s.roots.filter(x => x !== l);
    s.last = [s.q.left, s.q.right];
    s.answers += side;
    advance(s);
}

/** 保存した条件と回答履歴から状態を再生する */
function replay(songs, topN, seed, answers) {
    const s = newState(songs, topN, seed);
    advance(s);
    for (const c of answers) {
        if (s.done) break;
        if (c === 'L' || c === 'R') answer(s, c);
    }
    return s;
}

/** 総比較回数の目安 (進捗表示用) */
function estimateTotal(s) {
    const per = Math.max(1, Math.log2(Math.max(s.n, 2)) - 1.2);
    return Math.max(1, Math.round((s.n - 1) + s.target * per));
}

// =========================================================================
// Saved results (localStorage)
// =========================================================================

const RESULTS_KEY = 'loveliveSort.results.v1';

function isValidResult(r) {
    return !!r && typeof r.id === 'string' && typeof r.savedAt === 'number'
        && Array.isArray(r.series) && Array.isArray(r.songs)
        && r.songs.every(x => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string');
}

/** 保存済みの結果を新しい順で返す */
function loadResults() {
    try {
        const raw = localStorage.getItem(RESULTS_KEY);
        if (!raw) return [];
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return [];
        return list.filter(isValidResult).sort((a, b) => b.savedAt - a.savedAt);
    } catch (e) {
        return [];
    }
}

function writeResults(list) {
    try {
        localStorage.setItem(RESULTS_KEY, JSON.stringify(list));
        return true;
    } catch (e) {
        console.warn('結果の保存に失敗しました', e);
        return false;
    }
}

function seriesLabel(key) {
    const s = SERIES.find(x => x.key === key);
    return s ? s.label : key;
}

function pad2(n) { return String(n).padStart(2, '0'); }

function formatDateTime(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 現在の結果が保存済みか */
function isCurrentResultSaved() {
    return !!(session && session.resultId && loadResults().some(r => r.id === session.resultId));
}

/** 現在の結果を保存する。保存できたら true */
function saveResult() {
    if (!st || !st.done || !session) return false;
    if (isCurrentResultSaved()) return true;

    const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        savedAt: Date.now(),
        series: session.seriesKeys.slice(),
        topN: session.topN,
        total: st.n,
        target: st.target,
        songs: st.out.map(i => [st.songs[i].name, st.songs[i].key]), // [曲名, シリーズキー]
    };
    if (!writeResults(loadResults().concat(entry))) {
        alert('結果を保存できませんでした。ブラウザの保存領域がいっぱいか、保存が許可されていない可能性があります。');
        return false;
    }
    session.resultId = entry.id;
    saveState();
    return true;
}

function deleteResult(id) {
    return writeResults(loadResults().filter(r => r.id !== id));
}

function describeRange(r) {
    return r.target < r.total ? `上位${r.target}位まで (全${r.total}曲中)` : `全順位 (${r.total}曲)`;
}

// =========================================================================
// UI
// =========================================================================

let view = 'top';     // 'top' | 'history' | 'detail'
let detailId = null;  // 閲覧中の保存済み結果ID

function readConfigFromDOM() {
    const seriesKeys = SERIES.filter(s => document.getElementById(s.checkId).checked).map(s => s.key);
    const topN = parseInt(document.getElementById('selTopN').value, 10) || 0;
    return { seriesKeys, topN };
}

function applyConfigToDOM(seriesKeys, topN) {
    for (const s of SERIES) {
        document.getElementById(s.checkId).checked = seriesKeys.includes(s.key);
    }
    const sel = document.getElementById('selTopN');
    sel.value = String(topN);
    if (sel.value !== String(topN)) sel.value = '0';
}

function setVisible(id, visible) {
    document.getElementById(id).classList.toggle('hidden', !visible);
}

function makeEl(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
}

function setSongCell(el, song) {
    el.replaceChildren(makeEl('div', 'song-name', song.name), makeEl('div', 'song-series', song.label));
}

/** 結果表のHTML。rows = [{ name, label }] */
function buildResultTable(rows) {
    let str = `<table class="result-table">`;
    str += `<thead><tr><th>順位</th><th>曲名</th><th>シリーズ</th></tr></thead><tbody>`;
    rows.forEach((r, i) => {
        str += `<tr><td>${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.label)}</td></tr>`;
    });
    str += `</tbody></table>`;
    return str;
}

function fillQuestion() {
    const no = st.answers.length + 1;
    const pct = Math.min(99, Math.floor(st.answers.length * 100 / estimateTotal(st)));
    document.getElementById('battleNumber').innerHTML =
        `Sort No.${no}<br>${st.out.length} / ${st.target} 位 確定 (進捗の目安 ${pct}%)`;
    setSongCell(document.getElementById('leftField'), st.songs[st.q.left]);
    setSongCell(document.getElementById('rightField'), st.songs[st.q.right]);
}

function fillResult() {
    let str = `<h2 class="result-title">ソート結果</h2>`;
    if (st.target < st.n) {
        str += `<p class="result-note">全${st.n}曲中、上位${st.target}位まで</p>`;
    }
    str += buildResultTable(st.out.map(idx => ({ name: st.songs[idx].name, label: st.songs[idx].label })));
    document.getElementById('resultField').innerHTML = str;

    const saved = isCurrentResultSaved();
    const btn = document.getElementById('saveResultButton');
    btn.disabled = saved;
    btn.textContent = saved ? '保存済み' : 'この結果を保存する';
    document.getElementById('saveNote').textContent =
        saved ? '保存しました。トップ画面の「過去の結果一覧」から見られます。' : '';
}

function fillHistory() {
    const results = loadResults();
    const list = document.getElementById('historyList');
    if (results.length === 0) {
        list.replaceChildren(makeEl('p', 'history-empty', '保存された結果はありません。'));
        return;
    }
    list.replaceChildren(...results.map(r => {
        const item = makeEl('div', 'history-item');

        const info = makeEl('div', 'history-info');
        info.appendChild(makeEl('div', 'history-date', formatDateTime(r.savedAt)));
        info.appendChild(makeEl('div', 'history-series', '対象: ' + r.series.map(seriesLabel).join('、')));
        info.appendChild(makeEl('div', 'history-range', describeRange(r)));

        const buttons = makeEl('div', 'history-buttons');
        const view_ = makeEl('button', 'small-button', '閲覧');
        view_.addEventListener('click', () => openDetail(r.id));
        const del = makeEl('button', 'small-button danger-button', '削除');
        del.addEventListener('click', () => confirmDelete(r.id));
        buttons.appendChild(view_);
        buttons.appendChild(del);

        item.appendChild(info);
        item.appendChild(buttons);
        return item;
    }));
}

function fillDetail() {
    const r = loadResults().find(x => x.id === detailId);
    if (!r) { // 見つからなければ一覧へ
        view = 'history';
        render();
        return;
    }
    const box = document.getElementById('detailContent');
    let str = `<h2 class="result-title">保存した結果</h2>`;
    str += `<p class="result-note">保存日時: ${escapeHtml(formatDateTime(r.savedAt))}<br>`
        + `対象: ${escapeHtml(r.series.map(seriesLabel).join('、'))}<br>`
        + `${escapeHtml(describeRange(r))}</p>`;
    str += buildResultTable(r.songs.map(([name, key]) => ({ name, label: seriesLabel(key) })));
    box.innerHTML = str;
}

/** 現在のビューに合わせて表示を更新する */
function render() {
    const top = view === 'top';
    const sorting = top && !!st && !st.done;
    const finished = top && !!st && st.done;

    setVisible('selectionSection', top);
    setVisible('mainBattleArea', sorting);
    setVisible('resultField', finished);
    setVisible('resultActions', finished);
    setVisible('historySection', view === 'history');
    setVisible('historyDetail', view === 'detail');

    document.getElementById('openHistoryButton').textContent = `過去の結果一覧 (${loadResults().length})`;

    if (sorting) fillQuestion();
    if (finished) fillResult();
    if (view === 'history') fillHistory();
    if (view === 'detail') fillDetail();
}

// =========================================================================
// Actions
// =========================================================================

function startNew() {
    const { seriesKeys, topN } = readConfigFromDOM();
    const songs = buildSongs(seriesKeys);
    if (songs.length === 0) {
        alert('楽曲が選択されていません。最低1つチェックを入れてください。');
        return;
    }
    const seed = (Math.random() * 4294967296) >>> 0;
    session = { seriesKeys, topN, seed, sig: signature(songs), resultId: null };
    st = replay(songs, topN, seed, '');
    view = 'top';
    saveState();
    render();
}

function handleChoice(side) {
    if (view !== 'top' || !st || st.done) return;
    answer(st, side);
    saveState();
    render();
}

function undo() {
    if (view !== 'top' || !st || st.done || st.answers.length === 0) return;
    st = replay(st.songs, session.topN, session.seed, st.answers.slice(0, -1));
    saveState();
    render();
}

function resetAll() {
    clearSaved();
    st = null;
    session = null;
    view = 'top';
    alert('現在のソート結果をリセットしました。(保存済みの結果は残ります)');
    render();
}

function handleSave() {
    saveResult();
    render();
}

function openHistory() { view = 'history'; render(); }
function closeHistory() { view = 'top'; render(); }
function openDetail(id) { detailId = id; view = 'detail'; render(); }
function closeDetail() { detailId = null; view = 'history'; render(); }

function confirmDelete(id) {
    const r = loadResults().find(x => x.id === id);
    if (!r) return;
    if (!window.confirm(`${formatDateTime(r.savedAt)} の結果を削除します。よろしいですか？`)) return;
    deleteResult(id);
    render();
}

/** 保存データがあれば復元する */
function tryRestore() {
    const saved = loadSaved();
    if (!saved) return;

    const songs = buildSongs(saved.series);
    if (songs.length === 0 || signature(songs) !== saved.sig) {
        alert('楽曲データが更新されたので中断データを正しく復元できませんでした。');
        clearSaved();
        return;
    }
    if (saved.answers.length === 0) {
        clearSaved();
        return;
    }

    const restored = replay(songs, saved.topN, saved.seed, saved.answers);
    const msg = restored.done
        ? '前回の結果があるようです。表示しますか？'
        : '中断しているデータがあるようです。復元しますか？';
    if (!window.confirm(msg)) {
        clearSaved();
        return;
    }
    session = {
        seriesKeys: saved.series, topN: saved.topN, seed: saved.seed, sig: saved.sig,
        resultId: typeof saved.resultId === 'string' ? saved.resultId : null,
    };
    st = restored;
    view = 'top';
    applyConfigToDOM(saved.series, saved.topN);
    render();
}

// =========================================================================
// Initial load
// =========================================================================

async function initialLoad() {
    clearLegacyCookies();

    // 「ソートのしくみ」は別タブで開く。スクリプトから開くことで、説明ページ側から自分のタブを閉じられる
    document.getElementById('aboutLink').addEventListener('click', (e) => {
        if (window.open('about.html', '_blank')) e.preventDefault();
    });

    const lists = await Promise.all(SERIES.map(s => getFile(s.file)));
    if (lists.every(l => l.length === 0)) {
        alert('楽曲リストを読み込めませんでした。\nindex.html を直接開いている場合は、ローカルサーバー経由(python -m http.server など)で開いてください。');
    }
    SERIES.forEach((s, i) => {
        s.songs = lists[i];
        document.getElementById(s.checkId).checked = false;
        document.getElementById(s.cntId).textContent = `(${s.songs.length}曲)`;
    });

    document.getElementById('startButton').addEventListener('click', () => {
        if (st && !st.done && st.answers.length > 0) {
            if (!window.confirm('最初からやり直しになりますがよろしいですか？')) return;
        }
        startNew();
    });
    document.getElementById('resetCookieLink').addEventListener('click', (e) => {
        e.preventDefault();
        resetAll();
    });
    document.querySelectorAll('.choice-button').forEach(button => {
        button.addEventListener('click', () => handleChoice(button.dataset.choice));
    });
    document.getElementById('undoButton').addEventListener('click', undo);

    document.getElementById('saveResultButton').addEventListener('click', handleSave);
    document.getElementById('openHistoryButton').addEventListener('click', openHistory);
    document.getElementById('historyBackButton').addEventListener('click', closeHistory);
    document.getElementById('detailBackButton').addEventListener('click', closeDetail);

    tryRestore();
    render();
}

window.addEventListener('load', initialLoad);
