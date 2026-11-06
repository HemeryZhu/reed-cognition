/* ============================================================
   芦苇认知 · 四层解释透镜
   同一张冰山，换四种读法：五行、周易、心理机制、哲学。
   不做测算，不给标签。所有引文标出处；归类是按关键词做的，
   读错了也算它的一种诚实——它不是命，是你写下的词。
   ============================================================ */

window.REED = window.REED || {};

REED.lens = (function () {
  var current = 'iceberg';

  var META = {
    iceberg: {
      title: '你此刻的冰山',
      sub: '共 {n} 个点。连线只表示它们在同一次叙述里挨着出现，不表示因果。',
      empty: '走一遍觉察，或者载入一份示例看看它长什么样。'
    },
    wuxing: {
      title: '五种力量的此刻轻重',
      sub: '不给你定属性。只看最近这几件事里，哪一种力量留下的痕迹最多。',
      empty: '这张图还是空的。先有几个句子，才谈得上哪一股力量重。'
    },
    yijing: {
      title: '此刻的处境组合',
      sub: '外卦取你示人的那一层，内卦取你很少说出口的那一层。是取象，不是起卦。',
      empty: '还没有句子可以取象。先走一遍觉察，再回来看这一页。'
    },
    psy: {
      title: '这些反应在保护什么',
      sub: '把图上的点，对上几个有出处的机制说法。是类比，不是诊断。',
      empty: '机制要贴在你的句子上才有意义。先去说几件具体的事。'
    },
    philo: {
      title: '换一个人，问你同一个问题',
      sub: '六个人，六种问法。不用都同意，挑一个听得进去的。',
      empty: '这里的问题不凭空问。先有你的图，它们才知道该往哪儿问。'
    }
  };

  /* ---------- 小工具 ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  function list() {
    var st = REED.store.get();
    return st.nodes.map(function (n) {
      return {
        node: n,
        text: [n.title, n.protect, n.quote].join(' ')
      };
    });
  }

  function hits(items, re) {
    return items.filter(function (x) { return re.test(x.text); });
  }

  function chips(found, max) {
    if (!found.length) return '';
    var out = '<ul class="lens-evi">';
    found.slice(0, max || 3).forEach(function (x) {
      out += '<li>' + esc(x.node.title) + '</li>';
    });
    if (found.length > (max || 3)) {
      out += '<li class="is-more">另有 ' + (found.length - (max || 3)) + ' 条</li>';
    }
    return out + '</ul>';
  }

  function emptyPane(meta) {
    return '<div class="lens-empty">' +
      '<p>' + esc(meta.empty) + '</p>' +
      '<a href="#/dialogue">去走一遍觉察 →</a>' +
      '</div>';
  }

  function setHead(mode, n) {
    var t = document.querySelector('#mapTitle');
    var s = document.querySelector('#mapSub');
    var m = META[mode];
    if (!m) return;
    if (t) t.textContent = m.title;
    if (s) s.textContent = m.sub.replace('{n}', n);
    var head = document.querySelector('.map-head .eyebrow');
    if (head) head.textContent = mode === 'iceberg' ? '你此刻的结构' : '同一张图，换一种读法';
  }

  function canvas() { return document.querySelector('#mapCanvas'); }
  function legend() { return document.querySelector('#mapLegend'); }

  /* ---------- 五行 ----------
     五种力量取自《尚书·洪范》对五行之性的界定：
     水曰润下，火曰炎上，木曰曲直，金曰从革，土爰稼穑。
     这里只借「性」，不做生克推算，也不判吉凶。 */

  var WUXING = [
    {
      han: '木', image: '曲直', move: '生发', color: '#5b7a63',
      read: '想把话说完、把事做出来的那股劲。',
      match: /(咽回|咽了|没说|说不出|不敢说|没敢|憋|压在|闷|忍|开不了口)/,
      high: '受阻', hint: '挑一句咽回去的话，先写下来，不必寄出去。'
    },
    {
      han: '火', image: '炎上', move: '明', color: '#a8573a',
      read: '想被看见、被认出来的那股劲。',
      match: /(被看见|看见我|认可|在意|透明|注意|重视|重要|表现|证明|名字)/,
      high: '偏旺', hint: '把「希望被谁看见」说具体到一个人，愿望就不再是压力。'
    },
    {
      han: '土', image: '稼穑', move: '承载', color: '#8d7a4e',
      read: '接住别人、把事情稳住的那部分。',
      match: /(迁就|答应|照顾|配合|承担|责任|懂事|不好意思|让着|帮忙|为别人|合群)/,
      high: '过载', hint: '找一件你其实可以不管的事，这一周先不管它。'
    },
    {
      han: '金', image: '从革', move: '收敛', color: '#7d8078',
      read: '定规矩、卡标准、要一个确定的那部分。',
      match: /(应该|必须|不能|检查|出错|完美|标准|正确|规矩|要求|控制|怕错)/,
      high: '过紧', hint: '把标准降一档做一次，看看天有没有塌。'
    },
    {
      han: '水', image: '润下', move: '退藏', color: '#4e6572',
      read: '退一步、藏起来、先保住自己的那部分。',
      match: /(退|躲|回避|沉默|缩|一个人|安全|逃|放弃|不说了|算了|没声音)/,
      high: '过沉', hint: '在退开之前，先告诉对方一句：我需要一点时间。'
    }
  ];
  /* ---------- 周易 · 八卦 ----------
     性情取自《说卦传》第七章：乾健、坤顺、震动、巽入、坎陷、离丽、艮止、兑说。
     只用八卦作八种处境力量，不排盘、不起筮、不断吉凶。 */

  var TRIGRAMS = [
    { key: 'qian', han: '乾', code: [1, 1, 1], image: '天', nature: '健',
      line: '一直往前，不太肯停',
      match: /(主动|主导|必须|不能停|撑|扛|自己来|证明|拿下|顶住|做到)/,
      doIt: '先停一下，看这件事里有没有可以交给别人的部分。' },
    { key: 'kun', han: '坤', code: [0, 0, 0], image: '地', nature: '顺',
      line: '接住、顺从、把别人托住',
      match: /(迁就|答应|照顾|配合|忍|懂事|承担|让着|顺着|合群)/,
      doIt: '把一件一直由你托着的事，摊开来说，让大家一起托。' },
    { key: 'zhen', han: '震', code: [1, 0, 0], image: '雷', nature: '动',
      line: '一下子动起来，也容易被惊到',
      match: /(突然|一下子|惊|慌|急|冲动|爆发|情绪上来|忍不住)/,
      doIt: '把最急的那句话，压一个晚上再说。' },
    { key: 'xun', han: '巽', code: [0, 1, 1], image: '风', nature: '入',
      line: '绕进去、试探、先看脸色',
      match: /(试探|委婉|暗示|绕|看脸色|迎合|慢慢|一点点|不好直说)/,
      doIt: '把最委婉的那句话，直说一遍，看看会怎样。' },
    { key: 'kan', han: '坎', code: [0, 1, 0], image: '水', nature: '陷',
      line: '陷在里面，反复回到同一个地方',
      match: /(反复|又是|总是|一直|陷|出不来|拖|循环|回不去|沉)/,
      doIt: '找出循环里的第一个动作——它最小，也最容易改。' },
    { key: 'li', han: '离', code: [1, 0, 1], image: '火', nature: '丽',
      line: '附着在别人的目光上',
      match: /(被看见|认可|注意|怎么看|在意|透明|表现|评价|重视)/,
      doIt: '做一件没人会知道的小事，只为自己做。' },
    { key: 'gen', han: '艮', code: [0, 0, 1], image: '山', nature: '止',
      line: '停住、压住、守住那条线',
      match: /(停|压住|咽|沉默|退|不动|算了|不说了|放弃|忍住)/,
      doIt: '把「停」变成自己选的暂停，而不是被逼的停。' },
    { key: 'dui', han: '兑', code: [1, 1, 0], image: '泽', nature: '说',
      line: '开口、交换、把话讲开',
      match: /(直说|说开|说出来|开口|沟通|表达|解释|回应|讲开|争论)/,
      doIt: '找一个人，把这件事完整讲一遍，不求他给答案。' }
  ];

  /* 通行本六十四卦：外卦（上） + 内卦（下）。
     只用来给处境一个名字，卦辞爻辞一概不用。 */
  var HEX = {
    qian: { qian: '乾为天', dui: '天泽履', li: '天火同人', zhen: '天雷无妄', xun: '天风姤', kan: '天水讼', gen: '天山遁', kun: '天地否' },
    kun:  { qian: '地天泰', dui: '地泽临', li: '地火明夷', zhen: '地雷复', xun: '地风升', kan: '地水师', gen: '地山谦', kun: '坤为地' },
    zhen: { qian: '雷天大壮', dui: '雷泽归妹', li: '雷火丰', zhen: '震为雷', xun: '雷风恒', kan: '雷水解', gen: '雷山小过', kun: '雷地豫' },
    xun:  { qian: '风天小畜', dui: '风泽中孚', li: '风火家人', zhen: '风雷益', xun: '巽为风', kan: '风水涣', gen: '风山渐', kun: '风地观' },
    kan:  { qian: '水天需', dui: '水泽节', li: '水火既济', zhen: '水雷屯', xun: '水风井', kan: '坎为水', gen: '水山蹇', kun: '水地比' },
    li:   { qian: '火天大有', dui: '火泽睽', li: '离为火', zhen: '火雷噬嗑', xun: '火风鼎', kan: '火水未济', gen: '火山旅', kun: '火地晋' },
    gen:  { qian: '山天大畜', dui: '山泽损', li: '山火贲', zhen: '山雷颐', xun: '山风蛊', kan: '山水蒙', gen: '艮为山', kun: '山地剥' },
    dui:  { qian: '泽天夬', dui: '兑为泽', li: '泽火革', zhen: '泽雷随', xun: '泽风大过', kan: '泽水困', gen: '泽山咸', kun: '泽地萃' }
  };

  /* ---------- 心理机制 ---------- */

  var PSY = [
    {
      name: '防御机制', src: '安娜·弗洛伊德《自我与防御机制》1936',
      gist: '太难受的念头会被悄悄挪开。不是虚伪，是当时只能这样。',
      match: /(咽回|咽了|算了|没关系|还好|不至于|习惯了|压住|假装|无所谓|不想)/,
      ask: '如果这层挪开的手松一会儿，你最先感觉到什么？'
    },
    {
      name: 'ABC 模型', src: '埃利斯 Reason and Emotion in Psychotherapy 1962',
      gist: '让人难受的常常不是事本身，是你怎么读它。A 是事，B 是解释，C 才是反应。',
      match: /(果然|说明|等于|证明|反正|一定是|没人听|不重要|不行|看不起)/,
      ask: '这件事是 A。你的 B 是哪一句？换一种读法，C 会不一样吗？'
    },
    {
      name: '依恋与靠近', src: '鲍尔比《依恋》1969；安斯沃斯《依恋的模式》1978',
      gist: '人用早年学到的办法维持关系：靠靠近、靠先退开、或靠不停确认。',
      match: /(关系|离开|不带我|抛下|讨厌|不喜欢我|不合群|被留在|拒绝|答应|迁就)/,
      ask: '你此刻做的这件事，是在拉近，还是在保护自己不被推开？'
    },
    {
      name: '自主 · 胜任 · 联结', src: '德西与瑞安《人类行为中的内在动机与自我决定》1985',
      gist: '动力靠三样东西：自己能选、做得来、和人连得上。缺一样，力气就漏。',
      match: /(应该|必须|不得不|被安排|没得选|做不好|证明|没意思|意义|撑)/,
      ask: '这三样里，你现在最缺的是哪一样？'
    },
    {
      name: '控制二分', src: '爱比克泰德《手册》第一节，约公元二世纪',
      gist: '把力气花在归你管的部分；不归你管的，只做能做的准备。',
      match: /(怕|担心|万一|控制|脱出|失控|怎么看|评价|结果|来不及)/,
      ask: '分两栏写：归你管的，不归你管的。你花时间最多的是哪一栏？'
    }
  ];

  /* ---------- 哲学 · 对话卡 ---------- */

  var PHILO = [
    {
      name: '爱比克泰德', tag: '斯多葛 · 约公元二世纪',
      src: '《手册》第一节（据英译本转译）',
      say: '有些事情在我们能力之内，有些不在。',
      plain: '别人怎么想、事情成不成，多半不归你管；你怎么回应，归你管。',
      ask: '你图上这件事，哪一部分其实不归你管？'
    },
    {
      name: '孟子', tag: '战国 · 儒家',
      src: '《孟子·公孙丑上》',
      say: '恻隐之心，仁之端也。',
      plain: '看见别人难受时那一下不忍，是你心里本来就有的东西，不是软弱。',
      ask: '你对自己，用过对朋友那样的耐心吗？'
    },
    {
      name: '庄子', tag: '战国 · 道家',
      src: '《庄子·齐物论》',
      say: '今者吾丧我。',
      plain: '连「我是谁」这个固定的样子，也可以先放下一会儿。放下了，才听得见别的。',
      ask: '如果这次不按「我就是这样的人」来反应，你会怎么做？'
    },
    {
      name: '萨特', tag: '法国 · 存在主义',
      src: '《存在与虚无》1943',
      say: '人被判定为自由。',
      plain: '处境没得选，怎么回应还是你选；不选，也是一种选。',
      ask: '你说「只能这样」的那件事里，还有没有第二个选项，是你不愿付代价？'
    },
    {
      name: '加缪', tag: '法国 · 荒诞哲学',
      src: '《西西弗神话》1942',
      say: '必须想象西西弗是幸福的。',
      plain: '有些重复的事没有终点。能改的不是终点，是你和它的关系。',
      ask: '如果这件事一直不会有结果，你还愿意怎么过今天？'
    },
    {
      name: '孔子', tag: '春秋 · 儒家',
      src: '《论语·雍也》',
      say: '不迁怒，不贰过。',
      plain: '难过的时候不把它倒给下一个人；同一个坑不摔第二次，已经很好了。',
      ask: '这一次的火，最想被倒到谁身上？'
    }
  ];

  /* ---------- 五行：画环 ---------- */

  var WX_POS = (function () {
    var cx = 210, cy = 226, r = 142, out = {};
    WUXING.forEach(function (w, i) {
      var a = (-90 + i * 72) * Math.PI / 180;
      out[w.han] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });
    return out;
  })();

  function shrink(a, b, pad1, pad2) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / d, uy = dy / d;
    return {
      x1: a.x + ux * pad1, y1: a.y + uy * pad1,
      x2: b.x - ux * pad2, y2: b.y - uy * pad2
    };
  }

  function wxRing(found) {
    var P = WX_POS;
    var order = ['木', '火', '土', '金', '水'];
    var ke = [['木', '土'], ['土', '水'], ['水', '火'], ['火', '金'], ['金', '木']];
    var s = '<svg class="lens-svg wx-ring" viewBox="0 0 420 452" role="img" aria-label="五行生克示意">';
    s += '<defs><marker id="wxArrow" viewBox="0 0 10 10" refX="9" refY="5" ' +
      'markerWidth="5" markerHeight="5" orient="auto">' +
      '<path d="M0 0 L10 5 L0 10 z" fill="#9a9484"/></marker></defs>';

    // 相克：虚线穿过环内
    ke.forEach(function (pair) {
      var g = shrink(P[pair[0]], P[pair[1]], 34, 38);
      s += '<line class="wx-ke" x1="' + g.x1 + '" y1="' + g.y1 + '" x2="' + g.x2 +
        '" y2="' + g.y2 + '" marker-end="url(#wxArrow)"/>';
    });

    // 相生：沿环顺时针
    order.forEach(function (han, i) {
      var g = shrink(P[han], P[order[(i + 1) % 5]], 34, 40);
      s += '<line class="wx-sheng" x1="' + g.x1 + '" y1="' + g.y1 + '" x2="' + g.x2 +
        '" y2="' + g.y2 + '" marker-end="url(#wxArrow)"/>';
    });

    found.forEach(function (f) {
      var w = f.w, p = P[w.han], n = f.ev.length;
      var op = n === 0 ? 0 : (n === 1 ? 0.10 : 0.18);
      s += '<g class="wx-node">';
      if (op) s += '<circle cx="' + p.x + '" cy="' + p.y + '" r="52" fill="' + w.color + '" opacity="' + op + '"/>';
      s += '<circle class="wx-disc" cx="' + p.x + '" cy="' + p.y + '" r="31" stroke="' + w.color + '"/>';
      s += '<text class="wx-han-svg" x="' + p.x + '" y="' + (p.y + 9) + '" fill="' + w.color + '">' + w.han + '</text>';
      s += '<text class="wx-tag-svg" x="' + p.x + '" y="' + (p.y + 52) + '">' +
        w.image + ' · ' + (n === 0 ? '未显' : n === 1 ? '微显' : w.high) + '</text>';
      s += '</g>';
    });

    s += '<text class="wx-foot-svg" x="210" y="436" text-anchor="middle">实线相生 · 虚线相克</text>';
    return s + '</svg>';
  }

  function wxCard(f) {
    var w = f.w, n = f.ev.length;
    var state = n === 0 ? '未显' : (n === 1 ? '微显' : w.high);
    return '<article class="lens-card wx-card" style="--c:' + w.color + '">' +
      '<div class="lens-card-head">' +
        '<span class="wx-han">' + w.han + '</span>' +
        '<span class="lens-card-name">' + w.image + ' · ' + w.move + '</span>' +
        '<span class="lens-state">' + state + '</span>' +
      '</div>' +
      '<p class="lens-read">' + esc(w.read) + '</p>' +
      (n ? chips(f.ev, 2) : '<p class="lens-quiet">图上还没有写到这一路。</p>') +
      (n ? '<p class="lens-do">可做：' + esc(w.hint) + '</p>' : '') +
    '</article>';
  }

  function renderWuxing(items) {
    var found = WUXING.map(function (w) { return { w: w, ev: hits(items, w.match) }; });
    var html = '<div class="lens-pane">' +
      '<div class="lens-split">' +
        '<div class="lens-figure">' + wxRing(found) +
          '<p class="figure-cap">生成与制约，是古人讲关系的一套话。<br>它说的是力量之间怎么互相牵，不是你的命。</p>' +
        '</div>' +
        '<div class="lens-cards">' + found.map(wxCard).join('') + '</div>' +
      '</div>' +
      '<div class="lens-note">' +
        '<strong>怎么读</strong>' +
        '五行之性，见《尚书·洪范》：「水曰润下，火曰炎上，木曰曲直，金曰从革，土爰稼穑。」' +
        '这里只借这五个字来讲五种动作：伸出去、被看见、托住别人、卡标准、退回来。' +
        '归类只看你写下的词，同一句话可能同时落在两行里；它不是命理推算，也不把人归成五类。' +
      '</div>' +
    '</div>';
    canvas().innerHTML = html;
  }

  /* ---------- 周易：画卦 ---------- */

  var VERB = {
    qian: '往前推', kun: '接住', zhen: '起动', xun: '渗透',
    kan: '陷住', li: '附着', gen: '停住', dui: '说开'
  };

  /* 标题里的词比引文里的词更重：标题是你自己给这一块起的名字。 */
  function score(items) {
    return TRIGRAMS.map(function (t) {
      var n = 0, s = 0;
      items.forEach(function (x) {
        if (t.match.test(x.node.title)) { n++; s += 2; }
        else if (t.match.test(x.text)) { n++; s += 1; }
      });
      return { t: t, n: n, s: s };
    }).sort(function (a, b) { return (b.s - a.s) || (b.n - a.n); });
  }

  function yjFigure(outer, inner) {
    var codes = inner.code.concat(outer.code); // 自下而上
    var x0 = 46, wLine = 148, gap = 33, yBottom = 222;
    var s = '<svg class="lens-svg yj-figure" viewBox="0 0 380 322" role="img" aria-label="六爻卦画：外卦' +
      outer.han + '，内卦' + inner.han + '">';

    for (var i = 0; i < 6; i++) {
      var y = yBottom - i * gap;
      if (codes[i]) {
        s += '<rect class="yj-line" x="' + x0 + '" y="' + (y - 4) + '" width="' + wLine + '" height="8"/>';
      } else {
        var half = (wLine - 22) / 2;
        s += '<rect class="yj-line" x="' + x0 + '" y="' + (y - 4) + '" width="' + half + '" height="8"/>';
        s += '<rect class="yj-line" x="' + (x0 + wLine - half) + '" y="' + (y - 4) + '" width="' + half + '" height="8"/>';
      }
    }

    s += '<line class="yj-bracket" x1="' + (x0 + wLine + 34) + '" y1="' + (yBottom - 5 * gap - 10) +
      '" x2="' + (x0 + wLine + 34) + '" y2="' + (yBottom - 3 * gap + 10) + '"/>';
    s += '<line class="yj-bracket" x1="' + (x0 + wLine + 34) + '" y1="' + (yBottom - 2 * gap - 10) +
      '" x2="' + (x0 + wLine + 34) + '" y2="' + (yBottom + 10) + '"/>';

    s += '<text class="yj-tag" x="' + (x0 + wLine + 46) + '" y="' + (yBottom - 4 * gap) + '">外卦</text>';
    s += '<text class="yj-han" x="' + (x0 + wLine + 46) + '" y="' + (yBottom - 4 * gap + 30) + '">' + outer.han + '</text>';
    s += '<text class="yj-tag" x="' + (x0 + wLine + 46) + '" y="' + (yBottom - gap) + '">内卦</text>';
    s += '<text class="yj-han" x="' + (x0 + wLine + 46) + '" y="' + (yBottom - gap + 30) + '">' + inner.han + '</text>';

    s += '<text class="yj-note" x="' + x0 + '" y="' + (yBottom + 52) + '">六爻自下而上 · 内卦在下，外卦在上</text>';
    return s + '</svg>';
  }

  function renderYijing(items) {
    var deep = items.filter(function (x) { return x.node.layer === 'deep'; });
    var rest = items.filter(function (x) { return x.node.layer !== 'deep'; });

    var innerRank = score(deep.length ? deep : items);
    var outerRank = score(rest.length ? rest : items);

    var totalHits = innerRank.reduce(function (a, x) { return a + x.n; }, 0) +
                    outerRank.reduce(function (a, x) { return a + x.n; }, 0);

    if (!totalHits) {
      canvas().innerHTML = '<div class="lens-pane"><div class="lens-empty">' +
        '<p>这张图上的句子，还没有哪一句明显落进哪一象。<br>' +
        '硬取也能取出一卦，但那样读出来的东西不属于你。</p>' +
        '<a href="#/dialogue">再多说几件具体的事 →</a>' +
      '</div></div>';
      return;
    }

    var innerThin = !innerRank[0].n;
    var inner = innerThin ? TRIGRAMS[1] : innerRank[0].t; // 取不到象时暂以坤留白
    var outer = outerRank[0].n ? outerRank[0].t : TRIGRAMS[0];
    var name = (HEX[outer.key] && HEX[outer.key][inner.key]) || ('上' + outer.han + '下' + inner.han);

    var html = '<div class="lens-pane">' +
      '<div class="lens-split">' +
        '<div class="lens-figure">' + yjFigure(outer, inner) +
          '<p class="figure-cap">取象比类，非起卦。<br>不排盘，不问吉凶。</p>' +
        '</div>' +
        '<div class="lens-read-pane">' +
          '<p class="yj-name">' + esc(name) + '</p>' +
          '<p class="yj-sub">上卦 ' + outer.han + '（' + outer.image + ' · ' + outer.nature + '）' +
            '　下卦 ' + inner.han + '（' + inner.image + ' · ' + inner.nature + '）</p>' +
          (innerThin
            ? '<p class="lens-caveat">深水区还没有明显的迹象，内卦暂以坤（地）留白——它只表示「先接住」，不是给你的性格。</p>'
            : (!deep.length ? '<p class="lens-caveat">深水区还没有句子，内卦暂时按整张图来取。</p>' : '')) +
          '<dl class="yj-dl">' +
            '<div><dt>外面这一层</dt><dd>' + esc(outer.line) +
              '<span class="dd-tail">你在别人面前，多半是这个样子。</span></dd></div>' +
            '<div><dt>里面这一层</dt><dd>' + esc(inner.line) +
              '<span class="dd-tail">底下撑着这个样子的，是它。</span></dd></div>' +
            '<div><dt>合起来看</dt><dd>外面在' + esc(VERB[outer.key]) + '，里面在' +
              esc(VERB[inner.key]) + '。两股劲同向时省力，拧着时最耗人。</dd></div>' +
            '<div><dt>此时可做</dt><dd>' + esc(inner.doIt) +
              '<span class="dd-tail">从内卦这一侧动，外面会跟着松一点。</span></dd></div>' +
          '</dl>' +
        '</div>' +
      '</div>' +
      '<div class="lens-note">' +
        '<strong>这不是起卦</strong>' +
        '《说卦传》定八卦之性：「乾，健也；坤，顺也；震，动也；巽，入也；坎，陷也；离，丽也；艮，止也；兑，说也。」' +
        '本页只用这八个字区分八种处境力量：内卦取自深水区（信念与价值），外卦取自水面与中层（反应与模式）。' +
        '内外卦怎么取、怎么组合成一句处境话，是本平台自定的读法，不是《周易》原法，也不预测任何事。' +
      '</div>' +
    '</div>';
    canvas().innerHTML = html;
  }

  /* ---------- 心理机制 ---------- */

  function renderPsy(items) {
    var cards = PSY.map(function (m) {
      var ev = hits(items, m.match);
      return '<article class="lens-card psy-card' + (ev.length ? '' : ' is-quiet') + '">' +
        '<div class="lens-card-head">' +
          '<span class="lens-card-name">' + esc(m.name) + '</span>' +
          '<span class="lens-state">' + (ev.length ? ev.length + ' 条对得上' : '待出现') + '</span>' +
        '</div>' +
        '<p class="lens-src">' + esc(m.src) + '</p>' +
        '<p class="lens-read">' + esc(m.gist) + '</p>' +
        (ev.length ? chips(ev, 3) : '<p class="lens-quiet">这张图上还没有对得上的句子。</p>') +
        '<p class="lens-do">可以问：' + esc(m.ask) + '</p>' +
      '</article>';
    }).join('');

    canvas().innerHTML = '<div class="lens-pane">' +
      '<div class="lens-cards lens-grid-2">' + cards + '</div>' +
      '<div class="lens-note">' +
        '<strong>别把它当诊断</strong>' +
        '这些机制的说法来自上面标出的书，但把它们贴到你的句子上，是这台机器做的类比。' +
        '对不上很正常——机制不是标签，是一个可以拿去问自己的角度。' +
        '如果某些内容让你持续难受，请找专业的人。' +
      '</div>' +
    '</div>';
  }

  /* ---------- 哲学 ---------- */

  function renderPhilo() {
    var cards = PHILO.map(function (p) {
      return '<article class="lens-card philo-card">' +
        '<div class="lens-card-head">' +
          '<span class="lens-card-name">' + esc(p.name) + '</span>' +
          '<span class="lens-state">' + esc(p.tag) + '</span>' +
        '</div>' +
        '<blockquote class="philo-say">' + esc(p.say) + '</blockquote>' +
        '<p class="lens-src">' + esc(p.src) + '</p>' +
        '<p class="lens-read">' + esc(p.plain) + '</p>' +
        '<p class="philo-ask">' + esc(p.ask) + '</p>' +
      '</article>';
    }).join('');

    canvas().innerHTML = '<div class="lens-pane">' +
      '<div class="lens-cards lens-grid-2">' + cards + '</div>' +
      '<div class="lens-note">' +
        '<strong>关于引文</strong>' +
        '每张卡都标了出处；外文只标原著名与年份，不假装有唯一的中译。' +
        '他们说的话不是给你的答案，是一个换位——同一件事，换一双眼睛看。' +
        '不同意也没关系，能说清为什么不同意，你就更清楚自己站在哪儿了。' +
      '</div>' +
    '</div>';
  }

  /* ---------- 图例 ---------- */

  function legendFor(mode) {
    if (mode === 'wuxing') {
      return '<span>木 曲直 · 火 炎上 · 土 稼穑 · 金 从革 · 水 润下</span>' +
        '<span>「微显」= 图上只有一句 · 「未显」= 还没有</span>';
    }
    if (mode === 'yijing') {
      return '<span>上三爻 · 外卦（水面与中层）</span>' +
        '<span>下三爻 · 内卦（深水区）</span>' +
        '<span>取象比类，非占筮</span>';
    }
    if (mode === 'psy') {
      return '<span>每条都标了出处</span><span>「待出现」= 这张图上还没找到对得上的句子</span>';
    }
    if (mode === 'philo') {
      return '<span>引文标出处</span><span>外文著作只标原著名与年份</span>';
    }
    return '';
  }

  /* ---------- 总装 ---------- */

  function render() {
    var mode = current;
    var items = list();
    setHead(mode, items.length);

    if (mode === 'iceberg') {
      REED.map.render();
      return;
    }

    if (!items.length) {
      canvas().innerHTML = emptyPane(META[mode]);
      if (legend()) legend().innerHTML = legendFor(mode);
      return;
    }

    if (mode === 'wuxing') renderWuxing(items);
    else if (mode === 'yijing') renderYijing(items);
    else if (mode === 'psy') renderPsy(items);
    else if (mode === 'philo') renderPhilo();
    else renderWuxing(items);

    if (legend()) legend().innerHTML = legendFor(mode);
  }

  function sync() {
    var tabs = document.querySelectorAll('#lensSwitch [data-lens]');
    Array.prototype.forEach.call(tabs, function (b) {
      var on = b.getAttribute('data-lens') === current;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function set(mode) {
    if (!META[mode]) return;
    current = mode;
    sync();
    render();
  }

  function init() {
    var box = document.querySelector('#lensSwitch');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lens]');
      if (!btn || !box.contains(btn)) return;
      set(btn.getAttribute('data-lens'));
    });
    sync();
  }

  return {
    init: init,
    render: render,
    set: set,
    mode: function () { return current; }
  };
})();
