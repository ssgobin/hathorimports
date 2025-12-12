export function setupUrlValidation(inputSelector, submitBtnSelector) {
  const input = document.querySelector(inputSelector);
  const submitBtn = document.querySelector(submitBtnSelector);
  if (!input) return;

  function isValidUrl(value) {
    try {
      if (!value) return false;
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  input.addEventListener('input', () => {
    const ok = isValidUrl(input.value.trim());
    input.classList.toggle('input-error', !ok && input.value.length > 0);
    if (submitBtn) submitBtn.disabled = !ok;
  });
}
