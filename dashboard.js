/**
 * DiagnosTech — Student Dashboard
 * Navbar, user menu, appointments, notifications, and toasts.
 */

const DashboardApp = (() => {
  'use strict';

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
        const top = section.offsetTop - 140;
        if (window.scrollY >= top) {
          current = section.id;
        }
      });

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

  /* ---------- Appointments Module ---------- */
  const Appointments = {
    init() {
      this.list = document.getElementById('appointmentList');
      if (!this.list) return;

      this.list.addEventListener('click', (e) => {
        const cancelBtn = e.target.closest('.appointment-cancel');
        const rescheduleBtn = e.target.closest('.appointment-reschedule');

        if (cancelBtn) {
          const item = cancelBtn.closest('.appointment-item');
          this.cancel(item);
        }

        if (rescheduleBtn) {
          const item = rescheduleBtn.closest('.appointment-item');
          const title = item.querySelector('h3')?.textContent ?? 'appointment';
          Toast.show(`Reschedule flow opened for "${title}".`);
        }
      });
    },

    cancel(item) {
      if (!item || !confirm('Cancel this appointment?')) return;

      item.classList.add('removing');
      setTimeout(() => {
        item.remove();
        this.updateStatCount();
        Toast.show('Appointment cancelled successfully.');
      }, 300);
    },

    updateStatCount() {
      const count = this.list.querySelectorAll('.appointment-item').length;
      const statValue = document.querySelector('.stat-card__value');
      const statCards = document.querySelectorAll('.stat-card');

      if (statCards[0]) {
        statCards[0].querySelector('.stat-card__value').textContent = count;
      }
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

  /* ---------- App Bootstrap ---------- */
  return {
    init() {
      Toast.init();
      Theme.init();
      Navbar.init();
      UserMenu.init();
      Greeting.init();
      ScrollReveal.init();
      Appointments.init();
      Notifications.init();
    },
  };
})();

document.addEventListener('DOMContentLoaded', () => DashboardApp.init());
