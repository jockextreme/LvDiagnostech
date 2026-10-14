/**
 * DiagnosTech — Landing Page Application
 * Navbar, phone mockup, modals, booking, testimonials, FAQ, and forms.
 */

const App = (() => {
  'use strict';

  const STORAGE_KEY = 'diagnostech-appointments';

  const INFO = {
    insurance: {
      title: 'Student health insurance',
      html: '<p>University-sponsored plans are accepted at DiagnosTech. Bring your student ID and insurance card to in-person visits.</p><ul><li>Preventive visits: typically $0 copay</li><li>Specialist referral: confirm with your plan</li><li>Telehealth: covered on most campus plans</li></ul><p>Need a coverage letter? Email <a href="mailto:diagnostech@laverdad.edu.ph">diagnostech@laverdad.edu.ph</a>.</p>',
    },
    privacy: {
      title: 'Privacy Policy',
      html: '<p>DiagnosTech stores appointment requests on this device for demo purposes and does not transmit medical data from this landing page.</p><p>Production records are encrypted in transit and at rest. Access is limited to authorized campus clinicians.</p>',
    },
    terms: {
      title: 'Terms of Service',
      html: '<p>This campus portal is for students, faculty, and staff. Booking a visit is a request until a clinician confirms the slot.</p><p>Cancel or reschedule at least 24 hours ahead when possible. Emergency care should go through campus security or local emergency services.</p>',
    },
    hours: {
      title: 'Clinic hours',
      html: '<p><strong>Monday–Friday:</strong> 8:00 AM – 6:00 PM</p><p><strong>Saturday:</strong> 9:00 AM – 1:00 PM</p><p><strong>Sunday:</strong> Closed (online booking remains open 24/7)</p><p>After-hours telehealth triage is available from the student portal.</p>',
    },
    records: {
      title: 'Sample health records',
      html: '<p>Sign in to the student portal to view your full chart. Demo records on the phone include CBC, vaccination, and physical exam summaries.</p>',
    },
    wellness: {
      title: 'Campus wellness programs',
      html: '<ul><li>Mindful Mondays — 5 PM, Student Center</li><li>Sports screening clinic — first Saturday each month</li><li>Peer support circle — Thursdays, Mental Health suite</li></ul><p>Use Book Appointment and choose Mental Health to reserve a seat.</p>',
    },
    'record-cbc': {
      title: 'CBC panel',
      html: '<p>Collected March 12. Hemoglobin, white cells, and platelets were within campus lab reference ranges. Follow up only if symptoms return.</p>',
    },
    'record-vaccine': {
      title: 'Influenza vaccine',
      html: '<p>Seasonal flu vaccine administered January 8 at the campus health center. Next due: next fall term.</p>',
    },
    'record-pe': {
      title: 'Physical exam',
      html: '<p>Cleared for campus athletics on November 2. Blood pressure and musculoskeletal screen were unremarkable.</p>',
    },
    'rx-loratadine': {
      title: 'Loratadine 10mg',
      html: '<p>Take one tablet daily for seasonal allergies. A refill is available at the campus pharmacy with your student ID.</p>',
    },
    'rx-ibuprofen': {
      title: 'Ibuprofen 200mg',
      html: '<p>Take as needed for pain, with food. Do not exceed the labeled daily maximum. Contact the clinic if pain lasts more than 3 days.</p>',
    },
  };

  const Store = {
    all() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch (e) {
        return [];
      }
    },
    save(items) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    },
    add(item) {
      const items = this.all();
      items.unshift(item);
      this.save(items.slice(0, 12));
    },
  };

  const Toast = {
    init() {
      this.el = document.getElementById('toast');
    },
    show(message) {
      if (!this.el) return;
      this.el.hidden = false;
      this.el.textContent = message;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.el.hidden = true;
      }, 2800);
    },
  };

  const Modal = {
    init() {
      this.root = document.getElementById('appModal');
      if (!this.root) return;
      this.title = document.getElementById('modalTitle');
      this.body = document.getElementById('modalBody');
      this.dialog = this.root.querySelector('.modal__dialog');
      this.root.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-modal]')) this.close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.root.hidden) this.close();
      });
    },
    open({ title, html }) {
      this.title.textContent = title;
      this.body.innerHTML = html;
      this.root.hidden = false;
      document.body.classList.add('modal-open');
      this.dialog.focus();
    },
    close() {
      this.root.hidden = true;
      document.body.classList.remove('modal-open');
      this.body.innerHTML = '';
    },
  };

  const Booking = {
    open(prefs = {}) {
      const today = new Date().toISOString().slice(0, 10);
      Modal.open({
        title: 'Book an appointment',
        html: `
          <form id="bookingModalForm" class="contact-form" novalidate>
            <div class="form-group">
              <label for="bkName">Full name</label>
              <input id="bkName" name="name" required placeholder="Juan Dela Cruz">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="bkEmail">Email</label>
                <input id="bkEmail" name="email" type="email" required placeholder="you@laverdad.edu.ph">
              </div>
              <div class="form-group">
                <label for="bkPhone">Phone</label>
                <input id="bkPhone" name="phone" type="tel" required placeholder="0987 654 3210">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="bkDept">Department</label>
                <select id="bkDept" name="department" required>
                  <option value="general">General Medicine</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="neurology">Neurology</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="ophthalmology">Ophthalmology</option>
                  <option value="mental-health">Mental Health</option>
                </select>
              </div>
              <div class="form-group">
                <label for="bkType">Visit type</label>
                <select id="bkType" name="visitType">
                  <option value="in-person">In-person</option>
                  <option value="telehealth">Telehealth</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="bkDoctor">Preferred provider</label>
              <input id="bkDoctor" name="doctor" placeholder="Any available provider">
            </div>
            <div class="form-group">
              <label for="bkDate">Preferred date</label>
              <input id="bkDate" name="date" type="date" min="${today}" required>
            </div>
            <button type="submit" class="btn btn--primary btn--full">Confirm request</button>
            <p class="form-status" id="bookingStatus" role="status"></p>
          </form>
        `,
      });

      const form = document.getElementById('bookingModalForm');
      if (prefs.department) form.department.value = prefs.department;
      if (prefs.visitType) form.visitType.value = prefs.visitType;
      if (prefs.doctor) form.doctor.value = prefs.doctor;
      form.date.value = today;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        if (!data.name?.trim() || !data.email?.trim() || !data.phone?.trim()) {
          const status = document.getElementById('bookingStatus');
          status.textContent = 'Please complete the required fields.';
          status.className = 'form-status error';
          return;
        }
        this.commit(data);
        Modal.close();
        Toast.show('Appointment request saved. Check the phone for your list.');
        Phone.show('appointments');
      });
    },

    commit(data) {
      Store.add({
        id: Date.now(),
        name: data.name,
        department: data.department,
        visitType: data.visitType || 'in-person',
        doctor: data.doctor || 'Next available',
        date: data.date || new Date().toISOString().slice(0, 10),
      });
      Phone.renderAppointments();
    },
  };

  const Phone = {
    init() {
      this.app = document.getElementById('phoneApp');
      this.time = document.getElementById('phoneTime');
      if (!this.app) return;

      this.tick();
      setInterval(() => this.tick(), 30000);

      document.querySelectorAll('[data-phone-screen]').forEach((el) => {
        el.addEventListener('click', () => {
          const screen = el.getAttribute('data-phone-screen');
          const visitType = el.getAttribute('data-visit-type');
          this.show(screen);
          if (visitType) {
            const select = document.getElementById('phoneVisitType');
            if (select) select.value = visitType;
          }
        });
      });

      document.getElementById('phoneBookForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        Booking.commit({
          name: 'Campus member',
          ...data,
        });
        Toast.show('Visit booked on this device.');
        this.show('appointments');
      });

      const dateInput = this.app.querySelector('input[type="date"]');
      if (dateInput) dateInput.min = dateInput.value = new Date().toISOString().slice(0, 10);

      document.getElementById('joinDemoVisit')?.addEventListener('click', () => {
        this.show('waiting');
        const copy = document.getElementById('waitingCopy');
        copy.textContent = 'Connecting you with a campus clinician…';
        setTimeout(() => {
          if (this.app.dataset.screen === 'waiting') {
            copy.textContent = 'You are in the waiting room. A provider will join shortly.';
          }
        }, 1600);
      });

      this.renderAppointments();
      this.show('home');
    },

    tick() {
      if (!this.time) return;
      this.time.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    },

    show(name) {
      this.app.dataset.screen = name;
      this.app.querySelectorAll('.phone-view').forEach((view) => {
        view.hidden = view.getAttribute('data-view') !== name;
      });
      document.querySelectorAll('.float-card').forEach((card) => {
        card.classList.toggle('is-active', card.getAttribute('data-phone-screen') === name);
      });
    },

    renderAppointments() {
      const list = document.getElementById('phoneAppointments');
      if (!list) return;
      const items = Store.all();
      if (!items.length) {
        list.innerHTML = '<li class="empty">No visits yet. Book from the home screen.</li>';
        return;
      }
      list.innerHTML = items.map((item) => `
        <li>
          <button type="button" data-appt="${item.id}">
            <strong>${item.date} · ${item.visitType}</strong>
            <span>${item.department} · ${item.doctor}</span>
          </button>
        </li>
      `).join('');
      list.querySelectorAll('[data-appt]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = Store.all().find((row) => String(row.id) === btn.getAttribute('data-appt'));
          if (!item) return;
          Modal.open({
            title: 'Visit details',
            html: `<p><strong>${item.date}</strong> · ${item.visitType}</p><p>Department: ${item.department}</p><p>Provider: ${item.doctor}</p><p>Requested by ${item.name}.</p>`,
          });
        });
      });
    },
  };

  const Navbar = {
    init() {
      this.navbar = document.getElementById('navbar');
      this.toggle = document.getElementById('navToggle');
      this.links = document.getElementById('navLinks');
      this.navAnchors = this.links.querySelectorAll('a, button');

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
      const scrolled = window.scrollY > 40;
      this.navbar.classList.toggle('navbar--scrolled', scrolled);
      this.highlightActiveSection();
    },

    highlightActiveSection() {
      const sections = document.querySelectorAll('section[id]');
      let current = '';

      sections.forEach((section) => {
        const top = section.offsetTop - 120;
        if (window.scrollY >= top) {
          current = section.getAttribute('id');
        }
      });

      this.links.querySelectorAll('a').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
      });
    },
  };

  const ScrollReveal = {
    init() {
      this.elements = document.querySelectorAll('.reveal');
      if (!this.elements.length) return;

      this.observer = new IntersectionObserver(
        (entries) => this.onIntersect(entries),
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );

      this.elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          el.classList.add('visible');
          return;
        }
        this.observer.observe(el);
      });
    },

    onIntersect(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          this.observer.unobserve(entry.target);
        }
      });
    },
  };

  const Testimonials = {
    init() {
      this.track = document.getElementById('testimonialsTrack');
      this.cards = this.track.querySelectorAll('.testimonial-card');
      this.prevBtn = document.getElementById('prevTestimonial');
      this.nextBtn = document.getElementById('nextTestimonial');
      this.dotsContainer = document.getElementById('testimonialDots');

      if (!this.cards.length) return;

      this.currentIndex = 0;
      this.cardsPerView = this.getCardsPerView();
      this.track.style.setProperty('--cards', String(this.cardsPerView));

      this.buildDots();
      this.bindEvents();
      this.updateSlider();

      window.addEventListener('resize', () => {
        this.cardsPerView = this.getCardsPerView();
        this.track.style.setProperty('--cards', String(this.cardsPerView));
        this.currentIndex = Math.min(this.currentIndex, this.maxIndex());
        this.buildDots();
        this.updateSlider();
      });
    },

    getCardsPerView() {
      const width = this.track.parentElement?.clientWidth || window.innerWidth;
      if (width < 640) return 1;
      if (width < 980) return 2;
      return 3;
    },

    maxIndex() {
      return Math.max(0, this.cards.length - this.cardsPerView);
    },

    buildDots() {
      this.dotsContainer.innerHTML = '';
      const totalDots = this.maxIndex() + 1;

      for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('button');
        dot.className = 'testimonials-dot';
        dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
        dot.addEventListener('click', () => {
          this.currentIndex = i;
          this.updateSlider();
        });
        this.dotsContainer.appendChild(dot);
      }
    },

    bindEvents() {
      this.prevBtn.addEventListener('click', () => this.navigate(-1));
      this.nextBtn.addEventListener('click', () => this.navigate(1));
    },

    navigate(direction) {
      this.currentIndex = Math.max(0, Math.min(this.maxIndex(), this.currentIndex + direction));
      this.updateSlider();
    },

    updateSlider() {
      const styles = getComputedStyle(this.track);
      const gap = parseFloat(styles.columnGap || styles.gap) || 24;
      const cardWidth = this.cards[0].getBoundingClientRect().width;
      this.track.style.transform = `translateX(-${this.currentIndex * (cardWidth + gap)}px)`;

      const dots = this.dotsContainer.querySelectorAll('.testimonials-dot');
      dots.forEach((dot, i) => dot.classList.toggle('active', i === this.currentIndex));
    },
  };

  const FAQ = {
    init() {
      this.items = document.querySelectorAll('.faq-item');
      this.items.forEach((item) => {
        item.addEventListener('toggle', () => this.onToggle(item));
      });
    },

    onToggle(openedItem) {
      if (!openedItem.open) return;
      this.items.forEach((item) => {
        if (item !== openedItem) item.open = false;
      });
    },
  };

  const ContactForm = {
    init() {
      this.form = document.getElementById('contactForm');
      this.status = document.getElementById('formStatus');
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    handleSubmit(e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this.form).entries());
      const name = data.name?.trim();
      const email = data.email?.trim();
      const department = data.department;

      if (!name || !email || !department) {
        this.showStatus('Please fill in all required fields.', 'error');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.showStatus('Please enter a valid email address.', 'error');
        return;
      }

      Booking.commit({
        ...data,
        date: new Date().toISOString().slice(0, 10),
      });
      this.showStatus("Request submitted! We'll confirm your appointment within 24 hours.", 'success');
      this.form.reset();
    },

    showStatus(message, type) {
      this.status.textContent = message;
      this.status.className = `form-status ${type}`;
    },
  };

  const Actions = {
    init() {
      document.addEventListener('click', (e) => {
        const booking = e.target.closest('[data-open-booking]');
        if (booking) {
          Booking.open({
            department: booking.getAttribute('data-department'),
            visitType: booking.getAttribute('data-visit-type'),
            doctor: booking.getAttribute('data-doctor'),
          });
          return;
        }

        const info = e.target.closest('[data-open-info]');
        if (info) {
          const key = info.getAttribute('data-open-info');
          const content = INFO[key];
          if (content) Modal.open(content);
          return;
        }

        const copy = e.target.closest('[data-copy]');
        if (copy) {
          const value = copy.getAttribute('data-copy');
          navigator.clipboard?.writeText(value).then(() => {
            Toast.show(copy.getAttribute('data-copy-label') || 'Copied');
          }).catch(() => Toast.show(value));
        }
      });

      document.getElementById('enableReminders')?.addEventListener('click', async () => {
        if (!('Notification' in window)) {
          Toast.show('Reminders will appear as on-page alerts on this device.');
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('DiagnosTech reminders on', { body: 'We’ll ping you before campus visits.' });
          Toast.show('Browser reminders enabled.');
        } else {
          Toast.show('Reminders stay on this page until you allow notifications.');
        }
      });
    },
  };

  return {
    init() {
      Navbar.init();
      ScrollReveal.init();
      Testimonials.init();
      FAQ.init();
      ContactForm.init();
      Toast.init();
      Modal.init();
      Phone.init();
      Actions.init();
    },
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
