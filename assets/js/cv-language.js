(() => {
  const shell = document.querySelector('.resume-shell');
  if (!shell) return;

  const panels = [...shell.querySelectorAll('[data-cv-lang]')];
  const languageToggle = shell.querySelector('[data-cv-lang-toggle]');
  const downloadLink = shell.querySelector('[data-cv-download]');
  const labels = [...shell.querySelectorAll('[data-cv-label-en]')];

  const normalizeLanguage = (language) => (String(language).toLowerCase().startsWith('zh') ? 'zh' : 'en');

  const setLanguage = (language, persist = true) => {
    const selectedLanguage = normalizeLanguage(language);

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.cvLang !== selectedLanguage;
    });

    labels.forEach((label) => {
      label.textContent = label.dataset[`cvLabel${selectedLanguage === 'zh' ? 'Zh' : 'En'}`];
    });

    if (languageToggle) {
      languageToggle.setAttribute('aria-label', selectedLanguage === 'zh' ? 'Switch to English CV' : 'Switch to Chinese CV');
    }

    if (downloadLink) {
      downloadLink.href = selectedLanguage === 'zh' ? downloadLink.dataset.cvPdfZh : downloadLink.dataset.cvPdfEn;
    }

    shell.dataset.activeCvLang = selectedLanguage;
    document.documentElement.lang = selectedLanguage === 'zh' ? 'zh-CN' : 'en';

    if (persist) {
      try {
        window.localStorage.setItem('cv-language', selectedLanguage);
      } catch (_error) {
        // Language switching still works when storage is unavailable.
      }
    }
  };

  languageToggle?.addEventListener('click', () => {
    setLanguage(shell.dataset.activeCvLang === 'zh' ? 'en' : 'zh');
  });

  const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
  let savedLanguage;
  try {
    savedLanguage = window.localStorage.getItem('cv-language');
  } catch (_error) {
    savedLanguage = null;
  }

  setLanguage(requestedLanguage || savedLanguage || document.documentElement.lang, false);
})();
