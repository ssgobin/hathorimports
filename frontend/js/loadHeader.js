export async function loadHeader() {
  const res = await fetch("/components/header.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("afterbegin", html);
}

// Made with Bob
