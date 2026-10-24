"use strict";

// All data is rendered with textContent; no HTML strings are built from data.
const STATUS = {
  done: "已完成",
  review: "评审中",
  in_progress: "进行中",
  todo: "待开始",
};

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function badge(status) {
  const key = Object.prototype.hasOwnProperty.call(STATUS, status) ? status : "todo";
  return el("span", "badge s-" + key, STATUS[key]);
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + "T23:59:59+08:00");
  return Math.ceil((target - Date.now()) / 86400000);
}

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
}

function prList(c) {
  return Array.isArray(c.prs) ? c.prs : c.pr ? [c.pr] : [];
}

function stat(label, value, unit) {
  const box = el("div", "stat");
  box.append(el("dt", null, label));
  const dd = el("dd", null, value);
  if (unit) dd.append(el("small", null, unit));
  box.append(dd);
  return box;
}

function renderHero(d) {
  document.getElementById("title").textContent = d.project;
  document.getElementById("subtitle").textContent = d.subtitle || "";
  const all = d.tracks.flatMap((t) => t.components);
  const done = all.filter((c) => c.status === "done").length;
  const prs = all.reduce((n, c) => n + prList(c).length, 0);
  document.getElementById("stats").append(
    stat("组件完成", done + " / " + all.length),
    stat("已合并组件 PR", prs),
    stat("距功能冻结", Math.max(0, daysUntil(d.feature_freeze)), "天"),
    stat("距提交截止", Math.max(0, daysUntil(d.deadline)), "天"),
  );
}

function renderPhases(phases) {
  const ol = document.getElementById("phases");
  for (const p of phases) {
    const li = el("li", "phase p-" + p.status);
    li.append(el("div", "phase-id", p.id), el("div", "phase-name", p.name), badge(p.status));
    if (p.note) li.append(el("p", "phase-note", p.note));
    ol.append(li);
  }
}

function renderTracks(tracks) {
  const root = document.getElementById("tracks");
  for (const t of tracks) {
    const done = t.components.filter((c) => c.status === "done").length;
    const total = t.components.length;
    const card = el("article", "card track");

    const head = el("div", "track-head");
    head.append(el("h3", null, t.name));
    const count = el("span", "track-count");
    count.append(el("b", null, done + " / " + total), document.createTextNode(" 已完成"));
    head.append(count);

    const bar = el("div", "bar");
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(total));
    bar.setAttribute("aria-valuenow", String(done));
    bar.setAttribute("aria-label", t.name + " 完成进度");
    const fill = el("span");
    fill.style.width = (total ? (done / total) * 100 : 0).toFixed(1) + "%";
    bar.append(fill);

    const list = el("ul", "comp-list");
    for (const c of t.components) {
      const li = el("li", "comp");
      li.append(el("div", "comp-id", c.id));
      const body = el("div");
      body.append(el("div", "comp-name", c.name));
      const prs = prList(c).map((n) => "#" + n).join(" ");
      const meta = [prs, c.merged ? "合并于 " + c.merged : ""].filter(Boolean).join(" · ");
      if (meta) body.append(el("div", "comp-meta", meta));
      if (c.note) body.append(el("div", "comp-note", c.note));
      li.append(body, badge(c.status));
      list.append(li);
    }

    card.append(head, bar, list);
    root.append(card);
  }
}

function renderRegression(r) {
  const box = document.getElementById("regression");
  if (!r) {
    box.append(el("p", "caveat", "暂无记录"));
    return;
  }
  const head = el("div", "regression-head");
  head.append(el("code", null, r.commit), el("span", null, [r.date, r.note].filter(Boolean).join(" · ")));

  const table = el("table");
  const thead = el("thead");
  const hr = el("tr");
  hr.append(el("th", null, "套件"), el("th", "num", "通过"), el("th", "num", "跳过"));
  thead.append(hr);
  const tbody = el("tbody");
  for (const row of r.results || []) {
    const tr = el("tr");
    tr.append(el("td", null, row.suite), el("td", "num", row.passed), el("td", "num", row.skipped));
    tbody.append(tr);
  }
  table.append(thead, tbody);
  const scroll = el("div", "table-scroll");
  scroll.append(table);

  box.append(head, scroll);
  if (r.caveat) box.append(el("p", "caveat", r.caveat));
}

function renderArch(layers) {
  const root = document.getElementById("arch");
  for (const l of layers) {
    const card = el("article", "card layer");
    card.append(el("span", "layer-id", l.id), el("h3", null, l.name), el("p", null, l.desc));
    root.append(card);
  }
}

async function main() {
  const msg = document.getElementById("status-msg");
  try {
    const res = await fetch("data/progress.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const d = await res.json();
    renderHero(d);
    renderPhases(d.phases || []);
    renderTracks(d.tracks || []);
    renderRegression(d.latest_regression);
    renderArch(d.architecture || []);
    document.getElementById("process").textContent = d.process || "";
    document.getElementById("updated").textContent = "数据更新于 " + formatTime(d.updated_at) + "（北京时间）";
    msg.textContent = "";
  } catch (err) {
    msg.textContent = "进度数据加载失败：" + err.message;
    msg.classList.add("error");
  }
}

main();
