import { createSlice } from "@reduxjs/toolkit";

// Arşiv ve görev sayfalarında filtreleme işlemleri için varsayılan (ilk) ayarlar
const initialFilters = {
  status: "all",           // Görev Durumu (Örn: Tamamlandı, Devam Ediyor). 'all' hepsi demek.
  priority: "all",         // Öncelik Durumu (Örn: Düşük, Yüksek)
  assignedBy: "all",       // Görevi Veren Kişi
  assignedTo: "all",       // Görevin Atandığı Kişi
  dateRange: { start: "", end: "" }, // Tarih aralığı (Başlangıç ve Bitiş)
  groupId: "all",          // Grup numarası
  role: "all",             // Rol
  searchTerm: "",          // Arama kutusuna yazılan kelime/metin
};

// Filtrelerin durumunu yöneten Redux dilimi (Slice)
const filterSlice = createSlice({
  name: "filters",
  // Yukarıdaki varsayılan ayarları başlangıç durumu (state) olarak veriyoruz.
  initialState: initialFilters,
  
  reducers: {
    // Sadece TEK BİR filtreyi değiştirmek için kullanılır.
    // Örn: Sadece arama kutusuna (searchTerm) bir şey yazıldığında.
    setFilter: (state, action) => {
      const { field, value } = action.payload; // field: 'searchTerm', value: 'Yazılım'
      // Eğer değiştirilmek istenen özellik state içinde varsa günceller
      if (field in state) {
        state[field] = value;
      }
    },
    // BİRDEN FAZLA filtreyi aynı anda değiştirmek için kullanılır.
    setFilters: (state, action) => {
      // Eski filtrelerin üzerine yeni gelen filtre değerlerini yazar
      return { ...state, ...action.payload };
    },
    // Tüm filtreleri sıfırlayarak varsayılan ilk ayarlara geri döndürür.
    // Ekranda "Filtreleri Temizle" butonuna basıldığında bu çalışır.
    resetFilters: () => {
      return initialFilters;
    },
  },
});

// Fonksiyonları sayfalar içinde kullanabilmek için dışa aktarıyoruz
export const { setFilter, setFilters, resetFilters } = filterSlice.actions;

// Bileşenlerde mevcut filtreleri (durum, arama vb.) okuyabilmek için seçici (selector)
export const selectFilters = (state) => state.filters;

// Store'a kaydetmek için reducer'ı dışa aktarıyoruz
export default filterSlice.reducer;
