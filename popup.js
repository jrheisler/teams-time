import {
  STORAGE_KEYS,
  getStoredValue,
  setStoredValue,
  upsertMember,
  loadTimezoneOptions
} from './util.js';

const timezoneList = document.getElementById('timezone-list');
const quickAddForm = document.getElementById('quick-add-form');
const quickNameField = document.getElementById('quick-name');
const quickTimezoneField = document.getElementById('quick-timezone');

function renderTeamMembers(members) {
  timezoneList.innerHTML = '';
  if (!members.length) {
    const emptyState = document.createElement('li');
    emptyState.className = 'timezone-item';
    emptyState.textContent = 'Add teammates to see their current time.';
    timezoneList.append(emptyState);
    return;
  }

  for (const member of members) {
    const item = document.createElement('li');
    item.className = 'timezone-item';

    const info = document.createElement('div');
    info.className = 'timezone-details';
    const name = document.createElement('strong');
    name.textContent = member.name;
    const timezone = document.createElement('span');
    timezone.textContent = member.timezone;
    info.append(name, timezone);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.className = 'secondary';
    removeButton.addEventListener('click', async () => {
      const filtered = members.filter((entry) => entry.id !== member.id);
      await setStoredValue(STORAGE_KEYS.teamMembers, filtered);
      renderTeamMembers(filtered);
    });

    item.append(info, removeButton);
    timezoneList.append(item);
  }
}

async function handleQuickAdd(event) {
  event.preventDefault();
  const formData = new FormData(quickAddForm);
  const name = formData.get('name');
  const timezone = formData.get('timezone');
  if (!name || !timezone) {
    return;
  }

  const members = await getStoredValue(STORAGE_KEYS.teamMembers, []);
  const updatedMembers = upsertMember(members, { name, timezone });
  await setStoredValue(STORAGE_KEYS.teamMembers, updatedMembers);
  renderTeamMembers(updatedMembers);
  quickAddForm.reset();
  quickNameField.focus();
}

async function init() {
  await loadTimezoneOptions(quickTimezoneField);
  const members = await getStoredValue(STORAGE_KEYS.teamMembers, []);
  renderTeamMembers(members);
  quickAddForm.addEventListener('submit', handleQuickAdd);
}

document.addEventListener('DOMContentLoaded', init);