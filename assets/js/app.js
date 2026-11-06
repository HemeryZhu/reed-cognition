/* ============================================================
   芦苇认知 · 路由与装配
   ============================================================ */

(function () {
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var VIEWS = {
    home: 'view-home',
    dialogue: 'view-dialogue',
    map: 'view-map',
    other: 'view-other',
    about: 'view-about'
  };

  var current = '';

  function parse() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    if (!h) return 'home';
    return VIEWS[h] ? h : 'home';
  }

  function route() {
    var name = parse();
    $$('.view').forEach(function (v) {
      v.classList.toggle('is-live', v.id === VIEWS[name]);
    });
    $$('#nav a').forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-view') === name);
    });

    if (name !== current) {
      window.scrollTo(0, 0);
    }
    current = name;

    if (name === 'dialogue') REED.dialogue.enter();
    if (name === 'map') REED.map.enter();
  }

  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('is-on'); }, 2400);
  }

  function copyText(text) {
    if (!text) { toast('地图还是空的'); return; }
    var done = function () { toast('已复制成文字，可以粘到任何地方'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); }
      catch (e) { toast('复制失败，请手动选择文字'); }
      document.body.removeChild(ta);
    }
  }

  /* ---------- 模型设置 ---------- */

  function initLLM() {
    var btn = $('#btnLLM');
    var mask = $('#llmSheet');
    if (!btn || !mask || !REED.llm) return;

    var fBase = $('#llmBase');
    var fModel = $('#llmModel');
    var fKey = $('#llmKey');
    var msg = $('#llmMsg');
    var testBtn = $('#llmTest');

    function syncDot() {
      btn.classList.toggle('is-on', REED.llm.hasKey());
    }

    function fill() {
      var s = REED.llm.load();
      fBase.value = s.base;
      fModel.value = s.model;
      fKey.value = s.key;
    }

    function say(text, kind) {
      msg.textContent = text || '';
      msg.className = 'sheet-msg' + (kind ? ' is-' + kind : '');
    }

    function open() {
      fill();
      say('');
      mask.hidden = false;
      setTimeout(function () { fKey.focus(); }, 60);
    }

    function close() { mask.hidden = true; }

    function readInput() {
      return {
        base: fBase.value.trim(),
        model: fModel.value.trim(),
        key: fKey.value.trim()
      };
    }

    function valid(v) {
      if (!v.key) { say('先填一个 Key。或者点「清除」，平台会用本地规则继续问。', 'err'); return false; }
      if (!/^https?:\/\//i.test(v.base)) { say('接口地址要以 http:// 或 https:// 开头。', 'err'); return false; }
      return true;
    }

    btn.addEventListener('click', open);
    $('#llmClose').addEventListener('click', close);
    mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mask.hidden) close();
    });

    $('#llmSave').addEventListener('click', function () {
      var v = readInput();
      if (!valid(v)) return;
      REED.llm.save(v);
      syncDot();
      say('已存在这台设备上。回到觉察，下一个问题就会由模型来问。', 'ok');
    });

    $('#llmClear').addEventListener('click', function () {
      REED.llm.clear();
      fill();
      syncDot();
      say('已清除。平台回到本地规则模式，已有的记录不受影响。', 'ok');
    });

    testBtn.addEventListener('click', function () {
      var v = readInput();
      if (!valid(v)) return;
      REED.llm.save(v);
      syncDot();
      say('正在连…');
      testBtn.disabled = true;
      REED.llm.test().then(function (t) {
        say('连上了。模型回话：' + t, 'ok');
      }).catch(function (err) {
        say('没连上：' + err.message +
          '。若是跨域被拦，说明这家接口不允许浏览器直连，需要加一层代理。', 'err');
      }).then(function () {
        testBtn.disabled = false;
      });
    });

    syncDot();
  }

  function init() {
    REED.store.load();
    REED.dialogue.init();
    initLLM();
    if (REED.lens) REED.lens.init();

    $$('#nav a').forEach(function (a) {
      a.addEventListener('click', function () { setTimeout(route, 0); });
    });
    window.addEventListener('hashchange', route);

    var seed = $('#btnSeed');
    if (seed) seed.addEventListener('click', function () {
      REED.store.loadSeed();
      (REED.lens ? REED.lens.render : REED.map.render)();
      toast('已载入一份示例冰山');
    });

    var exp = $('#btnExport');
    if (exp) exp.addEventListener('click', function () {
      copyText(REED.map.toText());
    });

    var reset = $('#btnReset');
    if (reset) reset.addEventListener('click', function () {
      if (!window.confirm('清空所有记录？这会把地图和对话一起删掉，不能撤回。')) return;
      REED.store.reset();
      (REED.lens ? REED.lens.render : REED.map.render)();
      toast('已清空');
    });

    var input = $('#otherInput');
    var btn = $('#btnAnalyse');
    if (input) {
      input.addEventListener('input', function () {
        var n = input.value.trim().length;
        $('#otherCount').textContent = n + ' 字';
        btn.disabled = n < 12;
      });
      if (btn) btn.disabled = input.value.trim().length < 12;
    }
    if (btn) btn.addEventListener('click', function () {
      var text = input.value.trim();
      if (text.length < 12) { toast('再多写几句'); return; }
      REED.portrait.render(text);
    });

    if (!location.hash) location.replace('#/');
    route();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
