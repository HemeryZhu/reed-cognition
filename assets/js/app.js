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

  function init() {
    REED.store.load();
    REED.dialogue.init();
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
