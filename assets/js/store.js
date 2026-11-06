/* ============================================================
   芦苇认知 · 本地存储
   没有账号，没有服务器。所有东西只在这台设备的浏览器里。
   ============================================================ */

window.REED = window.REED || {};

REED.store = (function () {
  var KEY = 'reed-cognition-v1';

  var blank = function () {
    return {
      v: 1,
      nodes: [],
      edges: [],
      answers: {},
      cursor: { ch: 0, step: 0, pending: [], done: false },
      other: []
    };
  };

  var state = blank();
  var listeners = [];

  function uid(p) {
    return (p || 'n') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.v === 1) state = parsed;
      }
    } catch (e) {
      state = blank();
    }
    return state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* 存储满了或者被禁用，不影响当前会话 */
    }
    listeners.forEach(function (fn) { fn(state); });
  }

  function onChange(fn) { listeners.push(fn); }

  function get() { return state; }

  function reset() {
    state = blank();
    save();
  }

  function addNode(data) {
    var layer = data.layer || (REED.TYPES[data.type] ? REED.TYPES[data.type].layer : 'surface');
    var node = {
      id: uid('n'),
      type: data.type || 'pattern',
      layer: layer,
      title: data.title || '',
      quote: data.quote || '',
      protect: data.protect || '',
      chapter: data.chapter || '',
      at: Date.now()
    };
    state.nodes.push(node);

    // 同一次叙述里紧挨着出现的两个点，连一条线。
    // 线只表示「它们是连着说出来的」，不表示因果。
    var prev = state.nodes.filter(function (n) {
      return n.chapter === node.chapter && n.id !== node.id;
    }).pop();
    if (prev) {
      state.edges.push({ from: prev.id, to: node.id, kind: 'sequence' });
    }

    save();
    return node;
  }

  function recordAnswer(stepId, payload) {
    state.answers[stepId] = {
      question: payload.question || '',
      answer: payload.answer || '',
      at: Date.now()
    };
    save();
  }

  function setCursor(cursor) {
    state.cursor = cursor;
    save();
  }

  function addOther(profile) {
    state.other.unshift(profile);
    state.other = state.other.slice(0, 12);
    save();
  }

  function nodesByLayer(layer) {
    return state.nodes.filter(function (n) { return n.layer === layer; });
  }

  function hasMap() { return state.nodes.length > 0; }

  /* ---------- 示例 ---------- */

  var SEED = {
    nodes: [
      { type: 'reaction', chapter: 'ch1', title: '脸一热，心里先沉下去',
        quote: '脸有点热，心里一沉。脑子里冒出来的是「果然，我说什么都没人听」。' },
      { type: 'pattern', chapter: 'ch1', title: '对别人宽，对自己窄',
        quote: '我会说：别多想，他们可能只是在想自己的事，不代表你不行。' },
      { type: 'pattern', chapter: 'ch2', title: '把想说的话咽回去',
        quote: '每次讨论我都有想法，但轮到我之前，我就先想好「说了也没用」。', protect: '怕说出来，场面失控或者被讨厌' },
      { type: 'trigger', chapter: 'ch2', title: '被忽略时，觉得自己是透明的',
        quote: '怕他觉得我不行，然后以后有项目就不带我了。' },
      { type: 'pattern', chapter: 'ch2', title: '用提前放弃，避开被否定的时刻',
        quote: '我会直接说卡住了。没那样做，是因为说了就等于承认我不行。' },
      { type: 'value', chapter: 'ch3', title: '被认可',
        quote: '为了不显得不合群，我把想说的话咽了，跟他们吃了我并不想吃的饭。', protect: '怕自己不重要' },
      { type: 'pattern', chapter: 'ch3', title: '说的和做的，有一段距离',
        quote: '大概花了两小时想怎么让别人满意，真正读书只有四十分钟。' },
      { type: 'belief', chapter: 'ch4', title: '我是一个不太会来事的人',
        quote: '初中转学，有次自我介绍完，后排有人笑，我同桌说「你别紧张，你就是不太会说话」。' },
      { type: 'counter', chapter: 'ch4', title: '也有过一次，我不是这样',
        quote: '去年做小组展示，我讲完，有个人说这是他听过最清楚的一遍。那天我一点都不紧张。' }
    ],
    edges: []
  };

  function loadSeed() {
    state = blank();
    var prev = null;
    SEED.nodes.forEach(function (n) {
      var node = {
        id: uid('n'), type: n.type, layer: REED.TYPES[n.type].layer,
        title: n.title, quote: n.quote, protect: n.protect || '',
        chapter: n.chapter, at: Date.now()
      };
      state.nodes.push(node);
      if (prev && prev.chapter === node.chapter) {
        state.edges.push({ from: prev.id, to: node.id, kind: 'sequence' });
      }
      prev = node;
    });
    state.cursor = { ch: 4, step: 0, pending: [], done: true };
    save();
  }

  return {
    load: load, save: save, get: get, reset: reset,
    onChange: onChange, addNode: addNode, recordAnswer: recordAnswer,
    setCursor: setCursor, addOther: addOther, nodesByLayer: nodesByLayer,
    hasMap: hasMap, loadSeed: loadSeed, uid: uid
  };
})();
