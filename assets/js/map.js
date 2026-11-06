/* ============================================================
   芦苇认知 · 冰山地图
   水面之上是反应，水面之下是模式，深水区是信念。
   每个点都能追回到一句原话。
   ============================================================ */

window.REED = window.REED || {};

REED.map = (function () {
  var W = 1000, H = 740;
  var BANDS = {
    surface: { top: 78,  bottom: 250, label: '水面之上', sub: '行为与反应' },
    middle:  { top: 300, bottom: 470, label: '水面之下', sub: '模式与触发' },
    deep:    { top: 520, bottom: 700, label: '深水区',   sub: '信念与价值' }
  };
  var WATER = 272;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  function wrap(text, per) {
    var t = String(text);
    var lines = [];
    if (t.length <= per) return [t];
    lines.push(t.slice(0, per));
    var rest = t.slice(per);
    lines.push(rest.length > per ? rest.slice(0, per - 1) + '…' : rest);
    return lines;
  }

  function layout(list, layerKey) {
    var per = 3;
    var band = BANDS[layerKey];
    var rows = [];
    for (var i = 0; i < list.length; i += per) rows.push(list.slice(i, i + per));
    var usable = band.bottom - band.top - 34;
    var gapY = rows.length > 1 ? Math.min(96, usable / (rows.length - 1)) : 0;

    var out = [];
    rows.forEach(function (row, ri) {
      var n = row.length;
      var gapX = 330;
      var start = 500 - (n - 1) * gapX / 2;
      var y = band.top + 34 + ri * gapY;
      row.forEach(function (node, i) {
        out.push({ node: node, x: start + i * gapX, y: y });
      });
    });
    return out;
  }

  function render() {
    var host = document.querySelector('#mapCanvas');
    if (!host) return;
    var st = REED.store.get();
    var nodes = st.nodes;

    var title = document.querySelector('#mapTitle');
    var sub = document.querySelector('#mapSub');
    if (title) {
      title.textContent = nodes.length ? '你此刻的冰山' : '还没有画出冰山';
    }
    if (sub) {
      sub.textContent = nodes.length
        ? '共 ' + nodes.length + ' 个点。连线只表示它们在同一次叙述里挨着出现，不表示因果。'
        : '走一遍觉察，或者载入一份示例看看它长什么样。';
    }

    if (!nodes.length) {
      host.innerHTML =
        '<div class="map-empty">' +
          '<p>这张图还是空的。<br>它需要一个你自己说出来的句子，才能开始长。</p>' +
          '<a href="#/dialogue">去走一遍觉察 →</a>' +
        '</div>';
      renderLegend();
      return;
    }

    var placed = [];
    ['surface', 'middle', 'deep'].forEach(function (layer) {
      var list = nodes.filter(function (n) { return n.layer === layer; }).slice(0, 9);
      placed = placed.concat(layout(list, layer));
    });

    var posOf = {};
    placed.forEach(function (p) { posOf[p.node.id] = p; });

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="认知冰山地图">';

    // 纸面纵深
    svg += '<defs>' +
      '<linearGradient id="depth" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#ffffff" stop-opacity=".55"/>' +
        '<stop offset=".36" stop-color="#ffffff" stop-opacity="0"/>' +
        '<stop offset=".46" stop-color="#5d6f60" stop-opacity=".045"/>' +
        '<stop offset="1" stop-color="#5d6f60" stop-opacity=".10"/>' +
      '</linearGradient>' +
    '</defs>';
    svg += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#depth)"/>';

    // 三层分隔
    ['middle', 'deep'].forEach(function (k) {
      var b = BANDS[k];
      svg += '<line class="depth-tick" x1="56" y1="' + (b.top - 18) + '" x2="' + (W - 56) + '" y2="' + (b.top - 18) + '"/>';
    });

    // 左栏层名
    ['surface', 'middle', 'deep'].forEach(function (k) {
      var b = BANDS[k];
      var mid = (b.top + b.bottom) / 2;
      svg += '<text class="layer-band-label" x="56" y="' + (mid - 8) + '">' + esc(b.label) + '</text>';
      svg += '<text class="layer-name" x="56" y="' + (mid + 16) + '">' + esc(b.sub) + '</text>';
    });

    // 水线
    svg += '<line class="water-line" x1="40" y1="' + WATER + '" x2="' + (W - 40) + '" y2="' + WATER + '"/>';
    svg += '<text class="layer-band-label" x="' + (W - 56) + '" y="' + (WATER - 10) + '" text-anchor="end">水面</text>';

    // 连线
    st.edges.forEach(function (e) {
      var a = posOf[e.from], b = posOf[e.to];
      if (!a || !b) return;
      var my = (a.y + b.y) / 2;
      svg += '<path class="edge" data-a="' + e.from + '" data-b="' + e.to + '" d="M' +
        a.x + ' ' + a.y + ' C ' + a.x + ' ' + my + ', ' + b.x + ' ' + my + ', ' + b.x + ' ' + b.y + '"/>';
    });

    // 节点
    placed.forEach(function (p) {
      var n = p.node;
      var type = REED.TYPES[n.type] || REED.TYPES.pattern;
      var lines = wrap(n.title || '（未命名）', 9);
      svg += '<g class="node-group" data-id="' + n.id + '" tabindex="0" role="button" ' +
        'aria-label="' + esc(type.label + '：' + n.title) + '">';
      svg += '<circle class="node-ring" cx="' + p.x + '" cy="' + p.y + '" r="9"/>';
      svg += '<circle class="node-core" cx="' + p.x + '" cy="' + p.y + '" r="3.2"/>';
      lines.forEach(function (line, li) {
        svg += '<text class="node-label" x="' + p.x + '" y="' + (p.y + 26 + li * 17) + '" text-anchor="middle">' + esc(line) + '</text>';
      });
      svg += '</g>';
    });

    svg += '</svg>';
    host.innerHTML = svg + '<div class="map-tip" id="mapTip"></div>';
    bindTip(host, placed);
    renderLegend();
  }

  function bindTip(host, placed) {
    var tip = host.querySelector('#mapTip');
    var svg = host.querySelector('svg');

    function show(g) {
      var id = g.getAttribute('data-id');
      var item = placed.filter(function (p) { return p.node.id === id; })[0];
      if (!item) return;
      var n = item.node;
      var type = REED.TYPES[n.type] || REED.TYPES.pattern;
      tip.innerHTML =
        '<span class="tip-type">' + esc(type.label) + '</span>' +
        esc(n.title) +
        (n.protect ? '<span class="tip-quote">在保护：' + esc(n.protect) + '</span>' : '') +
        (n.quote ? '<span class="tip-quote">' + esc(n.quote) + '</span>' : '');
      tip.classList.add('is-on');

      var rect = host.getBoundingClientRect();
      var gb = g.getBoundingClientRect();
      var left = gb.left - rect.left + gb.width / 2 - 130;
      left = Math.max(12, Math.min(left, rect.width - 272));
      var top = gb.top - rect.top + gb.height + 8;
      if (top + 150 > rect.height) top = gb.top - rect.top - 150;
      tip.style.left = left + 'px';
      tip.style.top = Math.max(10, top) + 'px';

      svg.querySelectorAll('.node-group').forEach(function (el) {
        el.classList.toggle('is-dim', el !== g);
      });
      svg.querySelectorAll('.edge').forEach(function (el) {
        var linked = el.getAttribute('data-a') === id || el.getAttribute('data-b') === id;
        el.classList.toggle('is-dim', !linked);
        el.classList.toggle('is-strong', linked);
      });
    }

    function hide() {
      tip.classList.remove('is-on');
      svg.querySelectorAll('.node-group').forEach(function (el) { el.classList.remove('is-dim'); });
      svg.querySelectorAll('.edge').forEach(function (el) {
        el.classList.remove('is-dim');
        el.classList.remove('is-strong');
      });
    }

    svg.querySelectorAll('.node-group').forEach(function (g) {
      g.addEventListener('mouseenter', function () { show(g); });
      g.addEventListener('mouseleave', hide);
      g.addEventListener('focus', function () { show(g); });
      g.addEventListener('blur', hide);
    });
  }

  function renderLegend() {
    var host = document.querySelector('#mapLegend');
    if (!host) return;
    host.innerHTML =
      '<span><i class="lg-surface"></i>水面之上 · 行为与反应</span>' +
      '<span><i class="lg-middle"></i>水面之下 · 模式与触发点</span>' +
      '<span><i class="lg-deep"></i>深水区 · 信念与价值排序</span>';
  }

  function toText() {
    var st = REED.store.get();
    if (!st.nodes.length) return '';
    var out = ['芦苇认知 · 我的冰山', ''];
    ['surface', 'middle', 'deep'].forEach(function (k) {
      var list = st.nodes.filter(function (n) { return n.layer === k; });
      if (!list.length) return;
      out.push('【' + REED.LAYERS[k].name + '】' + REED.LAYERS[k].sub);
      list.forEach(function (n) {
        var t = REED.TYPES[n.type] ? REED.TYPES[n.type].label : '';
        out.push('- ' + t + '：' + n.title);
        if (n.protect) out.push('  在保护：' + n.protect);
        if (n.quote) out.push('  原话：' + n.quote);
      });
      out.push('');
    });
    out.push('——');
    out.push('这张图不是结论，是一个可以反复改的草稿。');
    return out.join('\n');
  }

  function enter() {
    if (window.REED && REED.lens) REED.lens.render();
    else render();
  }

  return { enter: enter, render: render, toText: toText };
})();
