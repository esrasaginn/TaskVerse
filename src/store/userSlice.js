import { createSlice } from "@reduxjs/toolkit";
// Projedeki 140 kişinin bilgilerini içeren sahte (mock) JSON veritabanını içe aktarıyoruz
import db from "../../data/taskverse-db-turkce-isimli.json";

// Her bir role (yönetici, takım lideri, geliştirici) karşılık gelen Türkçe unvanları ve ikonları tanımlıyoruz
const roleMeta = {
  manager: { title: "Yönetici", icon: "👔" },
  teamLeader: { title: "Takım Lideri", icon: "🧭" },
  developer: { title: "Geliştirici", icon: "💻" },
};

// JSON dosyasından gelen kullanıcıları okuyup, her birinin rolüne göre başlık ve ikon ekliyoruz.
const initialUsers = db.users.map((u) => {
  // Eğer kullanıcının rolü yukarıda tanımlı değilse varsayılan olarak "Üye" ve "👤" ikonunu ver
  const meta = roleMeta[u.role] || { title: "Üye", icon: "👤" };
  return {
    ...u,           // Kullanıcının mevcut bilgilerini kopyala (id, isim, şifre vb.)
    title: meta.title, // Türkçe unvanı ekle
    icon: meta.icon,   // İkonu ekle
  };
});

// Kullanıcılarla ilgili durum (state) yönetimini yapan Redux dilimi
const userSlice = createSlice({
  name: "users", // Bu dilimin adı
  initialState: {
    // Uygulama ilk açıldığında yukarıda hazırladığımız 'initialUsers' listesini kullan
    users: initialUsers, 
  },
  reducers: {
    // Gerekirse dışarıdan yeni bir kullanıcı listesi yüklemek için kullanılacak fonksiyon
    setUsers: (state, action) => {
      // Gelen yeni listeye de yukarıdaki gibi unvan ve ikon ekleyip state'e kaydet
      state.users = action.payload.map((u) => {
        const meta = roleMeta[u.role] || { title: "Üye", icon: "👤" };
        return {
          ...u,
          title: meta.title,
          icon: meta.icon,
        };
      });
    },
  },
});

export const { setUsers } = userSlice.actions;

// --- SEÇİCİLER (SELECTORS) ---
// Bileşenlerin (sayfaların) Redux içindeki kullanıcı verilerini kolayca çekmesini sağlayan yardımcı fonksiyonlar

// Tüm kullanıcı listesini getirir
export const selectAllUsers = (state) => state.users.users;

// Sadece belirli bir gruptaki (Örn: groupId = 1) kullanıcıları getirir
export const selectUsersByGroup = (state, groupId) =>
  state.users.users.filter((u) => u.groupId === groupId);

// Sistemdeki tüm Yöneticileri getirir
export const selectManagers = (state) =>
  state.users.users.filter((u) => u.role === "manager");

// Sistemdeki tüm Takım Liderlerini getirir
export const selectTeamLeaders = (state) =>
  state.users.users.filter((u) => u.role === "teamLeader");

// Sistemdeki tüm Geliştiricileri getirir
export const selectDevelopers = (state) =>
  state.users.users.filter((u) => u.role === "developer");

// Belirli bir yöneticinin GURUBUNA bağlı olan Takım Liderlerini getirir.
// (Örneğin 1. grubun yöneticisi sadece 1. grubun takım liderlerini görebilsin diye)
export const selectTeamLeadersByManagerGroup = (state, managerGroupId) =>
  state.users.users.filter(
    (u) => u.role === "teamLeader" && u.groupId === managerGroupId
  );

// Belirli bir Takım Liderinin GURUBUNA bağlı olan Geliştiricileri getirir.
export const selectDevelopersByTeamLeaderGroup = (state, teamLeaderId) => {
  const users = state.users.users;
  // Önce ID'den takım liderini bul
  const leader = users.find((u) => u.id === teamLeaderId);
  // Eğer lider bulunamazsa boş liste döndür
  if (!leader) return [];
  // Lider bulunduysa, o liderle aynı grupta olan ve rolü geliştirici olanları listele
  return users.filter(
    (u) => u.role === "developer" && u.groupId === leader.groupId
  );
};

// Bu reducer'ı store.js içinde kullanmak için dışa aktarıyoruz.
export default userSlice.reducer;
