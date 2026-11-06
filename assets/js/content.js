/* ============================================================
   芦苇认知 · 内容库
   冰山三层、四个章节、十四个问题。
   问题只问「最近发生过的具体的事」，不让人给自己贴标签。
   ============================================================ */

window.REED = window.REED || {};

REED.LAYERS = {
  surface: {
    key: 'surface',
    name: '水面之上',
    sub: '别人看得见的，和你自己的第一反应',
    color: '#918b7f'
  },
  middle: {
    key: 'middle',
    name: '水面之下',
    sub: '让这些反应一再出现的模式',
    color: '#5d6f60'
  },
  deep: {
    key: 'deep',
    name: '深水区',
    sub: '你很少说出口，却一直在指挥你的东西',
    color: '#9e3d33'
  }
};

REED.TYPES = {
  reaction:  { label: '即时反应', layer: 'surface' },
  habit:     { label: '行为惯性', layer: 'surface' },
  pattern:   { label: '思维模式', layer: 'middle' },
  trigger:   { label: '情绪触发点', layer: 'middle' },
  belief:    { label: '核心信念', layer: 'deep' },
  value:     { label: '价值排序', layer: 'deep' },
  counter:   { label: '反例', layer: 'deep' }
};

/* ---------- 追问规则 ----------
   不问性格，只在用户用过的词上停一下。
   命中的第一条会被用到，所以顺序有讲究。 */

REED.PROBES = [
  {
    re: /(害怕|怕|恐惧|不敢|担心|万一)/,
    ask: '你用了「怕」。把最坏的情况说完整：真发生了，会怎样？然后呢？',
    note: '「怕」是通往深处最近的一条路。'
  },
  {
    re: /(应该|必须|不能|不可以|本来要|不该)/,
    ask: '这个「应该」是谁定下的？如果没有任何人知道你没做到，你还会按它来吗？',
    note: '应该，常常是别人的声音住进了你嘴里。'
  },
  {
    re: /(别人|大家|他们|人家|外人|会怎么看我)/,
    ask: '这里的「别人」具体是谁？闭上眼睛想那张脸。他真的在想你吗？',
    note: '我们害怕的观众，往往只有一两个。'
  },
  {
    re: /(总是|从来|每次|一直|永远|又一次)/,
    ask: '「总是」——有没有哪怕一次例外？那一次，环境或者你有什么不一样？',
    note: '找出例外，就找到了可以松开的地方。'
  },
  {
    re: /(不知道|说不清|没想过|说不上来|随便)/,
    ask: '不用给结论。就描述一个画面：当时你在哪，周围什么声音，身体哪个位置最紧。',
    note: '说不清的时候，先回到身体。'
  },
  {
    re: /(委屈|难受|烦|生气|愤怒|憋|堵|酸)/,
    ask: '这股情绪如果会说话，它最想让你做什么？它想要的东西，和你想做的，一样吗？',
    note: '情绪不是敌人，它是一个没被听见的诉求。'
  },
  {
    re: /(累|没力气|疲惫|撑不住|消耗|倦)/,
    ask: '是身体累，还是维持某个样子比较累？如果今天可以不当那个人，你想干什么？',
    note: '两种累，修的方式完全不一样。'
  },
  {
    re: /(没关系|算了|还好|不至于|无所谓|习惯了)/,
    ask: '「没关系」这三个字，说出来的时候，你心里是平的，还是按住了一点什么？',
    note: '最常见的自我说服，藏在最轻的词里。'
  }
];

REED.FALLBACK_PROBE = '再多说一点：当时你脑子里冒出来的第一句话，原话是什么？';

/* ---------- 章节与问题 ---------- */

