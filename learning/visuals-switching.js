/* Original, silent teaching diagrams. p is the phase of an eight-second loop.
 * Graphs stay fixed: the oscillating cursor means replay, never reversed physics.
 * Numbers come from the current lesson; illustrative shapes are labelled as such.
 */
(function () {
  'use strict';
  const H = window.HardwareVisuals = window.HardwareVisuals || {};
  const C = { ink: '#18342f', green: '#276850', blue: '#386ac2', orange: '#c77c25', muted: '#657871', line: '#cbd9d2', grid: '#f0f4f1', pale: '#edf5ef', sky: '#edf2fa', sand: '#fbf2e4' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  const n = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const fmt = (v, places = 2) => Number.isFinite(Number(v)) ? Number(Number(v).toFixed(places)).toString() : '—';
  const phase = p => ((n(p) % 1) + 1) % 1;
  const replay = p => (1 - Math.cos(2 * Math.PI * phase(p))) / 2;
  const text = (x, y, t, size = 22, color = C.ink, anchor = 'start', weight = 400) => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}">${esc(t)}</text>`;
  const line = (x1, y1, x2, y2, color = C.line, width = 2, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const path = (d, color = C.green, width = 3, fill = 'none', extra = '') => `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const rect = (x, y, w, h, fill = '#fff', stroke = C.line, r = 10, extra = '') => `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" rx="${r}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
  const dot = (x, y, color = C.orange, r = 6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  const poly = (pts, color = C.green, width = 3) => path(pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(' '), color, width);
  function wrap(s, max = 39) {
    const rows = []; let row = '', len = 0;
    for (const c of String(s)) { const w = /[\x00-\xff]/.test(c) ? 0.56 : 1; if (len + w > max && row) { rows.push(row); row = ''; len = 0; } row += c; len += w; }
    if (row) rows.push(row); return rows;
  }
  const words = (x, y, s, max = 20, size = 21, color = C.ink, spacing = 30) => wrap(s, max).map((r, i) => text(x, y + i * spacing, r, size, color)).join('');
  function base(title, body, note = '原理示意；光标往返表示回看同一事件。') {
    let grid = ''; for (let x = 40; x < 900; x += 40) grid += line(x, 74, x, 470, C.grid, 1); for (let y = 90; y < 470; y += 40) grid += line(30, y, 870, y, C.grid, 1);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540" role="img" aria-label="${esc(title)}" font-family="Microsoft YaHei, PingFang SC, sans-serif"><title>${esc(title)}</title><rect width="900" height="540" fill="#fff"/>${grid}${text(36, 43, title, 26, C.ink, 'start', 700)}${line(36, 64, 864, 64)}${body}${line(36, 477, 864, 477)}${wrap(note, 44).slice(0, 2).map((r, i) => text(36, 502 + i * 24, r, 18, C.muted)).join('')}</svg>`;
  }
  function card(x, y, w, h, title, content, color = C.green) {
    return rect(x, y, w, h, '#fff') + text(x + 18, y + 32, title, 21, color, 'start', 700) + words(x + 18, y + 67, content, Math.floor((w - 36) / 21), 21);
  }
  function metric(x, y, label, value, unit, color = C.green, w = 240) {
    return rect(x, y, w, 100, '#fff') + text(x + 16, y + 30, label, 20, C.muted) + text(x + 16, y + 72, `${value} ${unit}`, 31, color, 'start', 700);
  }
  function arrow(x1, y1, x2, y2, color = C.green, width = 3) {
    const a = Math.atan2(y2 - y1, x2 - x1), z = 10;
    const pts = [[x2, y2], [x2 - z * Math.cos(a - 0.5), y2 - z * Math.sin(a - 0.5)], [x2 - z * Math.cos(a + 0.5), y2 - z * Math.sin(a + 0.5)]];
    return line(x1, y1, x2, y2, color, width) + `<polygon points="${pts.map(q => q.join(',')).join(' ')}" fill="${color}"/>`;
  }
  function flow(pts, p, color = C.orange, count = 4) {
    const lengths = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
    const total = lengths.reduce((a, b) => a + b, 0); let out = '';
    for (let j = 0; j < count; j++) { let d = ((phase(p) + j / count) % 1) * total; for (let i = 0; i < lengths.length; i++) { if (d <= lengths[i]) { const f = d / (lengths[i] || 1); out += dot(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f, color, 4.5); break; } d -= lengths[i]; } }
    return out;
  }
  function axes(x, y, w, h, xLabel = '时间', yLabel = '') {
    return line(x, y, x + w, y, C.muted, 2) + line(x, y, x, y - h, C.muted, 2) + text(x + w, y + 31, xLabel, 20, C.muted, 'end') + text(x, y - h - 18, yLabel, 20, C.muted);
  }
  const cursor = (x, top, bottom, color = C.orange) => line(x, top, x, bottom, color, 2, '5 5');
  const series = (fn, x, y, w, h, count = 100) => Array.from({ length: count + 1 }, (_, i) => [x + w * i / count, y - h * fn(i / count)]);
  function bar(x, y, w, h, fraction, color = C.green) { return rect(x, y, w, h, C.grid, 'none', 4) + rect(x, y, w * Math.max(0, Math.min(1, fraction)), h, color, 'none', 4); }
  function labelsFallback(lesson, p) {
    const labels = (lesson.visual && lesson.visual.labels || ['观察变化', '核对条件', '理解关系', '验证结论']).slice(0, 4);
    return labels.map((s, i) => { const x = 52 + i % 2 * 414, y = 130 + Math.floor(i / 2) * 160; return card(x, y, 380, 125, `观察 ${i + 1}`, s) + dot(x + 350, y + 28, C.green, 5 + 2 * Math.sin(2 * Math.PI * (phase(p) - i / 4))); }).join('');
  }
  function voltageRamp(t) { return t < 0.35 ? 0 : t < 0.5 ? (t - 0.35) / 0.15 : 1; }
  function gateBump(t) { return Math.exp(-Math.pow((t - 0.48) / 0.07, 2)); }
  function bridge(p, currentOn = true, caption = '低侧 DUT') {
    let b = line(80, 125, 330, 125, C.ink, 3) + line(80, 414, 330, 414, C.ink, 3);
    b += line(285, 125, 285, 155, C.ink, 3) + rect(253, 155, 64, 67, C.sky) + text(285, 194, 'QH', 21, C.blue, 'middle');
    b += line(285, 222, 285, 300, C.ink, 3) + rect(253, 300, 64, 67, C.pale) + text(285, 340, 'QL', 21, C.green, 'middle') + line(285, 367, 285, 414, C.ink, 3);
    b += line(120, 125, 120, 173, C.ink, 3) + path('M120 173 C100 173 100 195 120 195 C100 195 100 217 120 217 C100 217 100 239 120 239 C100 239 100 261 120 261', C.ink, 3) + line(120, 261, 285, 261, C.ink, 3);
    b += text(90, 223, 'L', 22, C.ink, 'end') + text(285, 394, caption, 18, C.muted, 'middle') + text(330, 153, '栅极关断', 18, C.muted, 'end');
    b += line(331, 210, 331, 167, C.blue, 2) + path('M319 186 L343 186 L331 168 Z', C.blue, 2, C.sky) + line(319, 164, 343, 164, C.blue, 2) + line(331, 164, 331, 125, C.blue, 2) + line(331, 210, 331, 261, C.blue, 2) + line(285, 261, 331, 261, C.blue, 2);
    if (currentOn) b += flow([[120, 125], [120, 261], [285, 261], [285, 414], [80, 414]], p, C.green, 6);
    else b += flow([[120, 125], [120, 261], [331, 261], [331, 125], [120, 125]], p, C.blue, 6);
    return b;
  }
  function doublepulse(lesson, p) {
    const v = lesson.visual && lesson.visual.values || {}, mode = lesson.visual && lesson.visual.mode || v.stage || v.mode || '', u = replay(p);
    let b = '', title = '双脉冲：明确激励、回路与测量条件', note = '原理示意；固定波形上的光标只表示回看。';
    if (mode === 'overview' || mode === 'commutation') {
      title = mode === 'overview' ? '短脉冲建立可比较的测试条件' : '关断后续流：IL 与 IDUT 不是同一条电流';
      b = bridge(p, mode === 'overview') + text(80, 105, `${fmt(v.bus_V)} V 母线`, 22, C.ink);
      if (mode === 'overview') {
        b += metric(440, 110, '目标电流', fmt(v.target_A), 'A', C.green, 330) + card(440, 230, 330, 92, '每次都记录', '起始温度、栅压与栅阻') + card(440, 340, 330, 102, '短脉冲的作用', '减少自热，仍须核查温升');
      } else {
        b += text(440, 120, '同一关断间隔', 23, C.ink, 'start', 700) + axes(450, 275, 345, 100, '间隔时间', '电流 / 定性');
        b += line(450, 192, 795, 192, C.blue, 4) + text(800, 199, 'IL', 21, C.blue) + line(450, 271, 795, 271, C.green, 4) + text(800, 278, 'IDUT', 20, C.green);
        b += cursor(450 + 345 * u, 172, 280) + card(440, 340, 390, 102, '电感电流没有消失', '流经上侧二极管；下管通道关断');
      }
    } else if (mode === 'windows') {
      title = '两次脉冲，各自对应不同测量窗口'; const x = 140, w = 650;
      b += text(42, 155, 'VGS', 22) + text(42, 273, 'IL', 22) + text(42, 391, 'VDS', 22);
      b += rect(487, 90, 35, 350, C.sand, 'none', 0) + rect(581, 90, 35, 350, C.sky, 'none', 0);
      b += poly([[x, 169], [x + 70, 169], [x + 70, 112], [505, 112], [505, 169], [598, 169], [598, 112], [681, 112], [681, 169], [x + w, 169]], C.green);
      b += poly([[x, 296], [x + 70, 296], [505, 220], [598, 222], [681, 206], [x + w, 210]], C.blue);
      b += poly([[x, 340], [x + 70, 340], [x + 70, 411], [505, 411], [505, 340], [598, 340], [598, 411], [681, 411], [681, 340], [x + w, 340]], C.orange);
      b += text(310, 102, '建流', 20, C.green, 'middle') + text(491, 91, 'Eoff', 19, C.orange, 'middle') + text(614, 91, 'Eon', 19, C.blue, 'middle');
      b += text(330, 458, `${fmt(v.first_us)} µs 首脉冲`, 20, C.muted, 'middle') + text(550, 458, `${fmt(v.gap_us)} µs`, 20, C.muted, 'middle') + text(676, 458, `${fmt(v.second_us)} µs`, 20, C.muted, 'middle') + cursor(x + w * u, 95, 435);
      note = '时间轴为便于观察而分段展开，长度不按脉宽比例；事件窗口保持固定。';
    } else if (mode === 'build') {
      title = '恒电压与线性电感：电流逐渐建立'; const x = 110, y = 402, w = 580, h = 255;
      b += axes(x, y, w, h, '时间 / µs', 'IL / A') + poly([[x, y], [x + w, y - h]], C.green, 4) + line(x, y - h, x + w, y - h, C.line, 2, '5 5');
      b += text(x - 15, y + 7, '0', 20, C.muted, 'end') + text(x - 15, y - h + 7, fmt(v.target_A), 20, C.muted, 'end') + text(x + w, y + 30, fmt(v.first_us, 2), 20, C.muted, 'end');
      b += cursor(x + w * u, y - h - 5, y) + dot(x + w * u, y - h * u, C.orange, 7) + metric(708, 145, '当前回看', fmt(v.target_A * u, 1), 'A', C.green, 155) + text(708, 282, `${fmt(v.L_uH)} µH`, 22) + text(708, 322, `${fmt(v.bus_V)} V`, 22);
      note = '近似条件：初始电流为零，电感未饱和，电感电压近似恒定。';
    } else if (mode === 'segments') {
      title = '分段看电压：续流微降，再开通继续上升'; const values = v.currents_A || [0, 0, 0], x = 115, y = 413, w = 635, h = 260;
      const yy = a => y - h * (a - 90) / 20; const points = [[x, yy(values[0])], [430, yy(values[1])], [750, yy(values[2])]];
      b += axes(x, y, w, h, '分段时间（展开）', 'IL / A，纵轴局部放大');
      [90, 100, 110].forEach(a => { b += line(x, yy(a), x + w, yy(a), C.line, 1, '4 5') + text(x - 15, yy(a) + 7, a, 19, C.muted, 'end'); });
      b += poly(points, C.green, 4) + line(430, 138, 430, y, C.line, 2, '4 5');
      b += text(250, 110, `续流 ${fmt(v.gap_us)} µs / ${fmt(v.gap_V)} V`, 21, C.blue, 'middle') + text(615, 110, `第二脉冲 ${fmt(v.second_us)} µs / ${fmt(v.bus_V)} V`, 21, C.orange, 'middle');
      points.forEach((q, i) => { b += dot(q[0], q[1], C.green, 5) + text(q[0] + (i === 2 ? -8 : 7), q[1] - 17, `${fmt(values[i], 1)} A`, 21, C.green, i === 2 ? 'end' : 'start'); });
      const a = u < 0.5 ? 0 : 1, f = (u * 2) % 1, q = [points[a][0] + (points[a + 1][0] - points[a][0]) * f, points[a][1] + (points[a + 1][1] - points[a][1]) * f];
      if (u === 1) { q[0] = points[2][0]; q[1] = points[2][1]; } b += cursor(q[0], 137, y) + dot(q[0], q[1], C.orange, 7);
      note = '−0.8 V 是由原片0.2 A下降量反推的条件；图的两段横轴各自展开。';
    } else if (mode === 'inductor-choice') {
      title = '电感取舍：变化幅度与建流时间';
      b += axes(120, 410, 650, 270, '时间（定性）', '电流（定性）') + line(120, 165, 770, 165, C.line, 2, '6 5');
      b += poly([[120, 410], [355, 165]], C.orange, 4) + poly([[120, 410], [690, 165]], C.blue, 4) + text(315, 213, '较小 L', 23, C.orange) + text(550, 309, '较大 L', 23, C.blue);
      b += dot(120 + 235 * u, 410 - 245 * u, C.orange, 7) + dot(120 + 570 * u, 410 - 245 * u, C.blue, 7) + text(120, 111, '同一目标电流', 22) + text(770, 111, '仍须核查饱和与寄生', 21, C.muted, 'end');
    } else if (mode === 'decoupling') {
      title = '储能与快速回路：两个不同的任务';
      b += card(58, 139, 220, 190, '储能电容', '负责整组脉冲的能量预算', C.blue) + rect(525, 164, 279, 205, C.pale, C.green) + text(664, 197, '局部换流回路', 22, C.green, 'middle');
      b += line(278, 188, 525, 188, C.line, 4) + line(278, 318, 525, 318, C.line, 4) + text(401, 165, '连接也有寄生', 20, C.muted, 'middle');
      b += rect(555, 228, 83, 81, '#fff', C.green) + text(596, 261, '局部', 21, C.green, 'middle') + text(596, 288, '电容', 21, C.green, 'middle') + rect(695, 228, 82, 81, '#fff', C.green) + text(736, 276, 'DUT', 22, C.green, 'middle');
      b += poly([[596, 228], [596, 216], [736, 216], [736, 228]], C.green) + poly([[736, 309], [736, 338], [596, 338], [596, 309]], C.green) + flow([[596, 216], [736, 216], [736, 338], [596, 338], [596, 216]], p, C.orange, 6);
      b += text(450, 421, '容量够，不代表高频路径足够短', 24, C.ink, 'middle');
      note = '框图仅表示储能与局部回路分工，不是可直接接线的完整测试电路。';
    } else if (mode === 'bandwidth') {
      title = '带宽不足：尖峰变平，读数也可能变小'; const x = 100, y = 339, w = 440, h = 175;
      b += axes(x, y, w, h, '边沿局部时间', '总电流形状 / 示意');
      const g = t => Math.exp(-Math.pow((t - 0.48) / 0.048, 2));
      b += poly(series(t => 0.38 + 0.55 * g(t), x, y, w, h), C.green, 4) + poly(series(t => 0.38 + 0.10 * Math.exp(-Math.pow((t - 0.48) / 0.15, 2)), x, y, w, h), C.orange, 4) + cursor(x + w * u, 145, 345);
      b += text(120, 119, `总峰示例 ${fmt((v.peaks_A || [])[0])} → ${fmt((v.peaks_A || [])[1])} A`, 22, C.ink);
      b += text(590, 121, 'Eon / µJ', 22, C.ink, 'start', 700);
      const energies = [v.reference_uJ].concat(v.Eon_uJ || []), names = ['参考'].concat((v.bandwidth_MHz || []).map(a => `${a} MHz`));
      energies.forEach((a, i) => { const yy = 159 + i * 67; b += text(590, yy, names[i], 18, C.muted) + bar(590, yy + 11, 210, 16, a / v.reference_uJ, i ? C.blue : C.green) + text(825, yy + 24, fmt(a), 20, C.ink, 'end'); });
      note = '曲线仅示意滤波后的形状；能量读数来自原片，未复现其滤波器和原始数据。';
    } else if (mode === 'deskew') {
      title = '同一物理事件，测量错位改变相乘结果';
      (v.offset_ns || []).forEach((off, i) => { const x = 45 + i * 280, shift = off * 7, w = 230;
        b += rect(x, 110, 255, 320, '#fff') + text(x + 127, 145, `${off > 0 ? '+' : ''}${off} ns 测量偏移`, 21, i === 1 ? C.green : C.orange, 'middle');
        b += line(x + 22, 314, x + w, 314) + poly([[x + 22, 200], [x + 95, 200], [x + 140, 302], [x + w, 302]], C.blue, 3) + poly([[x + 22, 302], [x + 90 + shift, 302], [x + 142 + shift, 207], [x + w, 207]], C.green, 3);
        b += cursor(x + 22 + 208 * u, 183, 320) + text(x + 127, 361, `Eon ${fmt((v.Eon_uJ || [])[i])} µJ`, 25, C.ink, 'middle', 700) + text(x + 127, 397, i === 1 ? '参考状态' : '延迟示意', 20, C.muted, 'middle');
      });
      note = '蓝：电压，绿：电流。只校正测量链延迟；不强行消除器件的真实时序。';
    } else if (mode === 'recovery-peak') {
      title = '总峰、负载基线与额外电流分开标'; const x = 100, y = 405, w = 680, h = 250, total = n(v.total_A), load = n(v.load_A), max = total * 1.1;
      const f = t => (load + (total - load) * gateBump(t)) / max;
      b += axes(x, y, w, h, '第二次开通附近', 'IDUT / A') + line(x, y - h * load / max, x + w, y - h * load / max, C.blue, 2, '6 5') + poly(series(f, x, y, w, h), C.green, 4);
      b += text(108, y - h * load / max + 32, `负载 ${fmt(load)} A`, 21, C.blue) + text(425, 128, `总峰 ${fmt(total)} A`, 24, C.green, 'middle') + text(620, 186, `额外约 ${fmt(v.extra_A)} A`, 22, C.orange) + cursor(x + w * u, 146, y) + dot(x + w * u, y - h * f(u), C.orange, 7);
      b += text(450, 457, '额外部分还可能含电容位移电流，不能直接等同 Irr', 21, C.ink, 'middle');
    } else if (mode === 'comparison') {
      title = '比较测试平台之前，先检查条件'; const es = v.Eoff_uJ || [], max = Math.max(...es, 1);
      es.forEach((e, i) => { const y = 165 + i * 115; b += text(90, y, i ? '平台 B' : '平台 A', 22) + bar(215, y - 25, 520, 38, e / max, i ? C.orange : C.green) + text(775, y + 3, `${fmt(e)} µJ`, 23, C.ink, 'end'); });
      b += cursor(215 + 520 * u, 128, 322) + card(85, 363, 725, 92, '固定比较条件', '同一 Eoff 定义、工况、探头和积分窗口');
      note = '原片为仿真示意；不能把其他场景的 Eon 误差直接相加解释这组 Eoff。';
    } else b = labelsFallback(lesson, p);
    return base(title, b, note);
  }

  function soa(lesson, p) {
    const v = lesson.visual && lesson.visual.values || {}, mode = lesson.visual && lesson.visual.mode || v.mode || '', u = replay(p); let b = '', title = 'SOA：电压、电流、时间与工作条件', note = '原理示意；不替代具体器件的 SOA 与温度条件。';
    if (mode === 'ohmic' || mode === 'linear') {
      const ohmic = mode === 'ohmic'; title = ohmic ? '充分导通：小压降下的导通损耗' : '线性限流：同样电流，漏源电压很高';
      b += rect(98, 150, 270, 235, ohmic ? C.pale : C.sand, ohmic ? C.green : C.orange) + text(233, 190, ohmic ? '充分导通示意' : '限流工作示意', 23, C.ink, 'middle');
      b += line(70, 270, 145, 270, C.green, 4) + rect(145, 247, 177, 46, '#fff', ohmic ? C.green : C.orange, 3) + text(233, 278, ohmic ? `${fmt(v.R_mohm)} mΩ` : '部分开启', 22, C.ink, 'middle') + line(322, 270, 415, 270, C.green, 4) + flow([[70, 270], [415, 270]], p, C.green, 5);
      b += text(232, 342, `电流 ${fmt(v.current_A)} A`, 25, C.green, 'middle') + metric(486, 136, '实际漏源电压', fmt(v.Vds_V, 3), 'V', C.blue, 310) + metric(486, 260, ohmic ? '导通功率' : '启动附近峰值', fmt(v.power_W), 'W', ohmic ? C.green : C.orange, 310);
      b += text(450, 438, ohmic ? '只在当前温度与栅压下，使用这一个导通电阻' : '这是起始功率；充电过程中不会一直保持此值', 22, C.ink, 'middle');
    } else if (mode === 'charge-time') {
      title = '恒流充电：输出升高，MOS 压降降低'; const x = 110, y = 398, w = 530, h = 235;
      b += axes(x, y, w, h, '时间 / ms', '电压 / V') + poly([[x, y], [x + w, y - h]], C.green, 4) + poly([[x, y - h], [x + w, y]], C.blue, 4) + cursor(x + w * u, y - h, y);
      b += text(x - 15, y + 5, '0', 19, C.muted, 'end') + text(x - 15, y - h + 6, fmt(v.Vin_V), 19, C.muted, 'end') + text(x + w, y + 30, fmt(v.time_ms), 19, C.muted, 'end');
      b += dot(x + w * u, y - h * u, C.green, 6) + dot(x + w * u, y - h * (1 - u), C.blue, 6) + text(260, 142, 'Vout', 22, C.green) + text(510, 360, 'VDS', 22, C.blue);
      b += metric(675, 148, '净充电电流', fmt(v.current_A), 'A', C.green, 190) + text(685, 293, `${fmt(v.C_uF)} µF`, 23) + text(685, 336, `${fmt(v.time_ms)} ms`, 23) + text(685, 376, '初始 0 V', 20, C.muted);
      note = '恒流、稳定输入、无额外负载的理想充电；光标是同一过程的回看。';
    } else if (mode === 'boundaries') {
      title = 'SOA 的不同边界，不能压成一条热公式';
      b += axes(100, 418, 455, 282, 'VDS（对数示意）', 'ID（对数示意）');
      b += path('M120 395 L245 177 L365 177 L465 265 L510 356 L510 418 L120 418 Z', C.line, 1, C.pale);
      const boundaries = [ { pts: [[120, 395], [245, 177]], color: C.green, label: '导通电阻边界' }, { pts: [[245, 177], [365, 177]], color: C.blue, label: '电流 / 封装边界' }, { pts: [[365, 177], [465, 265]], color: C.orange, label: '脉宽与热限制' }, { pts: [[465, 265], [510, 356]], color: '#985b45', label: '热失稳限制' }, { pts: [[510, 356], [510, 418]], color: C.muted, label: '耐压边界' } ];
      boundaries.forEach((z, i) => { b += poly(z.pts, z.color, 4) + dot(z.pts[0][0] + (z.pts[1][0] - z.pts[0][0]) * u, z.pts[0][1] + (z.pts[1][1] - z.pts[0][1]) * u, z.color, 5) + line(607, 155 + i * 57, 642, 155 + i * 57, z.color, 4) + text(657, 162 + i * 57, z.label, 20, C.ink); });
      note = '边界形状仅为分类示意，没有任何具体器件的安全数值；必须读真实 SOA。';
    } else if (mode === 'thermal-limit') {
      title = '恒功率矩形：只先计算一项热限制'; const budget = n(v.Tmax_C) - n(v.Tcase_C);
      b += metric(50, 120, '结壳温差预算', fmt(budget), 'K', C.orange, 250) + metric(325, 120, '该脉宽的 Zth', fmt(v.Zth_K_W), 'K/W', C.blue, 250) + metric(600, 120, '均匀热功率限制', fmt(v.power_W, 1), 'W', C.green, 250);
      b += text(312, 185, '÷', 30, C.ink, 'middle') + text(588, 185, '=', 30, C.ink, 'middle');
      b += axes(110, 419, 640, 136, '矩形脉冲时间（示意）', '恒功率') + path('M150 419 L150 310 L700 310 L700 419', C.green, 3, C.pale) + cursor(150 + 550 * u, 286, 419) + text(425, 351, '这一条限制之外，仍有其他 SOA 边界', 21, C.ink, 'middle');
      note = '固定壳温、恒功率、匹配脉宽；这个结果不能直接应用于变功率缓启动。';
    } else if (mode === 'trajectory') {
      title = '缓启动应力沿轨迹移动，不是峰值恒定点'; const x = 100, y = 410, w = 650, yy = 224;
      b += axes(x, y, w, 265, 'VDS / V（线性坐标）', 'ID / A') + line(x, yy, x + w, yy, C.green, 4) + arrow(x + w - 80, yy - 40, x + 100, yy - 40, C.green);
      b += text(x - 15, yy + 7, fmt(v.current_A), 22, C.green, 'end') + text(x, y + 32, fmt(v.Vds_end_V), 20, C.muted) + text(x + w, y + 32, fmt(v.Vds_start_V), 20, C.muted, 'end');
      b += rect(x + w - 30, yy - 30, 60, 60, 'none', C.orange, 0, 'stroke-dasharray="6 4"') + dot(x + w * (1 - u), yy, C.green, 9) + text(450, 105, `${fmt(v.duration_ms)} ms 过程：从右向左充电`, 23, C.ink, 'middle');
      b += card(180, 305, 525, 78, '峰值包络与真实轨迹不同', '本图不绘制器件安全边界');
      note = '此处是线性坐标的工作轨迹，不是数据表对数 SOA；往返光点表示回看。';
    } else if (mode === 'derating') {
      title = '壳温升高：热功率预算缩小，不能整图缩放'; const ts = v.Tcase_C || [], room = ts.map(t => n(v.Tmax_C) - t), max = Math.max(...room, 1);
      room.forEach((r, i) => { const yy = 160 + i * 106; b += text(70, yy, `${fmt(ts[i])}°C 壳温`, 22) + bar(248, yy - 30, 470, 38, r / max, i ? C.orange : C.green) + text(775, yy, `${fmt(r)} K`, 23, C.ink, 'end'); });
      b += cursor(248 + 470 * u, 119, 293) + metric(95, 342, '热功率比例', fmt(v.power_factor * 100, 1), '%', C.orange, 295) + card(432, 342, 365, 100, '其他边界另查', '耐压、封装电流不能照抄比例');
    } else if (mode === 'current-reduction') {
      title = '减小电流：功率降低，持续时间延长'; const times = v.times_ms || [], peaks = v.peaks_W || [], currents = v.currents_A || [], x = 110, y = 405, w = 640, h = 245, tmax = Math.max(...times, 1), pmax = Math.max(...peaks, 1);
      b += axes(x, y, w, h, '时间 / ms', 'P / W');
      times.forEach((t, i) => { const color = i ? C.blue : C.orange, ww = w * t / tmax, hh = h * peaks[i] / pmax; b += path(`M${x} ${y} L${x} ${y - hh} L${x + ww} ${y} Z`, color, 3, i ? C.sky : C.sand, 'fill-opacity="0.6"') + dot(x + ww * u, y - hh * (1 - u), color, 6) + text(x + ww, y + 30, fmt(t), 20, color, 'end') + text(760, 178 + i * 74, `${fmt(currents[i])} A`, 24, color) + text(760, 209 + i * 74, `${fmt(peaks[i])} W`, 19, color); });
      note = '同一坐标比较峰值与持续时间；减流后仍须用对应脉宽重新检查热响应与 SOA。';
    } else if (mode === 'checklist') {
      title = '从实际波形，走到有条件的结论';
      const items = [['取得波形', '电压、电流与初始状态'], ['求热响应', '保留完整功率历史'], ['检查 SOA', '真实器件与温度条件'], ['留下依据', '参数来源、重复周期与裕量']];
      items.forEach((it, i) => { const x = 53 + i % 2 * 424, y = 125 + Math.floor(i / 2) * 170; b += card(x, y, 370, 130, it[0], it[1], [C.green, C.blue, C.orange, C.green][i]); b += line(x + 18, y + 109, x + 18 + 330 * (0.2 + 0.8 * (1 + Math.cos(2 * Math.PI * (phase(p) - i / 4))) / 2), y + 109, C.green, 4); });
    } else b = labelsFallback(lesson, p);
    return base(title, b, note);
  }

  function energy(lesson, p) {
    const v = lesson.visual && lesson.visual.values || {}, mode = lesson.visual && lesson.visual.mode || v.kindDetail || v.mode || '', u = replay(p); let b = '', title = '能量：看正确的量与时间范围', note = '示意算例；光标和着色往返表示回看，不表示能量倒流。';
    if (mode === 'inductor') {
      title = '电感储能随电流平方增加'; const x = 110, y = 410, w = 540, h = 255;
      b += axes(x, y, w, h, '电流 I / A', '储能 EL / J') + poly(series(t => t * t, x, y, w, h), C.green, 4) + cursor(x + w * u, y - h, y) + dot(x + w * u, y - h * u * u, C.orange, 7);
      b += text(x + w, y + 30, fmt(v.current_A), 20, C.muted, 'end') + text(x - 16, y - h + 7, fmt(v.energy_J), 20, C.muted, 'end') + metric(683, 137, '回看电流', fmt(v.current_A * u, 1), 'A', C.blue, 180) + metric(683, 260, '对应储能', fmt(v.energy_J * u * u, 4), 'J', C.green, 180) + text(450, 463, `L = ${fmt(v.L_uH)} µH；储能不等于整组测试损耗`, 21, C.ink, 'middle');
    } else if (mode === 'bus-capacitor') {
      title = '容量计算要覆盖整组脉冲的净供能'; const es = v.energy_J || [], cs = v.cap_mF || [], max = Math.max(...es, 1e-9);
      es.forEach((e, i) => { const yy = 142 + i * 145; b += text(65, yy, i ? '整组示例' : '首脉冲', 22, C.ink, 'start', 700) + bar(230, yy - 26, 367, 31, e / max, i ? C.orange : C.green) + text(230, yy + 38, `${fmt(e, 5)} J 净供能`, 23, i ? C.orange : C.green) + metric(638, yy - 35, '理想所需容量', fmt(cs[i], 3), 'mF', i ? C.orange : C.green, 218); });
      b += text(450, 454, `${fmt(v.V0_V)} → ${fmt(v.V0_V - v.drop_V)} V，尚未计损耗、容差与电源补能`, 22, C.ink, 'middle') + cursor(230 + 367 * u, 98, 354);
    } else if (mode === 'instant-power') {
      title = '瞬时功率：同一时刻的电压与电流相乘';
      b += metric(75, 125, '同一时刻 VDS', fmt(v.voltage_V), 'V', C.blue, 285) + metric(75, 282, '同一时刻 ID', fmt(v.current_A), 'A', C.green, 285) + metric(573, 200, '该时刻功率', fmt(v.power_W), 'W', C.orange, 255);
      b += arrow(378, 180, 550, 245, C.blue) + arrow(378, 333, 550, 273, C.green) + flow([[378, 180], [550, 245]], p, C.blue, 2) + flow([[378, 333], [550, 273]], p, C.green, 2) + text(455, 269, '×', 40, C.ink, 'middle');
      b += text(450, 444, '不要把不同时刻的两个峰值直接相乘', 23, C.ink, 'middle');
      note = '此处仅为一个示意采样点，不是原片波形中的已验证测量值。';
    } else if (mode === 'switching-integral') {
      title = '功率面积：一次事件的开关能量'; const x = 120, y = 407, w = 600, h = 220;
      b += axes(x, y, w + 50, h + 15, '时间 / ns', 'p / W') + path(`M${x} ${y} L${x} ${y - h} L${x + w} ${y - h} L${x + w} ${y} Z`, C.green, 3, C.pale) + rect(x, y - h, w * u, h, '#d2e8d8', 'none', 0) + line(x, y - h, x + w, y - h, C.green, 3) + cursor(x + w * u, 164, y);
      b += text(x - 18, y - h + 7, fmt(v.example_power_W), 20, C.muted, 'end') + text(x, y + 30, 'ta = 0', 20, C.muted) + text(x + w, y + 30, `tb = ${fmt(v.example_width_ns)}`, 20, C.muted, 'end') + text(450, 124, `完整事件 ${fmt(v.example_energy_uJ)} µJ`, 26, C.green, 'middle', 700) + text(450, 317, `累计回看面积 ${fmt(v.example_energy_uJ * u, 2)} µJ`, 24, C.ink, 'middle');
      note = '矩形功率仅作积分入门示意；真实开关能量需原始曲线、校准和明确积分窗口。';
    } else if (mode === 'recovery-charge') {
      title = 'Qrr：二极管反向恢复电流的面积'; const x = 120, y = 414, w = 620, h = 240, f = t => t < 0.5 ? 2 * t : 2 * (1 - t);
      b += axes(x, y, w, h, '恢复区间 / ns', '|反向恢复电流| / A') + path(`M${x} ${y} L${x + w / 2} ${y - h} L${x + w} ${y} Z`, C.blue, 3, C.sky);
      const q = [[x, y]]; if (u > 0.5) q.push([x + w / 2, y - h]); q.push([x + w * u, y - h * f(u)], [x + w * u, y]);
      b += path(q.map((a, i) => `${i ? 'L' : 'M'}${a[0]} ${a[1]}`).join(' ') + ' Z', 'none', 0, '#cadbf5') + cursor(x + w * u, y - h - 10, y) + dot(x + w * u, y - h * f(u), C.orange, 7);
      b += text(x - 15, y - h + 7, fmt(v.peak_A), 20, C.muted, 'end') + text(x + w, y + 30, fmt(v.width_ns), 20, C.muted, 'end') + text(450, 116, `三角形示例面积 ${fmt(v.charge_nC)} nC`, 25, C.blue, 'middle', 700) + text(450, 367, '不包括负载电流基线', 23, C.ink, 'middle');
      note = '图显示反向电流的幅值，非总 DUT 电流；实际 Qrr 按规定的恢复边界积分。';
    } else if (mode === 'startup-energy') {
      title = '相同总能量，可以有不同功率与时间分布'; const x = 110, y = 412;
      b += axes(x, y, 660, 270, '时间（形状未标定）', '功率（形状未标定）') + path(`M${x} ${y} L${x} 172 L330 ${y} Z`, C.orange, 3, C.sand, 'fill-opacity="0.7"') + path(`M${x} ${y} L${x} 332 L770 ${y} Z`, C.blue, 3, C.sky, 'fill-opacity="0.65"');
      b += dot(x + 220 * u, y - 240 * (1 - u), C.orange, 6) + dot(x + 660 * u, y - 80 * (1 - u), C.blue, 6) + text(238, 169, '短而高', 23, C.orange) + text(607, 329, '长而低', 23, C.blue);
      b += text(450, 111, `理想充电耗散均为 ${fmt(v.energy_J, 4)} J`, 25, C.ink, 'middle', 700) + text(450, 462, `${fmt(v.C_uF)} µF，初始 0 V，充至 ${fmt(v.Vin_V)} V`, 21, C.muted, 'middle');
      note = '两块面积按相同几何面积绘制，只比较分布；能量相同不表示实际峰值结温相同。';
    } else b = labelsFallback(lesson, p);
    return base(title, b, note);
  }

  function gateCircuit(p, options = {}) {
    const color = options.color || C.green; let b = '';
    b += rect(55, 264, 112, 64, C.sky) + text(111, 303, '关断驱动', 19, C.blue, 'middle');
    b += line(167, 296, 202, 296, color, 3) + rect(202, 282, 72, 28, '#fff', color, 2) + line(274, 296, 363, 296, color, 3) + text(238, 264, options.resistor || 'Roff', 20, color, 'middle');
    b += line(363, 256, 363, 350, C.ink, 3) + line(380, 266, 380, 340, C.ink, 4) + line(380, 273, 435, 273, C.ink, 3) + line(435, 273, 435, 143, C.ink, 3) + line(380, 331, 435, 331, C.ink, 3) + line(435, 331, 435, 420, C.ink, 3);
    b += line(343, 296, 343, 189, C.orange, 2) + line(343, 189, 365, 189, C.orange, 2) + line(365, 174, 365, 204, C.orange, 3) + line(378, 174, 378, 204, C.orange, 3) + line(378, 189, 435, 189, C.orange, 2) + text(365, 157, options.cap || 'Cgd', 22, C.orange, 'middle');
    b += line(111, 328, 111, 420, color, 2) + line(111, 420, 435, 420, color, 2) + text(269, 451, '回到本地源极 / 关断电源', 19, C.muted, 'middle') + text(450, 139, 'D', 20, C.ink) + text(451, 422, 'S', 20, C.ink) + text(345, 327, 'G', 20, C.ink);
    if (options.clamp) {
      b += line(316, 296, 316, 352, C.green, 3) + rect(289, 352, 54, 37, C.pale, C.green, 3) + line(316, 389, 316, 420, C.green, 3) + text(273, 378, '钳位', 20, C.green, 'end') + flow([[435, 189], [378, 189]], p, C.orange, 2) + flow([[365, 189], [343, 189], [343, 296], [316, 296], [316, 420], [435, 420]], p, C.green, 4);
    } else b += flow([[435, 189], [378, 189]], p, C.orange, 2) + flow([[365, 189], [343, 189], [343, 296], [167, 296], [111, 296], [111, 420], [435, 420]], p, color, 5);
    return b;
  }
  function miller(lesson, p) {
    const v = lesson.visual && lesson.visual.values || {}, mode = lesson.visual && lesson.visual.mode || v.mode || '', u = replay(p); let b = '', title = '米勒耦合：看注入、泄放与门压余量', note = '原理示意，非原始实测；光标往返只表示回看同一过程。';
    if (mode === 'symptom' || mode === 'deadtime') {
      const dead = mode === 'deadtime'; title = dead ? '死区之后，对侧边沿仍可引起栅压抬升' : '命令关断，不等于实际栅压始终为零';
      const x = 190, w = 610, rows = dead ? [145, 235, 325, 415] : [160, 285, 410], names = dead ? ['下管命令', '上管命令', '开关节点', '下管 VGS'] : ['关断命令', '开关节点', '实际 VGS'];
      if (dead) b += rect(x + w * 0.22, 105, w * 0.22, 335, C.sand, 'none', 0) + text(x + w * 0.33, 99, '死区', 21, C.orange, 'middle');
      rows.forEach((yy, i) => { b += text(45, yy - 10, names[i], 21) + line(x, yy, x + w, yy, C.line); });
      if (dead) {
        b += poly([[x, 104], [x + w * 0.22, 104], [x + w * 0.22, 145], [x + w, 145]], C.green) + poly([[x, 235], [x + w * 0.44, 235], [x + w * 0.44, 194], [x + w, 194]], C.blue);
        b += poly(series(t => t < 0.44 ? 0 : t < 0.55 ? (t - 0.44) / 0.11 : 1, x, 325, w, 50), C.orange) + poly(series(t => 0.12 + 0.9 * Math.exp(-Math.pow((t - 0.52) / 0.045, 2)), x, 415, w, 45), C.green);
      } else {
        b += line(x, rows[0], x + w, rows[0], C.green, 3) + poly(series(voltageRamp, x, rows[1], w, 63), C.blue) + poly(series(gateBump, x, rows[2], w, 70), C.orange);
        b += text(800, 108, '当前无开通信号', 21, C.green, 'end');
      }
      b += cursor(x + w * u, 109, 437); note = '命令重叠与寄生抬升分别检查；本图只示意关联，不据栅压尖峰直接判断损坏。';
    } else if (mode === 'coupling' || mode === 'current' || mode === 'resistive-bump' || mode === 'clamp') {
      const clamp = mode === 'clamp'; title = { coupling: 'Cgd 位移电流：注入与泄放同时存在', current: '小电容配快边沿：产生瞬时耦合电流', 'resistive-bump': '有限下拉阻抗，把耦合电流变成压降', clamp: '满足关断条件后，用短低阻钳位路径吸收电流' }[mode];
      b += gateCircuit(p, { clamp, cap: mode === 'coupling' || clamp ? 'Cgd' : `${fmt(v.Cgd_pF)} pF`, resistor: mode === 'resistive-bump' ? `${fmt(v.Roff_ohm)} Ω 总阻抗` : 'Roff' });
      if (mode === 'current') b += metric(545, 112, '漏压边沿斜率', fmt(v.slope_V_ns), 'V/ns', C.blue, 282) + metric(545, 241, '瞬时位移电流', fmt(v.Miller_current_A), 'A', C.orange, 282) + words(545, 389, '栅压近似不动、Cgd线性化时的估算', 13, 21);
      else if (mode === 'resistive-bump') b += metric(545, 112, '耦合电流', fmt(v.Miller_current_A), 'A', C.orange, 282) + metric(545, 241, '电阻主导抬升', fmt(v.resistive_bump_V), 'V', C.green, 282) + words(545, 389, '只算量级；实际还受电容、电感和驱动影响', 13, 21);
      else if (clamp) b += card(542, 112, 295, 140, '使能有条件', '驱动关断且满足钳位触发门限') + card(542, 281, 295, 144, '能力与连接', '有限吸收电流；靠近栅极与本地回流');
      else b += card(540, 113, 295, 140, '漏栅电压变化', '通过电容耦合，不是击穿栅氧', C.orange) + card(540, 282, 295, 142, '门端响应', '一部分储荷，一部分经下拉泄放');
      note = clamp ? '钳位不能在正常开通时短接栅极；触发门限和电流能力以具体驱动器为准。' : '光点表示回路的位移电流关系，不表示电子穿过完好绝缘层。';
    } else if (mode === 'threshold') {
      title = '门限是有条件的低电流指标，不是“完全打开”'; const x = 110, y = 407, w = 630, h = 230;
      b += axes(x, y, w, h, '尖峰局部时间', 'VGS / 定性') + rect(x, 232, w, 50, C.sand, 'none', 0) + line(x, 282, x + w, 282, C.orange, 2, '5 5') + line(x, 232, x + w, 232, C.blue, 2, '5 5') + poly(series(t => 0.07 + 0.8 * gateBump(t), x, y, w, h), C.green, 4);
      b += text(116, 221, '门限随器件、温度和测试条件变化', 21, C.muted) + text(744, 287, '热态可能降低', 18, C.orange, 'end') + cursor(x + w * u, 161, y) + dot(x + w * u, y - h * (0.07 + 0.8 * gateBump(u)), C.orange, 6) + text(450, 460, '是否出现明显交叉电流，仍需实际电流证据', 22, C.ink, 'middle');
      note = '定性门限带，不代表某器件的真实数值；跨过门限不等于已达到额定电流。';
    } else if (mode === 'negative-bias') {
      title = '负偏置降低起点，但不能替代器件栅压限制'; const x = 120, y = 409, w = 600, h = 274, offs = v.Voff_V || [], peaks = v.Vgs_peak_V || [], yy = a => y - h * (a + 5) / 9;
      b += axes(x, y, w, h, '尖峰局部时间', 'VGS / V'); [-4, 0].forEach(a => { b += line(x, yy(a), x + w, yy(a), C.line, 2, '5 5') + text(x - 15, yy(a) + 6, a, 20, C.muted, 'end'); });
      offs.forEach((off, i) => { const f = t => yy(off + (peaks[i] - off) * gateBump(t)), color = i ? C.blue : C.orange; b += poly(Array.from({ length: 101 }, (_, j) => [x + w * j / 100, f(j / 100)]), color, 4) + dot(x + w * u, f(u), color, 6) + text(735, f(0.48) + 6, `${fmt(peaks[i])} V`, 22, color); });
      b += cursor(x + w * u, 129, 425) + text(450, 108, '比较相同抬升的算术示意', 22, C.ink, 'middle');
      note = '−4 V 不是通用推荐设置；真实偏置会影响动态参数，正负栅压含振铃均须核查。';
    } else if (mode === 'split-resistor') {
      title = '对侧控边沿，受扰侧强下拉：两处作用不同';
      b += card(60, 117, 350, 120, '对侧管 Rg,on', '影响本次开通边沿与注入量', C.orange) + card(60, 311, 350, 120, '受扰管 Rg,off', '影响耦合电流的泄放阻抗', C.green);
      b += axes(480, 220, 325, 86, '同一电压变化 / 示意', '对侧漏压边沿') + poly([[480, 220], [580, 220], [610, 140], [805, 140]], C.orange, 3) + poly([[480, 220], [550, 220], [665, 140], [805, 140]], C.blue, 3);
      b += axes(480, 417, 325, 90, '同一扰动 / 示意', '受扰 VGS 抬升') + poly(series(t => 0.85 * gateBump(t), 480, 417, 325, 90), C.orange, 3) + poly(series(t => 0.38 * gateBump(t), 480, 417, 325, 90), C.green, 3) + cursor(480 + 325 * u, 125, 435);
      note = '曲线只比较作用方向；栅阻不是越大或越小越好，还须检查损耗、振铃与驱动能力。';
    } else if (mode === 'capacitive-divider') {
      title = '快边沿极限：更大总电容，分到更小电压'; const peaks = v.bump_V || [], exts = v.Cext_pF || [], max = Math.max(...peaks, 1);
      exts.forEach((cap, i) => { const x = 56 + i * 424; b += rect(x, 116, 365, 325, '#fff') + text(x + 182, 152, `Cext = ${fmt(cap)} pF`, 22, i ? C.blue : C.green, 'middle') + text(x + 182, 187, `内建 Cgs = ${fmt(v.Cgs_internal_pF)} pF`, 20, C.muted, 'middle');
        b += line(x + 60, 380, x + 310, 380) + line(x + 60, 380, x + 60, 220) + poly(series(t => peaks[i] / max * voltageRamp(t), x + 60, 380, 250, 140), i ? C.blue : C.green, 4) + cursor(x + 60 + 250 * u, 220, 387) + text(x + 182, 418, `ΔVGS ≈ ${fmt(peaks[i])} V`, 24, i ? C.blue : C.green, 'middle', 700); });
      b += text(450, 94, `相同漏压跃变 ${fmt(v.Vds_step_V)} V，Cgd = ${fmt(v.Cgd_pF)} pF`, 21, C.ink, 'middle');
      note = '这是快边沿、来不及电阻泄放的线性电容极限；图中电压是增量，不是绝对栅压。';
    } else if (mode === 'added-charge') {
      title = '外加电容也要正常充放电：新增驱动电荷'; const x = 110, y = 412, w = 520, h = 250;
      b += axes(x, y, w, h, '栅压摆幅 / V', '额外电荷 / nC') + poly([[x, y], [x + w, y - h]], C.green, 4) + cursor(x + w * u, y - h, y) + dot(x + w * u, y - h * u, C.orange, 7);
      b += text(x + w, y + 30, fmt(v.Von_V - v.Voff_V), 20, C.muted, 'end') + text(x - 15, y - h + 6, fmt(v.extra_Q_nC), 20, C.muted, 'end') + metric(677, 145, '外加电容', fmt(v.Cext_pF), 'pF', C.blue, 185) + metric(677, 275, '完整摆幅电荷', fmt(v.extra_Q_nC), 'nC', C.green, 185);
      note = '这里只计算新增线性电容的电荷，不是整个器件 Qg；需要额外驱动电流和时间。';
    } else if (mode === 'rc-response') {
      title = '有限边沿时间：电阻泄放与电容储荷同时存在'; const x = 115, y = 410, w = 580, h = 240, top = n(v.resistive_bump_V), f = t => 1 - Math.exp(-n(v.rise_ns) * t / n(v.tau_ns, 1));
      b += axes(x, y, w, h, '边沿时间 / ns', '栅压增量 / V') + line(x, y - h, x + w, y - h, C.line, 2, '5 5') + poly(series(f, x, y, w, h), C.green, 4) + cursor(x + w * u, y - h, y) + dot(x + w * u, y - h * f(u), C.orange, 7);
      b += text(x - 15, y - h + 6, fmt(top), 20, C.muted, 'end') + text(x + w, y + 30, fmt(v.rise_ns), 20, C.muted, 'end') + text(120, 124, '虚线：电阻主导的渐近值', 21, C.muted) + metric(718, 188, '边沿结束', fmt(v.bump_V, 2), 'V', C.green, 145) + text(718, 327, `τ = ${fmt(v.tau_ns)} ns`, 20, C.blue);
      note = '线性 RC 教学模型，固定源极且忽略电感、器件非线性；不能当真实器件预测。';
    } else if (mode === 'layout') {
      title = '栅极去线与本地源极回线，共同构成闭环';
      [false, true].forEach((small, i) => { const x = 53 + i * 425; b += rect(x, 116, 368, 325, '#fff') + text(x + 184, 155, small ? '紧凑闭环' : '只缩一根线仍不够', 23, small ? C.green : C.orange, 'middle');
        b += rect(x + 37, 247, 80, 65, C.sky) + text(x + 77, 287, '驱动', 21, C.blue, 'middle') + rect(x + 256, 247, 75, 65, C.pale) + text(x + 293, 287, 'MOS', 21, C.green, 'middle');
        const pts = small ? [[x + 117, 262], [x + 256, 262], [x + 256, 297], [x + 117, 297], [x + 117, 262]] : [[x + 117, 262], [x + 256, 262], [x + 256, 371], [x + 117, 371], [x + 117, 262]];
        b += poly(pts, small ? C.green : C.orange, 3) + flow(pts, p, small ? C.green : C.orange, 5) + text(x + 185, 238, '栅线', 20, C.muted, 'middle') + text(x + 185, small ? 338 : 411, '源极回线', 20, C.muted, 'middle'); });
      note = '形状只说明回路面积，不据图形大小虚构 nH 值；完整设计还须核查阻尼与振铃。';
    } else if (mode === 'capacitance-ratio') {
      title = '电容比是线索：先匹配测量条件'; const ratio = n(v.ratio);
      b += text(75, 149, 'Crss = Cgd', 24, C.orange) + bar(270, 124, 500, 31, ratio, C.orange) + text(795, 149, `${fmt(v.Crss_pF)} pF`, 21, C.orange, 'end');
      b += text(75, 252, 'Ciss', 24, C.blue) + bar(270, 227, 500, 31, 1, C.blue) + text(795, 288, `${fmt(v.Ciss_pF)} pF`, 21, C.blue, 'end');
      b += metric(80, 334, '同条件比值', fmt(ratio * 100, 2), '%', C.green, 270) + card(395, 334, 410, 106, '比较前核对', '偏压、频率、温度与下拉回路') + cursor(270 + 500 * u, 105, 266);
      note = 'Ciss 是内建 Cgs 与 Cgd 之和；单点比值不等于整机抗扰保证。';
    } else if (mode === 'checklist') {
      title = '一条因果链，把措施接到原因上'; const nodes = [['对侧边沿', '控制开通速度'], ['Cgd 注入', '匹配器件与偏压'], ['下拉回路', '钳位、栅阻与布局'], ['门限余量', '合理偏置并验证']];
      nodes.forEach((it, i) => { const x = 40 + i * 215; b += card(x, 150, 195, 188, it[0], it[1], i % 2 ? C.blue : C.green); if (i < 3) b += arrow(x + 197, 245, x + 213, 245, C.orange, 2); b += bar(x + 18, 316, 157, 5, (1 + Math.cos(2 * Math.PI * (phase(p) - i / 4))) / 2, C.orange); });
      b += text(450, 417, '用实际 VGS 与电流，核对相关最差电压、负载和温度', 22, C.ink, 'middle');
    } else b = labelsFallback(lesson, p);
    return base(title, b, note);
  }
  H.doublepulse = doublepulse;
  H.soa = soa;
  H.miller = miller;
  H.energy = energy;
}());
