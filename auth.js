/**
 * DiagnosTech — Authentication pages
 * Navbar, scroll reveal, password toggles, sign-in and sign-up forms.
 */

const AuthApp = (() => {
  'use strict';

  /* ---------- Shared form helpers ---------- */
  const UI = {
    isEmail: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),

    invalid(input) {
      if (!input) return;
      input.classList.add('error');
      input.setAttribute('aria-invalid', 'true');
    },

    valid(input) {
      input.classList.remove('error');
      input.removeAttribute('aria-invalid');
    },

    reset(form, statusEl) {
      form.querySelectorAll('input').forEach((input) => UI.valid(input));
      UI.status(statusEl, '', '');
    },

    status(el, message, type) {
      el.textContent = message;
      el.className = type ? `form-status ${type}` : 'form-status';
    },

    busy(btn, on) {
      btn.classList.toggle('loading', on);
      btn.disabled = on;
    },
  };

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

  /* ---------- Password Toggle Module (works for every .password-field) ---------- */
  const PasswordToggle = {
    init() {
      document.querySelectorAll('.password-field').forEach((field) => {
        const input = field.querySelector('input');
        const btn = field.querySelector('.password-toggle');
        if (!input || !btn) return;

        btn.addEventListener('click', () => {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          btn.classList.toggle('visible', isPassword);
          btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });
      });
    },
  };

  /* ---------- Login Form Module ---------- */
  const LoginForm = {
    init() {
      this.form = document.getElementById('loginForm');
      if (!this.form) return;

      this.btn = document.getElementById('loginBtn');
      this.status = document.getElementById('formStatus');
      this.ssoBtn = document.getElementById('ssoBtn');

      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      this.ssoBtn?.addEventListener('click', () => {
        UI.status(this.status, 'University SSO is not connected yet. Sign in with your email for now.', 'error');
      });
      this.form.querySelectorAll('input').forEach((input) => {
        input.addEventListener('input', () => UI.valid(input));
      });
    },

    async handleSubmit(e) {
      e.preventDefault();
      if (this.btn.classList.contains('loading')) return;

      const data = new FormData(this.form);
      const email = String(data.get('email') ?? '').trim();
      const password = String(data.get('password') ?? '');
      const role = data.get('role');
      const emailInput = this.form.querySelector('#email');
      const passwordInput = this.form.querySelector('#password');

      UI.reset(this.form, this.status);

      let valid = true;
      if (!UI.isEmail(email)) { UI.invalid(emailInput); valid = false; }
      if (!password) { UI.invalid(passwordInput); valid = false; }
      if (!valid) {
        UI.status(this.status, 'Enter your email and password.', 'error');
        return;
      }

      if (typeof Auth === 'undefined') {
        UI.status(this.status, 'Sign-in is unavailable right now. Please reload the page.', 'error');
        return;
      }

      UI.busy(this.btn, true);
      try {
        const result = await Auth.login({ email, password, role, remember: data.get('remember') === 'on' });

        if (!result.ok) {
          UI.busy(this.btn, false);
          if (result.field === 'email') UI.invalid(emailInput);
          UI.status(this.status, result.message, 'error');
          return;
        }

        UI.status(this.status, `Welcome back, ${Auth.firstName(result.user)}!`, 'success');
        setTimeout(() => { window.location.href = Auth.homeFor(result.user); }, 500);
      } catch (err) {
        UI.busy(this.btn, false);
        UI.status(this.status, 'Something went wrong. Please try again.', 'error');
      }
    },
  };

  /* ---------- Sign-up Form Module ---------- */
  const SignupForm = {
    init() {
      this.form = document.getElementById('signupForm');
      if (!this.form) return;

      this.btn = document.getElementById('signupBtn');
      this.status = document.getElementById('formStatus');

      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      this.form.querySelectorAll('input').forEach((input) => {
        input.addEventListener('input', () => UI.valid(input));
      });
    },

    async handleSubmit(e) {
      e.preventDefault();
      if (this.btn.classList.contains('loading')) return;

      const data = new FormData(this.form);
      const name = String(data.get('name') ?? '').replace(/\s+/g, ' ').trim();
      const email = String(data.get('email') ?? '').trim();
      const password = String(data.get('password') ?? '');
      const confirm = String(data.get('confirm') ?? '');
      const role = data.get('role');

      const field = (id) => this.form.querySelector(id);
      const problems = [];

      UI.reset(this.form, this.status);

      if (name.length < 2 || name.length > 60) problems.push([field('#fullName'), 'Enter your full name (2–60 characters).']);
      if (!UI.isEmail(email)) problems.push([field('#email'), 'Enter a valid email address.']);
      if (password.length < 8) problems.push([field('#password'), 'Use at least 8 characters for your password.']);
      else if (confirm !== password) problems.push([field('#confirmPassword'), 'Passwords do not match.']);

      if (problems.length) {
        problems.forEach(([input]) => UI.invalid(input));
        UI.status(this.status, problems[0][1], 'error');
        problems[0][0].focus();
        return;
      }

      if (typeof Auth === 'undefined') {
        UI.status(this.status, 'Sign-up is unavailable right now. Please reload the page.', 'error');
        return;
      }

      UI.busy(this.btn, true);
      try {
        const result = await Auth.register({ name, email, password, role });

        if (!result.ok) {
          UI.busy(this.btn, false);
          const target = { name: '#fullName', email: '#email', password: '#password' }[result.field];
          if (target) {
            UI.invalid(field(target));
            field(target).focus();
          }
          UI.status(this.status, result.message, 'error');
          return;
        }

        UI.status(this.status, `Account created. Welcome, ${Auth.firstName(result.user)}!`, 'success');
        setTimeout(() => { window.location.href = Auth.homeFor(result.user); }, 700);
      } catch (err) {
        UI.busy(this.btn, false);
        UI.status(this.status, 'Something went wrong. Please try again.', 'error');
      }
    },
  };

  /* ---------- App Bootstrap ---------- */
  return {
    init() {
      Navbar.init();
      ScrollReveal.init();
      PasswordToggle.init();
      LoginForm.init();
      SignupForm.init();
    },
  };
})();

document.addEventListener('DOMContentLoaded', () => AuthApp.init());
