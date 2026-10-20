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

  const TIME_SLOTS = ['9:00 AM', '10:30 AM', '1:00 PM', '2:00 PM', '3:30 PM', '4:30 PM'];

  /* Rule-based symptom → urgency lookup for the preliminary check (NOT real AI, NOT a diagnosis). */
  const SYMPTOM_RULES = [
    { level: 'high', label: 'High — seek care soon', keywords: ['chest pain', 'difficulty breathing', 'shortness of breath', 'severe bleeding', 'fainted', 'unconscious', 'stroke', 'slurred speech', 'severe allergic', 'can\u2019t breathe'] },
    { level: 'medium', label: 'Medium — book a visit soon', keywords: ['fever', 'persistent cough', 'vomiting', 'severe pain', 'infection', 'swelling', 'dizzy', 'dizziness'] },
    { level: 'low', label: 'Low — routine check-up is fine', keywords: ['mild headache', 'runny nose', 'sore throat', 'rash', 'fatigue', 'tired', 'minor cut', 'cold'] },
  ];

  /* Scripted FAQ bot replies — keyword-matched, not a real LLM. */
  const FAQ_RULES = [
    { keywords: ['book', 'appointment', 'schedule visit'], reply: 'You can book a visit from your dashboard — click "Book Appointment" and choose a department, date, and time.' },
    { keywords: ['cancel'], reply: 'To cancel, find the appointment on your dashboard and click "Cancel" next to it.' },
    { keywords: ['reschedule'], reply: 'Click "Reschedule" next to the appointment you want to move, then pick a new date/time.' },
    { keywords: ['password', 'forgot', 'login', 'log in'], reply: 'Use "Forgot password?" on the sign-in page, or contact campus support if you\u2019re still stuck.' },
    { keywords: ['hour', 'open', 'schedule of clinic'], reply: 'The Campus Health Center is open Monday–Friday, 8:00 AM–5:00 PM. Telehealth visits may have different hours.' },
    { keywords: ['prescription', 'medicine', 'medication'], reply: 'Prescriptions issued by your doctor appear under "Recent Health Records" on your dashboard.' },
    { keywords: ['pharmacy', 'drug store'], reply: 'Use the "Find Nearby Pharmacies" quick action on your dashboard — it uses your location to list pharmacies close to you.' },
    { keywords: ['emergency', 'urgent', 'help now'], reply: 'If this is a medical emergency, please call local emergency services or go to the nearest hospital right away — don\u2019t wait on this chat.' },
  ];
  const FAQ_FALLBACK = 'I\u2019m not sure about that one — please reach out to campus health support, or book a consultation for anything specific to your health.';

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

      this.suggestBtn = document.getElementById('apptSuggestBtn');
      this.suggestNote = document.getElementById('apptSuggestNote');

      this.root.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-modal]')) this.close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.root.hidden) this.close();
      });
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      this.suggestBtn?.addEventListener('click', () => this.suggestTime());
    },

    /* Rule-based "AI Smart Scheduling": picks the earliest slot not already
       booked by anyone in the same department/date. Not real AI. */
    async suggestTime() {
      const department = this.form.department.value;
      const date = this.form.date.value;
      if (!date) {
        this.suggestNote.textContent = 'Pick a date first.';
        return;
      }

      this.suggestBtn.disabled = true;
      this.suggestNote.textContent = 'Checking availability…';

      try {
        const taken = await AppointmentStore.bookedSlotsFor(department, date);
        const free = TIME_SLOTS.find((t) => !taken.includes(t));
        if (free) {
          this.form.time.value = free;
          this.suggestNote.textContent = `Suggested ${free} — the earliest open slot for this department on this date.`;
        } else {
          this.suggestNote.textContent = 'No open slots that day — try another date.';
        }
      } catch (err) {
        this.suggestNote.textContent = 'Could not check availability — check your connection.';
      } finally {
        this.suggestBtn.disabled = false;
      }
    },

    open({ title, defaults = {}, onSubmit }) {
      if (!this.root) return;

      const today = localISODate();
      this.titleEl.textContent = title;
      this.statusEl.textContent = '';
      this.statusEl.className = 'form-status';
      if (this.suggestNote) this.suggestNote.textContent = '';
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

  /* ---------- Health Records & Prescriptions Module ---------- */
  const Records = {
    init() {
      this.list = document.querySelector('.records-list');
      this.role = document.body.dataset.role;
      this.isPatient = this.role === 'patient';
      if (!this.list) return;

      if (this.isPatient) {
        this.uid = Session.user.id;
        RecordStore.seedIfEmpty(this.uid, [
          { kind: 'lab', title: 'Blood Panel Review', detail: 'Complete metabolic panel', issuedBy: 'Dr. Elena Martinez', date: addDays(-7) },
          { kind: 'prescription', title: 'Prescription — Vitamin D3', detail: 'Vitamin D supplement', issuedBy: 'Dr. Elena Martinez', date: addDays(-18), medication: 'Vitamin D3', dosage: '1 tablet daily' },
          { kind: 'exam', title: 'Annual Physical Summary', detail: 'Routine check-up', issuedBy: 'Dr. Elena Martinez', date: addDays(-35) },
        ]).catch((err) => console.error('Record seed failed:', err));

        RecordStore.watch(this.uid, (items) => {
          this.items = items;
          this.render();
        });
      } else {
        this.wireDoctorIssueButton();
      }
    },

    render() {
      const items = (this.items || []).slice().sort((a, b) => b.date.localeCompare(a.date));
      this.list.innerHTML = '';

      if (!items.length) {
        const p = document.createElement('p');
        p.className = 'appointment-empty';
        p.textContent = 'No health records yet.';
        this.list.appendChild(p);
        return;
      }

      const ICONS = { lab: '🧪', prescription: '💊', exam: '🩺', note: '📋' };
      items.forEach((r) => {
        const el = document.createElement('article');
        el.className = 'record-item';
        el.innerHTML = `
          <div class="record-item__icon" aria-hidden="true">${ICONS[r.kind] || '📋'}</div>
          <div class="record-item__content">
            <h3>${esc(r.title)}</h3>
            <p>${esc(r.detail || '')}${r.issuedBy ? ` · ${esc(r.issuedBy)}` : ''} · ${esc(r.date)}</p>
          </div>
          <button class="btn btn--ghost btn--sm" type="button">View</button>
        `;
        el.querySelector('.btn').addEventListener('click', () => {
          const extra = r.kind === 'prescription' && r.medication
            ? ` Medication: ${r.medication}${r.dosage ? ` (${r.dosage})` : ''}.`
            : '';
          Toast.show(`${r.title} — ${r.detail || ''}.${extra}`);
        });
        this.list.appendChild(el);
      });
    },

    /* Doctor side: issue a record/prescription to a patient by email. */
    wireDoctorIssueButton() {
      const header = this.list.closest('.dashboard-card')?.querySelector('.dashboard-card__header');
      if (!header) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dashboard-card__link dashboard-card__link--btn';
      btn.textContent = 'Issue record';
      header.appendChild(btn);

      this.modal = document.getElementById('recordModal');
      if (!this.modal) return;
      this.form = document.getElementById('recordForm');
      this.statusEl = document.getElementById('recordFormStatus');
      this.dialog = this.modal.querySelector('.modal__dialog');

      btn.addEventListener('click', () => this.openModal());
      this.modal.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-modal]')) this.closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.modal.hidden) this.closeModal();
      });
      this.form.addEventListener('submit', (e) => this.handleIssue(e));
      this.form.kind.addEventListener('change', () => this.toggleMedFields());
    },

    toggleMedFields() {
      const isRx = this.form.kind.value === 'prescription';
      this.form.querySelectorAll('.record-med-fields').forEach((el) => { el.hidden = !isRx; });
    },

    openModal() {
      this.statusEl.textContent = '';
      this.statusEl.className = 'form-status';
      this.form.reset();
      this.toggleMedFields();
      this.modal.hidden = false;
      document.body.classList.add('modal-open');
      this.dialog.focus();
    },

    closeModal() {
      this.modal.hidden = true;
      document.body.classList.remove('modal-open');
    },

    async handleIssue(e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this.form).entries());

      if (!data.email || !data.title) {
        this.statusEl.textContent = 'Patient email and a title are required.';
        this.statusEl.className = 'form-status error';
        return;
      }

      const patient = Auth.findByEmail(data.email);
      if (!patient) {
        this.statusEl.textContent = 'No account found with that email.';
        this.statusEl.className = 'form-status error';
        return;
      }
      if (patient.role !== 'patient') {
        this.statusEl.textContent = 'That email belongs to a doctor account, not a patient.';
        this.statusEl.className = 'form-status error';
        return;
      }

      const record = {
        kind: data.kind,
        title: data.title,
        detail: data.detail || '',
        issuedBy: Auth.displayName(Session.user),
        date: localISODate(),
      };
      if (data.kind === 'prescription') {
        record.medication = data.medication || '';
        record.dosage = data.dosage || '';
      }

      try {
        await RecordStore.add(patient.id, record);
        Toast.show(`Record sent to ${patient.name}.`);
        this.closeModal();
      } catch (err) {
        this.statusEl.textContent = 'Could not save — check your connection.';
        this.statusEl.className = 'form-status error';
      }
    },
  };

  /* ---------- AI Preliminary Diagnostic Check (rule-based, not real AI) ---------- */
  const DiagnosticCheck = {
    init() {
      this.modal = document.getElementById('diagModal');
      this.trigger = document.getElementById('diagTriggerBtn');
      if (!this.modal || !this.trigger) return;

      this.form = document.getElementById('diagForm');
      this.resultEl = document.getElementById('diagResult');
      this.dialog = this.modal.querySelector('.modal__dialog');

      this.trigger.addEventListener('click', () => this.open());
      this.modal.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-modal]')) this.close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.modal.hidden) this.close();
      });
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    open() {
      this.form.reset();
      this.resultEl.innerHTML = '';
      this.modal.hidden = false;
      document.body.classList.add('modal-open');
      this.dialog.focus();
    },

    close() {
      this.modal.hidden = true;
      document.body.classList.remove('modal-open');
    },

    handleSubmit(e) {
      e.preventDefault();
      const text = (new FormData(this.form).get('symptoms') || '').toLowerCase();
      let match = SYMPTOM_RULES.find((rule) => rule.keywords.some((k) => text.includes(k)));

      const level = match ? match.level : 'low';
      const label = match ? match.label : 'Low — routine check-up is fine';

      this.resultEl.innerHTML = `
        <p class="diag-result diag-result--${esc(level)}"><strong>Suggested priority:</strong> ${esc(label)}</p>
        <p class="form-hint">This is a simple keyword-based prototype, not a medical diagnosis. Please consult a doctor for an accurate assessment — book a consultation if you're unsure.</p>
      `;
    },
  };

  /* ---------- AI Health Chatbot (scripted FAQ, not a real LLM) ---------- */
  const Chatbot = {
    init() {
      this.panel = document.getElementById('chatbotPanel');
      this.toggle = document.getElementById('chatbotToggle');
      if (!this.panel || !this.toggle) return;

      this.log = document.getElementById('chatbotLog');
      this.form = document.getElementById('chatbotForm');
      this.input = document.getElementById('chatbotInput');

      this.toggle.addEventListener('click', () => {
        const open = this.panel.hidden;
        this.panel.hidden = !open;
        this.toggle.setAttribute('aria-expanded', String(open));
        if (open) this.input.focus();
      });

      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = this.input.value.trim();
        if (!text) return;
        this.addMessage(text, 'user');
        this.input.value = '';
        setTimeout(() => this.addMessage(this.reply(text), 'bot'), 350);
      });
    },

    reply(text) {
      const lower = text.toLowerCase();
      const match = FAQ_RULES.find((rule) => rule.keywords.some((k) => lower.includes(k)));
      return match ? match.reply : FAQ_FALLBACK;
    },

    addMessage(text, from) {
      const div = document.createElement('div');
      div.className = `chatbot-msg chatbot-msg--${from}`;
      div.textContent = text;
      this.log.appendChild(div);
      this.log.scrollTop = this.log.scrollHeight;
    },
  };

  /* ---------- AI Pharmacy Locator (real OpenStreetMap data, browser geolocation) ---------- */
  const PharmacyLocator = {
    init() {
      this.modal = document.getElementById('pharmacyModal');
      this.trigger = document.getElementById('pharmacyTriggerBtn');
      if (!this.modal || !this.trigger) return;

      this.resultEl = document.getElementById('pharmacyResult');
      this.dialog = this.modal.querySelector('.modal__dialog');

      this.trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
      this.modal.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-modal]')) this.close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.modal.hidden) this.close();
      });
    },

    open() {
      this.modal.hidden = false;
      document.body.classList.add('modal-open');
      this.dialog.focus();
      this.search();
    },

    close() {
      this.modal.hidden = true;
      document.body.classList.remove('modal-open');
    },

    search() {
      this.resultEl.innerHTML = '<p class="form-hint">Getting your location…</p>';

      if (!navigator.geolocation) {
        this.resultEl.innerHTML = '<p class="form-hint">Geolocation isn\u2019t supported on this browser.</p>';
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => this.fetchNearby(pos.coords.latitude, pos.coords.longitude),
        () => {
          this.resultEl.innerHTML = '<p class="form-hint">Location permission was denied — please allow location access and try again.</p>';
        },
        { timeout: 8000 }
      );
    },

    async fetchNearby(lat, lon) {
      this.resultEl.innerHTML = '<p class="form-hint">Searching nearby pharmacies…</p>';
      const radius = 3000;
      const query = `[out:json][timeout:10];node["amenity"="pharmacy"](around:${radius},${lat},${lon});out body 15;`;

      try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
        });
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        this.render(data.elements || [], lat, lon);
      } catch (err) {
        this.resultEl.innerHTML = '<p class="form-hint">Could not reach the pharmacy directory — check your connection and try again.</p>';
      }
    },

    render(elements, lat, lon) {
      if (!elements.length) {
        this.resultEl.innerHTML = '<p class="form-hint">No pharmacies found within 3 km. Try again from a different location.</p>';
        return;
      }

      const withDistance = elements.map((el) => ({
        name: (el.tags && el.tags.name) || 'Unnamed pharmacy',
        address: el.tags ? [el.tags['addr:street'], el.tags['addr:city']].filter(Boolean).join(', ') : '',
        distance: this.haversine(lat, lon, el.lat, el.lon),
      })).sort((a, b) => a.distance - b.distance);

      this.resultEl.innerHTML = withDistance.map((p) => `
        <div class="pharmacy-item">
          <strong>${esc(p.name)}</strong>
          <span>${p.address ? esc(p.address) + ' · ' : ''}${p.distance.toFixed(1)} km away</span>
        </div>
      `).join('');
    },

    haversine(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
  };

  /* ---------- Preview Module (features not yet wired to real data) ---------- */
  const StaticPreview = {
    init() {
      const selector = [
        'a.quick-action[href="#"]:not([data-open-booking])',
        '.dashboard-card__link[href="#"]',
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
      Records.init();
      DiagnosticCheck.init();
      Chatbot.init();
      PharmacyLocator.init();
      Notifications.init();
      StaticPreview.init();
    },
  };
})();

document.addEventListener('DOMContentLoaded', () => DashboardApp.init());
