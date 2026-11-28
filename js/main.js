    /* =========================================================
       JAVASCRIPT · VOLFRAME
       ========================================================= */
    document.addEventListener('DOMContentLoaded', () => {

      /* ---- Sonido de interacción de la interfaz ---- */
      const uiSound = new Audio('audio/Nintendo-Switch-Snap-Sound-Effect-_with-end-pad-for-editors_.mp3');
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
