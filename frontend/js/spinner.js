export function showSpinner() {
  const spinner = document.getElementById('loadingSpinner');
  if (!spinner) return;
  spinner.classList.remove('hidden');
}

export function hideSpinner() {
  const spinner = document.getElementById('loadingSpinner');
  if (!spinner) return;
  spinner.classList.add('hidden');
}
