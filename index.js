// Supabase Client
const supabaseUrl = 'https://teuasvpvlkmjanefblut.supabase.co';
const supabaseKey = 'YOUR_PUBLIC_ANON_KEY'; // Dashboard > Settings > API'den anon key al
const supabase = Supabase.createClient(supabaseUrl, supabaseKey);

// Sabit admin parolası
const ADMIN_PASSWORD = 'clawy123'; // İstersen değiştir

// Durumu Çek
async function fetchStatus() {
  const statusTextEl = document.getElementById('statusText');
  const lastUpdateEl = document.getElementById('lastUpdate');
  if (!statusTextEl || !lastUpdateEl) return;

  const { data, error } = await supabase
    .from('status')
    .select('status_text, last_updated')
    .order('last_updated', { ascending: false })
    .limit(1);
  if (error) {
    statusTextEl.innerText = 'Durum bulunamadı';
    lastUpdateEl.innerText = '-';
    console.error('Veri çekme hatası:', error);
  } else if (data && data.length > 0) {
    statusTextEl.innerText = data[0].status_text || 'Aktif • Emek Mahallesi';
    lastUpdateEl.innerText = new Date(data[0].last_updated).toLocaleString('tr-TR');
  } else {
    statusTextEl.innerText = 'Aktif • Emek Mahallesi';
    lastUpdateEl.innerText = '-';
  }
}

// Durumu Güncelle
async function editStatus() {
  const password = prompt('Admin parolasını gir:');
  if (password !== ADMIN_PASSWORD) {
    alert('Yanlış parola!');
    return;
  }

  const newStatus = prompt('Yeni durumunu gir (örneğin: Aktif • Beşiktaş):', document.getElementById('statusText').innerText);
  if (newStatus && newStatus.trim() !== '') {
    const { error } = await supabase
      .from('status')
      .insert([
        {
          status_text: newStatus.trim(),
          last_updated: new Date().toISOString()
        }
      ]);
    if (error) {
      alert('Durum güncelleme hatası: ' + error.message);
      console.error('Güncelleme hatası:', error);
    } else {
      document.getElementById('statusText').innerText = newStatus.trim();
      document.getElementById('lastUpdate').innerText = new Date().toLocaleString('tr-TR');
      alert('Durum Supabase\'e kaydedildi!');
    }
  }
}
