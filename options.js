import {
  STORAGE_KEYS,
  getStoredValue,
  setStoredValue,
  upsertMember,
  removeMemberById,
  loadTimezoneOptions
} from './util.js';

const memberForm = document.getElementById('team-member-form');
const memberNameField = document.getElementById('member-name');
const memberTimezoneField = document.getElementById('member-timezone');
const memberList = document.getElementById('team-member-list');
const defaultTimezoneField = document.getElementById('default-timezone');
const preferencesForm = document.getElementById('preferences-form');

let editingMemberId = null;

function renderMemberList(members) {
  memberList.innerHTML = '';
  if (!members.length) {
    const empty = document.createElement('li');
    empty.className = 'team-member-item';
    empty.textContent = 'No team members yet. Add one above to get started.';
    memberList.append(empty);
    return;
  }

  for (const member of members) {
    const item = document.createElement('li');
    item.className = 'team-member-item';

    const details = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = member.name;
    const timezone = document.createElement('span');
    timezone.textContent = member.timezone;
    details.append(name, timezone);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      editingMemberId = member.id;
      memberNameField.value = member.name;
      memberTimezoneField.value = member.timezone;
      memberNameField.focus();
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async () => {
      const updated = removeMemberById(members, member.id);
      await setStoredValue(STORAGE_KEYS.teamMembers, updated);
      renderMemberList(updated);
    });

    actions.append(editButton, deleteButton);
    item.append(details, actions);
    memberList.append(item);
  }
}

async function handleMemberSubmit(event) {
  event.preventDefault();
  const formData = new FormData(memberForm);
  const name = formData.get('name');
  const timezone = formData.get('timezone');
  if (!name || !timezone) {
    return;
  }

  const members = await getStoredValue(STORAGE_KEYS.teamMembers, []);
  const updatedMembers = upsertMember(members, { id: editingMemberId, name, timezone });
  await setStoredValue(STORAGE_KEYS.teamMembers, updatedMembers);
  renderMemberList(updatedMembers);
  memberForm.reset();
  editingMemberId = null;
  memberNameField.focus();
}

async function handlePreferencesSubmit(event) {
  event.preventDefault();
  const formData = new FormData(preferencesForm);
  const defaultTimezone = formData.get('defaultTimezone');
  await setStoredValue(STORAGE_KEYS.preferences, { defaultTimezone });
}

async function hydrate() {
  await loadTimezoneOptions(memberTimezoneField);
  await loadTimezoneOptions(defaultTimezoneField, { includeEmpty: true });

  const [members, preferences] = await Promise.all([
    getStoredValue(STORAGE_KEYS.teamMembers, []),
    getStoredValue(STORAGE_KEYS.preferences, {})
  ]);

  renderMemberList(members);
  if (preferences.defaultTimezone) {
    defaultTimezoneField.value = preferences.defaultTimezone;
  }
}

function init() {
  hydrate();
  memberForm.addEventListener('submit', handleMemberSubmit);
  preferencesForm.addEventListener('submit', handlePreferencesSubmit);
}

document.addEventListener('DOMContentLoaded', init);