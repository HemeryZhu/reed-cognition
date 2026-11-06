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

    // 1. 记录原话
    REED.store.recordAnswer(step.id, { question: step.ask, answer: answer });

    // 2. 沉淀成节点
    var c = REED.store.get().cursor;
    if (chosen && chosen.sink) {
      sink(chosen.sink, answer, REED.CHAPTERS[c.ch].id);
    } else if (step.sink) {
      sink(step.sink, answer, REED.CHAPTERS[c.ch].id);
    }

    // 3. 若命中追问规则，插一个追问
    var probe = null;
    if (step.probe) probe = matchProbe(answer);

    // 4. 收起应答区，把你的原话留在页面上
    zone.remove();
    answering = false;

    els.thread.insertAdjacentHTML('beforeend',
      '<div class="turn turn-say">' +
        '<p class="say-label">你说的</p>' +
        '<p class="say-body">' + esc(answer) + '</p>' +
      '</div>'
    );

    if (probe) {
      els.thread.insertAdjacentHTML('beforeend',
        '<div class="turn turn-echo">' +
          '<p>' + esc(probe.note) + '</p>' +
        '</div>'
      );
    }

    // 5. 推进
    advance(probe ? {
      id: 'probe_' + step.id,
      ask: probe.ask,
      hint: '不用组织语言，想到什么写什么。',
      kind: 'text',
      minLen: 2,
      isProbe: true,
      placeholder: '……'
    } : null);

    renderSunk();
    renderRail();
    renderCurrent();
  }

  function advance(probeStep) {
    var c = REED.store.get().cursor;
    var ch = REED.CHAPTERS[c.ch];

    if (c.cur) { c.cur = null; }
    else if (c.step < ch.steps.length) { c.step++; }

    if (probeStep) {
      c.cur = probeStep;
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
