import emailjs from '@emailjs/browser';
import { gsap } from './motion';
import { t } from './lang';

/**
 * Contact's own motion signature — an "ink rise" on the headline (skew +
 * blur settling into place, unlike any other section's title reveal) and
 * a sequential underline-draw on the form fields as they enter view.
 */
export function initContactReveal(): void {
  gsap.from('.contact-title', {
    y: 60,
    skewY: 4,
    opacity: 0,
    filter: 'blur(10px)',
    duration: 1.3,
    ease: 'power4.out',
    clearProps: 'filter',
    scrollTrigger: { trigger: '.contact-title', start: 'top 85%' },
  });

  const inputs = gsap.utils.toArray<HTMLElement>('.contact-form-card .input');
  gsap.set(inputs, { '--underline': 0 } as gsap.TweenVars);
  gsap.to(inputs, {
    '--underline': 1,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power2.inOut',
    scrollTrigger: { trigger: '.contact-form-card', start: 'top 80%' },
  } as gsap.TweenVars);

  gsap.utils.toArray<HTMLElement>('.contact-info-block').forEach((el, i) => {
    gsap.from(el, {
      x: -24,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: i * 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
}

/**
 * Fill these in with your own EmailJS account (free tier at emailjs.com):
 * Service ID + Template ID come from your EmailJS dashboard, the public key
 * is safe to expose client-side by design. Until filled in, the form falls
 * back to opening the visitor's mail client with a pre-filled message.
 */
const EMAILJS_SERVICE_ID = '';
const EMAILJS_TEMPLATE_ID = '';
const EMAILJS_PUBLIC_KEY = '';
const FALLBACK_EMAIL = 'kkain25@gmail.com';

function isConfigured(): boolean {
  return Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
}

export function initContactForm(): void {
  const form = document.getElementById('contactForm') as HTMLFormElement | null;
  const status = document.getElementById('formStatus');
  if (!form || !status) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') ?? '');
    const email = String(data.get('email') ?? '');
    const project = String(data.get('project') ?? '');
    const message = String(data.get('message') ?? '');

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (isConfigured()) {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          { from_name: name, from_email: email, project, message },
          { publicKey: EMAILJS_PUBLIC_KEY }
        );
      } else {
        const subject = encodeURIComponent(
          `${t('form.subject')} — ${project || t('form.subject.fallback')}`
        );
        const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
        window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${subject}&body=${body}`;
      }
      status.textContent = t('form.status.ok');
      status.style.opacity = '1';
      form.reset();
    } catch (err) {
      console.error('Contact form send failed', err);
      status.textContent = t('form.status.error');
      status.style.opacity = '1';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      setTimeout(() => {
        status.style.opacity = '0';
      }, 3200);
    }
  });
}
