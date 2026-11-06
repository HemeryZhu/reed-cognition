/* ============================================================
   芦苇认知 · 对话引擎
   一次只问一个问题。抓住你用过的词，再问一次。
   ============================================================ */

window.REED = window.REED || {};

REED.dialogue = (function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var els = {};
  var renderedChapter = -1;
  var answering = false;

  function init() {
    els.thread = $('#threadInner');
    els.chapters = $('#chapters');
    els.sunk = $('#sunkList');
    if (!els.thread) return;

    els.thread.addEventListener('click', function (e) {
      var choice = e.target.closest('.choice');
      if (choice) { pickChoice(choice); return; }
      var submit = e.target.closest('[data-act="submit"]');
      if (submit) { submitAnswer(); return; }
      var act = e.target.closest('[data-act]');
      if (act) {
        var a = act.getAttribute('data-act');
        if (a === 'toMap') { location.hash = '#/map'; }
        if (a === 'restart') { restart(); }
      }
    });

    els.thread.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        submitAnswer();
      }
    });

    els.thread.addEventListener('input', function (e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        var c = e.target.closest('.field').querySelector('.counter');
        if (c) c.textContent = e.target.value.trim().length + ' 字';
      }
    });
  }

  function enter() {
    if (!els.thread) init();
    var st = REED.store.get();
    renderRail();
    renderSunk();
    els.thread.innerHTML = '';
    renderedChapter = -1;
    if (st.cursor.done) { renderClosing(); return; }
    if (st.cursor.step > 0 || st.cursor.cur) {
      var note = document.createElement('p');
      note.className = 'hint-keys';
      note.style.marginBottom = '2rem';
      note.textContent = '接着上回，停在下面这个问题。';
      els.thread.appendChild(note);
    }
    renderCurrent();
  }

  function currentStep() {
    var c = REED.store.get().cursor;
    if (c.done) return null;
    if (c.cur) return c.cur;
    var ch = REED.CHAPTERS[c.ch];
    if (!ch) return null;
    return ch.steps[c.step] || null;
  }

  /* ---------- 渲染 ---------- */

  function renderRail() {
    var c = REED.store.get().cursor;
    els.chapters.innerHTML = REED.CHAPTERS.map(function (ch, i) {
      var cls = i === c.ch ? 'is-now' : (i < c.ch || c.done ? 'is-done' : '');
      return '<li class="' + cls + '">' + ch.num + '　' + ch.name + '</li>';
    }).join('');
  }

  function renderSunk() {
    var nodes = REED.store.get().nodes.slice(-6).reverse();
    els.sunk.innerHTML = nodes.map(function (n) {
      var t = REED.TYPES[n.type] ? REED.TYPES[n.type].label : '';
      return '<li><span class="sunk-tag">' + t + '</span>' + esc(n.title) + '</li>';
    }).join('');
  }

  function renderCurrent() {
    var c = REED.store.get().cursor;
    var ch = REED.CHAPTERS[c.ch];
    var step = currentStep();
    if (!ch || !step) { renderClosing(); return; }

    if (renderedChapter !== c.ch) {
      renderIntro(ch);
      renderedChapter = c.ch;
      renderRail();
    }

    els.thread.insertAdjacentHTML('beforeend', askMarkup(step, c));
    renderAnswerZone(step);
    scrollToEnd();
  }

  function renderIntro(ch) {
    els.thread.insertAdjacentHTML('beforeend',
      '<div class="interlude">' +
        '<span class="i-num">' + ch.num + '　' + ch.name + '</span>' +
        '<h2>' + esc(ch.intro.title) + '</h2>' +
        '<p>' + esc(ch.intro.text) + '</p>' +
      '</div>'
    );
  }

  function askMarkup(step, c) {
    var idx = c.step + 1;
    var total = REED.CHAPTERS[c.ch].steps.length;
    var label = step.isProbe ? '再问一句' : ('第 ' + idx + ' / ' + total + ' 问');
    return '<div class="turn turn-ask">' +
      '<span class="q-mark">' + label + '</span>' +
      '<p class="q-text">' + esc(step.ask) + '</p>' +
      (step.hint ? '<p class="q-hint">' + esc(step.hint) + '</p>' : '') +
    '</div>';
  }

  function renderAnswerZone(step) {
    var zone = document.createElement('div');
    zone.className = 'answer-zone';
    zone.id = 'zone';

    if (step.kind === 'choice') {
      zone.innerHTML =
        '<div class="choices" role="group">' +
          step.options.map(function (o, i) {
            return '<button type="button" class="choice" data-i="' + i + '">' + esc(o.label) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="field" hidden>' +
          '<textarea rows="2" placeholder="可以补一句当时的情形，不补也行。"></textarea>' +
          '<div class="field-foot">' +
            '<span class="counter">0 字</span>' +
            '<span class="hint-keys">选一个，再继续</span>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:1.25rem" hidden>' +
          '<button class="btn btn-ink" type="button" data-act="submit" disabled>记下</button>' +
        '</div>';
    } else {
      var min = step.minLen || 2;
      zone.innerHTML =
        '<div class="field">' +
          '<textarea rows="5" placeholder="' + esc(step.placeholder || '……') + '"></textarea>' +
          '<div class="field-foot">' +
            '<span class="counter">0 字</span>' +
            '<span class="hint-keys">Ctrl / ⌘ + Enter 记下</span>' +
          '</div>' +
        '</div>' +
        '<p class="hint-keys" data-role="warn" hidden style="margin:.5rem 0 0;color:#9e3d33">再多写一点点，几个字也可以。</p>' +
        '<div style="margin-top:1.25rem">' +
          '<button class="btn btn-ink" type="button" data-act="submit">记下</button>' +
        '</div>';
    }

    els.thread.appendChild(zone);
    var ta = zone.querySelector('textarea');
    if (ta && step.kind !== 'choice') {
      setTimeout(function () { ta.focus(); }, 240);
    }
  }

  function pickChoice(btn) {
    var zone = $('#zone');
    if (!zone) return;
    zone.querySelectorAll('.choice').forEach(function (b) { b.classList.remove('is-picked'); });
    btn.classList.add('is-picked');
    var field = zone.querySelector('.field');
    if (field) field.hidden = false;
    var foot = zone.querySelector('[data-act="submit"]');
    if (foot) {
      foot.parentElement.hidden = false;
      foot.disabled = false;
    }
    var ta = zone.querySelector('textarea');
    if (ta) setTimeout(function () { ta.focus(); }, 120);
  }

  /* ---------- 提交 ---------- */

  function submitAnswer() {
    if (answering) return;
    var step = currentStep();
    var zone = $('#zone');
    if (!step || !zone) return;

    var answer = '';
    var chosen = null;

    if (step.kind === 'choice') {
      var pick = zone.querySelector('.choice.is-picked');
      if (!pick) return;
      chosen = step.options[parseInt(pick.getAttribute('data-i'), 10)];
      answer = chosen.label;
      var extra = zone.querySelector('textarea');
      if (extra && extra.value.trim()) answer += '。' + extra.value.trim();
    } else {
      var ta = zone.querySelector('textarea');
      answer = ta ? ta.value.trim() : '';
      var min = step.minLen || 2;
      if (answer.length < min) {
        var warn = zone.querySelector('[data-role="warn"]');
        if (warn) warn.hidden = false;
        if (ta) ta.focus();
        return;
      }
    }

    answering = true;

    var c = REED.store.get().cursor;
    var chapterId = REED.CHAPTERS[c.ch] ? REED.CHAPTERS[c.ch].id : '';

    // 1. 记录原话
    REED.store.recordAnswer(step.id, { question: step.ask, answer: answer });

    // 2. 收起应答区，把你的原话留在页面上
    zone.remove();
    els.thread.insertAdjacentHTML('beforeend',
      '<div class="turn turn-say">' +
        '<p class="say-label">你说的</p>' +
        '<p class="say-body">' + esc(answer) + '</p>' +
      '</div>'
    );
    scrollToEnd();

    // 3. 有模型就用模型，没有就用本地规则
    if (REED.llm && REED.llm.hasKey()) {
      askModel(step, answer, chosen, chapterId);
    } else {
      localFlow(step, answer, chosen, chapterId);
    }
  }

  /* ---------- 本地规则：没有 Key，或模型没接上 ---------- */

  function localFlow(step, answer, chosen, chapterId) {
    sinkForLocal(step, answer, chosen, chapterId);

    var probe = step.probe ? matchProbe(answer) : null;
    if (probe) {
      els.thread.insertAdjacentHTML('beforeend',
        '<div class="turn turn-echo"><p>' + esc(probe.note) + '</p></div>'
      );
    }

    advance(probe ? probeStep(step, probe.ask) : null);
    answering = false;
    renderSunk();
    renderRail();
    renderCurrent();
  }

  function sinkForLocal(step, answer, chosen, chapterId) {
    if (chosen && chosen.sink) sink(chosen.sink, answer, chapterId);
    else if (step.sink) sink(step.sink, answer, chapterId);
  }

  /* ---------- 模型：回应一句，再问一句 ---------- */

  var SYSTEM = [
    '你是「芦苇认知」里的提问者。这个平台帮人看见自己思考的结构：不给答案，不评价，不贴标签。',
    '',
    '规则：',
    '一、只谈具体发生过的行为和感受。不说「你是一个……的人」，不做心理诊断，不劝人，不给建议清单。',
    '二、追问要抓住对方原话里的词，往下一层问，不要换一个新话题。',
    '三、一次只问一个问题，不超过 40 字。不用感叹号，不堆形容词，不讲道理。',
    '四、如果这句话已经说透了，probe 给 null。不要为了问而问。',
    '',
    '冰山三层：surface 水面之上，是行为与即时反应；middle 水面之下，是反复出现的模式、触发点、怎么解读一件事；deep 深水区，是很少说出口的信念与价值排序。',
    '节点类型：reaction 反应、habit 习惯、pattern 模式、trigger 触发点、belief 信念、value 价值、counter 反例。',
    '',
    '只输出 JSON，不要任何解释：',
    '{"echo":"一句回应，25 字内，最好用回他说的词","probe":{"ask":"追问","hint":"更短的引导，可省略"} 或 null,"nodes":[{"type":"reaction","title":"12 字内","quote":"他的原话片段","protect":"他在保护什么，10 字内"}]}',
    'nodes 只抽这句话里真实出现的东西，最多 2 个，抽不出来就给空数组。'
  ].join('\n');

  function askModel(step, answer, chosen, chapterId) {
    var thinking = document.createElement('div');
    thinking.className = 'turn turn-thinking';
    thinking.textContent = '正在读你这句话';
    els.thread.appendChild(thinking);
    scrollToEnd();

    var allowProbe = !step.isProbe;

    callModel(step, answer, allowProbe).then(function (res) {
      if (thinking.parentNode) thinking.parentNode.removeChild(thinking);

      if (res.echo) {
        els.thread.insertAdjacentHTML('beforeend',
          '<div class="turn turn-echo"><p>' + esc(res.echo) + '</p></div>'
        );
      }

      var added = saveModelNodes(res.nodes, answer, chapterId);
      if (!added) sinkForLocal(step, answer, chosen, chapterId);

      var next = null;
      if (allowProbe && res.probe && res.probe.ask) {
        next = probeStep(step, res.probe.ask, res.probe.hint);
      }

      advance(next);
      answering = false;
      renderSunk();
      renderRail();
      renderCurrent();
    }).catch(function (err) {
      if (thinking.parentNode) thinking.parentNode.removeChild(thinking);
      els.thread.insertAdjacentHTML('beforeend',
        '<div class="turn turn-echo">' +
          '<p class="echo-note">模型没接上（' + esc(short(err.message)) + '）。这一问先按本地的方式继续。</p>' +
        '</div>'
      );
      localFlow(step, answer, chosen, chapterId);
    });
  }

  function callModel(step, answer, allowProbe) {
    var c = REED.store.get().cursor;
    var ch = REED.CHAPTERS[c.ch];
    var lines = [];

    if (ch) lines.push('【当前章节】第 ' + (c.ch + 1) + ' 章　' + ch.name);
    lines.push('【这一问】' + step.ask);
    lines.push('【他的回答】' + answer);

    var recent = recentAnswers();
    if (recent) lines.push('【之前说过的】\n' + recent);

    var titles = REED.store.get().nodes.slice(-5).map(function (n) { return n.title; });
    if (titles.length) lines.push('【已经沉淀】' + titles.join('、'));

    if (!allowProbe) lines.push('【注意】这一问已经是一次追问了，probe 必须为 null。');

    return REED.llm.json([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: lines.join('\n') }
    ], { maxTokens: 500, temperature: 0.65 }).then(function (res) {
      return res || {};
    });
  }

  function saveModelNodes(list, answer, chapterId) {
    if (!list || !list.length) return 0;
    var added = 0;
    list.slice(0, 2).forEach(function (n) {
      if (!n || !n.title) return;
      var title = String(n.title).trim().slice(0, 16);
      if (!title) return;
      var st = REED.store.get();
      var dup = st.nodes.some(function (x) {
        return x.title === title || (n.quote && x.quote === String(n.quote).trim());
      });
      if (dup) return;
      REED.store.addNode({
        type: REED.TYPES[n.type] ? n.type : 'pattern',
        title: title,
        quote: n.quote ? String(n.quote).trim().slice(0, 90) : answer,
        protect: n.protect ? String(n.protect).trim().slice(0, 30) : '',
        chapter: chapterId
      });
      added++;
    });
    return added;
  }

  function recentAnswers() {
    var st = REED.store.get();
    var answers = st.answers || {};
    var keys = Object.keys(answers);
    return keys.slice(-3).map(function (k) {
      var a = answers[k];
      return '问：' + a.question + '\n答：' + a.answer;
    }).join('\n\n');
  }

  function probeStep(step, ask, hint) {
    return {
      id: 'probe_' + step.id,
      ask: ask,
      hint: hint || '不用组织语言，想到什么写什么。',
      kind: 'text',
      minLen: 1,
      isProbe: true,
      placeholder: '……'
    };
  }

  function short(text) {
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    return t.length > 40 ? t.slice(0, 40) + '…' : t;
  }

  function advance(nextProbe) {
    var c = REED.store.get().cursor;
    var ch = REED.CHAPTERS[c.ch];

    if (c.cur) { c.cur = null; }
    else if (c.step < ch.steps.length) { c.step++; }

    if (nextProbe) {
      c.cur = nextProbe;
    } else if (c.step >= ch.steps.length) {
      c.ch++;
      c.step = 0;
      if (c.ch >= REED.CHAPTERS.length) {
        c.done = true;
        c.cur = null;
      } else {
        c.cur = null;
      }
    }
    REED.store.setCursor(c);
  }

  function sink(spec, answer, chapterId) {
    var title = spec.title || '';
    if (spec.prefix) title = spec.prefix + clip(answer, 14) + (spec.suffix || '');
    if (!title) title = clip(answer, 18);
    REED.store.addNode({
      type: spec.type,
      title: title,
      quote: answer,
      protect: spec.protect || '',
      chapter: chapterId
    });
  }

  function matchProbe(text) {
    for (var i = 0; i < REED.PROBES.length; i++) {
      if (REED.PROBES[i].re.test(text)) return REED.PROBES[i];
    }
    return null;
  }

  /* ---------- 结尾 ---------- */

  function renderClosing() {
    var st = REED.store.get();
    var value = st.nodes.filter(function (n) { return n.type === 'value'; }).pop();
    var summary = value && REED.SUMMARY_BY_VALUE[value.title] ? REED.SUMMARY_BY_VALUE[value.title] : '';

    els.thread.insertAdjacentHTML('beforeend',
      '<div class="interlude" style="border-top:0;padding-top:1rem">' +
        '<span class="i-num">' + REED.CLOSING.kicker + '</span>' +
        '<h2>' + REED.CLOSING.title + '</h2>' +
        '<p>' + REED.CLOSING.text + '</p>' +
        (summary ? '<p style="color:var(--ink-2)">' + summary + '</p>' : '') +
        '<div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:2rem">' +
          '<button class="btn btn-ink" type="button" data-act="toMap">去看我的冰山</button>' +
          '<button class="btn" type="button" data-act="restart">重走一遍</button>' +
        '</div>' +
      '</div>'
    );
    scrollToEnd();
  }

  function restart() {
    var st = REED.store.get();
    // 重走一遍：旧的节点、连线和回答一并作废，避免地图上出现两套重复的点。
    st.nodes = [];
    st.edges = [];
    st.answers = {};
    st.cursor = { ch: 0, step: 0, pending: [], cur: null, done: false };
    REED.store.save();
    enter();
  }

  /* ---------- 工具 ---------- */

  function clip(text, n) {
    var t = String(text).replace(/\s+/g, ' ').trim();
    t = t.split(/[。！？；\n]/)[0];
    if (t.length <= n) return t;
    return t.slice(0, n) + '…';
  }

  function scrollToEnd() {
    setTimeout(function () {
      var last = els.thread.lastElementChild;
      if (last) last.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 120);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  return { init: init, enter: enter, restart: restart };
})();
