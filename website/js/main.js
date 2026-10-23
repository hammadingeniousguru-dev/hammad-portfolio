/* ==========================================================================
   Hammad Khan — portfolio interactions
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  if (reduce) root.classList.add('no-anim');
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ───────── Content data ───────── */
  const FILMS = {
    looney: { src: 'assets/video/looney.mp4', poster: 'assets/poster/looney.jpg', cat: '2D Animation · 02:40', title: 'Looney Mix',
      desc: 'A cartoon mix of 2D character animation: two street-style characters bouncing between desert canyons and a western town. Animated and cut in After Effects and Premiere Pro.' },
    scene1: { src: 'assets/video/scene1.mp4', poster: 'assets/poster/scene1.jpg', cat: 'Motion Graphics · 00:16', title: 'Fine Art Photo Promo',
      desc: 'Promo spot for a fine-art photography offer: an illustrated gallery wall comes alive with kinetic type.' },
    scene2: { src: 'assets/video/scene2.mp4', poster: 'assets/poster/scene2.jpg', cat: '2D Animation · 00:18', title: 'Experience — Travel Spot',
      desc: 'An illustrated seascape — a boat riding into the sunset while the headline types itself onto the horizon.' },
    scene3: { src: 'assets/video/scene3.mp4', poster: 'assets/poster/scene3.jpg', cat: 'Motion Graphics · 00:15', title: 'Angie Hall — Feel the Rhythm',
      desc: 'Artist promo: an illustrated portrait framed by animated music notes and audio waveforms.' },
    rig3d: { src: 'assets/video/rig3d.mp4', poster: 'assets/poster/rig3d.jpg', cat: '3D · Blender · 00:45', title: 'Facial Rig Review — Eyes & Mouth',
      desc: 'Viewport capture from Blender testing the eye and mouth controls of the anime character before final renders.' }
  };
  const FILM_ORDER = Object.keys(FILMS);

  const VTUBERS = [
    { id: 'tara', name: 'Tara', file: 'tara st character.model3.json', params: 57, phys: 10, expCount: 6,
      desc: 'Streetwear idol with a full toggle kit — pop out cat ears, switch to cat or star eyes, or take the jacket off.',
      exps: ['angry', 'cat-ear', 'cat-eye', 'jacket', 'scared', 'star-eye'],
      notes: '<b>Expressions</b> angry · scared<br><b>Toggles</b> cat ears · cat eyes · star eyes · jacket' },
    { id: 'deth-dragon', name: 'Deth Dragon', file: 'deth dragon 2-01.model3.json', params: 55, phys: 7, expCount: 8,
      desc: 'Dragon-boy streamer whose wings, fire and glasses can all be switched on live.',
      exps: ['angry', 'glasses', 'wings'],
      notes: '<b>Expressions</b> angry · love · scared<br><b>Toggles</b> wings · wings fire · fire · glasses<br><b>Motion</b> fire' },
    { id: 'ember', name: 'Ember', file: 'ember live2d vtuber.model3.json', params: 52, phys: 5, expCount: 5,
      desc: 'Fire-wolf pup with a glowing chest flame, burning ears and a crying motion.',
      exps: ['happy', 'sad', 'angry', 'fire-off'],
      notes: '<b>Expressions</b> happy · sad · angry · cry<br><b>Toggle</b> fire off<br><b>Motions</b> ear fire · tears' },
    { id: 'pop', name: 'Pop', file: 'pop character vtuber main.model3.json', params: 27, phys: 3, expCount: 4,
      desc: 'Podcast-desk persona with a boom mic, built for big, readable reactions.',
      exps: ['happy', 'shocked', 'scared', 'angry'],
      notes: '<b>Expressions</b> happy · shocked · scared · angry' },
    { id: 'kore', name: 'Kore', file: 'kore chibi model.model3.json', params: 30, phys: 6, expCount: 0,
      desc: 'Chibi vampire princess. Twelve part groups and six physics groups keep the twin buns, braid and dress bouncing.',
      exps: [],
      notes: '<b>Rig</b> idle + face tracking · 12 part groups' }
  ];

  /* ───────── Utilities ───────── */
  const clock = () => {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' });
    const tick = () => $$('.clock').forEach(el => (el.textContent = fmt.format(new Date())));
    tick(); setInterval(tick, 15000);
    $$('.year').forEach(el => (el.textContent = new Date().getFullYear()));
  };

  const timecode = (seconds, fps = 30) => {
    const s = Math.max(0, seconds);
    const f = Math.floor((s % 1) * fps);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(Math.floor(s) % 60)}:${pad(f)}`;
  };

  const safePlay = v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  const ensureSrc = v => { if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src; };

  /* split text into masked words, keeping inline elements intact */
  const splitWords = el => {
    const out = [];
    const nodes = Array.from(el.childNodes);
    el.textContent = '';
    nodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'wline';
          const i = document.createElement('span'); i.className = 'wi'; i.style.display = 'inline-block'; i.textContent = part;
          w.appendChild(i); el.appendChild(w); out.push(i);
        });
      } else if (n.nodeName === 'BR') {
        el.appendChild(n);
      } else {
        const w = document.createElement('span'); w.className = 'wline';
        n.style.display = 'inline-block'; w.appendChild(n); el.appendChild(w); out.push(n);
      }
    });
    return out;
  };

  /* ───────── Smooth scroll ───────── */
  let lenis = null;
  const initScroll = () => {
    if (reduce || typeof window.Lenis === 'undefined' || !hasGsap) return;
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  };
  const scrollToY = (y, immediate = false) => {
    if (lenis) lenis.scrollTo(y, { immediate, duration: 1.4 });
    else window.scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
  };

  /* anchor links through Lenis */
  const initAnchors = () => {
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      root.classList.remove('menu-open');
      $('.menu-btn').setAttribute('aria-expanded', 'false');
      if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { duration: 1.6 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }));
    const btn = $('.menu-btn');
    btn.addEventListener('click', () => {
      const open = root.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', String(open));
      $('.mobile-menu').setAttribute('aria-hidden', String(!open));
      if (lenis) open ? lenis.stop() : lenis.start();
    });
  };

  /* ───────── Preloader ───────── */
  const preload = () => new Promise(resolve => {
    const loader = $('.loader');
    if (!loader || reduce || !hasGsap) { loader && loader.remove(); resolve(); return; }
    const frames = $$('.loader-frames span');
    const count = $('.loader-count');
    const reel = $('.reel-video');
    const ready = Promise.race([
      Promise.all([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        new Promise(r => { if (reel.readyState >= 3) r(); else reel.addEventListener('canplay', r, { once: true }); })
      ]),
      new Promise(r => setTimeout(r, 4500))
    ]);
    const state = { p: 0 };
    let done = false;
    ready.then(() => (done = true));
    const update = () => {
      const v = Math.round(state.p);
      count.textContent = String(v).padStart(3, '0');
      const on = Math.round((v / 100) * frames.length);
      frames.forEach((f, i) => f.classList.toggle('on', i < on));
    };
    // creep to 85% while loading, then finish
    const creep = gsap.to(state, { p: 85, duration: 2.2, ease: 'power2.out', onUpdate: update });
    const finish = () => {
      creep.kill();
      gsap.timeline({ onComplete: resolve })
        .to(state, { p: 100, duration: .5, ease: 'power1.inOut', onUpdate: update })
        .to('.loader-frames, .loader-meta', { opacity: 0, y: -10, duration: .35 }, '+=.1')
        .to('.loader-name', { yPercent: -40, opacity: 0, duration: .45, ease: 'power3.in' }, '<')
        .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: .8, ease: 'expo.inOut' }, '-=.1')
        .set(loader, { display: 'none' });
    };
    const wait = () => (done && state.p > 40 ? finish() : setTimeout(wait, 80));
    gsap.from('.loader-name', { yPercent: 60, opacity: 0, duration: .8, ease: 'expo.out' });
    wait();
  });

  /* ───────── Cursor ───────── */
  const initCursor = () => {
    if (!finePointer || reduce || !hasGsap) return;
    root.classList.add('has-cursor');
    const cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-label');
    const dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', () => cur.classList.add('is-live'), { once: true });
    window.addEventListener('pointermove', e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener('pointerover', e => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, [data-tilt], .tl-track');
      cur.classList.toggle('is-label', !!lab);
      cur.classList.toggle('is-hover', !lab && !!hov);
      label.textContent = lab ? lab.dataset.cursor : '';
    });
    document.documentElement.addEventListener('pointerleave', () => cur.classList.remove('is-live'));
    document.documentElement.addEventListener('pointerenter', () => cur.classList.add('is-live'));
  };

  /* ───────── Magnetic buttons + tilt ───────── */
  const initMagnetic = () => {
    if (!finePointer || reduce || !hasGsap) return;
    $$('[data-magnetic]').forEach(el => {
      const x = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
      const y = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .3); y((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
    const tilt = (el, max) => {
      gsap.set(el, { transformPerspective: 900 });
      const rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - .5) * max * 2);
        rx(-((e.clientY - r.top) / r.height - .5) * max * 2);
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    };
    $$('[data-tilt]').forEach(el => tilt(el, 8));
    $$('.card').forEach(el => tilt(el, 3.5));
    $$('[data-tilt-soft]').forEach(el => tilt(el, 4));
  };

  /* ───────── Text scramble on nav ───────── */
  const initScramble = () => {
    const glyphs = '!<>-_\\/[]{}—=+*^?#01';
    $$('[data-scramble]').forEach(el => {
      const final = el.textContent;
      let raf = null;
      el.addEventListener('pointerenter', () => {
        let frame = 0; cancelAnimationFrame(raf);
        const run = () => {
          el.textContent = final.split('').map((c, i) => (i < frame / 2 || c === ' ' ? c : glyphs[Math.floor(Math.random() * glyphs.length)])).join('');
          if (frame++ < final.length * 2) raf = requestAnimationFrame(run); else el.textContent = final;
        };
        run();
      });
    });
  };

  /* ───────── Nav behaviour ───────── */
  const initNav = () => {
    const nav = $('.nav');
    let last = 0;
    const onScroll = y => {
      nav.classList.toggle('is-scrolled', y > 40);
      if (!root.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > last && y > 400);
      last = y;
    };
    if (lenis) lenis.on('scroll', e => onScroll(e.scroll)); else window.addEventListener('scroll', () => onScroll(scrollY), { passive: true });
    if (!hasGsap) return;
    $$('.nav-links a').forEach(a => {
      const sec = $(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: s => a.classList.toggle('is-active', s.isActive) });
    });
  };

  /* ───────── Hero ───────── */
  const initHero = () => {
    // rotating word
    const words = ['move', 'talk', 'sell', 'breathe', 'pop', 'dance'];
    const rot = $('.rot-word');
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      if (!hasGsap || reduce) { rot.textContent = words[i]; return; }
      gsap.timeline()
        .to(rot, { yPercent: -110, duration: .35, ease: 'power3.in' })
        .add(() => { rot.textContent = words[i]; })
        .fromTo(rot, { yPercent: 110 }, { yPercent: 0, duration: .55, ease: 'expo.out' });
    }, 2200);

    if (!hasGsap || reduce) return;
    // stickers: idle float + mouse parallax
    const stickers = $$('.sticker');
    stickers.forEach((s, k) => gsap.to(s, { y: '+=18', rotation: k % 2 ? 4 : -4, duration: 2.6 + k * .4, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    if (finePointer) {
      const movers = stickers.map(s => ({ d: +s.dataset.depth, x: gsap.quickTo(s, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(s, 'yPercent', { duration: 1.2, ease: 'power3' }) }));
      window.addEventListener('pointermove', e => {
        const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
        movers.forEach(m => { m.x(nx * 60 * m.d); m.y(ny * 14 * m.d); });
      });
    }
    // hero scroll-out
    gsap.to('.hero-title', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.stickers', { yPercent: -35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  };

  const heroIntro = () => {
    if (!hasGsap || reduce) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero-title .word', { yPercent: 115, duration: 1.3, stagger: .12 })
      .from('.hero-reg', { scale: 0, rotation: -180, duration: .8, ease: 'back.out(2)' }, '-=.7')
      .from('.hero-sub, .hero-actions > *', { y: 30, opacity: 0, duration: 1, stagger: .08 }, '-=1')
      .from('.sticker', { scale: 0, opacity: 0, duration: 1.1, stagger: .12, ease: 'back.out(1.6)' }, '-=1')
      .from('.nav > *, .hero-meta', { y: -20, opacity: 0, duration: .8, stagger: .05 }, '-=1.2');
  };

  /* ───────── Reel ───────── */
  const initReel = () => {
    const video = $('.reel-video'), tc = $('.hud-tc');
    safePlay(video);
    const loop = () => { tc.textContent = 'TC ' + timecode(video.currentTime); requestAnimationFrame(loop); };
    loop();
    if (!hasGsap || reduce) return;
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.reel', start: 'top top', end: 'bottom bottom', scrub: .6 } });
    tl.fromTo('.reel-frame', { clipPath: 'inset(22% 18% 22% 18% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 })
      .fromTo('.reel-video', { scale: 1.25 }, { scale: 1, ease: 'none', duration: 1 }, 0)
      .to('.hud', { opacity: 1, duration: .3 }, .65)
      .to('.reel-caption', { opacity: 0, duration: .2 }, .5);
    ScrollTrigger.create({ trigger: '.reel', start: 'top bottom', end: 'bottom top', onToggle: s => (s.isActive ? safePlay(video) : video.pause()) });
  };

  /* ───────── Section reveals ───────── */
  const initReveals = () => {
    if (!hasGsap || reduce) return;
    $$('.section-title.split').forEach(t => {
      const words = splitWords(t);
      gsap.from(words, { yPercent: 115, rotation: 4, duration: 1.1, stagger: .07, ease: 'expo.out', scrollTrigger: { trigger: t, start: 'top 85%' } });
    });
    $$('.section-intro, .chapter').forEach(el => gsap.from(el, { y: 24, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
    gsap.from('.card', { y: 80, opacity: 0, duration: 1.1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.work-grid', start: 'top 80%' } });
    gsap.from('.phone', { y: 120, opacity: 0, rotation: (i) => [-6, 0, 6][i], duration: 1.2, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.phones', start: 'top 80%' } });
    gsap.from('.tool', { y: 60, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.tools', start: 'top 85%' } });
    gsap.from('.obs > *', { y: 60, opacity: 0, duration: 1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.obs', start: 'top 80%' } });
    gsap.from('.lab > *', { y: 60, opacity: 0, duration: 1, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.lab', start: 'top 80%' } });
    gsap.from('.about-photo', { scale: .85, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.about', start: 'top 70%' } });
    // contact title
    gsap.from('.contact-title .word', { yPercent: 115, duration: 1.2, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.contact', start: 'top 70%' } });
    gsap.from('.contact-actions > *', { y: 30, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.contact-actions', start: 'top 92%' } });
    // marquee speed reacts to scroll velocity
    const track = $('.marquee-track');
    ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top', onUpdate: s => {
      const v = Math.min(Math.abs(s.getVelocity()) / 400, 5);
      track.style.animationDuration = (32 / (1 + v)) + 's';
      track.style.animationDirection = s.direction < 0 ? 'reverse' : 'normal';
    } });
  };

  /* ───────── About ───────── */
  const initAbout = () => {
    const lead = $('.about-lead');
    const text = lead.textContent.trim();
    lead.innerHTML = text.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
    const nums = $$('.stat-num');
    if (!hasGsap || reduce) { nums.forEach(n => (n.textContent = n.dataset.count)); return; }
    gsap.to($$('.w', lead), { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: lead, start: 'top 80%', end: 'bottom 40%', scrub: true } });
    nums.forEach(n => {
      const o = { v: 0 };
      gsap.to(o, { v: +n.dataset.count, duration: 1.8, ease: 'power3.out', onUpdate: () => (n.textContent = Math.round(o.v)), scrollTrigger: { trigger: n, start: 'top 90%' } });
    });
  };

  /* ───────── Hover-preview video cards ───────── */
  const initPreviews = () => {
    const items = $$('.card, .h-video');
    items.forEach(card => {
      const v = $('video', card);
      if (!v) return;
      v.addEventListener('playing', () => card.classList.add('is-playing'));
      const start = () => { ensureSrc(v); safePlay(v); };
      const stop = () => { v.pause(); card.classList.remove('is-playing'); };
      if (finePointer) {
        card.addEventListener('pointerenter', start);
        card.addEventListener('pointerleave', stop);
      } else {
        new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? start() : stop())), { threshold: .6 }).observe(card);
      }
    });
    // open films
    $$('[data-open]').forEach(el => {
      el.addEventListener('click', () => openFilm(el.dataset.open));
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFilm(el.dataset.open); } });
    });
  };

  /* ───────── Lightbox ───────── */
  const lb = $('.lightbox'), lbVideo = $('.lb-video');
  let lbIndex = 0, lastFocus = null;
  const fillFilm = key => {
    const f = FILMS[key];
    lbIndex = FILM_ORDER.indexOf(key);
    lbVideo.poster = f.poster; lbVideo.src = f.src;
    $('.lb-cat').textContent = f.cat; $('.lb-title').textContent = f.title; $('.lb-desc').textContent = f.desc;
    safePlay(lbVideo);
  };
  function openFilm(key) {
    if (!FILMS[key]) return;
    lastFocus = document.activeElement;
    lb.hidden = false;
    pauseBackground();
    fillFilm(key);
    if (lenis) lenis.stop();
    if (hasGsap && !reduce) {
      gsap.fromTo('.lb-backdrop', { opacity: 0 }, { opacity: 1, duration: .4 });
      gsap.fromTo('.lb-body', { y: 60, scale: .96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .7, ease: 'expo.out' });
    }
    $('.lb-close').focus();
  }
  const closeFilm = () => {
    if (lb.hidden) return;
    const done = () => { lb.hidden = true; lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load(); if (lenis) lenis.start(); lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true }); };
    if (hasGsap && !reduce) gsap.to('.lb-body', { y: 40, opacity: 0, duration: .3, ease: 'power2.in', onComplete: done }); else done();
  };
  const stepFilm = d => fillFilm(FILM_ORDER[(lbIndex + d + FILM_ORDER.length) % FILM_ORDER.length]);
  const initLightbox = () => {
    $('.lb-close').addEventListener('click', closeFilm);
    $('.lb-backdrop').addEventListener('click', closeFilm);
    $('.lb-prev').addEventListener('click', () => stepFilm(-1));
    $('.lb-next').addEventListener('click', () => stepFilm(1));
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeFilm();
      if (e.key === 'ArrowRight') stepFilm(1);
      if (e.key === 'ArrowLeft') stepFilm(-1);
      if (e.key === 'Tab') { // simple focus trap
        const f = $$('button, video', lb).filter(x => !x.disabled);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  };
  /* stop any sound sources when the lightbox opens */
  const pauseBackground = () => {
    resetPhones();
    const ov = $('.obs-video'); if (ov && !ov.muted) { ov.muted = true; setMuteUI(false); }
  };

  /* ───────── VTuber Lab ───────── */
  const initLab = () => {
    const list = $('.model-list'), keys = $('.hotkeys');
    const vids = $$('.vt-video'), state = $('.vt-state'), file = $('.monitor-file');
    let current = null, activeExp = 'idle', token = 0, labVisible = false;

    list.innerHTML = VTUBERS.map((m, i) => `<button class="model" role="tab" aria-selected="false" data-i="${i}" data-cursor="Load"><img src="assets/vtuber/${m.id}/full.webp" alt="" loading="lazy"><span>${m.name}</span></button>`).join('');

    const play = (src, label) => {
      const my = ++token;
      const front = vids.find(v => v.classList.contains('is-on'));
      const back = vids.find(v => v !== front);
      back.src = src; back.currentTime = 0;
      const swap = () => {
        if (my !== token) return;
        back.classList.add('is-on'); front.classList.remove('is-on');
        setTimeout(() => { if (my === token) front.pause(); }, 500);
      };
      back.addEventListener('playing', swap, { once: true });
      if (labVisible) safePlay(back); else back.addEventListener('loadeddata', swap, { once: true });
      state.textContent = '● ' + label.replace('-', ' ');
      if (hasGsap && !reduce) gsap.fromTo(state, { scale: 1.25 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
    };

    const setExp = exp => {
      activeExp = exp;
      const m = VTUBERS[current];
      play(`assets/vtuber/${m.id}/${exp === 'idle' ? 'idle' : 'exp-' + exp}.mp4`, exp);
      $$('.hotkey', keys).forEach(k => k.classList.toggle('is-active', k.dataset.exp === exp));
    };

    const load = i => {
      if (i === current) return;
      current = i;
      const m = VTUBERS[i];
      $$('.model', list).forEach((b, k) => { b.classList.toggle('is-active', k === i); b.setAttribute('aria-selected', String(k === i)); });
      file.textContent = m.file;
      $('.model-name').textContent = m.name;
      $('.model-desc').textContent = m.desc;
      $('.model-toggles').innerHTML = m.notes;
      const nums = [[$('.ms-params'), m.params], [$('.ms-phys'), m.phys], [$('.ms-exp'), m.expCount]];
      nums.forEach(([el, val]) => {
        if (!hasGsap || reduce) { el.textContent = val; return; }
        const o = { v: +el.textContent || 0 };
        gsap.to(o, { v: val, duration: .9, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v)) });
      });
      const all = ['idle', ...m.exps];
      keys.innerHTML = all.map((e, k) => `<button class="hotkey" data-exp="${e}"><img src="assets/vtuber/${m.id}/${e === 'idle' ? 'look-1-3' : 'exp-' + e}.webp" alt="" loading="lazy">${e.replace('-', ' ')}<kbd>${k}</kbd></button>`).join('');
      if (!m.exps.length) keys.insertAdjacentHTML('beforeend', '<span class="mono" style="color:var(--muted);align-self:center">Idle-only rig · tracking demo</span>');
      $$('.hotkey', keys).forEach(b => b.addEventListener('click', () => setExp(b.dataset.exp)));
      if (hasGsap && !reduce) {
        gsap.from($$('.hotkey', keys), { y: 16, opacity: 0, duration: .5, stagger: .04, ease: 'power3.out' });
        gsap.fromTo('.model-name', { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, ease: 'expo.out' });
      }
      setExp('idle');
    };

    $$('.model', list).forEach(b => b.addEventListener('click', () => load(+b.dataset.i)));

    // keyboard hotkeys while the lab is on screen
    document.addEventListener('keydown', e => {
      if (!labVisible || !lb.hidden || e.target.closest('input, textarea')) return;
      const m = VTUBERS[current], all = ['idle', ...m.exps];
      const n = parseInt(e.key, 10);
      if (!Number.isNaN(n) && n < all.length) setExp(all[n]);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') load((current + (e.key === 'ArrowRight' ? 1 : -1) + VTUBERS.length) % VTUBERS.length);
    });

    // "face tracking" crosshair follows the pointer over the monitor
    const view = $('.monitor-view'), cross = $('.track-cross'), xy = $('.track-xy');
    view.addEventListener('pointermove', e => {
      const r = view.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
      cross.style.left = nx * 100 + '%'; cross.style.top = ny * 100 + '%';
      xy.textContent = `X ${(nx * 2 - 1).toFixed(2)} · Y ${(1 - ny * 2).toFixed(2)}`;
    });
    view.addEventListener('pointerleave', () => { cross.style.left = '50%'; cross.style.top = '30%'; xy.textContent = 'X 0.00 · Y 0.00'; });

    new IntersectionObserver(es => es.forEach(e => {
      labVisible = e.isIntersecting;
      const v = vids.find(x => x.classList.contains('is-on'));
      if (current === null && labVisible) load(0);
      else if (v) labVisible ? safePlay(v) : v.pause();
    }), { threshold: .25 }).observe($('.lab'));
  };

  /* ───────── 3D horizontal scroll ───────── */
  const initHorizontal = () => {
    if (!hasGsap || reduce) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px) and (hover: hover)', () => {
      const track = $('.h-track');
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.threed', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1 }
      });
      $$('.h-img-in img').forEach(img => {
        if (img.closest('.light')) return;
        gsap.fromTo(img, { xPercent: -6, scale: 1.15 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.h-panel'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return () => gsap.set(track, { clearProps: 'all' });
    });
  };

  /* ───────── Phones ───────── */
  let resetPhones = () => {};
  const initPhones = () => {
    const phones = $$('.phone');
    const toPreview = p => {
      const v = $('video', p);
      p.classList.remove('is-loud');
      $('.phone-sound', p).textContent = '🔇 tap for sound';
      if (v.dataset.mode === 'full') { v.src = v.dataset.src; v.dataset.mode = 'prev'; }
      v.muted = true; v.loop = true;
    };
    resetPhones = () => phones.forEach(p => { if (p.classList.contains('is-loud')) { toPreview(p); if (!inView) $('video', p).pause(); else safePlay($('video', p)); } });
    let inView = false;
    phones.forEach(p => {
      const v = $('video', p);
      p.addEventListener('click', () => {
        if (p.classList.contains('is-loud')) { toPreview(p); safePlay(v); return; }
        phones.forEach(o => { if (o !== p && o.classList.contains('is-loud')) { toPreview(o); safePlay($('video', o)); } });
        const ov = $('.obs-video'); if (!ov.muted) { ov.muted = true; setMuteUI(false); }
        v.src = p.dataset.full; v.dataset.mode = 'full'; v.muted = false; v.loop = false; v.currentTime = 0;
        p.classList.add('is-loud');
        $('.phone-sound', p).textContent = '🔊 playing · tap to mute';
        safePlay(v);
        v.onended = () => { toPreview(p); safePlay(v); };
      });
      if (finePointer && hasGsap && !reduce) {
        p.addEventListener('pointerenter', () => gsap.to(p, { y: -14, duration: .5, ease: 'power3.out' }));
        p.addEventListener('pointerleave', () => gsap.to(p, { y: 0, duration: .6, ease: 'power3.out' }));
      }
    });
    new IntersectionObserver(es => es.forEach(e => {
      inView = e.isIntersecting;
      phones.forEach(p => { const v = $('video', p); if (inView) { ensureSrc(v); safePlay(v); } else { if (p.classList.contains('is-loud')) toPreview(p); v.pause(); } });
    }), { threshold: .3 }).observe($('.phones'));
  };

  /* ───────── OBS scene switcher ───────── */
  let setMuteUI = () => {};
  const initObs = () => {
    const video = $('.obs-video'), name = $('.obs-scene-name'), wipe = $('.obs-wipe');
    const scenes = $$('.scene'), bar = $('.obs-progress i'), mute = $('.obs-mute');
    let idx = 0, inView = false, started = false;
    if (hasGsap) gsap.set(wipe, { xPercent: -101, visibility: 'visible' });
    setMuteUI = loud => { mute.setAttribute('aria-pressed', String(loud)); mute.textContent = loud ? '🔊 Mute' : '🔇 Unmute'; };
    const srcOf = i => `assets/video/ov-${scenes[i].dataset.scene}.mp4`;
    const go = (i, animate = true) => {
      idx = (i + scenes.length) % scenes.length;
      scenes.forEach((s, k) => { s.classList.toggle('is-active', k === idx); s.setAttribute('aria-selected', String(k === idx)); });
      const swap = () => { video.src = srcOf(idx); video.poster = `assets/poster/ov-${scenes[idx].dataset.scene}.jpg`; name.textContent = scenes[idx].dataset.label; if (inView) safePlay(video); };
      if (animate && hasGsap && !reduce) {
        gsap.timeline()
          .set(wipe, { xPercent: -101 })
          .to(wipe, { xPercent: 0, duration: .32, ease: 'power3.in' })
          .add(swap)
          .to(wipe, { xPercent: 101, duration: .45, ease: 'power3.out', delay: .05 });
      } else swap();
    };
    scenes.forEach((s, i) => s.addEventListener('click', () => go(i)));
    video.addEventListener('ended', () => go(idx + 1));
    video.addEventListener('timeupdate', () => { if (video.duration) bar.style.transform = `scaleX(${video.currentTime / video.duration})`; });
    mute.addEventListener('click', () => {
      video.muted = !video.muted; setMuteUI(!video.muted);
      if (!video.muted) { resetPhones(); safePlay(video); }
    });
    document.addEventListener('keydown', e => {
      if (!inView || !lb.hidden) return;
      const m = /^F([1-4])$/.exec(e.key);
      if (m) { e.preventDefault(); go(+m[1] - 1); }
    });
    new IntersectionObserver(es => es.forEach(e => {
      inView = e.isIntersecting;
      if (inView && !started) { started = true; go(0, false); }
      else if (inView) safePlay(video);
      else { video.pause(); if (!video.muted) { video.muted = true; setMuteUI(false); } }
    }), { threshold: .3 }).observe($('.obs'));
  };

  /* ───────── Skills keyframes ───────── */
  const initSkills = () => {
    $$('.skill').forEach(s => {
      const lvl = +s.dataset.level, keys = $('.keys', s);
      keys.innerHTML = '<i></i>'.repeat(7);
      const is = $$('i', keys);
      const light = () => is.forEach((el, k) => {
        if (k >= lvl) return;
        setTimeout(() => { el.classList.add('on'); if (k === lvl - 1) el.classList.add('last-on'); }, reduce ? 0 : k * 110);
      });
      if (!hasGsap || reduce) { light(); return; }
      ScrollTrigger.create({ trigger: s, start: 'top 85%', once: true, onEnter: light });
    });
  };

  /* ───────── Experience line ───────── */
  const initExp = () => {
    if (!hasGsap || reduce) { $('.exp-line i').style.transform = 'scaleY(1)'; return; }
    gsap.to('.exp-line i', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.exp-wrap', start: 'top 70%', end: 'bottom 70%', scrub: true } });
    $$('.exp-item').forEach(it => gsap.from(it, { x: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: it, start: 'top 85%' } }));
  };

  /* ───────── Contact ───────── */
  const initContact = () => {
    const pill = $('.email-pill');
    pill.addEventListener('click', async () => {
      const email = pill.dataset.email;
      try { await navigator.clipboard.writeText(email); }
      catch { const t = document.createElement('textarea'); t.value = email; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch {} t.remove(); }
      pill.classList.add('copied');
      setTimeout(() => pill.classList.remove('copied'), 1800);
    });
  };

  /* ───────── Timeline scrubber ───────── */
  const initTimeline = () => {
    const tl = $('.timeline'), track = $('.tl-track'), fill = $('.tl-fill'), head = $('.tl-head'), tcEl = $('.tl-tc'), keysEl = $('.tl-keys');
    const DURATION = 180; // the page "runs" 3 minutes at 30fps
    const chapters = $$('[data-chapter]');
    const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
    let keys = [];
    const layoutKeys = () => {
      keysEl.innerHTML = '';
      keys = chapters.map(sec => {
        const y = Math.min(sec.getBoundingClientRect().top + scrollY, maxScroll());
        const k = document.createElement('button');
        k.className = 'tl-key'; k.dataset.label = sec.dataset.chapter; k.setAttribute('aria-label', 'Jump to ' + sec.dataset.chapter);
        k.style.left = (y / maxScroll()) * 100 + '%';
        k.addEventListener('pointerdown', e => e.stopPropagation());
        k.addEventListener('click', () => scrollToY(y));
        keysEl.appendChild(k);
        return { el: k, y };
      });
    };
    const render = y => {
      const p = Math.min(1, Math.max(0, y / maxScroll()));
      fill.style.transform = `translateY(-50%) scaleX(${p})`;
      head.style.left = p * 100 + '%';
      tcEl.textContent = timecode(p * DURATION);
      track.setAttribute('aria-valuenow', Math.round(p * 100));
      keys.forEach(k => k.el.classList.toggle('passed', y >= k.y - 2));
    };
    if (lenis) lenis.on('scroll', e => render(e.scroll)); else window.addEventListener('scroll', () => render(scrollY), { passive: true });
    if (hasGsap) ScrollTrigger.addEventListener('refresh', () => { layoutKeys(); render(scrollY); });
    layoutKeys(); render(scrollY);

    // drag to scrub
    let dragging = false;
    const seek = (e, immediate) => {
      const r = track.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      scrollToY(p * maxScroll(), immediate);
    };
    track.addEventListener('pointerdown', e => { dragging = true; track.setPointerCapture(e.pointerId); seek(e, true); });
    track.addEventListener('pointermove', e => dragging && seek(e, true));
    const end = () => (dragging = false);
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    track.addEventListener('keydown', e => {
      const step = innerHeight * .8;
      if (e.key === 'ArrowRight') { e.preventDefault(); scrollToY(scrollY + step); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToY(scrollY - step); }
    });
    // tuck the timeline away over the contact section so it never covers the footer
    if (hasGsap) ScrollTrigger.create({ trigger: '.footer', start: 'top bottom', end: 'bottom bottom', onToggle: s => tl.classList.toggle('is-away', s.isActive) });
  };

  /* ───────── Boot ───────── */
  const boot = async () => {
    clock();
    initScroll();
    if (lenis) lenis.stop();
    initAnchors();
    initCursor();
    initMagnetic();
    initScramble();
    initHero();
    initReel();
    initAbout();
    initPreviews();
    initLightbox();
    initLab();
    initHorizontal();
    initReveals();
    initPhones();
    initObs();
    initSkills();
    initExp();
    initContact();
    initNav();
    initTimeline();
    await preload();
    if (lenis) lenis.start();
    root.classList.add('is-ready');
    heroIntro();
    if (hasGsap) {
      ScrollTrigger.refresh();
      window.addEventListener('load', () => ScrollTrigger.refresh());
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
