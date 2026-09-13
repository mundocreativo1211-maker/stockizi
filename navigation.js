const navigationButtons = document.querySelectorAll('[data-section]');
const pages = document.querySelectorAll('[data-page]');

function showSection(sectionName) {
  const selectedPage = document.querySelector(`[data-page="${sectionName}"]`);
  if (!selectedPage) return;

  // Ocultar una sección conserva sus campos y los productos de la sesión.
  for (const page of pages) {
    page.hidden = page !== selectedPage;
  }

  for (const button of navigationButtons) {
    if (button.dataset.section === sectionName) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  }

  const title = selectedPage.querySelector('h1');
  document.title = `${title.textContent} · Stockizi`;
  title.focus();
}

for (const button of navigationButtons) {
  button.addEventListener('click', () => showSection(button.dataset.section));
}
