// Supabase Client
const supabaseUrl = 'https://teuasvpvlkmjanefblut.supabase.co';
const supabaseKey = 'YOUR_PUBLIC_ANON_KEY'; // Dashboard > Settings > API'den anon key al
const supabase = Supabase.createClient(supabaseUrl, supabaseKey);

// Kayıt Formu
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const { data, error } = await supabase.auth.signUp({ email, password });
  const messageEl = document.getElementById('signup-message');
  if (error) {
    messageEl.textContent = 'Kayıt hatası: ' + error.message;
  } else {
    messageEl.textContent = 'Kayıt başarılı! E-posta doğrulama gönderildi.';
  }
});

// Giriş Formu
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  const messageEl = document.getElementById('login-message');
  if (error) {
    messageEl.textContent = 'Giriş hatası: ' + error.message;
  } else {
    messageEl.textContent = 'Giriş başarılı!';
    updateUI(data.user);
    // Durum sayfasındaysa durumu çek
    if (document.getElementById('statusText')) {
      await fetchStatus();
    }
  }
});

// Çıkış Yap
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert('Çıkış hatası: ' + error.message);
  } else {
    updateUI(null);
  }
}

// UI Güncelleme
function updateUI(user) {
  const authContainer = document.getElementById('auth-container');
  const userInfo = document.getElementById('user-info');
  const userEmail = document.getElementById('user-email');
  if (user) {
    authContainer.style.display = 'none';
    userInfo.style.display = 'block';
    userEmail.textContent = user.email;
    // Durum sayfasında giriş yapmış kullanıcıyı yönlendir
    if (document.getElementById('statusText')) {
      fetchStatus();
    }
  } else {
    authContainer.style.display = 'block';
    userInfo.style.display = 'none';
  }
}

// Oturum Durumu Takibi
supabase.auth.onAuthStateChange((event, session) => {
  updateUI(session?.user || null);
});

// Durumu Çek (status tablosundan)
async function fetchStatus() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    document.getElementById('statusText').innerText = 'Lütfen giriş yap!';
    document.getElementById('lastUpdate').innerText = '-';
    return;
  }
  const { data, error } = await supabase
    .from('status')
    .select('status_text, last_updated')
    .eq('user_id', user.user.id)
    .single();
  if (error || !data) {
    document.getElementById('statusText').innerText = 'Durum bulunamadı';
    document.getElementById('lastUpdate').innerText = '-';
  } else {
    document.getElementById('statusText').innerText = data.status_text || 'Aktif • Emek Mahallesi';
    document.getElementById('lastUpdate').innerText = new Date(data.last_updated).toLocaleString('tr-TR');
  }
}

// Durumu Güncelle (status tablosuna kaydet)
async function editStatus() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    alert('Durumu güncellemek için giriş yapmalısın!');
    window.location.href = 'index.html';
    return;
  }
  const newStatus = prompt("Yeni durumunu gir (örneğin: Aktif • Beşiktaş):", document.getElementById('statusText').innerText);
  if (newStatus && newStatus.trim() !== "") {
    const { error } = await supabase
      .from('status')
      .upsert([
        {
          user_id: user.user.id,
          status_text: newStatus.trim(),
          last_updated: new Date().toISOString()
        }
      ], { onConflict: ['user_id'] });
    if (error) {
      alert('Durum güncelleme hatası: ' + error.message);
    } else {
      document.getElementById('statusText').innerText = newStatus.trim();
      document.getElementById('lastUpdate').innerText = new Date().toLocaleString('tr-TR');
      alert('Durum Supabase\'e kaydedildi!');
    }
  }
}
