// Admin Domain Management script
async function fetchDomains() {
  const res = await fetch('/admin/domains');
  const domains = await res.json();
  const list = document.getElementById('domainList');
  list.innerHTML = '';
  domains.forEach(domain => {
    const li = document.createElement('li');
    li.textContent = domain;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.onclick = () => removeDomain(domain);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

async function addDomain() {
  const input = document.getElementById('domainInput');
  const domain = input.value.trim();
  if (!domain) return;
  const res = await fetch('/admin/domains', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain })
  });
  if (res.ok) {
    input.value = '';
    fetchDomains();
  } else {
    const err = await res.json();
    alert(err.error);
  }
}

async function removeDomain(domain) {
  const res = await fetch(`/admin/domains/${domain}`, {
    method: 'DELETE'
  });
  if (res.ok) {
    fetchDomains();
  } else {
    const err = await res.json();
    alert(err.error);
  }
}

document.getElementById('addBtn').onclick = addDomain;
fetchDomains();