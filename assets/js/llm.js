/* ============================================================
   芦苇认知 · 模型接入
   用 OpenAI 兼容接口。Key 只存在本机浏览器里，
   页面本身是公开的，所以每个人填自己的。
   没有 Key 时，整个平台仍然按原来的规则运行。
   ============================================================ */

window.REED = window.REED || {};

REED.llm = (function () {
  var KEY = 'reed-llm-v1';

  var DEFAULTS = {
    base: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat'
  };

  var cache = null;

  function load() {
    if (cache) return cache;
    var raw = {};
    try { raw = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { raw = {}; }
    cache = {
      base: trimBase(raw.base || DEFAULTS.base),
      model: (raw.model || DEFAULTS.model).trim(),
      key: (raw.key || '').trim()
    };
    return cache;
  }

  function save(next) {
    cache = {
      base: trimBase(next.base || DEFAULTS.base),
      model: (next.model || DEFAULTS.model).trim(),
      key: (next.key || '').trim()
    };
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* 隐私模式下写不进去，忽略 */ }
    return cache;
  }

  function clear() {
    cache = { base: DEFAULTS.base, model: DEFAULTS.model, key: '' };
    try { localStorage.removeItem(KEY); } catch (e) { /* 同上 */ }
  }

  function trimBase(b) {
    return String(b).trim().replace(/\/+$/, '');
  }

  function hasKey() {
    return !!load().key;
  }

  function endpoint() {
    var b = load().base;
    if (/\/chat\/completions$/.test(b)) return b;
    return b + '/chat/completions';
  }

  /* 一次请求。opts: {json, temperature, maxTokens, timeout} */
  function request(messages, opts) {
    opts = opts || {};
    var s = load();
    if (!s.key) return Promise.reject(new Error('还没有填 API Key'));

    var body = {
      model: s.model,
      messages: messages,
      temperature: opts.temperature == null ? 0.6 : opts.temperature,
      max_tokens: opts.maxTokens || 900,
      stream: false
    };
    if (opts.json) body.response_format = { type: 'json_object' };

    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (ctrl) ctrl.abort();
    }, opts.timeout || 45000);

    return fetch(endpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + s.key
      },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) {
        return res.text().then(function (t) {
          var msg = 'HTTP ' + res.status;
          try {
            var j = JSON.parse(t);
            msg += '：' + ((j.error && j.error.message) || String(t).slice(0, 140));
          } catch (e) {
            msg += '：' + String(t).slice(0, 140);
          }
          throw new Error(msg);
        });
      }
      return res.json();
    }, function (err) {
      clearTimeout(timer);
      if (err && err.name === 'AbortError') throw new Error('请求超时，模型没有回话');
      throw new Error('请求发不出去，可能是网络或跨域限制');
    }).then(function (j) {
      var txt = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!txt) throw new Error('模型返回了空内容');
      return txt;
    });
  }

  /* 要求模型返回 JSON，并容忍它多写了几句解释 */
  function json(messages, opts) {
    return request(messages, withJson(opts)).then(function (txt) {
      var obj = parseJson(txt);
      if (!obj) throw new Error('模型没有按格式返回');
      return obj;
    }, function (err) {
      // 有些兼容端点不认 response_format，去掉再试一次
      if (!/400|response_format|json/i.test(err.message || '')) throw err;
      return request(messages, opts).then(function (txt) {
        var obj = parseJson(txt);
        if (!obj) throw err;
        return obj;
      });
    }).then(function (obj) {
      return obj;
    });
  }

  function withJson(opts) {
    var o = {};
    for (var k in (opts || {})) o[k] = opts[k];
    o.json = true;
    return o;
  }

  function parseJson(txt) {
    var t = String(txt).trim();
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    var a = t.indexOf('{');
    var b = t.lastIndexOf('}');
    if (a >= 0 && b > a) t = t.slice(a, b + 1);
    try { return JSON.parse(t); } catch (e) { return null; }
  }

  function test() {
    return request([{ role: 'user', content: '只回复两个字：可用' }], {
      maxTokens: 16,
      temperature: 0,
      timeout: 20000
    }).then(function (t) {
      return String(t).trim();
    });
  }

  return {
    load: load,
    save: save,
    clear: clear,
    hasKey: hasKey,
    request: request,
    json: json,
    test: test,
    endpoint: endpoint
  };
})();
