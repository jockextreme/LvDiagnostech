/**
 * DiagnosTech — Authentication Page
 * Navbar, scroll reveal, login form, and password toggle.
 */

const AuthApp = (() => {
  'use strict';

  /* ---------- Navbar Module ---------- */
  const Navbar = {
    init() {
      this.navbar = document.getElementById('navbar');
      this.toggle = document.getElementById('navToggle');
      this.links = document.getElementById('navLinks');

      if (!this.navbar) return;

      this.toggle.addEventListener('click', () => this.toggleMenu());
      this.links.querySelectorAll('a').forEach((link) => {
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
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );

      this.elements.forEach((el) => this.observer.observe(el));
    },
  };

  /* ---------- Password Toggle Module ---------- */
  const PasswordToggle = {
    init() {
      this.input = document.getElementById('password');
      this.btn = document.getElementById('passwordToggle');
      if (!this.input || !this.btn) return;

      this.btn.addEventListener('click', () => this.toggle());
    },

    toggle() {
      const isPassword = this.input.type === 'password';
      this.input.type = isPassword ? 'text' : 'password';
      this.btn.classList.toggle('visible', isPassword);
      this.btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    },
  };

  /* ---------- Login Form Module ---------- */
  const LoginForm = {
    init() {
      this.form = document.getElementById('loginForm');
      this.btn = document.getElementById('loginBtn');
      this.status = document.getElementById('formStatus');
      this.ssoBtn = document.getElementById('ssoBtn');

      if (!this.form) return;

      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      this.ssoBtn?.addEventListener('click', () => this.handleSSO());

      this.form.querySelectorAll('input').forEach((input) => {
        input.addEventListener('input', () => this.clearFieldError(input));
      });
    },

    handleSubmit(e) {
      e.preventDefault();
      if (this.btn.classList.contains('loading')) return;

      const data = new FormData(this.form);
      const email = data.get('email')?.trim();
      const password = data.get('password')?.trim();
      const emailInput = this.form.querySelector('#email');
      const passwordInput = this.form.querySelector('#password');

      this.clearStatus();
      let valid = true;

      if (!email || !this.isValidEmail(email)) {
        this.setFieldError(emailInput);
        valid = false;
      }

      if (!password || password.length < 6) {
        this.setFieldError(passwordInput);
        valid = false;
      }

      if (!valid) {
        this.showStatus('Please check your email and password.', 'error');
        return;
      }

      this.simulateLogin(email, data.get('role'));
    },

    simulateLogin(email, role) {
      this.btn.classList.add('loading');
      this.btn.disabled = true;
      this.clearStatus();

      setTimeout(() => {
        this.btn.classList.remove('loading');
        this.btn.disabled = false;
        this.showStatus(`Welcome back! Signed in as ${role} (${email}).`, 'success');
      }, 1500);
    },

    handleSSO() {
      this.showStatus('Redirecting to university SSO portal…', 'success');
    },

    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    setFieldError(input) {
      input.classList.add('error');
      input.classList.remove('success');
    },

    clearFieldError(input) {
      input.classList.remove('error');
    },

    clearStatus() {
      this.status.textContent = '';
      this.status.className = 'form-status';
    },

    showStatus(message, type) {
      this.status.textContent = message;
      this.status.className = `form-status ${type}`;
    },
  };

  /* ---------- App Bootstrap ---------- */
  return {
    init() {
      Navbar.init();
      ScrollReveal.init();
      PasswordToggle.init();
      LoginForm.init();
    },
  };
})();

document.addEventListener('DOMContentLoaded', () => AuthApp.init());
