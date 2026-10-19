(function () {
  'use strict';

  const API_BASE = '/api';

  const Auth = {
    get studentToken() {
      return localStorage.getItem('token');
    },
    set studentToken(v) {
      v ? localStorage.setItem('token', v) : localStorage.removeItem('token');
    },
    get adminToken() {
      return localStorage.getItem('adminToken');
    },
    set adminToken(v) {
      v ? localStorage.setItem('adminToken', v) : localStorage.removeItem('adminToken');
    },
    get user() {
      try {
        return JSON.parse(localStorage.getItem('user') || 'null');
      } catch {
        return null;
      }
    },
    set user(v) {
      v ? localStorage.setItem('user', JSON.stringify(v)) : localStorage.removeItem('user');
    },
    clearStudent() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearAdmin() {
      localStorage.removeItem('adminToken');
    },
  };

  async function api(path, options) {
    const opts = options || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    const token = opts.admin ? Auth.adminToken : Auth.studentToken;
    if ((opts.auth || opts.admin) && token) {
      headers.Authorization = 'Bearer ' + token;
    }
    const res = await fetch(API_BASE + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* no body */
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || 'Request failed (' + res.status + ')');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function money(value) {
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ETB';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toast(message, type) {
    let box = document.getElementById('toast-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast-box';
      document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => el.classList.add('show'), 20);
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 3600);
  }

  function requireStudent() {
    if (!Auth.studentToken) {
      location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search);
      return false;
    }
    return true;
  }

  function logout() {
    Auth.clearStudent();
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    location.href = 'index.html';
  }

  function logoutAdmin() {
    Auth.clearAdmin();
    location.href = 'admin.html';
  }

  function renderAdminNav(host) {
    host.innerHTML =
      '<a class="brand" href="admin.html"><span class="brand-mark">EE</span>' +
      '<span class="brand-text">Exit Exam Prep<small>Administrator Portal</small></span></a>' +
      (Auth.adminToken
        ? '<nav class="nav-links" id="navLinks">' +
          '<button class="btn btn-ghost btn-sm" id="navAdminLogout">Log out</button>' +
          '</nav>'
        : '');
    const out = document.getElementById('navAdminLogout');
    if (out) out.addEventListener('click', logoutAdmin);
  }

  function mountNav() {
    const host = document.getElementById('nav');
    if (!host) return;
    const active = location.pathname.split('/').pop() || 'index.html';

    if (active === 'admin.html') {
      renderAdminNav(host);
      return;
    }

    const user = Auth.user;
    const links = [
      { href: 'index.html', label: 'Home' },
      { href: 'dashboard.html', label: 'My Dashboard' },
    ];

    host.innerHTML =
      '<a class="brand" href="index.html"><span class="brand-mark">EE</span>' +
      '<span class="brand-text">Exit Exam Prep<small>Ethiopian Higher Education</small></span></a>' +
      '<button class="nav-toggle" aria-label="Menu" id="navToggle">&#9776;</button>' +
      '<nav class="nav-links" id="navLinks">' +
      links
        .map(
          (l) =>
            '<a href="' + l.href + '"' + (l.href === active ? ' class="active"' : '') + '>' + l.label + '</a>'
        )
        .join('') +
      '<a class="btn btn-ghost btn-sm" href="login.html">Log in</a>' +
      '<a class="btn btn-outline btn-sm" href="register.html">Register</a>' +
      '<a class="btn btn-ghost btn-sm" href="admin.html">Admin Portal</a>' +
      (user
        ? '<span class="nav-user">' + escapeHtml(user.fullName) + '</span>' +
          '<button class="btn btn-ghost btn-sm" id="navLogout">Log out</button>'
        : '') +
      '</nav>';

    const toggle = document.getElementById('navToggle');
    const list = document.getElementById('navLinks');
    if (toggle) toggle.addEventListener('click', () => list.classList.toggle('open'));
    const out = document.getElementById('navLogout');
    if (out) out.addEventListener('click', logout);
  }

  function isEditable(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
  }

  function protectContent() {
    document.addEventListener('contextmenu', (e) => {
      if (!isEditable(e.target)) {
        e.preventDefault();
        toast('Right-click is disabled on protected content.', 'warn');
      }
    });
    ['copy', 'cut'].forEach((evt) => {
      document.addEventListener(evt, (e) => {
        if (!isEditable(e.target)) {
          e.preventDefault();
          toast('Copying of protected content is not allowed.', 'warn');
        }
      });
    });
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => {
      if (!isEditable(e.target) && !e.target.closest('.selectable')) e.preventDefault();
    });
    document.addEventListener('keydown', (e) => {
      const key = (e.key || '').toUpperCase();
      const blockCombo =
        key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(key)) ||
        (e.ctrlKey && ['U', 'S', 'P'].includes(key)) ||
        (e.metaKey && ['U', 'S', 'P'].includes(key));
      if (blockCombo) {
        e.preventDefault();
        toast('This action is disabled to protect the content.', 'warn');
      }
    });
    window.addEventListener('beforeprint', () => toast('Printing is disabled for protected content.', 'warn'));
    const mq = window.matchMedia('print');
    if (mq && mq.addEventListener) mq.addEventListener('change', () => {});
    const style = document.createElement('style');
    style.textContent = '@media print { body { display: none !important; } }';
    document.head.appendChild(style);
  }

  function applyWatermark(label) {
    if (!label) return;
    const layer = document.createElement('div');
    layer.className = 'watermark-layer';
    layer.setAttribute('aria-hidden', 'true');
    const grid = document.createElement('div');
    grid.className = 'watermark-grid';
    for (let i = 0; i < 120; i += 1) {
      const span = document.createElement('span');
      span.textContent = label;
      grid.appendChild(span);
    }
    layer.appendChild(grid);
    document.body.appendChild(layer);
  }

  function renderDocument(container, text) {
    container.innerHTML = '';
    const blocks = String(text).split(/\n{2,}/);
    blocks.forEach((block) => {
      const lines = block.split('\n');
      const isHeading = /^[0-9]+\.\s+[A-Z]/.test(block.trim()) || /^[A-Z0-9 ()&-]+$/.test(block.trim());
      if (isHeading && block.trim().length < 70) {
        const h = document.createElement('h3');
        h.textContent = block.trim();
        container.appendChild(h);
        return;
      }
      const p = document.createElement('p');
      p.innerHTML = lines.map((l) => escapeHtml(l)).join('<br>');
      container.appendChild(p);
    });
  }

  window.App = {
    api,
    Auth,
    money,
    escapeHtml,
    toast,
    requireStudent,
    logout,
    logoutAdmin,
    mountNav,
    protectContent,
    applyWatermark,
    renderDocument,
  };

  document.addEventListener('DOMContentLoaded', mountNav);
})();
