(function () {
  'use strict';
  const C = { ink: '#18342f', green: '#276850', blue: '#386ac2', orange: '#c77c25', pale: '#f3f7f4', grid: '#e5ede7', muted: '#60776d' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const phase = p => ((Number(p) || 0) % 1 + 1) % 1;
  const sweep = p => (1 - Math.cos(2 * Math.PI * phase(p))) / 2;
  const num = (n, d = 2) => Number.isFinite(Number(n)) ? Number(Number(n).toFixed(d)).toString() : '—';
  const v = l => (l.visual && l.visual.values) || {};
  const id = l => String(l.id || '');
  const txt = (x, y, s, color = C.ink, size = 22, anchor = 'start', weight = 500) => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`;
  const line = (x1, y1, x2, y2, color = C.ink, width = 3, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const rect = (x, y, w, h, fill = 'white', stroke = C.grid, r = 10, sw = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const circle = (x, y, r = 5, fill = C.ink, stroke = 'none') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const path = (d, color = C.ink, width = 3, dash = '', fill = 'none') => `<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const poly = (points, color = C.ink, width = 3, dash = '') => path(points.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(' '), color, width, dash);
  const pill = (x, y, w, label, color = C.green) => rect(x, y, w, 38, '#fff', color, 19) + txt(x + w / 2, y + 26, label, color, 19, 'middle');
  function flow(points, p, color = C.blue, count = 5, direction = 1) {
    const lens = points.slice(1).map((q, i) => Math.hypot(q[0] - points[i][0], q[1] - points[i][1]));
    const total = lens.reduce((a, b) => a + b, 0); if (!total) return '';
    let out = '';
    for (let j = 0; j < count; j++) {
      let dist = phase(direction * phase(p) + j / count) * total;
      for (let k = 0; k < lens.length; k++) {
        if (dist <= lens[k] || k === lens.length - 1) {
          const t = lens[k] ? dist / lens[k] : 0;
          out += circle(points[k][0] + (points[k + 1][0] - points[k][0]) * t, points[k][1] + (points[k + 1][1] - points[k][1]) * t, 5, color, 'white'); break;
        }
        dist -= lens[k];
      }
    }
    return out;
  }
  function sampled(fn, x0, x1, n = 100) { return Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [x0 + (x1 - x0) * t, fn(t)]; }); }
  function box(x, y, w, h, title, value, color = C.green) {
    const units = Array.from(String(value)).reduce((n, c) => n + (/[^\u0000-\u00ff]/.test(c) ? 1 : 0.61), 0);
    const compact = h < 90, valueSize = Math.max(18, Math.min(compact ? 23 : 27, (w - 28) / Math.max(units, 1)));
    return rect(x, y, w, h, 'white', color) + txt(x + w / 2, y + (compact ? 24 : 30), title, C.muted, compact ? 18 : 20, 'middle') + txt(x + w / 2, y + h - (compact ? 12 : 23), value, color, valueSize, 'middle', 700);
  }
  function axes(x, y, w, h, xlabel = '时间（示意）', ylabel = '') {
    let s = line(x, y + h, x + w, y + h, C.muted, 2) + line(x, y, x, y + h, C.muted, 2);
    if (ylabel) s += txt(x, y - 18, ylabel, C.muted, 19);
    s += txt(x + w, y + h + 33, xlabel, C.muted, 19, 'end');
    return s;
  }
  function legend(items, y = 446) {
    const width = 820 / items.length;
    return items.map((q, i) => line(50 + i * width, y - 6, 73 + i * width, y - 6, q[1], 4, q[2] || '') + txt(83 + i * width, y, q[0], C.ink, 19)).join('');
  }
  function frame(l, body, note = '原理示意 · 循环观察，不代表实测', sub = '') {
    const title = String(l.title || '原理示意');
    const titleSize = title.length > 31 ? 22 : 24;
    const footer = String(note).slice(0, 44);
    const mode = l.visual && l.visual.mode ? ` · ${String(l.visual.mode).slice(0, 24)}` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><defs><pattern id="grid-${esc(id(l))}" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="${C.grid}" stroke-width="1"/></pattern></defs><g font-family="Microsoft YaHei,PingFang SC,Noto Sans CJK SC,sans-serif"><rect width="900" height="540" fill="white"/><rect x="22" y="87" width="856" height="382" rx="14" fill="url(#grid-${esc(id(l))})"/>${txt(30, 40, title, C.ink, titleSize, 'start', 700)}${txt(30, 70, sub || '同一画布内观察电流路径和状态变化', C.muted, 19)}${body}${line(30, 482, 870, 482, C.grid, 2)}${txt(30, 510, footer, C.muted, 18)}${txt(870, 534, '静音循环' + mode, C.muted, 18, 'end')}</g></svg>`;
  }
  function gateCircuit(p, opts = {}) {
    const color = opts.off ? C.orange : C.blue;
    const points = [[160, 210], [245, 210], [320, 210], [430, 210], [430, 266]];
    let s = rect(52, 165, 108, 208, 'white', C.ink) + txt(106, 195, '驱动器', C.ink, 22, 'middle') + txt(106, 244, opts.off ? '抽电荷' : '送电荷', color, 20, 'middle') + txt(106, 355, '返回', C.muted, 19, 'middle');
    s += line(160, 210, 245, 210) + rect(245, 195, 75, 30, 'white', C.ink, 2) + line(320, 210, 430, 210) + circle(430, 210);
    s += line(430, 210, 430, 267) + line(400, 267, 460, 267, C.blue, 4) + line(400, 281, 460, 281, C.blue, 4) + line(430, 281, 430, 350) + line(430, 350, 160, 350);
    s += txt(283, 181, opts.r || '实际总阻抗', C.ink, 20, 'middle') + txt(430, 151, opts.gate || '门极节点', color, 21, 'middle') + txt(365, 310, 'Qg', C.ink, 21);
    s += flow(points, p, color, 5, opts.off ? -1 : 1) + flow([[430, 350], [160, 350]], p, color, 3, opts.off ? -1 : 1);
    s += txt(263, 410, '充放电等效示意', C.muted, 19, 'middle');
    return s;
  }
  function gate(l, p) {
    const d = v(l), key = id(l); let s = '', note = '原理示意 · 回看过程，不是保证开关时间';
    if (key === 'gate-charge') {
      const max = d.Qg_nC, q1 = d.Qgth_nC, q2 = d.Qgs_nC, q3 = q2 + d.Qgd_nC;
      const x = q => 110 + 700 * q / max;
      const curve = q => q < q1 ? 400 - 75 * q / q1 : q < q2 ? 325 - 70 * (q - q1) / (q2 - q1) : q < q3 ? 255 : 255 - 105 * (q - q3) / (max - q3);
      s += axes(110, 140, 700, 260, 'Qg（nC）', '栅压（形状示意）');
      [[0, q1, C.grid], [q1, q2, '#e5edfa'], [q2, q3, '#e3eee6'], [q3, max, '#fbf0df']].forEach(([a, b, color]) => { s += rect(x(a), 140, x(b) - x(a), 260, color, 'none', 0); });
      s += poly([[x(0), 400], [x(q1), 325], [x(q2), 255], [x(q3), 255], [x(max), 150]], C.green, 5);
      [q1, q2, q3, max].forEach(q => { s += line(x(q), 400, x(q), 409, C.muted, 2) + txt(x(q), 432, num(q), C.ink, 19, 'middle'); });
      const q = sweep(p) * max; s += line(x(q), 140, x(q), 400, C.blue, 2, '5 5') + circle(x(q), curve(q), 7, C.blue, 'white');
      s += txt(300, 118, `电流段 ${num(q2 - q1)} nC`, C.blue, 20) + txt(545, 118, `平台段 ${num(d.Qgd_nC)} nC`, C.green, 20);
      s += txt(445, 457, `主要转换区间 Qsw = ${num(d.Qsw_nC)} nC；全部 Qg = ${num(max)} nC`, C.ink, 20, 'middle');
      return frame(l, s, '电荷取对应测试条件；纵轴形状未作电压定量', '阈值段 → 电流变化 → 米勒平台 → 最终栅压');
    }
    if (key === 'audit-miller' || key === 'gate-miller-ratio') {
      s += rect(45, 155, 148, 76, 'white', C.orange) + txt(119, 184, '对管切换', C.orange, 21, 'middle') + txt(119, 214, '漏极 dv/dt', C.ink, 19, 'middle');
      s += line(193, 192, 270, 192) + line(270, 166, 270, 218, C.blue, 4) + line(285, 166, 285, 218, C.blue, 4) + line(285, 192, 437, 192) + circle(437, 192) + txt(276, 145, 'Cgd', C.blue, 21, 'middle');
      s += line(437, 192, 437, 276) + rect(422, 276, 30, 58, 'white', C.ink, 2) + line(437, 334, 437, 380) + line(437, 380, 215, 380) + txt(367, 309, 'Roff', C.ink, 20, 'end');
      s += line(335, 192, 335, 276) + line(315, 276, 355, 276, C.green, 4) + line(315, 290, 355, 290, C.green, 4) + line(335, 290, 335, 380) + txt(309, 322, 'Cgs', C.green, 20, 'end');
      s += flow([[193, 192], [437, 192], [437, 380], [215, 380]], p, C.orange, 6) + txt(320, 415, '耦合进入 → 电容分流 / 关断泄流', C.ink, 19, 'middle');
      s += axes(545, 170, 290, 210, '时间', '本地 VGS');
      if (key === 'audit-miller') {
        const amp = d.bump_V, y = t => 380 - 170 * (1 - Math.exp(-3 * t)) / (1 - Math.exp(-3));
        s += poly(sampled(y, 545, 835), C.blue, 4) + circle(545 + sweep(p) * 290, y(sweep(p)), 6, C.blue);
        s += txt(835, 151, `末端约 ${num(amp)} V`, C.blue, 21, 'end');
        s += txt(690, 430, `${num(d.duration_ns)} ns 恒流 RC 算例`, C.ink, 19, 'middle');
        note = '该 RC 曲线只表示原片近似；不证明破坏性直通';
      } else {
        s += line(545, 255, 835, 255, C.orange, 2, '6 5') + txt(835, 241, `筛查 Vth = ${num(d.threshold_V)} V`, C.orange, 19, 'end');
        s += poly([[545, 380], [590, 380], [650, 292], [710, 320], [780, 378], [835, 380]], C.blue, 4);
        s += box(565, 100, 250, 65, '模型电阻比上限', num(d.ratioLimit, 3), C.green);
        s += txt(690, 430, '鼓包形状只示意，未给实测幅值', C.muted, 18, 'middle');
        note = '比值只作初筛；不能用它保证不误导通';
      }
      return frame(l, s, note, '观察耦合路径与关断路径，不把阈值当大电流保证');
    }
    if (key === 'audit-drive-voltage') {
      const max = Math.max(d.r10_mohm, d.r15_mohm) * 1.25;
      s += axes(160, 145, 590, 235, '', 'RDS(on) 最大值（mΩ）');
      [[300, d.r10_mohm, '10 V', C.blue], [600, d.r15_mohm, '15 V', C.green]].forEach(([x, r, lab, color]) => { const h = r / max * 220; s += rect(x - 65, 380 - h, 130, h, color, color, 5) + txt(x, 365 - h, num(r), color, 25, 'middle') + txt(x, 416, lab, C.ink, 22, 'middle'); });
      s += line(195 + 610 * sweep(p), 140, 195 + 610 * sweep(p), 380, C.orange, 2, '4 6');
      s += txt(450, 455, `同一最大值口径改善约 ${num(d.improvement_percent)}%`, C.ink, 22, 'middle');
      return frame(l, s, '同一测试条件比较；还需权衡动态、供电和栅压应力', '两根柱共用零点与比例，不放大微小差异');
    }
    if (key === 'deadtime-resistor') {
      const maxT = d.estimate_ns * 1.25, x = t => 170 + 600 * t / maxT;
      [['参考', d.reference_ns, d.reference_ohm, 215, C.blue], ['更换后', d.estimate_ns, d.new_ohm, 350, C.green]].forEach(([lab, t, r, y, color]) => { s += txt(65, y - 35, lab, color, 22) + txt(65, y, `${num(r)} Ω`, C.ink, 20) + poly([[170, y - 75], [220, y - 75], [x(t), y], [810, y]], color, 4) + line(x(t), y - 86, x(t), y + 10, color, 2, '4 5') + txt(x(t), y + 35, `${num(t)} ns`, color, 22, 'middle'); });
      const xx = 170 + 640 * sweep(p); s += line(xx, 115, xx, 388, C.orange, 2, '4 6');
      s += txt(450, 450, '只缩放电荷转换过程；固定传播延迟另算', C.ink, 21, 'middle');
      return frame(l, s, '比例换算仅为初估，不能将典型值改称最坏值', '同一时间比例下比较两段转换');
    }
    if (key === 'gate-lower-bound') {
      const y = a => 390 - a / (d.target_V * 1.15) * 230;
      s += axes(100, 150, 720, 240, '关断时间（示意）', 'VDS（V）');
      s += line(100, y(d.bus_V), 820, y(d.bus_V), C.blue, 2, '5 5') + txt(810, y(d.bus_V) + 30, `母线 ${num(d.bus_V)} V`, C.blue, 20, 'end');
      s += line(100, y(d.target_V), 820, y(d.target_V), C.orange, 2, '7 5') + txt(810, y(d.target_V) - 15, `示例目标 ${num(d.target_V)} V`, C.orange, 20, 'end');
      const fn = t => y(d.bus_V + (d.target_V - d.bus_V) * Math.exp(-Math.pow((t - .45) / .12, 2)));
      s += poly(sampled(fn, 100, 820), C.green, 4) + circle(100 + 720 * sweep(p), fn(sweep(p)), 7, C.green);
      s += txt(450, 451, `此模型：有效独立 Roff,ext ≥ ${num(d.lowerExternal_ohm)} Ω`, C.ink, 23, 'middle');
      return frame(l, s, '曲线只示意过冲预算；目标与电阻下限均有条件', '先决定可接受峰值，再按实际关断路径反算');
    }
    if (key === 'gate-tradeoff' || key === 'gate-validate') {
      const names = (l.visual && l.visual.labels) || ['速度', '损耗', '尖峰', '抗干扰'];
      s += rect(330, 205, 240, 100, 'white', C.ink) + txt(450, 245, key === 'gate-tradeoff' ? '实际栅极阻抗' : '候选驱动路径', C.ink, 23, 'middle') + txt(450, 278, '建立模型 → 验证', C.muted, 20, 'middle');
      const cards = [[70, 120], [610, 120], [70, 330], [610, 330]];
      cards.forEach(([x, y], i) => { const selected = Math.floor(phase(p) * 4) === i, color = i % 2 ? C.orange : C.blue; s += line(x < 300 ? x + 210 : x, y + 47, x < 300 ? 330 : 570, 255, selected ? color : C.grid, selected ? 4 : 2) + rect(x, y, 210, 92, 'white', selected ? color : C.grid) + txt(x + 105, y + 40, names[i] || '验证条件', color, 23, 'middle') + txt(x + 105, y + 70, key === 'gate-tradeoff' ? '彼此影响' : '目标板确认', C.muted, 19, 'middle'); });
      return frame(l, s, '定性关系；不把一个阻值写成所有电路的答案', '逐项检查同一驱动电路的不同约束');
    }
    const off = /off|discharge|peak-driver|command/.test(key);
    s += gateCircuit(p, { off, r: d.total_ohm != null ? `${num(d.total_ohm)} Ω` : '实际总阻抗', gate: d.plateau_V != null ? `平台 ${num(d.plateau_V)} V` : '栅极电荷节点' });
    if (key === 'gate-current-on' || key === 'gate-current-off') {
      const push = off ? d.plateau_V - d.off_V : d.drive_V - d.plateau_V;
      s += box(545, 135, 290, 100, '推动电流的电压差', `${num(push)} V`, C.blue) + box(545, 275, 290, 100, '平台附近栅电流', `${num(d.current_A, 3)} A`, C.green);
      s += txt(690, 427, '实际路径阻抗全部计入', C.ink, 21, 'middle');
    } else if (key === 'gate-peak-driver') {
      s += box(545, 130, 290, 108, `初始 ${num(d.on_V)} V`, `${num(d.peak_A, 3)} A`, C.orange) + box(545, 280, 290, 108, '平台期间', `${num(d.plateau_A, 3)} A`, C.blue);
      s += txt(690, 430, '两种电流不是同一时刻', C.ink, 20, 'middle');
    } else if (key === 'deadtime-command') {
      const x = 555, w = 280; s += txt(x, 130, '命令先低，实际随后变化', C.ink, 20);
      s += poly([[x, 160], [x + 65, 160], [x + 65, 205], [835, 205]], C.orange, 3) + txt(840, 210, '命令', C.orange, 18, 'end');
      s += poly([[x, 250], [x + 95, 250], [x + 125, 285], [x + 185, 285], [x + 225, 335], [835, 335]], C.blue, 4) + txt(835, 367, '栅压放电 / 换流', C.blue, 20, 'end');
      s += line(x + w * sweep(p), 145, x + w * sweep(p), 340, C.green, 2, '4 4');
      s += txt(690, 429, 'VDS 与电流还需同步观察', C.ink, 19, 'middle');
    } else {
      s += axes(550, 160, 280, 210, d.time_ns != null ? '对应转换时间' : '时间（示意）', off ? '剩余阶段电荷' : '已转移阶段电荷');
      const fn = t => off ? 170 + 200 * t : 370 - 200 * t;
      s += poly([[550, fn(0)], [830, fn(1)]], C.blue, 4) + circle(550 + sweep(p) * 280, fn(sweep(p)), 7, C.blue);
      if (d.charge_nC != null) s += txt(830, 133, `${num(d.charge_nC)} nC / ${num(d.current_A, 3)} A`, C.ink, 21, 'end');
      if (d.time_ns != null) s += txt(690, 432, `估算 ${num(d.time_ns)} ns`, C.green, 27, 'middle', 700);
    }
    return frame(l, s, note, '线上的流动点表示电荷路径，不表示电流数值比例');
  }

  function bridge(p, mode = 'gap') {
    const main = [[205, 120], [205, 385]], diode = [[315, 385], [315, 260], [205, 260], [385, 260]];
    let s = line(145, 120, 265, 120, C.ink, 4) + txt(205, 105, '直流母线', C.ink, 20, 'middle') + line(205, 120, 205, 155) + rect(160, 155, 90, 62, 'white', C.ink, 4) + txt(205, 194, '上管 H', C.ink, 20, 'middle') + line(205, 217, 205, 299) + rect(160, 299, 90, 62, 'white', C.ink, 4) + txt(205, 338, '下管 L', C.ink, 20, 'middle') + line(205, 362, 205, 400) + line(145, 400, 265, 400, C.ink, 4) + txt(205, 433, '母线负端', C.ink, 20, 'middle');
    s += circle(205, 260) + line(205, 260, 355, 260) + rect(355, 235, 65, 50, 'white', C.blue, 4) + txt(387, 268, '负载', C.blue, 19, 'middle') + txt(241, 243, 'SW', C.ink, 20);
    if (mode === 'diode') {
      s += poly([[205, 400], [315, 400], [315, 260], [205, 260]], C.orange, 3) + path('M300 332 L315 305 L330 332 Z', C.orange, 2, '', '#fff') + line(299, 303, 331, 303, C.orange, 3) + txt(336, 356, '二极管', C.orange, 19) + flow(diode, p, C.orange, 6);
    } else if (mode === 'overlap') {
      s += rect(153, 149, 104, 220, 'none', C.orange, 10, 4) + flow(main, p, C.orange, 7) + txt(67, 454, '共同导通：母线低阻路径', C.orange, 20);
    } else {
      s += flow([[205, 120], [205, 260], [355, 260]], p, C.blue, 4) + txt(65, 454, '路径高亮只表示接力过程', C.muted, 19);
    }
    return s;
  }
  function deadtime(l, p) {
    const d = v(l), key = id(l); let s = '';
    if (key === 'deadtime-gap' || key === 'deadtime-150' || key === 'deadtime-measure') {
      let a, b, end, labels;
      if (key === 'deadtime-gap') { a = d.off_ns + d.propOff_ns; b = d.command_ns + d.on_ns + d.propOn_ns; end = b * 1.23; labels = [`前关完成 ${num(a)} ns`, `后开开始 ${num(b)} ns`, `实际空隙 ${num(d.gap_ns)} ns`]; }
      else if (key === 'deadtime-150') { a = d.off_ns - d.on_ns + d.skew_ns; b = d.result_ns; end = b * 1.23; labels = [`不利时间差 ${num(a)} ns`, `示例设定 ${num(b)} ns`, `示例余量 ${num(b - a)} ns`]; }
      else { a = d.corrected_ns; b = d.displayed_ns; end = b * 1.32; labels = [`校正间隔 ${num(a)} ns`, `显示间隔 ${num(b)} ns`, `探头相对延迟 ${num(d.relativeDelay_ns)} ns`]; }
      const x = t => 180 + 610 * t / end;
      s += axes(180, 145, 610, 245, '同一时间轴（ns）');
      s += rect(x(a), 135, x(b) - x(a), 255, '#f5e8d5', 'none', 0);
      s += line(180, 220, x(a), 220, C.blue, 9) + circle(x(a), 220, 7, C.blue) + txt(180, 190, labels[0], C.blue, 23);
      s += line(180, 330, x(b), 330, C.green, 9) + circle(x(b), 330, 7, C.green) + txt(180, 300, labels[1], C.green, 23);
      s += line(x(a), 135, x(a), 399, C.blue, 2, '4 5') + line(x(b), 135, x(b), 399, C.green, 2, '4 5');
      s += txt(180, 423, '0', C.muted, 19, 'middle') + txt(x(a), 423, num(a), C.blue, 19, 'end') + txt(x(b), 423, num(b), C.green, 19, 'start');
      s += txt(450, 458, labels[2], C.orange, 24, 'middle', 700) + circle(180 + 610 * sweep(p), 390, 6, C.orange);
      return frame(l, s, key === 'deadtime-150' ? '原片示例；固定倍率不能补齐未知最坏边界' : '先统一起止定义与测量参考，再比较时间差', key === 'deadtime-measure' ? '自拟校时例：不是原片已知测量误差' : '数字取自本页算例，图中位置按同一时间比例');
    }
    if (key === 'deadtime-corners') {
      s += txt(450, 125, '逐个工况寻找最小间隔', C.ink, 23, 'middle');
      ['冷', '常温', '热'].forEach((a, i) => { s += txt(300 + 210 * i, 166, a, C.ink, 22, 'middle'); });
      ['轻载', '中载', '满载'].forEach((a, j) => { s += txt(155, 220 + 80 * j, a, C.ink, 22, 'middle'); });
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const active = Math.floor(phase(p) * 9) === j * 3 + i; s += rect(215 + 210 * i, 182 + 80 * j, 170, 62, active ? '#e1ece5' : 'white', active ? C.green : C.grid) + txt(300 + 210 * i, 221 + 80 * j, active ? '测量中' : '待比较', active ? C.green : C.muted, 21, 'middle'); }
      s += txt(450, 454, '供电、电流方向与模式也要覆盖', C.ink, 22, 'middle');
      return frame(l, s, '矩阵表示验证范围；没有捏造各工况的测试结果');
    }
    if (key === 'deadtime-typical') {
      const cols = [['min', '需查保证边界', C.blue], ['typ', '典型表现', C.green], ['max', '需查保证边界', C.orange]];
      cols.forEach(([a, b, color], i) => { s += rect(85 + i * 245, 140, 220, 178, 'white', Math.floor(phase(p) * 3) === i ? color : C.grid) + txt(195 + i * 245, 190, a, color, 29, 'middle', 700) + txt(195 + i * 245, 259, b, C.ink, 21, 'middle'); });
      s += rect(120, 353, 660, 76, 'white', C.ink) + txt(450, 385, 'MCU 死区 → 驱动器互锁 / 固定延时 → 器件', C.ink, 21, 'middle') + txt(450, 413, '具体逻辑决定关系，不能机械相加', C.muted, 19, 'middle');
      return frame(l, s, '空白 min/max 不等于零偏差，typ 不等于最坏值');
    }
    if (key === 'deadtime-voltage' || key === 'audit-fixed-deadtime') {
      const x0 = 100, x1 = 810, edge1 = 290, edge2 = 355;
      s += axes(x0, 150, x1 - x0, 215, 'PWM 周期（局部空隙放大）', '桥臂电压（示意）');
      s += rect(edge1, 150, edge2 - edge1, 215, '#f8ead8', 'none', 0) + poly([[100, 345], [edge1, 345], [edge1, 180], [690, 180], [690, 345], [810, 345]], C.blue, 4, '8 5') + poly([[100, 345], [edge2, 345], [edge2, 180], [690, 180], [690, 345], [810, 345]], C.green, 4);
      s += line(100 + 710 * sweep(p), 145, 100 + 710 * sweep(p), 365, C.orange, 2) + txt(450, 129, `${num(d.bus_V)} V · ${num(d.frequency_Hz / 1000)} kHz · ${num(d.deadtime_ns)} ns`, C.ink, 22, 'middle');
      s += legend([['期望波形', C.blue, '6 4'], ['续流修正后示意', C.green]], 415);
      s += txt(450, 455, `单桥臂平均误差量级 ≈ ${num(d.error_V, 3)} V`, C.orange, 25, 'middle', 700);
      return frame(l, s, key === 'audit-fixed-deadtime' ? `内部典型 ${num(d.deadtime_ns)} ns；范围 ${num(d.min_ns)}–${num(d.max_ns)} ns` : '连续电流近似；电流换向和过零时需另分析', '正向电流示例；曲线空隙特意放大，不按周期比例');
    }
    if (key === 'deadtime-loss') {
      s += bridge(p, 'diode');
      s += txt(650, 131, '每周期两段实际续流', C.ink, 23, 'middle');
      s += axes(480, 160, 345, 180, '一个开关周期', '二极管导通');
      [[525, d.tD1_ns], [720, d.tD2_ns]].forEach(([x, t]) => { s += rect(x, 210, 45, 130, '#efdbc0', C.orange, 0) + txt(x + 22, 194, `${num(t)} ns`, C.orange, 20, 'middle'); });
      s += flow([[480, 350], [825, 350]], p, C.orange, 4);
      s += txt(650, 394, `${num(d.VF_V)} V × ${num(d.current_A)} A`, C.ink, 22, 'middle') + txt(650, 433, `平均导通热 ${num(d.loss_W, 3)} W`, C.green, 25, 'middle', 700);
      return frame(l, s, '使用实际二极管时长；恢复损耗未包含在此项', '时间段宽度为放大示意，两次导通分别计入');
    }
    const isDiode = key === 'deadtime-diode', overlap = key === 'deadtime-short';
    s += bridge(p, isDiode ? 'diode' : overlap ? 'overlap' : 'gap');
    const x0 = 475, x1 = 830, upperEnd = 625, lowerStart = overlap ? 605 : 685;
    s += rect(Math.min(upperEnd, lowerStart), 138, Math.abs(lowerStart - upperEnd), 235, overlap ? '#f9e3c9' : '#e2eee5', 'none', 0);
    s += txt(470, 127, overlap ? '实际通道重叠示意' : '共同关断区示意', overlap ? C.orange : C.green, 22);
    s += txt(470, 184, '上管', C.blue, 20) + poly([[530, 180], [upperEnd, 180], [upperEnd, 227], [x1, 227]], C.blue, 4);
    s += txt(470, 305, '下管', C.green, 20) + poly([[530, 347], [lowerStart, 347], [lowerStart, 300], [x1, 300]], C.green, 4);
    s += line(x0 + (x1 - x0) * sweep(p), 142, x0 + (x1 - x0) * sweep(p), 365, C.orange, 2, '4 5');
    if (isDiode) s += txt(650, 413, `该电流方向：SW ≈ −${num(d.exampleDiodeDrop_V)} V`, C.orange, 21, 'middle');
    else s += txt(650, 412, overlap ? '共同导通 ≠ 安全接力' : '先关断完成，再允许开通', overlap ? C.orange : C.green, 21, 'middle');
    return frame(l, s, overlap ? '电流峰值依完整回路；不由设定死区唯一决定' : '逻辑空隙不等于实际间隔，续流方向由电流决定');
  }

  function desatCircuit(p, normal = true) {
    let s = rect(45, 205, 130, 160, 'white', C.ink) + txt(110, 238, '本地驱动', C.ink, 21, 'middle') + txt(110, 277, '检测 / 比较', C.muted, 19, 'middle') + txt(110, 339, '本地关断', C.green, 19, 'middle');
    s += line(375, 110, 375, 135) + txt(375, 104, '母线', C.ink, 20, 'middle') + rect(342, 135, 66, 51, 'white', C.ink, 3) + txt(375, 167, '负载', C.ink, 20, 'middle') + line(375, 186, 375, 267) + rect(341, 267, 68, 62, 'white', C.green, 4) + txt(375, 306, 'IGBT', C.green, 20, 'middle') + line(375, 329, 375, 407);
    s += line(175, 325, 341, 325, C.green, 3) + txt(260, 348, '栅极控制', C.muted, 18, 'middle');
    s += line(175, 255, 250, 255) + rect(250, 242, 50, 26, 'white', C.ink, 2) + line(300, 255, 321, 255) + path('M321 242 L321 268 L340 255 Z', C.ink, 2, '', 'white') + line(342, 240, 342, 270) + line(342, 255, 375, 255) + circle(375, 255);
    s += txt(275, 226, 'R', C.ink, 20, 'middle') + txt(335, 209, 'HV D', C.ink, 19, 'middle');
    s += circle(215, 255) + line(215, 255, 215, 367) + line(195, 367, 235, 367, C.blue, 4) + line(195, 380, 235, 380, C.blue, 4) + line(215, 380, 215, 407) + line(110, 407, 375, 407) + line(110, 365, 110, 407);
    s += txt(244, 383, 'Cblank', C.blue, 19) + txt(255, 442, '当地发射极参考', C.muted, 19, 'middle');
    s += line(215, 174, 215, 255, C.blue, 3) + txt(215, 157, 'ICHG', C.blue, 20, 'middle') + flow(normal ? [[215, 174], [215, 255], [375, 255]] : [[215, 174], [215, 367]], p, C.blue, 4);
    return s;
  }
  function desat(l, p) {
    const d = v(l), key = id(l); let s = '';
    if (key === 'desat-normal') {
      s += desatCircuit(p, true);
      let y = 391; const scale = 66;
      [[d.vce_V, 'VCE', C.green], [d.vf_V, 'VF', C.blue], [d.current_uA * d.resistance_ohm / 1e6, 'I·R', C.orange]].forEach(([a, name, color]) => { const h = a * scale; y -= h; s += rect(560, y, 132, h, color, 'white', 0) + txt(710, y + h / 2 + 7, `${name} ${num(a)} V`, color, 21); });
      s += txt(650, 136, '检测脚电压逐项相加', C.ink, 22, 'middle') + txt(650, 445, `VDESAT ≈ ${num(d.desat_V)} V`, C.green, 27, 'middle', 700);
      return frame(l, s, '正常功率路径含负载；二极管压降并非常数', '电路保留负载与当地参考，避免直连母线的误读');
    }
    if (key === 'desat-threshold') {
      s += box(65, 145, 230, 130, '检测脚门槛', `${num(d.threshold_V)} V`, C.green) + box(335, 145, 230, 130, '二极管压降', `${num(d.vf_V)} V`, C.blue) + box(605, 145, 230, 130, '电阻压降', `${num(d.resistorDrop_V)} V`, C.orange);
      s += txt(315, 219, '−', C.ink, 32, 'middle') + txt(585, 219, '−', C.ink, 32, 'middle');
      s += line(180, 302, 720, 302, C.grid, 3) + flow([[180, 302], [720, 302]], p, C.green, 5) + box(275, 340, 350, 109, '换算到 VCE 的名义门槛', `${num(d.vceTrip_V)} V`, C.green);
      return frame(l, s, '名义门槛需加容差、温度与瞬态条件', '检测脚与功率器件两端的电压不是同一个量');
    }
    if (key === 'desat-blank' || key === 'desat-tolerance') {
      const th = d.threshold_V != null ? d.threshold_V : d.thresholdMax_V;
      const t = d.charge_us != null ? d.charge_us : d.time_us, xmax = t * 1.22;
      const x = a => 115 + a / xmax * 705, y = a => 390 - a / (th * 1.2) * 245;
      s += axes(115, 145, 705, 245, '充电开始后的时间（µs）', 'VDESAT（V）');
      s += line(115, y(th), 820, y(th), C.orange, 2, '6 5') + txt(810, y(th) - 14, `门槛 ${num(th)} V`, C.orange, 21, 'end');
      s += poly([[115, 390], [x(t), y(th)]], C.blue, 4) + line(x(t), y(th), x(t), 399, C.blue, 2, '4 5') + txt(x(t), 424, `${num(t)} µs`, C.blue, 22, 'middle');
      const u = sweep(p); s += circle(115 + (x(t) - 115) * u, 390 + (y(th) - 390) * u, 7, C.blue);
      if (key === 'desat-blank') {
        s += path(`M115 390 L${x(t * .45)} ${y(th * .45)} Q${x(t * .63)} ${y(th * .2)} ${x(t)} ${y(th * .2)}`, C.green, 4) + txt(265, 350, '正常开通后被拉低', C.green, 20);
        s += txt(450, 459, '故障保持高 VCE → 继续充电到门槛', C.ink, 21, 'middle');
      } else s += txt(450, 459, `${num(d.capacitance_pF)} pF · ${num(d.thresholdMax_V)} V · ${num(d.currentMin_uA)} µA`, C.ink, 22, 'middle');
      return frame(l, s, key === 'desat-blank' ? '只有充电过程；内部消隐、滤波、传播与关断另计' : '独立型号容差算例；100pF还未加入电容公差', key === 'desat-blank' ? '正常曲线仅定性；故障斜线按本页恒流算例' : '更高门槛、更小电流使到达门槛更晚');
    }
    if (key === 'desat-soft-off') {
      const maxT = d.softFall_ns * 1.2;
      const xL = t => 100 + 320 * t / maxT, xR = t => 540 + 290 * t / maxT;
      s += axes(100, 160, 320, 235, '时间（ns）', '电流（A）') + axes(540, 160, 290, 235, '时间（ns）', '感应过冲 ΔV（V）');
      [[d.fastFall_ns, C.orange, d.fastExtra_V], [d.softFall_ns, C.blue, d.softExtra_V]].forEach(([t, color, dv]) => { s += poly([[100, 175], [xL(t), 395], [420, 395]], color, 4) + poly([[540, 395], [540, 395 - 220 * dv / d.fastExtra_V], [xR(t), 395 - 220 * dv / d.fastExtra_V], [xR(t), 395], [830, 395]], color, 4) + txt(xL(t), 426, num(t), color, 19, 'middle') + txt(xR(t) - 6, 380 - 220 * dv / d.fastExtra_V, `${num(dv)} V`, color, 20, 'end'); });
      s += txt(100, 143, `${num(d.current_A)} A 起点`, C.ink, 20) + line(100 + 320 * sweep(p), 160, 100 + 320 * sweep(p), 395, C.green, 2, '4 6');
      s += legend([['更快下降', C.orange], ['较缓下降', C.blue]], 457);
      return frame(l, s, '自拟恒定 di/dt 算例；软关断也受短路能量限制', `${num(d.L_nH)} nH 电感：相同电流变化，不同下降时间`);
    }
    if (key === 'desat-budget') {
      const total = d.exampleAllowed_us, scale = 72, x0 = 90;
      s += txt(450, 133, '原片三段时间算例（不代表完整芯片时序）', C.ink, 22, 'middle');
      const segs = [[d.shownCharge_us, C.blue, '充电', 185], [d.shownFilter_us, C.orange, '滤波', 330], [d.shownOff_us, C.green, '关断', 185], [d.exampleMargin_us, C.grid, '名义剩余', 330]];
      let x = x0; segs.forEach(([t, color, name, labelY]) => { const w = t * scale; s += rect(x, 225, w, 65, color, 'white', 0); const center = x + w / 2; s += line(center, labelY < 225 ? labelY + 14 : 290, center, labelY < 225 ? 225 : labelY - 25, C.muted, 2) + txt(center, labelY, `${name} ${num(t)} µs`, color === C.grid ? C.ink : color, 20, 'middle'); x += w; });
      s += line(x0, 360, x0 + total * scale, 360, C.muted, 2) + txt(x0, 387, '0', C.muted, 19) + txt(x0 + total * scale, 387, `${num(total)} µs 示例窗口`, C.ink, 20, 'end');
      s += circle(x0 + total * scale * sweep(p), 360, 7, C.orange) + txt(450, 440, '实际还需对齐内部消隐、传播及电流清除定义', C.ink, 21, 'middle');
      return frame(l, s, '不得用典型三项相加就宣称真实器件有安全余量');
    }
    if (key === 'desat-urgency') {
      s += box(75, 150, 285, 120, '同时承受的 VCE', `${num(d.voltage_V)} V`, C.orange) + box(540, 150, 285, 120, '同时流过的 IC', `${num(d.current_A)} A`, C.blue) + txt(450, 225, '×', C.ink, 40, 'middle');
      s += line(220, 300, 680, 300, C.grid, 3) + flow([[220, 300], [680, 300]], p, C.orange, 5) + box(260, 335, 380, 110, '瞬时耗散功率', `${num(d.power_W / 1000)} kW`, C.orange);
      return frame(l, s, `${num(d.exampleWindow_us)} µs 是示例；耐短路条件必须查具体器件`, '高电压和大电流同时存在，热量会快速累积');
    }
    if (key === 'desat-clue') {
      s += axes(120, 150, 680, 245, 'VCE（未按比例）', 'IC（示意）');
      [0, 1, 2].forEach(i => { s += path(`M120 395 Q155 ${270 - i * 35} 220 ${270 - i * 35} L800 ${255 - i * 35}`, i === 1 ? C.green : C.grid, i === 1 ? 4 : 2); });
      s += circle(178, 295, 8, C.blue) + txt(170, 437, `正常示例 ${num(d.normalExample_V)} V`, C.blue, 22);
      s += circle(725, 221, 8, C.orange) + txt(735, 185, `故障示例 ${num(d.faultExample_V)} V`, C.orange, 22, 'end');
      s += flow([[178, 295], [300, 255], [725, 221]], p, C.orange, 3);
      return frame(l, s, '输出曲线只解释线索；不是某型号测量特性', '只在适当的导通检测窗口内判断异常 VCE');
    }
    if (key === 'desat-diode-layout') {
      s += rect(55, 165, 180, 96, 'white', C.orange) + txt(145, 201, '集电极快变化', C.orange, 22, 'middle') + txt(145, 235, `${num(d.slew_V_ns)} V/ns`, C.ink, 24, 'middle');
      s += line(235, 213, 345, 213) + line(345, 178, 345, 248, C.blue, 5) + line(365, 178, 365, 248, C.blue, 5) + line(365, 213, 560, 213) + circle(560, 213);
      s += txt(355, 151, `Cj ${num(d.capacitance_pF)} pF`, C.blue, 22, 'middle') + txt(560, 188, '检测节点', C.ink, 22, 'middle');
      s += flow([[235, 213], [560, 213], [560, 330]], p, C.orange, 5) + line(560, 213, 560, 330) + rect(480, 330, 160, 72, 'white', C.green) + txt(560, 359, '本地滤波 / 钳位', C.green, 19, 'middle') + txt(560, 389, '短回路返回', C.muted, 19, 'middle');
      s += box(675, 285, 175, 115, '瞬时量级', `${num(d.current_mA)} mA`, C.orange);
      return frame(l, s, '自拟瞬时量级；不是持续电流或已证实误触发', '截止二极管仍通过结电容耦合位移电流');
    }
    s += txt(450, 130, '检测覆盖由门槛与时间共同决定', C.ink, 23, 'middle');
    const cards = [['DESAT', '严重异常 VCE', C.orange], ['电流检测', '正负电流范围', C.blue], ['热保护', '长期热累积', C.green]];
    cards.forEach(([a, b, color], i) => { const active = Math.floor(phase(p) * 3) === i; s += rect(70 + i * 260, 190, 235, 170, active ? '#f0f6f2' : 'white', color) + txt(187 + i * 260, 244, a, color, 27, 'middle', 700) + txt(187 + i * 260, 299, b, C.ink, 21, 'middle'); });
    s += txt(450, 427, '三种保护互补；故障锁存和复位按系统策略', C.ink, 21, 'middle');
    return frame(l, s, '严重过流也可能触发 DESAT；它不替代完整保护');
  }

  function kelvinCircuit(p, opt = {}) {
    const wrong = !!opt.wrong; let s = rect(45, 160, 112, 242, 'white', C.ink) + txt(101, 192, '驱动器', C.ink, 21, 'middle') + txt(101, 229, 'OUT', C.blue, 19, 'middle') + txt(101, 378, '返回', C.blue, 20, 'middle');
    s += line(157, 215, 225, 215, C.blue) + rect(225, 201, 64, 28, 'white', C.ink, 2) + line(289, 215, 438, 215, C.blue) + txt(257, 186, 'Rg', C.ink, 20, 'middle');
    s += line(438, 180, 438, 252, C.ink, 4) + line(457, 180, 457, 252, C.ink, 4) + poly([[457, 180], [480, 180], [480, 117]], C.ink, 3) + poly([[457, 252], [480, 270]], C.ink, 3) + txt(480, 108, 'D', C.ink, 21, 'middle') + txt(422, 245, 'G', C.blue, 21, 'end');
    s += circle(480, 270, 6, C.ink) + txt(502, 266, '芯片源极', C.ink, 19);
    s += poly([[480, 270], [350, 270], [350, 380], [157, 380]], C.blue, 4) + txt(350, 411, 'SK 返回', C.blue, 21, 'middle');
    s += path('M480 270 L480 285 Q500 294 480 303 Q500 312 480 321 Q500 330 480 339 L480 429', C.orange, 4) + txt(505, 320, 'LS', C.orange, 21) + txt(480, 455, '功率 S', C.orange, 21, 'middle');
    s += flow([[480, 117], [480, 270], [480, 429]], p, C.orange, 5) + flow([[157, 215], [438, 215]], p, C.blue, 4) + flow([[480, 270], [350, 270], [350, 380], [157, 380]], p, C.blue, 5);
    if (opt.clamp) {
      const bottom = wrong ? 435 : 380;
      s += circle(310, 215) + line(310, 215, 310, 294, wrong ? C.orange : C.green, 3) + path('M295 306 L310 282 L325 306 Z', wrong ? C.orange : C.green, 2, '', 'white') + path('M293 277 L300 282 L322 282 L329 287', wrong ? C.orange : C.green, 3) + line(310, 306, 310, bottom, wrong ? C.orange : C.green, 3);
      if (wrong) s += poly([[310, 435], [480, 435], [480, 429]], C.orange, 3); else s += circle(310, 380, 5, C.green);
      s += txt(284, 326, '钳位', wrong ? C.orange : C.green, 19, 'end');
      if (wrong) s += txt(200, 455, '错误参考：接 S', C.orange, 19, 'middle');
    }
    return s;
  }
  function kelvin(l, p) {
    const d = v(l), key = id(l); let s = '';
    if (key === 'kelvin-four-wire') {
      s += rect(340, 210, 160, 44, 'white', C.ink, 3) + txt(420, 239, `${num(d.resistance_mohm)} mΩ`, C.ink, 24, 'middle');
      const force = [[340, 232], [120, 232], [120, 370], [390, 370], [450, 370], [740, 370], [740, 232], [500, 232]];
      s += poly(force, C.orange, 4) + circle(420, 370, 31, 'white', C.orange) + txt(420, 379, 'I', C.orange, 26, 'middle') + flow(force, p, C.orange, 9);
      s += poly([[340, 232], [340, 135], [390, 135]], C.blue, 3) + poly([[450, 135], [500, 135], [500, 232]], C.blue, 3) + circle(420, 135, 31, 'white', C.blue) + txt(420, 144, 'V', C.blue, 25, 'middle');
      s += txt(110, 197, 'Force：载流引线', C.orange, 21) + txt(550, 151, 'Sense：测端点电压', C.blue, 21) + txt(420, 302, `${num(d.sense_mV)} mV / ${num(d.current_A)} A`, C.ink, 23, 'middle');
      s += pill(170, 426, 240, `两线示例 ${num(d.twoWire_mohm)} mΩ`, C.orange) + pill(470, 426, 240, `四线示例 ${num(d.resistance_mohm)} mΩ`, C.blue);
      return frame(l, s, '测压线近似零电流；栅极 SK 返回则有脉冲电流', '自拟数值说明引线误差，不模拟具体测量仪器');
    }
    if (key === 'kelvin-layout') {
      s += rect(65, 115, 770, 334, '#edf4ef', C.green) + rect(95, 200, 150, 105, 'white', C.ink) + txt(170, 244, '驱动 IC', C.ink, 23, 'middle') + txt(170, 281, 'OUT / RTN', C.muted, 19, 'middle');
      s += rect(670, 150, 125, 240, 'white', C.ink) + rect(705, 160, 70, 47, '#f2dfc6', C.orange, 3) + txt(740, 191, 'D', C.orange, 23, 'middle') + rect(705, 325, 70, 47, '#f2dfc6', C.orange, 3) + txt(740, 356, 'S', C.orange, 23, 'middle');
      s += line(740, 115, 740, 160, C.orange, 14) + line(740, 372, 740, 448, C.orange, 14);
      const g = [[245, 228], [650, 228], [670, 228]], k = [[670, 274], [650, 274], [245, 274]];
      s += poly(g, C.blue, 9) + poly(k, C.blue, 9) + flow(g, p, C.green, 5) + flow(k, p, C.green, 5) + txt(666, 218, 'G', C.ink, 20, 'end') + txt(666, 302, 'SK', C.ink, 20, 'end');
      s += rect(355, 218, 65, 20, 'white', C.ink, 2) + txt(387, 198, 'Rg', C.ink, 19, 'middle');
      s += rect(595, 230, 17, 42, 'white', C.green, 2) + rect(624, 230, 17, 42, 'white', C.green, 2) + txt(525, 352, '本地钳位 / 下拉', C.green, 21, 'middle') + line(568, 336, 617, 280, C.green, 2);
      s += txt(380, 409, '去回线紧邻；与功率噪声区分离', C.ink, 21, 'middle');
      return frame(l, s, '概念 PCB；实际层叠、耦合与安规距离需独立校核', '保护器件靠近 G / SK，SK 不并入主功率铜皮');
    }
    if (key === 'kelvin-negative') {
      s += line(210, 145, 210, 220, C.green, 3) + txt(210, 128, 'G', C.ink, 23, 'middle') + path('M187 281 L210 238 L233 281 Z', C.green, 3, '', 'white') + path('M183 228 L194 238 L229 238 L239 248', C.green, 4) + line(210, 281, 210, 388, C.green, 3) + txt(210, 420, 'SK', C.ink, 23, 'middle');
      s += txt(310, 240, '阴极', C.muted, 20) + txt(310, 283, '阳极', C.muted, 20);
      s += flow([[210, 145], [210, 388]], p, phase(p) < .5 ? C.orange : C.blue, 4, phase(p) < .5 ? 1 : -1);
      const x0 = 535, x = a => x0 + (a + 2) / 10 * 295, zero = x(0);
      s += line(x0, 280, 830, 280, C.muted, 2) + line(zero, 145, zero, 400, C.muted, 2) + txt(830, 428, 'VG−VSK（V）', C.muted, 19, 'end') + txt(530, 118, '支路电流（定性）', C.muted, 19);
      const points = [[x(-1.6), 398], [x(-d.illustrativeForward_V), 286], [x(0), 280], [x(d.nominalZener_V), 275], [x(d.nominalZener_V + .7), 155]];
      s += poly(points, C.green, 4) + circle(x(-d.illustrativeForward_V), 286, 6, C.blue) + circle(x(d.nominalZener_V), 275, 6, C.orange);
      s += txt(x(-d.illustrativeForward_V), 455, `−${num(d.illustrativeForward_V)} 示例`, C.blue, 19, 'middle') + txt(825, 245, `+${num(d.nominalZener_V)} V 标称`, C.orange, 19, 'end');
      s += txt(210, 461, '反向稳压 / 正向导通', C.ink, 20, 'middle');
      return frame(l, s, '单向齐纳不支持任意持续负压；瞬态仍受寄生影响', '电流方向动画仅区分两种导通，曲线不代表具体器件');
    }
    const wrong = key === 'kelvin-reference' || key === 'kelvin-clamp';
    s += kelvinCircuit(p, { wrong, clamp: wrong || key === 'kelvin-local-network' });
    if (key === 'kelvin-ls') {
      s += box(615, 155, 225, 115, `di/dt = +${num(d.rise_A_ns)} A/ns`, `uS = +${num(d.riseVoltage_V)} V`, C.orange) + box(615, 310, 225, 115, `di/dt = ${num(d.fall_A_ns)} A/ns`, `uS = ${num(d.fallVoltage_V)} V`, C.blue);
      s += rect(608, phase(p) < .5 ? 148 : 303, 239, 129, 'none', C.ink, 14, 3);
      return frame(l, s, '约定功率电流从芯片流向 S；下降时电感电压变号', `${num(d.L_nH)} nH 示例，不能每次都把源极感应电压写成 +5V`);
    }
    if (key === 'kelvin-actual-vgs' || key === 'kelvin-clamp') {
      const a = key === 'kelvin-clamp' ? d.powerClamp_V : d.external_V;
      const b = d.sourceDrop_V, c = key === 'kelvin-clamp' ? d.localClampEstimate_V : d.local_V;
      const vals = [[a, 'G−S', C.orange], [b, 'SK−S', C.blue], [c, 'G−SK', C.green]];
      vals.forEach(([n, lab, color], i) => { const x = 625 + i * 83, h = n / Math.max(a, b, c) * 175; s += rect(x - 26, 380 - h, 52, h, color, 'white', 1) + txt(x, 363 - h, `${num(n)} V`, color, 21, 'middle') + txt(x, 416, lab, C.ink, 18, 'middle'); });
      s += txt(710, 145, '相同零点，比较节点差', C.ink, 20, 'middle') + txt(710, 454, `${num(a)} − ${num(b)} = ${num(c)} V`, C.green, 23, 'middle');
      return frame(l, s, '本地 G−SK 更接近芯片 Vgs；剩余寄生仍需考虑', key === 'kelvin-clamp' ? '错参考示意：仅在钳位导通时作当前代数估算' : '三组电压使用同一节点与极性定义');
    }
    if (key === 'kelvin-pulldown') {
      s += line(290, 215, 290, 286, C.green, 3) + rect(275, 286, 30, 50, 'white', C.green, 2) + line(290, 336, 290, 380, C.green, 3) + circle(290, 380, 5, C.green) + flow([[290, 215], [290, 380]], p, C.green, 3);
      s += box(615, 145, 225, 110, `${num(d.resistance_ohm / 1000)} kΩ 下拉`, `${num(d.current_mA)} mA`, C.green) + box(615, 300, 225, 115, '钳位二极管', '达到条件才强导通', C.orange);
      return frame(l, s, '本页分开说明作用；不把电阻支路等同强钳位', `${num(d.voltage_V)} V 下的电阻电流算例，返回以本地 SK 示意`);
    }
    if (key === 'kelvin-return-current') {
      s += box(615, 150, 225, 110, '转移电荷 / 时长', `${num(d.charge_nC)} nC / ${num(d.time_ns)} ns`, C.blue) + box(615, 310, 225, 110, '阶段平均电流', `${num(d.current_A)} A`, C.green);
      return frame(l, s, 'SK 承载栅极脉冲返回；不承载主负载电流', '自拟电荷算例；流动点不代表实际瞬时幅值');
    }
    const labels = key === 'kelvin-local-network' ? ['驱动返回', '本地钳位 / 下拉', '共模能力需匹配'] : wrong ? ['钳位接 S', '与驱动参考不同', '应检查本地 VGS'] : ['功率电流走 S', '栅极返回走 SK', '主共用段移出驱动'];
    labels.forEach((a, i) => { s += rect(615, 140 + i * 107, 225, 77, 'white', i % 2 ? C.blue : C.green) + txt(727, 187 + i * 107, a, i % 2 ? C.blue : C.green, 20, 'middle'); });
    return frame(l, s, '等效结构示意；Kelvin 不等于零电感或隔离地', '主功率与栅极返回分路，仍在器件内部源极相连');
  }
  window.HardwareVisuals = window.HardwareVisuals || {};
  Object.assign(window.HardwareVisuals, { gate, deadtime, desat, kelvin });
})();
