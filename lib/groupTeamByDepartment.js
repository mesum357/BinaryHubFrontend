const DEPTS = ['CEO', 'Developer', 'Designer', 'Marketer'];

function normalizeDepartment(raw) {
  const s = String(raw || '').trim().toLowerCase();
  const map = {
    ceo: 'CEO',
    developer: 'Developer',
    designer: 'Designer',
    marketer: 'Marketer'
  };
  return map[s] || null;
}

function groupTeamMembers(list) {
  const by = {
    CEO: [],
    Developer: [],
    Designer: [],
    Marketer: [],
    Other: []
  };
  for (const m of list || []) {
    const d = normalizeDepartment(m.department);
    if (d && by[d]) by[d].push(m);
    else by.Other.push(m);
  }
  return by;
}

module.exports = { DEPTS, normalizeDepartment, groupTeamMembers };
