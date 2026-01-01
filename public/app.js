let user_id, admin_id;

async function login() {
  const identifier = document.getElementById('id').value;
  const password = document.getElementById('pw').value;

  const res = await fetch('https://tallyinsight-backend-1.onrender.com/agent/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error);
    return;
  }

  user_id = data.user_id;
  admin_id = data.admin_id;

  loadCompanies();
}

async function loadCompanies() {
  const res = await fetch('https://tallyinsight-backend-1.onrender.com/agent/companies', {
    headers: { 'x-user-id': user_id }
  });

  const data = await res.json();
  const div = document.getElementById('companies');
  div.style.display = 'block';
  div.innerHTML = '<h3>Select Company</h3>';

  data.companies.forEach(c => {
    const btn = document.createElement('button');
    btn.innerText = c.company_name;
    btn.onclick = () => provision(c.company_id);
    div.appendChild(btn);
  });
}

async function provision(company_id) {
  const res = await fetch('https://tallyinsight-backend-1.onrender.com/agent/provision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, admin_id, company_id })
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error);
    return;
  }

  await fetch('/done', { method: 'POST' });
}
