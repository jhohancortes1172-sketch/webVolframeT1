    /* =========================================================
       JAVASCRIPT · VOLFRAME
       ========================================================= */
    document.addEventListener('DOMContentLoaded', () => {

      /* ---- Rastro fluido del puntero ---- */
      const fluidCanvas = document.getElementById('fluid');
      const fluidMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const finePointer = window.matchMedia('(pointer: fine)');
      if (fluidCanvas instanceof HTMLCanvasElement && !fluidMotion.matches && finePointer.matches) {
        const fluidContext = fluidCanvas.getContext('2d');
        if (!fluidContext) {
          console.warn('No se pudo inicializar el efecto de fluido: Canvas 2D no está disponible.');
        } else {
          const fluidConfig = {
            DENSITY_DISSIPATION: 3.5,
            SPLAT_RADIUS: 0.5,
            SPLAT_FORCE: 6000,
            COLOR_UPDATE_SPEED: 10,
            MAX_DPR: 1.5
          };
          let width = 0;
          let height = 0;
          let lastPointer = null;
          let lastActivity = 0;
          let lastFrameTime = 0;
          let frameId = 0;

          function resizeFluidCanvas() {
            const pixelRatio = Math.min(window.devicePixelRatio || 1, fluidConfig.MAX_DPR);
            width = window.innerWidth;
            height = window.innerHeight;
            fluidCanvas.width = Math.round(width * pixelRatio);
            fluidCanvas.height = Math.round(height * pixelRatio);
            fluidContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            lastPointer = null;
          }

          function drawSplat(x, y, angle, speed, hue) {
            const baseRadius = Math.min(68, Math.max(18, Math.min(width, height) * fluidConfig.SPLAT_RADIUS * .1));
            const force = Math.min(2.2, 1 + speed / 80) * fluidConfig.SPLAT_FORCE / 6000;
            const radius = baseRadius * force;

            fluidContext.save();
            fluidContext.translate(x, y);
            fluidContext.rotate(angle);
            fluidContext.scale(1 + Math.min(speed / 100, 1.2), .72);
            const gradient = fluidContext.createRadialGradient(0, 0, 0, 0, 0, radius);
            gradient.addColorStop(0, `hsla(${hue}, 100%, 72%, .28)`);
            gradient.addColorStop(.35, `hsla(${(hue + 24) % 360}, 95%, 58%, .16)`);
            gradient.addColorStop(1, `hsla(${hue}, 90%, 50%, 0)`);
            fluidContext.fillStyle = gradient;
            fluidContext.beginPath();
            fluidContext.arc(0, 0, radius, 0, Math.PI * 2);
            fluidContext.fill();
            fluidContext.restore();
          }

          function animateFluid(now) {
            const deltaTime = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, .05) : 1 / 60;
            lastFrameTime = now;
            const fade = 1 - Math.exp(-fluidConfig.DENSITY_DISSIPATION * deltaTime);
            fluidContext.globalCompositeOperation = 'destination-out';
            fluidContext.fillStyle = `rgba(0, 0, 0, ${fade})`;
            fluidContext.fillRect(0, 0, width, height);
            fluidContext.globalCompositeOperation = 'source-over';

            if (now - lastActivity > 2400) {
              fluidContext.clearRect(0, 0, width, height);
              frameId = 0;
              lastFrameTime = 0;
              return;
            }
            frameId = window.requestAnimationFrame(animateFluid);
          }

          function onPointerMove(event) {
            if (event.pointerType === 'touch') return;
            const point = { x: event.clientX, y: event.clientY };
            const now = performance.now();
            const hue = (now / 1000 * fluidConfig.COLOR_UPDATE_SPEED * 6) % 360;

            if (lastPointer) {
              const dx = point.x - lastPointer.x;
              const dy = point.y - lastPointer.y;
              const distance = Math.hypot(dx, dy);
              const steps = Math.max(1, Math.ceil(distance / 12));
              for (let step = 1; step <= steps; step++) {
                const progress = step / steps;
                drawSplat(
                  lastPointer.x + dx * progress,
                  lastPointer.y + dy * progress,
                  Math.atan2(dy, dx),
                  distance / steps,
                  hue
                );
              }
            } else {
              drawSplat(point.x, point.y, 0, 0, hue);
            }

            lastPointer = point;
            lastActivity = now;
            if (!frameId) frameId = window.requestAnimationFrame(animateFluid);
          }

          resizeFluidCanvas();
          window.addEventListener('resize', resizeFluidCanvas, { passive: true });
          window.addEventListener('pointermove', onPointerMove, { passive: true });
          window.addEventListener('blur', () => { lastPointer = null; });
        }
      }

      /* ---- Sonido de interacción de la interfaz ---- */
      const uiSound = new Audio('audio/soundeffectswitch.mp3');
      uiSound.preload = 'auto';
      document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element) || !target.closest('button, a[href], [role="button"], .work-card, .team-card, .star-rating label')) return;

        uiSound.currentTime = 0;
        uiSound.play().catch((error) => console.warn('No se pudo reproducir el sonido de la interfaz:', error));
      });

      /* ---- Año automático en el footer ---- */
      document.getElementById('year').textContent = new Date().getFullYear();

      /* ---- Navbar: efecto al hacer scroll + enlace activo ---- */
      const nav = document.getElementById('mainNav');
      const toTop = document.getElementById('toTop');
      const links = document.querySelectorAll('.navbar-vf .nav-link');
      const sections = [...links].map(l => document.querySelector(l.getAttribute('href')));

      function onScroll() {
        nav.classList.toggle('scrolled', window.scrollY > 40);
        toTop.classList.toggle('show', window.scrollY > 500);
        const pos = window.scrollY + 140;
        sections.forEach((sec, i) => {
          if (sec && sec.offsetTop <= pos && sec.offsetTop + sec.offsetHeight > pos) {
            links.forEach(l => l.classList.remove('active'));
            links[i].classList.add('active');
          }
        });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

      /* ---- Cerrar menú móvil al elegir un enlace ---- */
      const navMenu = document.getElementById('navMenu');
      links.forEach(l => l.addEventListener('click', () => {
        if (navMenu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(navMenu).hide();
      }));

      /* ---- Animaciones de aparición al hacer scroll ---- */
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
      }, { threshold: .12 });
      document.querySelectorAll('.reveal').forEach(el => io.observe(el));

      /* ---- Video del hero: sonido on/off + pausa fuera de pantalla ---- */
      const heroVideo = document.getElementById('heroVideo');
      const heroSound = document.getElementById('heroSound');
      if (heroVideo && heroSound) {
        heroSound.addEventListener('click', () => {
          heroVideo.muted = !heroVideo.muted;
          if (!heroVideo.muted) heroVideo.play().catch(() => {});
          const on = !heroVideo.muted;
          heroSound.classList.toggle('on', on);
          heroSound.setAttribute('aria-pressed', on);
          heroSound.setAttribute('aria-label', on ? 'Silenciar' : 'Activar sonido');
          heroSound.querySelector('i').className = 'bi ' + (on ? 'bi-volume-up-fill' : 'bi-volume-mute-fill');
        });
        // Solo reproduce mientras el video está visible
        new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) heroVideo.play().catch(() => {});
          else heroVideo.pause();
        }, { threshold: .25 }).observe(heroVideo);
      }

      /* ---- Filtros del portafolio ---- */
      const filterBtns = document.querySelectorAll('.filter-btn');
      const items = document.querySelectorAll('.portfolio-item');
      filterBtns.forEach(btn => btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        items.forEach(it => {
          const show = f === 'all' || it.dataset.category === f;
          if (show) {
            it.classList.remove('d-none');
            requestAnimationFrame(() => it.classList.remove('hide'));
          } else {
            it.classList.add('hide');
            setTimeout(() => { if (it.classList.contains('hide')) it.classList.add('d-none'); }, 350);
          }
        });
      }));

      /* ---- Toast de éxito ---- */
      const toastEl = document.getElementById('successToast');
      function showToast(msg) {
        document.getElementById('toastMsg').textContent = msg;
        bootstrap.Toast.getOrCreateInstance(toastEl).show();
      }

      /* ---- Utilidad de validación ---- */
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      function validateField(el) {
        let ok = el.checkValidity();
        if (el.type === 'email') ok = emailRx.test(el.value.trim());
        if (el.tagName === 'TEXTAREA' || el.type === 'text') ok = ok && el.value.trim().length >= (el.minLength > 0 ? el.minLength : 1);
        el.classList.toggle('is-invalid', !ok);
        el.classList.toggle('is-valid', ok);
        return ok;
      }
      function attachLiveValidation(form) {
        form.querySelectorAll('.form-control, .form-select').forEach(el => {
          el.addEventListener('blur', () => validateField(el));
          el.addEventListener('input', () => { if (el.classList.contains('is-invalid')) validateField(el); });
        });
      }

      /* ---- Contador de caracteres del buzón ---- */
      const sgMessage = document.getElementById('sgMessage');
      sgMessage.addEventListener('input', () => { document.getElementById('charNum').textContent = sgMessage.value.length; });

      /* ---- BUZÓN DE SUGERENCIAS ---- */
      const sgForm = document.getElementById('suggestionForm');
      attachLiveValidation(sgForm);
      sgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;
        sgForm.querySelectorAll('.form-control, .form-select').forEach(el => { if (!validateField(el)) valid = false; });
        const rating = sgForm.querySelector('input[name="rating"]:checked');
        document.getElementById('ratingError').classList.toggle('d-none', !!rating);
        if (!rating) valid = false;
        if (!valid) return;

        const data = {
          nombre: sgForm.sgName.value.trim(),
          correo: sgForm.sgEmail.value.trim(),
          tipo: sgForm.sgType.value,
          valoracion: Number(rating.value),
          mensaje: sgForm.sgMessage.value.trim()
        };
        handleSuggestion(data);
        showToast('¡Gracias por tu opinión, ' + data.nombre.split(' ')[0] + '! La recibimos con éxito.');
        sgForm.reset();
        sgForm.querySelectorAll('.is-valid,.is-invalid').forEach(el => el.classList.remove('is-valid', 'is-invalid'));
        document.getElementById('charNum').textContent = '0';
      });

      /* AQUÍ CONECTAR EL ENVÍO REAL (Formspree, EmailJS, Google Apps Script, backend propio):
         fetch('https://formspree.io/f/TU_ID', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }); */
      function handleSuggestion(data) { console.log('Sugerencia recibida:', data); }

      /* ---- FORMULARIO DE CONTACTO ---- */
      const ctForm = document.getElementById('contactForm');
      attachLiveValidation(ctForm);
      ctForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;
        ctForm.querySelectorAll('.form-control, .form-select').forEach(el => { if (!validateField(el)) valid = false; });
        if (!valid) return;

        const data = {
          nombre: ctForm.ctName.value.trim(),
          correo: ctForm.ctEmail.value.trim(),
          asunto: ctForm.ctSubject.value,
          mensaje: ctForm.ctMessage.value.trim()
        };
        handleContact(data);
        showToast('Mensaje enviado. ¡Te contactaremos muy pronto!');
        ctForm.reset();
        ctForm.querySelectorAll('.is-valid,.is-invalid').forEach(el => el.classList.remove('is-valid', 'is-invalid'));
      });

      /* AQUÍ CONECTAR EL ENVÍO REAL del formulario de contacto (igual que el buzón). */
      function handleContact(data) { console.log('Contacto recibido:', data); }
    });
