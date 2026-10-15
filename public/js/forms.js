(function () {
  async function postJSON(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('contactMsg');
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(contactForm).entries());
        await postJSON('/api/contact', data);
        msg.textContent = 'Thank you! We will be in touch soon.';
        msg.style.color = '#2f6b3a';
        contactForm.reset();
      } catch (err) {
        msg.textContent = err.message || 'Something went wrong.';
        msg.style.color = '#8a2b1a';
      } finally {
        btn.disabled = false;
      }
    });
  }

  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('newsletterMsg');
      try {
        const email = newsletterForm.email.value;
        await postJSON('/api/newsletter', { email });
        if (msg) msg.textContent = 'Thanks for joining!';
        newsletterForm.reset();
      } catch (err) {
        if (msg) msg.textContent = err.message || 'Could not subscribe.';
      }
    });
  }
})();
