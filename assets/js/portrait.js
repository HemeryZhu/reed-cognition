/* ============================================================
   芦苇认知 · 他人推演
   不给人格标签，不做诊断。只推演三件事：
   他在保护什么、他的反应可能从哪来、你可以怎么跟他说话。
   ============================================================ */

window.REED = window.REED || {};

REED.portrait = (function () {
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- 信号表 ----------
     每条只描述行为，不描述人格。
     命中越多、越具体的那几条，会被排到前面。 */

  var SIGNALS = [
    {
      id: 'control',
      re: /(必须|按他(的)?|听他的|安排|规定|不放心|说了算|控制|指挥|要求我们|都得|都要|改一|修改|重写|按我的|得听|顺序|流程|统一)/g,
      facet: '他要事情按他的秩序走',
      why: '这类人常用流程和细节来降低不确定感。他改你的措辞，往往不是为了更好，是为了让它变成他的。',
      protect: '怕事情脱轨，怕自己失去位置',
      advice: '先给他确定性：把结论、风险、你已经排除过的选项先摆出来，再谈分歧。他要的多半是顺序，不是你的能力。',
      advice2: '把「他又改我」翻译成「他在意什么」。看清他在意的那一项，你就能只让那一项。'
    },
    {
      id: 'critic',
      re: /(挑毛病|否定|看不上|贬低|打击|泼冷水|说我不行|看笑话|阴阳|嘲讽|没下文|不接话|略过|跳过|不采纳|之前考虑过|否决|否掉|驳|不给面子|当着.{0,6}说)/g,
      facet: '他用挑错来确认自己的位置',
      why: '先指出问题的人，往往先要占住「我看得比你清楚」这个位置。这不一定是恶意，更像一种习惯性的自我确认。',
      protect: '怕自己不重要，怕被后来的人超过',
      advice: '不接评价，只接事实。可以说：第三点我改；前两点保留，理由是——。把对话从人拉回到事。',
      advice2: '别在公开场合跟他争对错。他要的是位置，不是答案；你给他位置，他反而松手。'
    },
    {
      id: 'volatile',
      re: /(发火|翻脸|情绪化|突然生气|吼|摔|脾气|阴阳怪气|冷脸|激动|拍桌|大声|急眼)/g,
      facet: '他的情绪没有缓冲带',
      why: '情绪直接出来，说明他不太有一个内在的停顿。很多时候不是冲你，是他没有能力把感受先放一放。',
      protect: '怕被忽视，怕自己的需求不算数',
      advice: '情绪高点不讲道理，先降温。一句「我听懂了，这事我来处理」，比任何解释都有效。',
      advice2: '具体的分歧放到第二天再谈。他记得的是你当时有没有站在他那边。'
    },
    {
      id: 'avoid',
      re: /(不回|没回|已读|装没看见|拖|推脱|不表态|打太极|敷衍|拖到|不回复|不理|晾着|放鸽子|失联|不出现)/g,
      facet: '他用不回应来避免冲突',
      why: '沉默对他可能是最省力的防御。他不一定在算计你，可能只是不知道怎么拒绝，又不想承担拒绝的后果。',
      protect: '怕正面冲突，怕话说出口就收不回来',
      advice: '把开放问题变成可回答的小问题。别问「你怎么看」，问「A 还是 B，今天下班前给我一个字就行」。',
      advice2: '给他一条不用承认自己在躲的出口：「如果你现在不方便，我按 A 走了。」'
    },
    {
      id: 'selfabsorbed',
      re: /(只说自己|不听|打断|抢话|自说自话|只看自己|只顾|自恋|从头到尾说|都是他|聊自己|插话|不让人说)/g,
      facet: '他需要不断被看见',
      why: '总把话题拉回自己身上的人，通常内在「被看见」的账户是空的。他不是不关心你，是顾不上。',
      protect: '怕自己在场却不被注意',
      advice: '先给他一次完整的被听见，不打断、不纠正。他拿到那口气之后，反而更容易听你说。',
      advice2: '重要的请求放在他讲完之后提，不要在他兴致最高的时候抢。'
    },
    {
      id: 'logic',
      re: /(讲道理|说教|辩论|说服|非要争|逻辑|抬杠|反驳|纠正|讲一堆|道理|论证)/g,
      facet: '他用道理把情绪包起来',
      why: '越是要用道理赢的人，越难说出「我不舒服」。争论的内容常常不是真正的内容。',
      protect: '怕承认自己在意，怕示弱',
      advice: '别在论点上赢他。直接说感受：「我不是要论证谁对，我是觉得被晾在一边了。」',
      advice2: '如果一定要讲逻辑，先承认他成立的那部分，再补你的条件。他要的是不被否定。'
    },
    {
      id: 'superior',
      re: /(居高临下|教训|摆架子|看不起|摆谱|颐指气使|指使|瞧不起|不屑|高人一等)/g,
      facet: '他需要保持在你之上',
      why: '总要显得比你懂的人，通常不太确定自己真的被认可。他要的不是讨论，是一个高度差。',
      protect: '怕被看穿，怕位置掉下来',
      advice: '别急着证明你懂。先请他把话说完，再问一个他真的答得上来的问题。他放松了，才有得谈。',
      advice2: '在公开场合给他留高度，在私下里谈实质。'
    },
    {
      id: 'double',
      re: /(双标|双重标准|自己可以|别人不行|只许|两套标准|对自己宽)/g,
      facet: '他有两套标准：一套对自己，一套对别人',
      why: '标准不一致，往往不是没意识到，而是他下意识地把自己放在了不受约束的位置。',
      protect: '怕被同样的尺子量',
      advice: '不要说「你双标」，这句话只会让他防御。换成具体的对照：「上次你是这么处理的，这次换成我，规则变了吗？」',
      advice2: '把规则提前写下来。模糊的地方，是他标准最容易漂移的地方。'
    },
    {
      id: 'pleaser',
      re: /(讨好|不敢拒绝|怕冲突|老好人|委屈自己|迎合|迁就|不好意思拒绝|处处让|低声下气)/g,
      facet: '他用顺从来换安全',
      why: '总是答应的人，往往把关系的稳定看得比自己的意愿更重。他的配合里有一点怕。',
      protect: '怕关系断掉',
      advice: '给他一个不必拒绝也能表达的机会：「如果你不方便，直接说，我不会不高兴。」',
      advice2: '别把他的顺受当成同意。重要的事，再问一次他真正想要什么。'
    },
    {
      id: 'face',
      re: /(面子|别人怎么看|在乎评价|怕丢人|体面|下不来台|当众|当着大家|要好看)/g,
      facet: '他活在一个想象的观众席里',
      why: '在意评价的人，行动的第一考量是「别人会怎么想」。他的很多决定，是在给不在场的人做。',
      protect: '怕丢脸，怕被看轻',
      advice: '给他台阶，也给他一个体面的说法。能在外人面前保住位置，事情就好谈。',
      advice2: '别在人多的时候提他的问题。私下说，效果差一倍不止。'
    },
    {
      id: 'credit',
      re: /(抢功|抢我|功劳|占便宜|揽|甩锅|推责任|背锅|归功于自己|抢着报|写自己名字)/g,
      facet: '他要确保功劳落到自己身上',
      why: '需要把功劳抓在手里，通常说明他不太确信自己配得上。这不是强大，是一种持续的不安。',
      protect: '怕被忽略，怕被替代',
      advice: '留下可追溯的记录，但不用当场争。事实自己会说话，你只需要不让它消失。',
      advice2: '把分工写在明面上：谁负责、什么时候交、谁汇报。模糊地带是他最舒服的地方。'
    },
    {
      id: 'guilt',
      re: /(内疚|愧疚|道德绑架|为你好|pua|让我觉得是我错|都是我的错|不懂事|不感恩|白养|牺牲)/g,
      facet: '他用内疚来维持关系',
      why: '让人感到亏欠，是一种不动手的控制。他可能并不自知，只是这套方式曾经有效。',
      protect: '怕失去你，怕你不再顺着他',
      advice: '把内疚和事实分开。可以这样说：「我知道你难受，但这件事我的答案是不行。」',
      advice2: '不要为了缓解当下的不适而答应。答应之后的不适，会以另一种方式回来。'
    },
    {
      id: 'silent',
      re: /(冷战|沉默|不说话|甩脸色|生闷气|不理我|冷处理|无视|当没看见|冷淡)/g,
      facet: '他用沉默表达不满',
      why: '沉默是一种把话交给对方猜的方式。他希望你先开口，又不想自己先低头。',
      protect: '怕说出来显得自己小气',
      advice: '替他把话说出来：「你是不是有点不舒服？可以直接说，我不会走。」把暗的搬到明处。',
      advice2: '别追着问「你怎么了」超过两次。给一个具体的出口，比反复追问有效。'
    },
    {
      id: 'unreliable',
      re: /(答应.{0,6}不做|失约|放鸽子|不靠谱|说话不算|承诺|拖到最后|临时变卦|说好.{0,4}又)/g,
      facet: '他用答应来结束当下的压力',
      why: '很多人答应，是为了让这一刻的对话赶紧结束。他答应的那一刻是真的，后来也是真的做不到。',
      protect: '怕当下让你失望，又不知道怎么拒绝',
      advice: '把承诺变成时间点：「那我们约周三中午前，你给我一句话。」模糊的答应等于没答应。',
      advice2: '重要的事只托付一次。第二次还托付，是你自己在赌。'
    }
  ];

  var SELF_SIGNALS = [
    { re: /(不.{0,2}想.{0,2}(说|开口|发言|讲话)|闭嘴|懒得说|懒得开口|没再说话|沉默)/,
      note: '你在描述里写到自己不说话了。这往往不是没想法，是把想法收起来了——收起久了，对方会以为你没有。' },
    { re: /(委屈|难受|寒心|失望|心凉|不舒服)/,
      note: '你用了「委屈」这类词。委屈常常出现在「我明明占理，却没有说出口」之后。' },
    { re: /(自我怀疑|是不是我|我是不是|我错|是不是太敏感|反思|太玻璃心)/,
      note: '你已经开始检讨自己了。先别急着站到他那一边——把事实和感受分开看。' },
    { re: /(忍|算了|不计较|随他|无所谓|懒得计较|不跟他一般见识)/,
      note: '你选择了不计较。不计较本身没问题，但值得确认一次：这是放下，还是压下去了。' }
  ];

  /* ---------- 主流程 ---------- */

  function analyse(raw) {
    var text = String(raw || '').trim();
    if (text.length < 12) return { tooShort: true };

    var scored = [];
    SIGNALS.forEach(function (s) {
      var g = new RegExp(s.re.source, 'g');
      var m = text.match(g);
      if (m) scored.push({ signal: s, score: m.length });
    });
    scored.sort(function (a, b) { return b.score - a.score; });

    var facets = [];
    var seen = {};
    scored.forEach(function (item) {
      if (facets.length >= 3) return;
      if (seen[item.signal.id]) return;
      seen[item.signal.id] = 1;
      facets.push(item.signal);
    });

    var selfHit = null;
    for (var i = 0; i < SELF_SIGNALS.length; i++) {
      if (SELF_SIGNALS[i].re.test(text)) { selfHit = SELF_SIGNALS[i]; break; }
    }

    return {
      tooShort: false,
      facets: facets,
      self: selfHit,
      evidence: facets.length ? pickEvidence(text, facets[0]) : pickEvidence(text, null)
    };
  }

  function pickEvidence(text, signal) {
    var parts = text.split(/[。！？；\n]/).filter(function (p) { return p.trim().length > 3; });
    if (signal) {
      for (var i = 0; i < parts.length; i++) {
        if (new RegExp(signal.re.source).test(parts[i])) return parts[i].trim();
      }
    }
    return parts[0] ? parts[0].trim() : text;
  }

  function render(raw) {
    var box = $('#otherResult');
    var r = analyse(raw);

    if (r.tooShort) {
      box.hidden = false;
      box.innerHTML = '<div class="other-empty">再多写几句。至少要有一件具体的事：他说了什么、做了什么、你当时怎么反应。</div>';
      return;
    }

    if (!r.facets.length) {
      renderThin(box, r);
      return;
    }

    var html = '';

    html += '<div class="result-block">' +
      '<h3>他从你的描述里，露出了这几个面</h3>' +
      r.facets.map(function (f) {
        return '<div class="facet">' +
          '<p class="facet-title">' + esc(f.facet) + '</p>' +
          '<p class="facet-why">' + esc(f.why) + '</p>' +
          (f === r.facets[0] && r.evidence
            ? '<p class="facet-quote">你写的：「' + esc(clip(r.evidence, 46)) + '」</p>'
            : '') +
        '</div>';
      }).join('') +
    '</div>';

    var protects = r.facets.map(function (f) { return f.protect; }).filter(Boolean);
    html += '<div class="result-block">' +
      '<h3>他大概在保护什么</h3>' +
      '<p class="facet-why">' + esc(protects.join('；')) + '。</p>' +
      '<p class="facet-why" style="margin-top:.75rem">' +
        '这个猜测不一定是真的。但如果你按这个假设去和他相处，' +
        '通常会比按「他就是坏」这个假设，多出一些余地。' +
      '</p>' +
    '</div>';

    var tips = [];
    r.facets.forEach(function (f) {
      if (f.advice) tips.push(f.advice);
      if (f.advice2) tips.push(f.advice2);
    });
    tips = tips.slice(0, 4);

    html += '<div class="result-block">' +
      '<h3>和他说话时，可以试试</h3>' +
      '<ol class="advice">' + tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
    '</div>';

    if (r.self) {
      html += '<div class="result-block">' +
        '<h3>也看看你自己这一半</h3>' +
        '<p class="facet-why">' + esc(r.self.note) + '</p>' +
      '</div>';
    }

    html += caution();
    box.hidden = false;
    box.innerHTML = html;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* 信号不足时的诚实出口：不硬编故事，但仍保留边界提醒和自我镜像。 */
  function renderThin(box, r) {
    var html = '';
    html += '<div class="result-block">' +
      '<h3>还差一点具体的场景</h3>' +
      '<p class="facet-why">' +
        '你写下的内容里，关于「他做了什么」已经够了，但还看不出「他这么做之后，谁得到了什么」。' +
        '推演结构需要后一半。补上任意一条，就能继续：<br><br>' +
        '一、他那句话的<strong>原话</strong>是什么？<br>' +
        '二、说完之后，在场的人<strong>反应</strong>是什么？<br>' +
        '三、这件事最后<strong>谁得了好处</strong>？' +
      '</p>' +
      (r.evidence ? '<p class="facet-quote">你写的：「' + esc(clip(r.evidence, 46)) + '」</p>' : '') +
    '</div>';

    if (r.self) {
      html += '<div class="result-block">' +
        '<h3>也看看你自己这一半</h3>' +
        '<p class="facet-why">' + esc(r.self.note) + '</p>' +
      '</div>';
    }

    html += caution();
    box.hidden = false;
    box.innerHTML = html;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function caution() {
    return '<div class="result-block">' +
      '<p class="caution"><strong>提醒：</strong>以上全部基于你一个人的描述，' +
      '他看到的一定是另一个版本。这不是他的画像，是你手里那张关于他的地图。' +
      '地图可以帮你走路，但不能代替你和他说话。</p>' +
    '</div>';
  }

  function clip(t, n) {
    return t.length > n ? t.slice(0, n) + '…' : t;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  return { render: render, analyse: analyse };
})();
