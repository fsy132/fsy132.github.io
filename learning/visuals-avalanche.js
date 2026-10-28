/* Original silent avalanche diagrams. Each lesson has its own fixed scene.
 * The host supplies the phase of an eight-second loop. A reversing cursor is
 * explicitly a replay cursor; it never means that heat or energy flows back.
 */
(function () {
  'use strict';
  const H = window.HardwareLessonVisuals = window.HardwareLessonVisuals || {};
  const C = { ink: '#18342f', green: '#276850', blue: '#386ac2', orange: '#c77c25', muted: '#657871', line: '#cbd9d2', grid: '#f0f4f1', pale: '#edf5ef', sky: '#edf2fa', sand: '#fbf2e4' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  const num = (v, fallback = 0) => v != null && Number.isFinite(Number(v)) ? Number(v) : fallback;
  const fmt = (v, places = 2) => v != null && Number.isFinite(Number(v)) ? String(Number(Number(v).toFixed(places))) : '—';
  const phase = p => ((num(p) % 1) + 1) % 1;
  const replay = p => (1 - Math.cos(2 * Math.PI * phase(p))) / 2;
  const values = lesson => lesson.visual && lesson.visual.values || {};
  const text = (x, y, s, size = 22, color = C.ink, anchor = 'start', weight = 400) => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`;
  const line = (x1, y1, x2, y2, color = C.line, width = 2, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const path = (d, color = C.green, width = 3, fill = 'none', extra = '') => `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const poly = (points, color = C.green, width = 3) => path(points.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(' '), color, width);
  const rect = (x, y, w, h, fill = '#fff', stroke = C.line, r = 9) => `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
  const dot = (x, y, color = C.orange, r = 6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  const clamp = x => Math.max(0, Math.min(1, num(x)));
  function wrap(s, max) {
    let row = '', length = 0; const out = [];
    for (const c of String(s)) { const w = /[\x00-\xff]/.test(c) ? 0.56 : 1; if (row && length + w > max) { out.push(row); row = ''; length = 0; } row += c; length += w; }
    if (row) out.push(row); return out;
  }
  const words = (x, y, s, max = 18, size = 21, color = C.ink, gap = 29) => wrap(s, max).map((r, i) => text(x, y + i * gap, r, size, color)).join('');
  function base(title, body, note = '原理示意，非实测或安全判据；往返光标仅表示回看。') {
    let grid = ''; for (let x = 40; x < 900; x += 40) grid += line(x, 75, x, 468, C.grid, 1); for (let y = 90; y < 468; y += 40) grid += line(30, y, 870, y, C.grid, 1);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540" role="img" aria-label="${esc(title)}" font-family="Microsoft YaHei, PingFang SC, sans-serif"><title>${esc(title)}</title><rect width="900" height="540" fill="#fff"/>${grid}${text(36, 43, title, 26, C.ink, 'start', 700)}${line(36, 64, 864, 64)}${body}${line(36, 477, 864, 477)}${wrap(note, 44).slice(0, 2).map((s, i) => text(36, 502 + 24 * i, s, 18, C.muted)).join('')}</svg>`;
  }
  function card(x, y, w, h, title, caption, color = C.green) { return rect(x, y, w, h) + text(x + 16, y + 30, title, 21, color, 'start', 700) + words(x + 16, y + 63, caption, Math.floor((w - 32) / 21), 20); }
  function metric(x, y, w, label, value, unit, color = C.green) { return rect(x, y, w, 96) + text(x + 16, y + 28, label, 19, C.muted) + text(x + 16, y + 69, `${value} ${unit}`, 29, color, 'start', 700); }
  function arrow(x1, y1, x2, y2, color = C.green, width = 3) {
    const a = Math.atan2(y2 - y1, x2 - x1), d = 10;
    return line(x1, y1, x2, y2, color, width) + `<polygon points="${x2},${y2} ${x2 - d * Math.cos(a - 0.5)},${y2 - d * Math.sin(a - 0.5)} ${x2 - d * Math.cos(a + 0.5)},${y2 - d * Math.sin(a + 0.5)}" fill="${color}"/>`;
  }
  function flow(points, p, color = C.orange, count = 4, closed = false) {
    const lengths = points.slice(1).map((q, i) => Math.hypot(q[0] - points[i][0], q[1] - points[i][1]));
    const total = lengths.reduce((a, b) => a + b, 0); let out = '';
    for (let j = 0; j < count; j++) {
      const f = (phase(p) + j / count) % 1; let d = f * total;
      for (let i = 0; i < lengths.length; i++) {
        if (d <= lengths[i]) { const u = d / (lengths[i] || 1), opacity = closed ? 1 : Math.min(1, f * 12, (1 - f) * 12); out += `<g opacity="${opacity}">${dot(points[i][0] + (points[i + 1][0] - points[i][0]) * u, points[i][1] + (points[i + 1][1] - points[i][1]) * u, color, 4.5)}</g>`; break; } d -= lengths[i];
      }
    } return out;
  }
  const cursor = (x, y1, y2) => line(x, y1, x, y2, C.orange, 2, '5 5');
  const axes = (x, y, w, h, xlabel, ylabel) => line(x, y, x + w, y, C.muted) + line(x, y, x, y - h, C.muted) + text(x + w / 2, y + 31, xlabel, 20, C.muted, 'middle') + text(x, y - h - 17, ylabel, 20, C.muted);
  const points = (fn, x, y, w, h, count = 80) => Array.from({ length: count + 1 }, (_, i) => [x + w * i / count, y - h * fn(i / count)]);
  const bar = (x, y, w, h, fraction, color) => rect(x, y, w, h, C.grid, 'none', 4) + rect(x, y, w * clamp(fraction), h, color, 'none', 4);

  H['av01-a'] = function (lesson, p) {
    const v = values(lesson); let b = '';
    b += rect(69, 115, 345, 317, C.sand, 'none', 18) + text(85, 140, '换流差分回路范围', 20, C.orange);
    b += line(105, 167, 330, 167, C.ink, 3) + line(105, 410, 535, 410, C.ink, 3);
    b += line(105, 167, 105, 271, C.ink, 3) + line(84, 271, 126, 271, C.ink, 3) + line(84, 285, 126, 285, C.ink, 3) + line(105, 285, 105, 410, C.ink, 3) + text(55, 322, '局部电容', 18);
    b += line(330, 167, 330, 190, C.ink, 3) + rect(300, 190, 60, 65, '#fff', C.ink) + text(330, 229, 'QH', 21, C.ink, 'middle') + line(330, 255, 330, 327, C.ink, 3);
    b += rect(300, 327, 60, 60, '#fff', C.ink) + text(330, 363, 'QL', 21, C.ink, 'middle') + line(330, 387, 330, 410, C.ink, 3) + text(203, 218, '上管关断', 19, C.muted);
    b += line(330, 285, 430, 285, C.ink, 3) + path('M430 285 C430 265 450 265 450 285 C450 265 470 265 470 285 C470 265 490 265 490 285', C.ink) + line(490, 285, 535, 285, C.ink, 3) + line(535, 285, 535, 410, C.ink, 3) + text(470, 253, '绕组', 21, C.ink, 'middle');
    b += line(380, 410, 380, 366, C.blue, 3) + path('M368 364 L392 364 L380 342 Z', C.blue, 2, C.sky) + line(368, 338, 392, 338, C.blue, 3) + line(380, 338, 380, 285, C.blue, 3) + line(330, 285, 380, 285, C.blue, 3);
    b += poly([[380, 410], [380, 285], [535, 285], [535, 410], [380, 410]], C.blue, 2) + flow([[380, 410], [380, 285], [535, 285], [535, 410], [380, 410]], p, C.blue, 6, true);
    b += line(140, 180, 275, 180, C.orange, 3, '6 5') + line(140, 395, 275, 395, C.orange, 3, '6 5') + text(141, 313, `总 Lσ = ${fmt(v.LsigmaNh)} nH`, 20, C.orange);
    b += card(580, 108, 273, 100, '蓝：负载续流', '电流经下侧体二极管继续', C.blue) + card(580, 227, 273, 100, '橙：快速换流', '电容与桥臂的电流发生重分配', C.orange) + card(580, 346, 273, 100, '不能重复计数', '总回路寄生电感只计一次');
    return base('负载续流与快速换流：找对两种路径', b, '下管通道亦关断；蓝线为本工况续流，橙区标差分回路，不表示两管同时导通。');
  };

  H['av01-b'] = function (lesson, p) {
    const v = values(lesson), u = replay(p), current = num(v.currentA), time = num(v.fallTimeNs), slope = time > 0 ? current / time : 0, dv = num(v.LsigmaNh) * slope;
    let b = axes(100, 406, 450, 246, '关断边沿时间 / ns', '换流支路电流 / A');
    b += poly([[100,160],[550,406]], C.blue, 4) + line(100,160,550,160,C.line,1,'5 5') + text(82,168,fmt(current),20,C.blue,'end') + text(82,413,'0',20,C.muted,'end') + text(100,438,'0',20,C.muted) + text(550,438,fmt(time),20,C.muted,'end');
    b += cursor(100 + 450*u,148,411) + dot(100+450*u,160+246*u,C.orange,7) + text(325,280,`${fmt(current)} A / ${fmt(time)} ns`,24,C.blue,'middle');
    b += metric(600,110,250,'整个换流回路',fmt(v.LsigmaNh),'nH') + metric(600,223,250,'电流斜率幅值',fmt(slope),'A/ns',C.blue) + metric(600,336,250,'附加电压幅值',fmt(dv),'V',C.orange);
    return base('小电感 × 快速电流变化，也会产生大电压', b, `采用恒斜率近似；${fmt(dv)} V为附加电压，不是实际已钳位的VDS测量峰值。`);
  };

  H['av01-c'] = function (lesson, p) {
    const v=values(lesson),u=replay(p),bus=num(v.busV),a=num(v.unclampedV),bpeak=num(v.improvedPeakV),top=Math.max(a,bpeak,bus,1)*1.16,x=105,y=414,w=650,h=250;
    const yy=voltage=>y-h*voltage/top, spike=t=>Math.exp(-Math.pow((t-.43)/.075,2));
    let b=axes(x,y,w,h,'边沿局部时间 / 定性','未钳位需求电压 / V') + line(x,yy(bus),x+w,yy(bus),C.muted,2,'6 5');
    b+=poly(points(t=>(bus+(a-bus)*spike(t))/top,x,y,w,h),C.orange,4) + poly(points(t=>(bus+(bpeak-bus)*spike(t))/top,x,y,w,h),C.green,4);
    b+=text(110,105,`${fmt(v.LsigmaNh)} nH → ${fmt(a)} V`,24,C.orange) + text(505,105,`${fmt(v.LimprovedNh)} nH → ${fmt(bpeak)} V`,24,C.green);
    b+=text(770,yy(bus)+7,`${fmt(bus)} V`,20,C.muted) + text(460,145,'同一母线、同一电流斜率',20,C.muted) + cursor(x+w*u,155,y);
    b+=dot(x+w*u,yy(bus+(a-bus)*spike(u)),C.orange,6) + dot(x+w*u,yy(bus+(bpeak-bus)*spike(u)),C.green,6);
    return base('减小总寄生电感：在同斜率假设下比较',b,'曲线形状仅示意；没有画器件额定边界。钳位、电容、阻尼与实际斜率会改变结果。');
  };

  H['av02-a'] = function (lesson,p) {
    const v=values(lesson),u=phase(p); let b='';
    b+=text(340,111,'漏极 D',22,C.ink,'middle') + line(340,122,340,155,C.ink,3) + rect(215,155,250,119,C.sky,C.blue,2) + text(340,200,'N 漂移区',23,C.blue,'middle') + rect(215,274,250,109,C.pale,C.green,2) + text(340,350,'P 体区',23,C.green,'middle');
    b+=rect(213,258,254,37,C.sand,C.orange,2) + text(340,284,'反偏结：强电场',20,C.orange,'middle');
    b+=line(340,383,340,420,C.ink,3) + text(340,452,'源极 S（体区连接）',21,C.ink,'middle');
    b+=rect(54,216,126,100,'#fff',C.line) + text(117,249,'栅极',21,C.muted,'middle') + text(117,283,'已关断',23,C.ink,'middle',700) + line(180,266,205,266,C.muted,2,'4 5');
    b+=arrow(495,165,495,376,C.orange,3) + words(520,226,'常规雪崩电流方向',5,20,C.orange);
    b+=arrow(265,255,265,212,C.blue,2) + text(247,239,'e⁻',19,C.blue,'end') + arrow(410,295,410,334,C.green,2) + text(425,325,'h⁺',19,C.green);
    b+=flow([[278,274],[278,170]],u,C.blue,3) + flow([[395,274],[395,371]],u,C.green,3);
    b+=card(642,113,212,119,'反向结雪崩','沟道不必被栅极打开',C.orange) + metric(642,250,212,'示例雪崩电压',fmt(v.avalancheV),'V',C.orange) + text(642,382,`起始电流 ${fmt(v.currentA)} A`,22) + words(642,417,'存在电流不等于已永久损坏',10,19);
    return base('栅极关断，反偏结仍可能承载雪崩电流',b,'仅示意电子与空穴的倍增和分离；不是精确器件截面、载流子数量或碰撞仿真。');
  };

  H['av02-b'] = function (lesson,p) {
    const v=values(lesson),u=replay(p),x=150,w=440,xa=270,xb=490; let b=rect(xa,90,xb-xa,347,C.sand,'none',0);
    b+=text(58,147,'VGS',22,C.green) + text(58,258,'VDS',22,C.blue) + text(58,379,'ID',22,C.orange);
    b+=poly([[x,115],[235,115],[255,162],[590,162]],C.green,3) + text(598,169,'已关断',19,C.green);
    b+=poly([[x,282],[240,282],[xa,218],[xb,218],[515,263],[590,263]],C.blue,3) + text(380,204,`${fmt(v.avalancheV)} V 示意平台`,20,C.blue,'middle');
    b+=poly([[x,335],[xa,335],[xb,411],[590,411]],C.orange,3) + text(380,359,`${fmt(v.currentA)} A → 0 A`,20,C.orange,'middle');
    b+=line(x,176,590,176) + line(x,291,590,291) + line(x,422,590,422) + cursor(x+w*u,96,432) + text(380,456,`候选事件 ${fmt(v.avalancheNs)} ns`,20,C.muted,'middle');
    b+=card(660,102,198,103,'还要看电流','同一时段是否承载电流',C.orange) + card(660,221,198,103,'排除其它钳位','检查外部TVS等支路',C.blue) + card(660,340,198,103,'排除测量限制','带宽、量程与探头校准');
    return base('平顶是线索：三路波形和电路条件一起核对',b,'三条波形共享示意时间轴；平顶本身不能证明发生雪崩，平台电压不是所有器件常数。');
  };

  H['av02-c'] = function (lesson,p) {
    const v=values(lesson),u=replay(p),peak=num(v.avalancheV)*num(v.currentA),t=num(v.avalancheNs),energy=peak*t*.001/2,partial=peak*t*.001*(u-u*u/2),x=100,y=409,w=480,h=242;
    let b=axes(x,y,w,h,'事件时间 / ns','瞬时功率 / kW');
    b+=path(`M${x} ${y} L${x} ${y-h} L${x+w*u} ${y-h*(1-u)} L${x+w*u} ${y} Z`,C.green,0,C.pale) + poly([[x,y-h],[x+w,y]],C.green,4) + cursor(x+w*u,y-h-12,y);
    b+=text(x-14,y-h+7,fmt(peak/1000),20,C.green,'end') + text(x-14,y+7,'0',20,C.muted,'end') + text(x+w,y+30,fmt(t),20,C.muted,'end') + text(x,442,'0',20,C.muted);
    b+=metric(627,112,225,'当前已积分面积',fmt(partial,1),'µJ') + metric(627,226,225,'整段三角形面积',fmt(energy,1),'µJ',C.blue) + card(627,342,225,105,'平均功率另算','还需要每秒发生几次',C.orange);
    return base('功率—时间图的面积，才是一次能量',b,'电压恒定、电流线性衰减的示例；填充量随回看进度变化，不表示已产生的热能倒流。');
  };

  H['av02-formula-1'] = function (lesson,p) {
    const v=values(lesson),u=replay(p),voltage=num(v.avalancheV),current=num(v.currentA),peak=voltage*current;
    let b=rect(45,102,385,344) + rect(470,102,385,344);
    b+=text(65,134,'同一事件内的两个瞬时量',22,C.ink,'start',700) + text(67,197,`VDS ≈ ${fmt(voltage)} V`,22,C.blue) + line(75,220,395,220,C.blue,4);
    b+=text(67,274,`ID：${fmt(current)} A → 0 A`,22,C.green) + poly([[75,302],[395,401]],C.green,4) + cursor(75+320*u,204,407);
    b+=axes(515,360,295,145,'事件时间 / 定性','P / kW') + poly([[515,215],[810,360]],C.orange,4) + cursor(515+295*u,208,367) + dot(515+295*u,215+145*u,C.orange,7);
    b+=text(790,172,`起始 ${fmt(peak/1000)} kW`,25,C.orange,'end',700) + text(662,431,`当前 ${fmt(peak*(1-u)/1000,2)} kW`,23,C.ink,'middle');
    return base('瞬时相乘：大峰值功率会随电流下降',b,'曲线仅表示本页恒压、线性衰减示例；峰值功率不是整段恒定功率，也不是周期平均。');
  };

  H['av02-formula-2'] = function (lesson,p) {
    const v=values(lesson),lav=num(v.LsigmaNh),i=num(v.currentA),bus=num(v.busV),av=num(v.avalancheV),el=.5*lav*i*i*.001,valid=av>bus,ea=valid?el*av/(av-bus):0,es=ea-el;
    let b=line(125,155,700,155,C.ink,3) + line(125,333,700,333,C.ink,3) + line(125,155,125,204,C.ink,3) + `<circle cx="125" cy="245" r="41" fill="${C.sky}" stroke="${C.blue}" stroke-width="3"/>` + line(125,286,125,333,C.ink,3);
    b+=text(125,252,'电源',21,C.blue,'middle') + text(125,115,`${fmt(bus)} V`,24,C.blue,'middle');
    b+=rect(318,123,173,65,C.pale,C.green) + text(405,151,`Lσ ${fmt(lav)} nH`,21,C.green,'middle') + text(405,177,`初始 ${fmt(i)} A`,19,C.green,'middle');
    b+=line(700,155,700,205,C.ink,3) + rect(636,205,128,82,C.sand,C.orange) + text(700,235,'雪崩器件',21,C.orange,'middle') + text(700,267,`${fmt(av)} V`,22,C.orange,'middle') + line(700,287,700,333,C.ink,3);
    b+=flow([[125,155],[700,155],[700,333],[125,333],[125,155]],p,C.orange,8,true) + text(427,242,'供电仍接入',24,C.blue,'middle') + text(427,280,valid?'VAV > Vbus':'该模型不适用',23,valid?C.muted:C.orange,'middle');
    b+=metric(45,362,240,'初始电感储能',fmt(el,2),'µJ',C.green) + text(300,418,'＋',30) + metric(337,362,240,'期间电源供能',valid?fmt(es,2):'—','µJ',C.blue) + text(592,418,'＝',30) + metric(630,362,225,'器件吸收',valid?fmt(ea,2):'—','µJ',C.orange);
    return base('吸收能量可大于初始电感储能：电源还在供能',b,'仅适用于图示等效连接、近似恒定电压及线性衰减电流；实际半桥先确认能量路径。');
  };

  H['av03-a'] = function (lesson,p) {
    const v=values(lesson); let b=metric(55,116,260,'一次事件能量',fmt(v.singleEnergyMicroJ),'µJ');
    b+=rect(80,276,210,119,C.sand,C.orange) + text(185,317,'雪崩器件',25,C.orange,'middle') + text(185,357,'不能只看能量',21,C.ink,'middle') + arrow(185,220,185,269,C.orange) + flow([[185,220],[185,269]],p,C.orange,2);
    b+=card(391,104,452,95,'电流与波形','核对峰值、脉宽及衰减方式',C.blue) + card(391,218,452,95,'起始结温与连接','同一能量，起始温度可能不同',C.green) + card(391,332,452,95,'额定能力的测试条件','确认单次/重复能力、数据来源',C.orange);
    b+=text(185,446,'小于某个 EAS ≠ 自动安全',21,C.ink,'middle');
    return base('一次能量小，还要匹配器件额定条件',b,'本页没有给出可比较的具体EAS额定值，因此不画“安全倍数”或已通过的判断标记。');
  };

  H['av03-b'] = function (lesson,p) {
    const v=values(lesson),u=replay(p),e=num(v.singleEnergyMicroJ),freq=num(v.frequencyKhz)*1000,pav=e*1e-6*freq;
    let b=axes(80,288,740,124,'事件序列 / 仅示意部分次数','事件标记（高度不表示能量）');
    for(let j=0;j<9;j++){const x=110+j*78;b+=line(x,288,x,186,C.green,3)+dot(x,186,C.green,5);}
    b+=cursor(80+740*u,159,299) + text(450,112,`每次 ${fmt(e)} µJ；每秒 ${fmt(freq,0)} 次`,25,C.ink,'middle');
    b+=metric(65,340,230,'一次能量',fmt(e),'µJ') + text(311,396,'×',29) + metric(351,340,230,'实际事件频率',fmt(v.frequencyKhz),'kHz',C.blue) + text(598,396,'＝',29) + metric(637,340,218,'额外平均损耗',fmt(pav),'W',C.orange);
    return base('重复次数把每次小能量变成持续平均损耗',b,'事件标记不是功率面积图；只有每开关周期恰好一次时，事件频率才等于开关频率。');
  };

  H['av03-c'] = function (lesson,p) {
    const v=values(lesson),u=replay(p),rise=num(v.averagePowerW)*num(v.exampleThermalResistance),baseT=num(v.baseTemperatureC),mean=baseT+rise;
    let b=axes(90,389,480,215,'观察时间 / 定性','结温变化（脉冲形状示意）');
    b+=line(90,355,570,355,C.muted,2,'5 5') + line(90,242,570,242,C.blue,2,'5 5') + text(95,345,`原有平均 ${fmt(baseT)} °C`,19,C.muted) + text(95,225,`新增平均后约 ${fmt(mean,1)} °C`,20,C.blue);
    const shape=t=>(389-242)/215+.10*Math.cos(t*12*Math.PI)+.04*Math.cos(t*24*Math.PI);
    b+=poly(points(shape,90,389,480,215,180),C.orange,3) + cursor(90+480*u,161,399) + text(355,118,'峰值另用瞬态模型核查',21,C.orange,'middle');
    b+=metric(620,115,230,'新增平均温升',fmt(rise,1),'K',C.blue) + card(620,231,230,103,'这里的热阻','来自本页示意安装条件') + card(620,355,230,103,'平均值没有回答','每次脉冲最高结温是多少',C.orange);
    return base('平均温升与脉冲峰值：两个问题分别核对',b,'热阻线性近似；橙色纹波只示意存在瞬态峰值，幅值未量化，不是实际结温仿真。');
  };

  H['av04-a'] = function (lesson,p) {
    const v=values(lesson),u=replay(p),start=num(v.startV),end=num(v.endV),voltage=Math.sqrt(Math.max(0,start*start+u*(end*end-start*start)));
    let b=rect(50,218,187,130,C.pale,C.green) + text(144,260,'电机回馈',25,C.green,'middle') + text(144,303,`${fmt(v.feedbackJ)} J 情景`,23,C.ink,'middle');
    b+=arrow(237,280,362,280,C.green,4) + flow([[237,280],[362,280]],p,C.green,3) + rect(362,221,175,117,C.sky,C.blue) + text(449,265,'直流母线',24,C.blue,'middle') + text(449,306,'电压被抬升',21,C.ink,'middle');
    b+=poly([[537,255],[590,255],[590,152],[655,152]],C.muted,3) + rect(655,108,198,93,'#fff') + text(754,142,'电源不能吸收',21,C.ink,'middle') + text(754,177,'隔断 / BMS限制',19,C.muted,'middle') + line(605,141,628,164,C.orange,3) + line(605,164,628,141,C.orange,3);
    b+=arrow(537,302,660,302,C.orange,3) + flow([[537,302],[660,302]],p,C.orange,3) + rect(660,236,193,131,C.sand,C.orange) + text(756,266,`母线电容 ${fmt(v.capacitanceMicroF)} µF`,19,C.orange,'middle') + text(756,308,`${fmt(voltage,1)} V`,29,C.orange,'middle',700) + text(756,344,'电压回看进度',18,C.muted,'middle');
    b+=card(62,385,365,74,'新增储能',`${fmt(v.storedJ,3)} J（指定电压终点）`,C.green) + card(464,385,389,74,'其余能量',`${fmt(v.remainingJ,3)} J 还需要确定出口`,C.orange);
    return base('电机回馈：电源不能吸收时，母线电容先充电',b,'能量框图，非完整接线图；电压数值随回看进度变化，不表示电容自动周期放电。');
  };

  H['av04-b'] = function (lesson,p) {
    const v=values(lesson),u=replay(p),start=num(v.startV),end=num(v.endV),cap=num(v.capacitanceMicroF)*1e-6,stored=.5*cap*(end*end-start*start),feedback=num(v.feedbackJ),voltage=start+u*(end-start),partial=.5*cap*(voltage*voltage-start*start),x=100,y=395,w=440,h=222;
    const f=t=>stored>0?(.5*cap*(Math.pow(start+t*(end-start),2)-start*start))/stored:0;
    let b=axes(x,y,w,h,'母线电压 / V','电容新增储能 / J') + poly(points(f,x,y,w,h),C.green,4) + line(x,y-h,x+w,y-h,C.line,1,'5 5');
    b+=text(82,y-h+7,fmt(stored,3),20,C.green,'end') + text(82,y+7,'0',20,C.muted,'end') + text(x,y+30,fmt(start),20,C.muted) + text(x+w,y+30,fmt(end),20,C.muted,'end') + cursor(x+w*u,y-h-10,y) + dot(x+w*u,y-h*f(u),C.orange,7);
    b+=text(310,118,`${fmt(v.capacitanceMicroF)} µF，能量随电压平方增加`,22,C.ink,'middle') + text(310,460,`回看：${fmt(voltage,1)} V，新增 ${fmt(partial,3)} J`,21,C.green,'middle');
    b+=text(730,118,`输入回馈 ${fmt(feedback)} J`,23,C.ink,'middle',700) + rect(620,151,70,244,C.sand,C.orange,2);
    const fraction=feedback>0?clamp(num(v.storedJ)/feedback):0;
    b+=rect(620,395-244*fraction,70,244*fraction,C.pale,C.green,2) + text(709,225,`${fmt(v.remainingJ,3)} J`,23,C.orange) + text(709,256,'尚无出口',19,C.orange) + text(709,345,`${fmt(v.storedJ,3)} J`,23,C.green) + text(709,376,'进电容',19,C.green) + text(734,443,'能量余额必须闭合',21,C.ink,'middle');
    return base('算电容能吃下多少：用两个电压平方的差',b,'终点电压只是情景值，须同时满足电容和器件额定；不是推荐让母线达到器件雪崩电压。');
  };

  H['av04-c'] = function (lesson,p) {
    const v=values(lesson),u=replay(p),power=num(v.endV)*num(v.currentA),duration=num(v.durationMs),energy=power*duration*.001;
    let b=rect(44,112,280,334) + text(184,149,'短尖峰',24,C.blue,'middle',700) + axes(76,335,216,126,'纳秒量级 / 定性','P(t) / 定性');
    b+=poly([[76,335],[137,335],[151,222],[172,335],[292,335]],C.blue,3) + cursor(76+216*u,205,343) + words(76,401,'按该次真实波形积分',10,20,C.muted);
    b+=rect(360,112,495,334) + text(608,149,'余能被恒功率吸收的假设',23,C.orange,'middle',700) + axes(405,335,400,126,'毫秒时间轴 / ms','P / kW');
    b+=rect(405,209,400*u,126,C.sand,'none',0) + poly([[405,335],[405,209],[805,209],[805,335]],C.orange,3) + cursor(405+400*u,198,343);
    b+=text(720,193,`${fmt(power/1000)} kW`,21,C.orange) + text(805,367,fmt(duration,3),20,C.muted,'end') + text(610,399,`整段 ≈ ${fmt(energy,2)} J`,24,C.orange,'middle',700) + text(610,431,`本页余能 ${fmt(v.remainingJ,3)} J（计算取近似值）`,19,C.muted,'middle');
    return base('高电压维持多久，决定累计吸收多少能量',b,'两图时间轴分别展开，不按相同比例；右图恒压恒流、余能全由单器件吸收仅为情景假设。');
  };

  H['av04-d'] = function (lesson,p) {
    const v=values(lesson),u=replay(p),power=num(v.endV)*num(v.currentA),rise=power*num(v.exampleZth);
    let b=metric(52,112,256,'假定矩形脉冲功率',fmt(power,0),'W',C.orange) + metric(52,229,256,'原片示意 Zth',fmt(v.exampleZth),'K/W',C.blue);
    b+=arrow(321,212,381,212,C.muted) + arrow(321,277,381,277,C.muted) + rect(392,135,442,179,C.sand,C.orange) + text(613,177,'线性模型外推量',23,C.orange,'middle',700) + text(613,234,`${fmt(rise,0)} K`,43,C.orange,'middle',700) + text(613,277,'不能当成测得的真实失效温度',21,C.ink,'middle');
    b+=card(52,351,241,103,'具体器件数据','型号、曲线及边界来源',C.green) + card(327,351,241,103,'匹配测试条件','起始温度、脉宽和波形',C.blue) + card(602,351,241,103,'模型适用范围','超界仅说明严重风险',C.orange);
    b+=dot(70+u*750,331,C.orange,5);
    return base('计算结果超出模型范围，不能继续声称精确温度',b,`${fmt(v.exampleZth)} K/W未独立追溯到具体器件。示意能力曲线和热外推都不能定义精确损坏电流或时刻。`);
  };

  H['av05-a'] = function (lesson,p) {
    const v=values(lesson),u=replay(p); let b='';
    const xs=[43,335,627],heads=['缩小高频回路','调节关断边沿','按条件吸收 / 钳位'];
    xs.forEach((x,i)=>{b+=rect(x,108,230,339) + text(x+115,143,heads[i],21,[C.green,C.blue,C.orange][i],'middle',700);});
    b+=rect(69,199,57,58,C.pale,C.green,4) + text(97,233,'C',23,C.green,'middle') + rect(180,199,57,58,C.pale,C.green,4) + text(208,233,'Q',23,C.green,'middle');
    const loop=[[98,199],[98,177],[208,177],[208,277],[98,277],[98,257]];
    b+=poly(loop,C.green,3) + flow(loop,p,C.orange,4) + text(158,322,`${fmt(v.LsigmaNh)} → ${fmt(v.LreducedNh)} nH`,23,C.green,'middle') + words(63,369,'局部母线电容靠近桥臂',9,20);
    b+=rect(359,191,61,43,C.sky,C.blue,4) + text(389,219,'驱动',18,C.blue,'middle') + line(420,212,442,212,C.blue,3) + rect(442,198,55,27,'#fff',C.blue,2) + line(497,212,542,212,C.blue,3) + text(468,184,'Rg,off',20,C.blue,'middle');
    b+=poly([[362,303],[415,303],[436,258],[548,258]],C.blue,3) + poly([[362,303],[415,303],[476,258],[548,258]],C.orange,3) + cursor(362+186*u,250,313) + words(354,356,'降低di/dt时，也核对开关损耗与死区',9,20);
    b+=rect(652,186,179,60,C.sand,C.orange,5) + text(742,223,'RC：阻尼振铃',21,C.orange,'middle') + rect(652,265,179,60,C.sand,C.orange,5) + text(742,302,'TVS：脉冲钳位',21,C.orange,'middle') + words(647,366,'校核实际峰值、引线电感及脉冲能力',9,20);
    return base('短尖峰：布局、边沿与吸收各解决一部分',b,'位置框图，非完整接线图；RC和TVS均需选型验证，不能把它们当作长期机械回馈的默认出口。');
  };

  H['av05-b'] = function (lesson,p) {
    let b=rect(45,205,161,116,C.pale,C.green) + text(125,247,'电机',25,C.green,'middle') + text(125,288,'回馈能量',21,C.ink,'middle') + arrow(206,263,315,263,C.green,4) + flow([[206,263],[315,263]],p,C.green,3);
    b+=rect(315,205,156,116,C.sky,C.blue) + text(393,247,'母线',25,C.blue,'middle') + text(393,288,'监测电压',21,C.ink,'middle');
    b+=poly([[471,239],[540,239],[540,159],[620,159]],C.orange,3) + arrow(540,159,620,159,C.orange,3) + flow([[471,239],[540,239],[540,159],[620,159]],p,C.orange,4);
    b+=rect(620,106,235,115,C.sand,C.orange) + text(737,143,'制动斩波器＋电阻',22,C.orange,'middle',700) + text(737,183,'按能量与功率选型',21,C.ink,'middle');
    b+=poly([[471,287],[540,287],[540,350],[620,350]],C.blue,3) + arrow(540,350,620,350,C.blue,3) + flow([[471,287],[540,287],[540,350],[620,350]],p,C.blue,4);
    b+=rect(620,287,235,115,C.sky,C.blue) + text(737,325,'可接收回灌的电池',22,C.blue,'middle',700) + text(737,366,'须有允许的充电路径',20,C.ink,'middle');
    b+=rect(45,365,426,91) + text(258,397,'能量管理：限制回馈电流与母线电压',21,C.green,'middle',700) + text(258,431,'联动控制，并核对电阻温升与电池条件',19,C.muted,'middle');
    b+=line(393,365,393,324,C.muted,2,'5 5') + text(393,125,'两类可设计的出口',22,C.ink,'middle') + text(738,253,'按系统条件选用或协同',19,C.muted,'middle');
    return base('持续回馈需要真正的能量出口和控制',b,'这是能量框图；电池只有在电压、BMS和充电能力均允许时才可接收，不能让MOS雪崩默认泄能。');
  };
})();
