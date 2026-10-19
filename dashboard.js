/**
 * DiagnosTech — Student Dashboard
 * Navbar, user menu, appointments, notifications, and toasts.
 */

const DashboardApp = (() => {
  'use strict';

  /* Local (not UTC) YYYY-MM-DD, so "today" is correct in this timezone */
  const localISODate = (d = new Date()) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const addDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return localISODate(d);
  };

  /* Escape user-supplied text before it goes into innerHTML */
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

  const DEPARTMENTS = {
    general: 'General Medicine',
    cardiology: 'Cardiology',
    neurology: 'Neurology',
    orthopedics: 'Orthopedics',
    ophthalmology: 'Ophthalmology',
    'mental-health': 'Mental Health',
  };

  /* ---------- Theme Module ---------- */
  const Theme = {
    key: 'diagnostech-theme',

    init() {
      this.root = document.documentElement;
      this.toggles = document.querySelectorAll('[data-theme-toggle]');
      this.apply(this.get());

      this.toggles.forEach((toggle) => {
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggle();
        });
      });
    },

    get() {
      try {
        const stored = localStorage.getItem(this.key);
        if (stored === 'dark' || stored === 'light') return stored;
      } catch (e) { /* ignore */ }

      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    apply(theme) {
      this.root.setAttribute('data-theme', theme);
      const isDark = theme === 'dark';

      this.toggles.forEach((toggle) => {
        toggle.setAttribute('aria-pressed', String(isDark));
        if (toggle.classList.contains('theme-toggle')) {
          toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        }
      });
    },

    toggle() {
      const next = this.root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(this.key, next);
      } catch (e) { /* ignore */ }
      this.apply(next);
    },
  };

  /* ---------- Navbar Module ---------- */
  const Navbar = {
    init() {
      this.navbar = document.getElementById('navbar');
      this.toggle = document.getElementById('navToggle');
      this.links = document.getElementById('navLinks');
      this.navAnchors = this.links?.querySelectorAll('a') ?? [];

      if (!this.navbar) return;

      this.toggle.addEventListener('click', () => this.toggleMenu());
      this.navAnchors.forEach((link) => {
        link.addEventListener('click', () => this.closeMenu());
      });

      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      window.addEventListener('resize', () => {
        if (window.innerWidth > 1120) this.closeMenu();
      });
      this.onScroll();
    },

    toggleMenu() {
      const isOpen = this.links.classList.toggle('open');
      this.toggle.classList.toggle('active', isOpen);
      this.toggle.setAttribute('aria-expanded', isOpen);
    },

    closeMenu() {
      this.links.classList.remove('open');
      this.toggle.classList.remove('active');
      this.toggle.setAttribute('aria-expanded', 'false');
    },

    onScroll() {
      this.navbar.classList.toggle('navbar--scrolled', window.scrollY > 40);
      this.highlightActiveSection();
    },

    highlightActiveSection() {
      const sections = document.querySelectorAll('section[id]');
      let current = 'overview';

      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= 140) {
          current = section.id;
        }
      });

      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && sections.length) current = sections[sections.length - 1].id;

      this.navAnchors.forEach((link) => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === `#${current}`);
      });
    },
  };

  /* ---------- User Menu Module ---------- */
  const UserMenu = {
    init() {
      this.menu = document.getElementById('userMenu');
      this.btn = document.getElementById('userMenuBtn');
      if (!this.menu || !this.btn) return;

      this.btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });

      document.addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    },

    toggle() {
      const isOpen = this.menu.classList.toggle('open');
      this.btn.setAttribute('aria-expanded', isOpen);
    },

    close() {
      this.menu.classList.remove('open');
      this.btn.setAttribute('aria-expanded', 'false');
    },
  };

  /* ---------- Greeting Module ---------- */
  const Greeting = {
    init() {
      this.el = document.getElementById('greeting');
      if (!this.el) return;

      const hour = new Date().getHours();
      let text = 'Good evening';

      if (hour < 12) text = 'Good morning';
      else if (hour < 17) text = 'Good afternoon';

      this.el.textContent = text;
    },
  };

  /* ---------- Scroll Reveal Module ---------- */
  const ScrollReveal = {
    init() {
      this.elements = document.querySelectorAll('.reveal');
      if (!this.elements.length) return;

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              this.observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
      );

      this.elements.forEach((el) => this.observer.observe(el));
    },
  };

  /* ---------- Toast Module ---------- */
  const Toast = {
    init() {
      this.el = document.getElementById('toast');
      this.timer = null;
    },

    show(message) {
      if (!this.el) return;

      clearTimeout(this.timer);
      this.el.textContent = message;
      this.el.classList.add('visible');

      this.timer = setTimeout(() => {
        this.el.classList.remove('visible');
      }, 3000);
    },
  };

  /* ---------- Booking Modal Module (patient dashboard only) ---------- */
  const BookingModal = {
    init() {
      this.root = document.getElementById('apptModal');
      if (!this.root) return;

      this.form = document.getElementById('apptForm');
      this.titleEl = document.getElementById('apptModalTitle');
      this.statusEl = document.getElementById('apptFormStatus');
      this.dialog = this.root.querySelector('.modal__dialog');

      this.root.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-modal]')) this.close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.root.hidden) this.close();
      });
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    open({ title, defaults = {}, onSubmit }) {
      if (!this.root) return;

      const today = localISODate();
      this.titleEl.textContent = title;
      this.statusEl.textContent = '';
      this.statusEl.className = 'form-status';
      this.form.reset();

      this.form.department.value = defaults.department || 'general';
      this.form.visitType.value = defaults.visitType || 'in-person';
      this.form.doctor.value = (defaults.doctor && defaults.doctor !== 'Next available') ? defaults.doctor : '';
      this.form.date.min = today;
      this.form.date.value = defaults.date && defaults.date >= today ? defaults.date : today;
      this.form.time.value = defaults.time || '';

      this.onSubmit = onSubmit;
      this.root.hidden = false;
      document.body.classList.add('modal-open');
      this.dialog.focus();
    },

    close() {
      if (!this.root) return;
      this.root.hidden = true;
      document.body.classList.remove('modal-open');
    },

    handleSubmit(e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this.form).entries());

      if (!data.date || !data.time) {
        this.statusEl.textContent = 'Please choose a date and time.';
        this.statusEl.className = 'form-status error';
        return;
      }

      this.onSubmit?.(data);
      this.close();
    },
  };

  /* ---------- Appointments Module ---------- */
  const Appointments = {
    init() {
      this.list = document.getElementById('appointmentList');
      this.role = document.body.dataset.role;
      this.isPatient = this.role === 'patient';
      if (!this.list) return;

      if (this.isPatient) {
        this.uid = Session.user.id;
        this.items = [];
        this.loaded = false;

        AppointmentStore.seedIfEmpty(this.uid, [
          { department: 'general', title: 'General Medicine Consultation', doctor: 'Rizal Park', visitType: 'in-person', date: addDays(0), time: '10:30 AM', room: 'Room B-204' },
          { department: 'mental-health', title: 'Telehealth — Mental Health', doctor: 'Lebleb Macalintal', visitType: 'telehealth', date: addDays(5), time: '2:00 PM', room: 'Online' },
        ]).catch((err) => console.error('Seed failed:', err));

        this.render();
        AppointmentStore.watch(this.uid, (items) => {
          this.items = items;
          this.loaded = true;
          this.render();
        });

        document.querySelectorAll('[data-open-booking]').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal();
          });
        });
      }

      this.list.addEventListener('click', (e) => {
        const cancelBtn = e.target.closest('.appointment-cancel');
        const rescheduleBtn = e.target.closest('.appointment-reschedule');
        const joinBtn = e.target.closest('.appointment-join');

        if (cancelBtn) this.cancel(cancelBtn.closest('.appointment-item'));

        if (rescheduleBtn) {
          const item = rescheduleBtn.closest('.appointment-item');
          if (this.isPatient) {
            this.openModal(item.dataset.id);
          } else {
            const title = item.querySelector('h3')?.textContent ?? 'appointment';
            Toast.show(`Reschedule flow opened for "${title}".`);
          }
        }

        if (joinBtn) Toast.show('Connecting to your telehealth room…');
      });
    },

    render() {
      const items = (this.items || [])
        .slice()
        .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));

      this.list.innerHTML = '';

      if (!this.loaded) {
        const li = document.createElement('li');
        li.className = 'appointment-empty';
        li.textContent = 'Loading appointments…';
        this.list.appendChild(li);
      } else if (!items.length) {
        const li = document.createElement('li');
        li.className = 'appointment-empty';
        li.textContent = 'No upcoming appointments.';
        this.list.appendChild(li);
      } else {
        items.forEach((a) => this.list.appendChild(this.buildItem(a)));
      }

      const statCards = document.querySelectorAll('.stat-card');
      if (statCards[0]) statCards[0].querySelector('.stat-card__value').textContent = this.loaded ? items.length : '—';
    },

    buildItem(a) {
      const li = document.createElement('li');
      li.className = 'appointment-item';
      li.dataset.id = a.id;

      const d = new Date(`${a.date}T00:00:00`);
      const day = Number.isNaN(d.getTime()) ? '--' : d.getDate();
      const month = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short' });
      const weekday = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const isTele = a.visitType === 'telehealth';

      li.innerHTML = `
        <div class="appointment-item__date${isTele ? ' appointment-item__date--telehealth' : ''}">
          <strong>${day}</strong>
          <span>${esc(month)}</span>
        </div>
        <div class="appointment-item__info">
          <h3>${esc(a.title)}</h3>
          <p>Dr. ${esc(a.doctor || 'Next available')} · ${isTele ? 'Video Consultation' : 'Campus Health Center'}</p>
          <span class="appointment-item__time">${esc(weekday)}, ${esc(a.time || '')} · ${esc(a.room || (isTele ? 'Online' : 'TBD'))}</span>
        </div>
        <div class="appointment-item__actions">
          ${isTele
            ? '<button class="btn btn--primary btn--sm appointment-join" type="button">Join Call</button>'
            : '<button class="btn btn--outline btn--sm appointment-reschedule" type="button">Reschedule</button><button class="btn btn--ghost btn--sm appointment-cancel" type="button">Cancel</button>'}
        </div>
      `;
      return li;
    },

    cancel(item) {
      if (!item || !confirm('Cancel this appointment?')) return;
      const id = item.dataset.id;

      item.classList.add('removing');
      setTimeout(() => {
        if (this.isPatient) {
          AppointmentStore.remove(this.uid, id)
            .then(() => Toast.show('Appointment cancelled successfully.'))
            .catch(() => Toast.show('Could not cancel — check your connection.'));
          return;
        } else {
          item.remove();
          const count = this.list.querySelectorAll('.appointment-item').length;
          const statCards = document.querySelectorAll('.stat-card');
          if (statCards[0]) statCards[0].querySelector('.stat-card__value').textContent = count;
          if (!count && !this.list.querySelector('.appointment-empty')) {
            const li = document.createElement('li');
            li.className = 'appointment-empty';
            li.textContent = 'No upcoming appointments.';
            this.list.appendChild(li);
          }
        }
        Toast.show('Appointment cancelled successfully.');
      }, 300);
    },

    openModal(editId) {
      const editing = editId ? (this.items || []).find((a) => a.id === editId) : null;

      BookingModal.open({
        title: editing ? 'Reschedule appointment' : 'Book an appointment',
        defaults: editing || {},
        onSubmit: (data) => {
          const label = DEPARTMENTS[data.department] || 'General Medicine';
          const payload = {
            department: data.department,
            title: data.visitType === 'telehealth' ? `Telehealth — ${label}` : `${label} Consultation`,
            doctor: (data.doctor || '').trim() || 'Next available',
            visitType: data.visitType,
            date: data.date,
            time: data.time,
            room: data.visitType === 'telehealth' ? 'Online' : 'Room B-204',
          };

          const action = editing
            ? AppointmentStore.update(this.uid, editing.id, payload).then(() => 'Appointment rescheduled successfully.')
            : AppointmentStore.add(this.uid, payload).then(() => 'Appointment booked successfully.');

          action
            .then((msg) => Toast.show(msg))
            .catch(() => Toast.show('Could not save — check your connection.'));
        },
      });
    },
  };

  /* ---------- Preview Module (features not yet wired to real data) ---------- */
  const StaticPreview = {
    init() {
      const selector = [
        'a.quick-action[href="#"]:not([data-open-booking])',
        '.dashboard-card__link[href="#"]',
        '.record-item .btn',
      ].join(',');

      document.querySelectorAll(selector).forEach((el) => {
        el.addEventListener('click', (e) => {
          if (el.tagName === 'A') e.preventDefault();
          Toast.show('This feature is coming soon.');
        });
      });
    },
  };

  /* ---------- Notifications Module ---------- */
  const Notifications = {
    init() {
      this.list = document.getElementById('notificationList');
      this.markAllBtn = document.getElementById('markAllRead');

      this.markAllBtn?.addEventListener('click', () => this.markAllRead());
    },

    markAllRead() {
      const unread = this.list?.querySelectorAll('.notification-item--unread');
      if (!unread?.length) {
        Toast.show('No unread notifications.');
        return;
      }

      unread.forEach((item) => item.classList.remove('notification-item--unread'));

      const statCards = document.querySelectorAll('.stat-card');
      if (statCards[2]) {
        statCards[2].querySelector('.stat-card__value').textContent = '0';
      }

      Toast.show('All notifications marked as read.');
    },
  };

  /* ---------- Session Module ---------- */
  const Session = {
    init() {
      if (typeof Auth === 'undefined') {
        window.location.replace('login.html');
        return false;
      }

      const user = Auth.guard(document.body.dataset.role);
      if (!user) return false;

      this.user = user;
      Auth.applyUser(user);
      document.querySelectorAll('[data-signout]').forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          Auth.logout();
        });
      });
      return true;
    },
  };

  /* ---------- App Bootstrap ---------- */
  return {
    init() {
      if (!Session.init()) return;
      Toast.init();
      Theme.init();
      Navbar.init();
      UserMenu.init();
      Greeting.init();
      ScrollReveal.init();
      BookingModal.init();
      Appointments.init();
      Notifications.init();
      StaticPreview.init();
    },
  };
})();

document.addEventListener('DOMContentLoaded', () => DashboardApp.init());
