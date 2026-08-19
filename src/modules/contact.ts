import emailjs from '@emailjs/browser';

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
        const subject = encodeURIComponent(`Project inquiry — ${project || 'New idea'}`);
        const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
        window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${subject}&body=${body}`;
      }
      status.textContent = "Message received. I'll be in touch.";
      status.style.opacity = '1';
      form.reset();
    } catch (err) {
      console.error('Contact form send failed', err);
      status.textContent = 'Something went wrong — please email me directly.';
      status.style.opacity = '1';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      setTimeout(() => {
        status.style.opacity = '0';
      }, 3200);
    }
  });
}