REED.CHAPTERS = [
  {
    id: 'ch1',
    num: '第一章',
    name: '一处别扭',
    intro: {
      title: '先从一件小事开始',
      text: '不问你是什么样的人——这个问题没人答得准。只问最近一周，哪件事让你心里微微地不舒服了一下。'
    },
    steps: [
      {
        id: 'scene',
        ask: '最近一周，哪件事让你心里有点别扭？',
        hint: '不用是大事。可能是一句话、一个没被回复的消息、一次没被点名的发言。',
        kind: 'text',
        placeholder: '上周开会，我提了个想法，没人接话，直接跳到下一个人……',
        minLen: 8
      },
      {
        id: 'firstReaction',
        ask: '当时你的第一反应是什么？',
        hint: '分三层说：身体哪里变了；冒出什么情绪；脑子里蹦出的那句话。',
        kind: 'text',
        placeholder: '脸有点热，心里一沉。脑子里冒出来的是「果然，我说什么都没人听」。',
        minLen: 6,
        probe: true,
        sink: { type: 'reaction' }
      },
      {
        id: 'whatMatters',
        ask: '那句「果然」里，你最在意的到底是哪一点？',
        hint: '是被忽视、被否定、显得蠢，还是别的什么？',
        kind: 'text',
        placeholder: '在意的不是没人接话，是那一刻我觉得自己在这个组里是透明的。',
        minLen: 4,
        probe: true
      },
      {
        id: 'friendTest',
        ask: '如果同样的事发生在你最好的朋友身上，你会怎么跟他说？',
        hint: '用你当时会说的原话。不用讲道理，就写你会怎么开口。',
        kind: 'text',
        placeholder: '我会说：别多想，他们可能只是在想自己的事，不代表你不行。',
        minLen: 4,
        sink: { type: 'pattern', title: '对别人宽，对自己窄' }
      }
    ]
  },
  {
    id: 'ch2',
    num: '第二章',
    name: '反复掉进去的坑',
    intro: {
      title: '你明知道会后悔，还是做了',
      text: '有些反应只出现一次，有些会反复出现。反复出现的那几个，才是结构。'
    },
    steps: [
      {
        id: 'loopChoice',
        ask: '下面哪种情况，你反复经历过？选最像的那个。',
        hint: '选完可以再补一句，最近一次是什么时候。',
        kind: 'choice',
        options: [
          {
            label: '一直拖到最后一刻',
            sink: {
              type: 'pattern',
              title: '用拖延换一小段轻松',
              protect: '怕认真做出来，还是不够好'
            }
          },
          {
            label: '明明不愿意，还是答应了',
            sink: {
              type: 'pattern',
              title: '先答应，再后悔',
              protect: '怕拒绝之后，关系就变了'
            }
          },
          {
            label: '有话想说，最后咽了回去',
            sink: {
              type: 'pattern',
              title: '把想说的话咽回去',
              protect: '怕说出来，场面失控或者被讨厌'
            }
          },
          {
            label: '反复检查，怕出错',
            sink: {
              type: 'pattern',
              title: '用反复检查换取确定感',
              protect: '怕一个疏忽就证明了自己不行'
            }
          },
          {
            label: '开头很热，后来不了了之',
            sink: {
              type: 'pattern',
              title: '靠热情启动，靠热情结束',
              protect: '怕进入那个枯燥又看不到头的阶段'
            }
          },
          {
            label: '一被否定，就想证明自己',
            sink: {
              type: 'pattern',
              title: '被否定时先反击，再消化',
              protect: '怕那个否定是真的'
            }
          }
        ]
      },
      {
        id: 'loopInstance',
        ask: '最近一次发生，具体是什么情形？',
        hint: '时间、地点、对方说了什么、你做了什么。越具体越好。',
        kind: 'text',
        placeholder: '周日下午，导师问我进度，我说还在做，其实我周五就停住了。',
        minLen: 6
      },
      {
        id: 'loopFear',
        ask: '在那一刻，你在害怕发生什么？',
        hint: '不是怕这件事本身，是怕它意味着什么。',
        kind: 'text',
        placeholder: '怕他觉得我不行，然后以后有项目就不带我了。',
        minLen: 4,
        probe: true,
        sink: { type: 'trigger' }
      },
      {
        id: 'loopIfNot',
        ask: '如果不害怕，你会怎么做？为什么没有那样做？',
        hint: '第二个问题才是重点。',
        kind: 'text',
        placeholder: '我会直接说卡住了。没那样做，是因为说了就等于承认我不行。',
        minLen: 6,
        probe: true
      }
    ]
  },
  {
    id: 'ch3',
    num: '第三章',
    name: '你到底在保什么',
    intro: {
      title: '说出来的和做出来的，往往不是同一个',
      text: '价值排序不看你说重视什么，看你为了它放弃过什么、时间花在了哪里。'
    },
    steps: [
      {
        id: 'valueChoice',
        ask: '如果只能保住一样，你选哪个？',
        hint: '只能选一个。选的时候不用想「应该」选哪个。',
        kind: 'choice',
        options: [
          { label: '被认可',      sink: { type: 'value', title: '被认可', protect: '怕自己不重要' } },
          { label: '自由不受限',  sink: { type: 'value', title: '自由不受限', protect: '怕被安排、被定义' } },
          { label: '安全与稳妥',  sink: { type: 'value', title: '安全与稳妥', protect: '怕失去已有的东西' } },
          { label: '持续成长',    sink: { type: 'value', title: '持续成长', protect: '怕停在原地' } },
          { label: '亲近的关系',  sink: { type: 'value', title: '亲近的关系', protect: '怕被留在外面' } },
          { label: '掌控感',      sink: { type: 'value', title: '掌控感', protect: '怕事情脱出自己手里' } }
        ]
      },
      {
        id: 'valueCost',
        ask: '上一次为了它，你放弃了什么？',
        hint: '一个具体的放弃：一次机会、一段关系、一个下午、一句话。',
        kind: 'text',
        placeholder: '为了不显得不合群，我把想说的话咽了，跟他们吃了我并不想吃的饭。',
        minLen: 6
      },
      {
        id: 'valueGap',
        ask: '最近一周，你为它实际花了多少时间？时间又花到哪去了？',
        hint: '诚实地估一个比例就行。',
        kind: 'text',
        placeholder: '大概花了两小时想怎么让别人满意，真正读书只有四十分钟。',
        minLen: 4,
        sink: { type: 'pattern', title: '说的和做的，有一段距离', dynamic: true }
      }
    ]
  },
  {
    id: 'ch4',
    num: '第四章',
    name: '你怎么解释自己',
    intro: {
      title: '一句话，你用了很多年',
      text: '每个人心里都有一句关于自己的判词。它通常不是你自己写的，但一直是你在照着活。'
    },
    steps: [
      {
        id: 'selfSentence',
        ask: '用一句话形容自己：「我是一个______的人。」',
        hint: '第一反应想到什么就填什么，不用挑好听的。',
        kind: 'text',
        placeholder: '我是一个不太会来事的人。',
        minLen: 2,
        sink: { type: 'belief', prefix: '我是一个', suffix: '的人' }
      },
      {
        id: 'beliefOrigin',
        ask: '这句话，最早是从谁那里、什么场合听来的？',
        hint: '想不起来也没关系，就说你第一次意识到它是真的，是什么时候。',
        kind: 'text',
        placeholder: '初中转学，有次自我介绍完，后排有人笑，我同桌说「你别紧张，你就是不太会说话」。',
        minLen: 4,
        probe: true
      },
      {
        id: 'counterExample',
        ask: '有没有哪一次，你完全不是这样？说说那一次。',
        hint: '哪怕只有一次，很短的几分钟也算。',
        kind: 'text',
        placeholder: '去年做小组展示，我讲完，有个人说这是他听过最清楚的一遍。那天我一点都不紧张。',
        minLen: 4,
        sink: { type: 'counter', title: '也有过一次，我不是这样' }
      }
    ]
  }
];

/* ---------- 结尾 ---------- */

REED.CLOSING = {
  kicker: '走完了',
  title: '你刚才说的话，已经画成了一张图',
  text: '地图上每个点，都能追回到你亲口说过的一句原话。它不是结论，是一个可以反复改的草稿。'
};

/* ---------- 收束语：按选中价值生成 ---------- */

REED.SUMMARY_BY_VALUE = {
  '被认可':   '你的很多反应，都在回答同一个问题：我做得够不够好。当评价权握在别人手里的时候，你会一直很忙。',
  '自由不受限': '你对被安排格外敏感。有时候你拒绝的不是那件事，是「有人替我决定了」这件事本身。',
  '安全与稳妥': '你倾向于先守住已有的，再谈别的。这让你很少翻车，也可能让你错过那些需要先松手的机会。',
  '持续成长': '你能忍受很多不舒服，只要它换来变好。要小心的是：把「还没变好」当成对自己的判决。',
  '亲近的关系': '你愿意为了不断掉连接而让步。值得问一句：那些关系里，有没有哪一段，是靠你一直让步才维持的。',
  '掌控感':   '你习惯把事情抓在手里。放松对你来说不是休息，是失控的预演。'
};
