const SUPABASE_URL = 'https://cuxazxzpvrodsmxktkne.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eGF6eHpwdnJvZHNteGt0a25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTcxNzUsImV4cCI6MjA4NjgzMzE3NX0.8zGB_E_AAsU6wnBIBZnpQmDrmyKJXPLU11UChyZZKJ4';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentAdmin = null;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = '../app/index.html';
        return;
    }

    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_admin) {
        alert('আপনার অ্যাডমিন অ্যাক্সেস নেই');
        window.location.href = '../app/index.html';
        return;
    }

    currentAdmin = profile;
    loadReminders();
});

window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`${tabId}-tab`).classList.remove('hidden');
    
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (tabId === 'reminders') loadReminders();
    if (tabId === 'donors') loadDonors();
    if (tabId === 'users') loadUsers();
};

async function loadReminders() {
    const list = document.getElementById('reminders-list');
    list.innerHTML = '<p class="text-center py-10">লোড হচ্ছে...</p>';
    
    const { data } = await supabaseClient.from('daily_reminders').select('*').order('created_at', { ascending: false });
    
    list.innerHTML = data.map(r => `
        <div class="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center">
            <div>
                <p class="text-slate-800 font-medium">${r.content}</p>
                <p class="text-[10px] text-slate-400 mt-2">${new Date(r.created_at).toLocaleDateString('bn-BD')}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="toggleReminder(${r.id}, ${r.is_active})" class="p-2 ${r.is_active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50'} rounded-lg">
                    <i class="fas ${r.is_active ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </button>
                <button onclick="deleteReminder(${r.id})" class="p-2 text-red-600 bg-red-50 rounded-lg">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

window.openReminderModal = () => document.getElementById('reminder-modal').style.display = 'flex';
window.closeReminderModal = () => document.getElementById('reminder-modal').style.display = 'none';

window.saveReminder = async () => {
    const content = document.getElementById('reminder-content').value;
    if (!content) return;

    await supabaseClient.from('daily_reminders').insert([{ content, is_active: true }]);
    closeReminderModal();
    loadReminders();
};

window.deleteReminder = async (id) => {
    if (confirm('আপনি কি নিশ্চিত?')) {
        await supabaseClient.from('daily_reminders').delete().eq('id', id);
        loadReminders();
    }
};

window.toggleReminder = async (id, currentStatus) => {
    await supabaseClient.from('daily_reminders').update({ is_active: !currentStatus }).eq('id', id);
    loadReminders();
};

async function loadDonors() {
    const body = document.getElementById('donors-table-body');
    const { data } = await supabaseClient.from('blood_donors').select('*').order('created_at', { ascending: false });
    
    body.innerHTML = data.map(d => `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="px-6 py-4 text-sm font-bold">${d.name}</td>
            <td class="px-6 py-4 text-sm text-red-600 font-bold">${d.blood_group}</td>
            <td class="px-6 py-4 text-sm text-slate-600">${d.location}</td>
            <td class="px-6 py-4 text-sm text-slate-600">${d.contact}</td>
            <td class="px-6 py-4">
                <button onclick="deleteDonor(${d.id})" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

window.deleteDonor = async (id) => {
    if (confirm('ডিলিট করতে চান?')) {
        await supabaseClient.from('blood_donors').delete().eq('id', id);
        loadDonors();
    }
};

async function loadUsers() {
    const list = document.getElementById('users-list');
    const { data } = await supabaseClient.from('profiles').select('*');
    
    list.innerHTML = data.map(u => `
        <div class="bg-white p-5 rounded-2xl border border-slate-200">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                    ${u.full_name ? u.full_name[0] : 'U'}
                </div>
                <div>
                    <p class="font-bold text-slate-800">${u.full_name || 'অজানা ইউজার'}</p>
                    <p class="text-xs text-slate-400">${u.email || ''}</p>
                </div>
            </div>
            <div class="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span class="text-[10px] px-2 py-1 rounded-md ${u.is_admin ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'} font-bold uppercase">
                    ${u.is_admin ? 'Admin' : 'User'}
                </span>
            </div>
        </div>
    `).join('');
}

window.handleLogout = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '../app/index.html';
};