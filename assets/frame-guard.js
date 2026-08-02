(() => {
  const root = document.documentElement;
  if (window.self === window.top) {
    root.classList.remove('frame-check-pending');
    return;
  }
  root.classList.add('is-framed');
})();
