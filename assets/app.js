(function () {
  'use strict';

  /* ---- helpers ---- */

  var STATUS_LABEL = {
    done:        '已完成',
    review:      '评审中',
    in_progress: '进行中',
    todo:        '待开始'
  };

  function daysUntil(dateStr) {
    var target = new Date(dateStr + 'T00:00:00');
    var today  = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / 86400000);
  }

  function dateOnly(iso) {
    if (!iso) return '—';
    var m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : iso;
  }

  function dateTime(iso) {
    if (!iso) return '—';
    return iso.replace('T', ' ').replace(/[+-]\d{2}:\d{2}$/, '');
  }

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  function badge(status) {
    return el('span', 'badge badge-' + status, STATUS_LABEL[status] || status);
  }

  function prDisplay(c) {
    if (c.pr !== null && c.pr !== undefined) return '#' + c.pr;
    if (c.prs && Array.isArray(c.prs) && c.prs.length) {
      return c.prs.map(function (n) { return '#' + n; }).join(', ');
    }
    return '—';
  }

  /* ---- header ---- */

  function buildHeader(d) {
    var hdr = document.getElementById('site-header');

    hdr.appendChild(el('h1', 'project-title', d.project));
    hdr.appendChild(el('p',  'project-subtitle', d.subtitle));

    var meta = el('div', 'project-meta');

    var up = el('span', 'meta-item');
    up.appendChild(el('span', 'meta-label', '更新于 '));
    up.appendChild(el('span', 'meta-value', dateTime(d.updated_at)));
    meta.appendChild(up);

    var days = daysUntil(d.deadline);
    var dl = el('span', 'meta-item');
    dl.appendChild(el('span', 'meta-label', '距截止 '));
    var daysCls = days <= 3 ? 'meta-value urgent' : 'meta-value';
    dl.appendChild(el('span', daysCls, days + ' 天'));
    meta.appendChild(dl);

    var ff = el('span', 'meta-item');
    ff.appendChild(el('span', 'meta-label', '功能冻结 '));
    ff.appendChild(el('span', 'meta-value', d.feature_freeze));
    meta.appendChild(ff);

    hdr.appendChild(meta);
  }

  /* ---- architecture ---- */

  function buildArchitecture(d) {
    var sec = document.getElementById('architecture');
    sec.appendChild(el('h2', 'section-title', '系统架构'));

    var grid = el('div', 'arch-grid');
    d.architecture.forEach(function (l) {
      var card = el('div', 'arch-card');

      var h = el('div', 'arch-card-header');
      h.appendChild(el('span', 'arch-card-id', l.id));
      h.appendChild(el('h3',   'arch-card-name', l.name));
      card.appendChild(h);

      card.appendChild(el('p', 'arch-card-desc', l.desc));
      grid.appendChild(card);
    });
    sec.appendChild(grid);
  }

  /* ---- phases ---- */

  function buildPhases(d) {
    var sec = document.getElementById('phases');
    sec.appendChild(el('h2', 'section-title', '项目阶段'));

    var timeline = el('div', 'phase-timeline');
    var total = d.phases.length;
    var doneN = d.phases.filter(function (p) { return p.status === 'done'; }).length;

    /* bar */
    var barRow = el('div', 'phase-bar-row');
    var lbl = el('span', 'phase-bar-label');
    lbl.appendChild(el('span', '', doneN + ' / ' + total + ' 已完成'));
    barRow.appendChild(lbl);

    var track = el('div', 'phase-bar-track');
    var fill  = el('div', 'phase-bar-fill');
    fill.style.width = Math.round((doneN / total) * 100) + '%';
    track.appendChild(fill);
    barRow.appendChild(track);
    timeline.appendChild(barRow);

    /* list */
    var list = el('ol', 'phase-list');
    d.phases.forEach(function (p) {
      var li = el('li', 'phase-item phase-' + p.status);

      var left = el('div', 'phase-left');
      left.appendChild(badge(p.status));
      left.appendChild(el('strong', 'phase-name', p.name));
      li.appendChild(left);

      var right = el('div', 'phase-right');
      right.appendChild(el('span', 'phase-id', p.id));
      if (p.note) right.appendChild(el('span', 'phase-note', p.note));
      li.appendChild(right);

      list.appendChild(li);
    });
    timeline.appendChild(list);
    sec.appendChild(timeline);
  }

  /* ---- tracks ---- */

  function buildTracks(d) {
    var sec = document.getElementById('tracks');
    sec.appendChild(el('h2', 'section-title', '开发轨道'));

    d.tracks.forEach(function (t) {
      var ts = el('div', 'track-section');

      var th = el('div', 'track-header');
      var total = t.components.length;
      var done  = t.components.filter(function (c) { return c.status === 'done'; }).length;
      th.appendChild(el('h3', 'track-name', t.name));
      th.appendChild(el('span', 'track-ratio', done + ' / ' + total + ' 已完成'));
      ts.appendChild(th);

      /* bar */
      var bar = el('div', 'track-bar-track');
      var barFill = el('div', 'track-bar-fill');
      barFill.style.width = Math.round((done / total) * 100) + '%';
      bar.appendChild(barFill);
      ts.appendChild(bar);

      /* table */
      var tbl = el('table', 'comp-table');
      var thead = el('thead');
      var hr = el('tr');
      ['ID', '组件', '状态', 'PR', '合并日期', '备注'].forEach(function (h) {
        hr.appendChild(el('th', '', h));
      });
      thead.appendChild(hr);
      tbl.appendChild(thead);

      var tbody = el('tbody');
      t.components.forEach(function (c) {
        var tr = el('tr');
        tr.appendChild(el('td', 'cell-id', c.id));
        tr.appendChild(el('td', 'cell-name', c.name));

        var sd = el('td', 'cell-status');
        sd.appendChild(badge(c.status));
        tr.appendChild(sd);

        tr.appendChild(el('td', 'cell-pr', prDisplay(c)));
        tr.appendChild(el('td', 'cell-merged', dateOnly(c.merged)));
        tr.appendChild(el('td', 'cell-note', c.note || ''));
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      ts.appendChild(tbl);

      sec.appendChild(ts);
    });
  }

  /* ---- regression ---- */

  function buildRegression(d) {
    var sec = document.getElementById('regression');
    sec.appendChild(el('h2', 'section-title', '最新回归测试'));

    var r = d.latest_regression;

    var meta = el('div', 'regression-meta');
    var cm = el('span', 'regression-commit');
    cm.appendChild(el('span', '', '提交 '));
    cm.appendChild(el('code', '', r.commit));
    meta.appendChild(cm);
    meta.appendChild(el('span', 'regression-date', r.date));
    if (r.note) meta.appendChild(el('span', 'regression-note', r.note));
    sec.appendChild(meta);

    var tbl = el('table', 'regression-table');
    var thead = el('thead');
    var hr = el('tr');
    ['测试套件', '通过', '跳过'].forEach(function (h) {
      hr.appendChild(el('th', '', h));
    });
    thead.appendChild(hr);
    tbl.appendChild(thead);

    var tbody = el('tbody');
    r.results.forEach(function (row) {
      var tr = el('tr');
      tr.appendChild(el('td', '', row.suite));
      tr.appendChild(el('td', 'cell-passed', String(row.passed)));
      tr.appendChild(el('td', 'cell-skipped', String(row.skipped)));
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    sec.appendChild(tbl);

    if (r.caveat) {
      sec.appendChild(el('p', 'regression-caveat', r.caveat));
    }
  }

  /* ---- process ---- */

  function buildProcess(d) {
    var sec = document.getElementById('process');
    sec.appendChild(el('h2', 'section-title', '开发流程'));
    sec.appendChild(el('p', 'process-text', d.process));
  }

  /* ---- error ---- */

  function showError(msg) {
    var main = document.querySelector('main');
    var div = el('div', 'error-banner');
    div.setAttribute('role', 'alert');
    div.appendChild(el('p', '', '⚠️ ' + msg));
    main.insertBefore(div, main.firstChild);
  }

  /* ---- main ---- */

  fetch('data/progress.json')
    .then(function (resp) {
      if (!resp.ok) throw new Error('无法加载数据（HTTP ' + resp.status + '）');
      return resp.json();
    })
    .then(function (data) {
      buildHeader(data);
      buildArchitecture(data);
      buildPhases(data);
      buildTracks(data);
      buildRegression(data);
      buildProcess(data);
    })
    .catch(function (err) {
      showError('数据加载失败：' + err.message + '。请确认 data/progress.json 文件存在。');
    });
})();