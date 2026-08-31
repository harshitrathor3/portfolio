const revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 120));

  const tabButtons = document.querySelectorAll('.job-tabs button');
  const panels = document.querySelectorAll('.job-panel');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.querySelector(`.job-panel[data-panel="${btn.dataset.job}"]`).classList.add('active');
    });
  });