(function () {
  'use strict';
  const root = document.getElementById('projects');
  const element = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  function localURL(value) {
    const url = new URL(value, document.baseURI);
    if (!['http:', 'https:', 'file:'].includes(url.protocol) || url.origin !== new URL(document.baseURI).origin) throw new Error('Invalid archive link');
    return value;
  }
  function arrowLink(label, href, className) {
    const a = element('a', className, label);
    a.href = localURL(href);
    const arrow = element('span', '', '↗'); arrow.setAttribute('aria-hidden', 'true'); a.append(arrow);
    return a;
  }
  function projectCard(project, index) {
    const article = element('article', 'project-card');
    article.id = `project-${project.id}`;
    const cover = element('a', 'project-image-link');
    cover.href = localURL(project.href);
    cover.setAttribute('aria-label', `打开${project.title}`);
    const img = element('img', 'project-image');
    img.src = localURL(project.cover); img.alt = project.coverAlt; img.width = 1600; img.height = 920;
    img.loading = index ? 'lazy' : 'eager'; img.decoding = 'async'; cover.append(img);
    const information = element('div', 'project-information');
    const meta = element('div', 'project-meta');
    meta.append(element('span', '', `${String(index + 1).padStart(2, '0')} / ${project.category || 'PROJECT'}`), element('span', '', project.year));
    const heading = element('div', 'project-heading');
    const h3 = element('h3'); const title = element('a', '', project.title); title.href = localURL(project.href); h3.append(title);
    const tags = element('ul', 'project-tags'); tags.setAttribute('aria-label', '项目标签');
    (Array.isArray(project.tags) ? project.tags : []).forEach(tag => tags.append(element('li', '', tag)));
    heading.append(h3, element('p', 'project-subtitle', project.subtitle), tags);
    const detail = element('div', 'project-detail');
    detail.append(element('p', '', project.description), arrowLink(project.actionLabel || '查看项目', project.href, 'text-link'));
    information.append(meta, heading, detail); article.append(cover, information);
    return article;
  }
  function learningTopics(project) {
    const list = document.getElementById('learning-topics');
    const nodes = project.topics.map((topic, index) => {
      const a = element('a', 'topic-link'); a.href = localURL(topic.href);
      const arrow = element('span', 'topic-arrow', '↗'); arrow.setAttribute('aria-hidden', 'true');
      a.append(element('span', 'topic-number', String(index + 1).padStart(2, '0')), element('h3', '', topic.title), element('p', '', topic.description), arrow);
      return a;
    });
    list.replaceChildren(...nodes);
  }
  function downloads(items) {
    const list = document.getElementById('download-list');
    const nodes = items.map(item => {
      const a = element('a', 'download-link'); a.href = localURL(item.href); a.download = item.filename;
      const copy = element('div'); copy.append(element('h3', '', item.title), element('p', '', item.description));
      const arrow = element('span', 'download-arrow', '↓'); arrow.setAttribute('aria-hidden', 'true');
      a.append(copy, arrow); return a;
    });
    list.replaceChildren(...nodes);
  }
  function showError() {
    const p = element('p', 'fallback-note', '作品信息暂时未能加载。'); p.setAttribute('role', 'status');
    p.append(document.createTextNode(' '), arrowLink('直接打开 MOSFET 学习页', 'learning/index.html', 'text-link'));
    root.replaceChildren(p); root.setAttribute('aria-busy', 'false');
    const topics = document.getElementById('learning-topics');
    topics.replaceChildren(arrowLink('打开完整学习页', 'learning/index.html', 'text-link'));
    const list = document.getElementById('download-list');
    const a = arrowLink('下载离线学习页', 'downloads/offline-learning.html', 'text-link'); a.download = 'offline-learning.html'; list.replaceChildren(a);
  }
  fetch('content/projects.json', { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error('Archive unavailable'); return response.json(); })
    .then(projects => {
      if (!Array.isArray(projects) || !projects.length) throw new Error('Empty archive');
      root.replaceChildren(...projects.map(projectCard)); root.setAttribute('aria-busy', 'false');
      const learningProject = projects.find(project => Array.isArray(project.topics) && project.topics.length);
      if (learningProject) learningTopics(learningProject);
      const allDownloads = projects.flatMap(project => Array.isArray(project.downloads) ? project.downloads : []);
      const uniqueDownloads = allDownloads.filter((item, index, items) => items.findIndex(other => other.href === item.href) === index);
      downloads(uniqueDownloads);
      const latest = projects.map(project => project.updated).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort().pop();
      if (latest) { const time = document.getElementById('updated-date'); time.dateTime = latest; time.textContent = latest; }
    }).catch(showError);

  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.site-nav a')];
    const observer = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach(entry => {
        links.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    ['work', 'learning', 'about'].forEach(id => observer.observe(document.getElementById(id)));
  }
})();
