import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAllUsers } from '../features/users/userSlice';
// Redux'tan görev işlemleriyle ilgili gerekli fonksiyonları çağırıyoruz
import { 
  addTaskThunk, 
  updateTaskThunk, 
  deleteTaskThunk, 
  completeTaskThunk, 
  changeTaskStatusThunk 
} from '../features/tasks/taskSlice';
import { addNotificationThunk } from '../features/notifications/notificationSlice';

// TaskCard Bileşeni
// Görevlerin ekranda bir "kart" şeklinde görünmesini ve yönetilmesini sağlar
// task: Görevin tüm verileri (başlık, açıklama, tarih vb.)
// userRole: Kartı görüntüleyen kişinin rolü (Yönetici, Lider, Geliştirici)
// viewMode: Kartın görünüm türü ('created_by_me' -> benim oluşturduğum, 'assigned_to_me' -> bana atanan)
const TaskCard = ({ 
  task, 
  userRole, 
  viewMode
}) => {
  const dispatch = useDispatch();
  const users = useSelector(selectAllUsers);
  const currentUser = useSelector((state) => state.auth.currentUser);

  // Görevin yerel kopyasını (durum ve geri bildirim) tutan state'ler
  // Kullanıcı henüz kaydet'e basmadan önceki değişiklikleri buralarda tutuyoruz
  const [localStatus, setLocalStatus] = useState(task.status);
  const [localFeedback, setLocalFeedback] = useState(task.feedback || '');
  
  // Görevi reddetme durumuyla ilgili state'ler
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Görevi düzenleme durumuyla ilgili state'ler
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editDueDate, setEditDueDate] = useState(task.dueDate);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editCategory, setEditCategory] = useState(task.category || 'mülki');

  // Görev devretme (Takım liderinden geliştiriciye) durumuyla ilgili state'ler
  const [showDelegateForm, setShowDelegateForm] = useState(false);
  const [delegationText, setDelegationText] = useState('');
  
  // Aynı grupta bulunan geliştiricileri buluyoruz
  const groupDevelopers = users.filter(u => u.role === 'developer' && u.groupId === currentUser?.groupId);
  const [delegateToId, setDelegateToId] = useState('');

  // Takım lideri giriş yaptığında geliştirici seçimi için ilk sıradakini otomatik seç
  useEffect(() => {
    if (groupDevelopers.length > 0) {
      setDelegateToId(groupDevelopers[0].id);
    }
  }, [currentUser, users]);

  // Silme onayı penceresinin gösterilip gösterilmeyeceğini kontrol eden state
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Props'tan (üst bileşenden) gelen görev verisi değiştiğinde yerel değerleri de güncelle
  useEffect(() => {
    setLocalStatus(task.status);
    setLocalFeedback(task.feedback || '');
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditDueDate(task.dueDate);
    setEditPriority(task.priority);
    setEditCategory(task.category || 'mülki');
    setShowRejectionInput(false);
    setRejectionReasonText('');
  }, [task]);

  // Görevi atayan ve alan kişilerin tüm detaylarını (isim, ikon vb.) bul
  const assignedByUser = users.find(u => u.id === task.assignedBy);
  const assignedToUser = users.find(u => u.id === task.assignedTo);

  // Öncelik etiketini Türkçeye çeviren yardımcı fonksiyon
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'yuksek': return 'Yüksek';
      case 'orta': return 'Orta';
      case 'dusuk': return 'Düşük';
      default: return priority;
    }
  };

  // Durum etiketini kullanıcı dostu Türkçe metne çeviren yardımcı fonksiyon
  const getStatusLabel = (status) => {
    switch (status) {
      case 'bekliyor': return 'Bekliyor';
      case 'devam_ediyor': return 'Devam Ediyor';
      case 'tamamlandi': return 'Tamamlandı (Onay Bekliyor)';
      case 'tamamlanmadi': return 'Tamamlanmadı (Onay Bekliyor)';
      case 'onaylandi': return 'Onaylandı';
      case 'reddedildi': return 'Reddedildi';
      case 'iptal_edildi': return 'İptal Edildi';
      default: return status;
    }
  };

  // CSS class ismi atamak için kullanılır (örneğin kırmızı veya yeşil yapmak için)
  const getStatusClass = (status) => {
    return status;
  };

  // Kategori adını ve ikonunu döndüren fonksiyon
  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'askeri': return 'Yazılım / Geliştirme 💻';
      case 'imari': return 'Altyapı / DevOps ⚙️';
      case 'mali': return 'Finans / Bütçe 💰';
      case 'mülki': return 'Yönetim / İdari 📁';
      default: return 'Genel 📁';
    }
  };

  // Çalışan kişi "Geri Bildirim Gönder" butonuna bastığında çalışır
  const handleSendFeedback = (e) => {
    e.preventDefault();
    // Eğer geri bildirim kutusu boşsa uyarı ver
    if (!localFeedback.trim()) {
      dispatch(addNotificationThunk({ message: "Lütfen tamamlanan iş hakkında geri bildirim yazınız!", type: "error" }));
      return;
    }
    // Görevi henüz kabul etmediyse (bekliyor) bildirim gönderemez
    if (localStatus === 'bekliyor') {
      dispatch(addNotificationThunk({ message: "Görev durumunu 'Devam Ediyor', 'Tamamlandı' veya 'Tamamlanmadı' olarak seçmelisiniz!", type: "error" }));
      return;
    }
    
    // Veritabanında (veya Redux'ta) görevin durumunu ve açıklamasını güncelle
    dispatch(changeTaskStatusThunk({ id: task.id, status: localStatus, feedback: localFeedback }));
    
    // Görevi veren kişiye, kişinin durumu güncellediğini haber veren bir bildirim gönder
    dispatch(addNotificationThunk({
      message: `${currentUser.fullName} görev bildiriminde bulundu: "${task.title}". Durum: ${getStatusLabel(localStatus)}`,
      type: 'info',
      assignedTo: task.assignedBy
    }));

    dispatch(addNotificationThunk({ message: 'Geri bildirim başarıyla gönderildi.', type: 'success' }));
  };

  // Takım lideri bir görevi altındaki geliştiriciye (devretmek) atamak istediğinde çalışır
  const handleDelegateSubmit = (e) => {
    e.preventDefault();
    if (!delegationText.trim()) {
      dispatch(addNotificationThunk({ message: "Lütfen Geliştiriciye iletilecek görev tanımını yazınız!", type: "error" }));
      return;
    }
    // Geliştirici seçilmediyse ilkini otomatik al
    const targetDevId = delegateToId || (groupDevelopers[0]?.id || 'developer1');
    const childTaskId = 'task-dev-' + Date.now(); // Geliştiriciye giden göreve yeni benzersiz bir ID oluştur
    
    // Geliştiriciye yeni bir "alt görev" (child task) oluştur
    dispatch(addTaskThunk({
      id: childTaskId,
      title: `Geliştirici Süreci: ${task.title}`,
      description: delegationText,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category || 'mülki',
      status: 'bekliyor',
      assignedBy: currentUser.id,
      assignedByRole: 'teamLeader',
      assignedTo: targetDevId,
      assignedToRole: 'developer',
      groupId: currentUser.groupId,
      parentTaskId: task.id, // Bu alt görevin ana göreve bağlı olduğunu belirtiyoruz
      isArchived: false
    }));

    // Takım liderinin kendi görevini (ana görev) "devam ediyor" durumuna çek 
    // ve alt görevin ID'sini referans olarak ekle
    dispatch(updateTaskThunk({
      id: task.id,
      status: 'devam_ediyor',
      delegatedTaskId: childTaskId
    }));

    // Geliştiriciye görev atandığını bildiren mesaj
    dispatch(addNotificationThunk({
      message: `Takım Lideri ${currentUser.fullName} size yeni bir görev iletti: "${task.title}"`,
      type: 'info',
      assignedTo: targetDevId
    }));

    dispatch(addNotificationThunk({ message: 'Görev Geliştiriciye Gönderildi.', type: 'success' }));
    setDelegationText('');
    setShowDelegateForm(false);
  };

  // Yönetici görevi düzenleyip "Kaydet" dediğinde çalışır
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim() || !editDueDate) {
      dispatch(addNotificationThunk({ message: "Lütfen tüm alanları doldurunuz!", type: "error" }));
      return;
    }
    // Görevi güncel verilerle kaydet
    dispatch(updateTaskThunk({
      id: task.id,
      title: editTitle,
      description: editDescription,
      dueDate: editDueDate,
      priority: editPriority,
      category: editCategory
    }));
    dispatch(addNotificationThunk({ message: 'Görev detayları güncellendi.', type: 'success' }));
    setIsEditing(false); // Düzenleme modundan çık
  };

  // Görev iptal edilmek (silinmek) istendiğinde çalışır
  const handleConfirmDelete = () => {
    dispatch(deleteTaskThunk(task.id));
    
    // Görevi alan kişiye, görevinin iptal edildiğini bildir
    dispatch(addNotificationThunk({
      message: `Bir görev iptal edildi: "${task.title}"`,
      type: 'warning',
      assignedTo: task.assignedTo
    }));

    dispatch(addNotificationThunk({ message: 'Görev başarıyla iptal edildi.', type: 'success' }));
    setShowConfirmDelete(false); // Onay penceresini kapat
  };

  // --- YETKİ KONTROLLERİ ---

  // Bu karta bakan kişi "görevi yapan" (assignee) ise ve görev arşivlenmemişse durumunu güncelleyebilir mi?
  const isEditable = viewMode === 'assigned_to_me' && task.status !== 'onaylandi' && !task.isArchived;

  // Bu karta bakan kişi "görevi veren" (creator) ise ve görev tamamlandı olarak işaretlendiyse inceleyip onay/ret verebilir mi?
  const isReviewable = viewMode === 'created_by_me' && (task.status === 'tamamlandi' || task.status === 'tamamlanmadi') && !task.isArchived;

  // Görevi veren kişi, eğer görev henüz yeni verildiyse (bekliyor) veya reddedildiyse görevi düzenleyebilir veya silebilir.
  const isManageable = viewMode === 'created_by_me' && (task.status === 'bekliyor' || task.status === 'reddedildi') && !task.isArchived;

  return (
    <div className={`task-card ${task.status === 'onaylandi' ? 'task-card-approved' : ''}`}>
      
      {/* Görev Onaylandı / Reddedildi / İptal Edildi Damgaları */}
      {task.status === 'onaylandi' && (
        <div className="modern-status-stamp stamp-onaylandi">
          <span>ONAYLANDI</span>
        </div>
      )}
      {task.status === 'reddedildi' && (
        <div className="modern-status-stamp stamp-reddedildi">
          <span>REDDEDİLDİ</span>
        </div>
      )}
      {task.status === 'iptal_edildi' && (
        <div className="modern-status-stamp stamp-reddedildi" style={{ borderColor: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--text-muted)' }}>İPTAL EDİLDİ</span>
        </div>
      )}

      {isEditing ? (
        /* EĞER DÜZENLEME MODUNDAYSAK (Form Gösterilir) */
        <form onSubmit={handleSaveEdit} className="task-card-edit-form">
          <div className="form-group">
            <label>Görev Başlığı</label>
            <input 
              type="text" 
              className="form-control" 
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Görev Tanımı</label>
            <textarea 
              className="form-control" 
              rows="3"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Teslim Tarihi</label>
            <input 
              type="date" 
              className="form-control" 
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Kategori</label>
            <select 
              className="form-control" 
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            >
              <option value="mülki">Yönetim / İdari 📁</option>
              <option value="askeri">Yazılım / Geliştirme 💻</option>
              <option value="imari">Altyapı / DevOps ⚙️</option>
              <option value="mali">Finans / Bütçe 💰</option>
            </select>
          </div>
          <div className="form-group">
            <label>Öncelik</label>
            <select 
              className="form-control" 
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
            >
              <option value="dusuk">Düşük</option>
              <option value="orta">Orta</option>
              <option value="yuksek">Yüksek</option>
            </select>
          </div>
          <div className="btn-action-group">
            <button type="submit" className="btn-primary">💾 Kaydet</button>
            <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Vazgeç</button>
          </div>
        </form>
      ) : (
        /* DÜZENLEME MODUNDA DEĞİLSEK (Normal Kart Görünümü) */
        <>
          <div className="task-card-header">
            <h4 className="task-card-title">{task.title}</h4>
            <div className="task-badges">
              {/* Kategori Etiketi */}
              <span className="badge badge-category">
                {getCategoryLabel(task.category || 'mülki')}
              </span>
              {/* Öncelik Etiketi */}
              <span className={`badge badge-priority-${task.priority}`}>
                {getPriorityLabel(task.priority)}
              </span>
              {/* Durum Etiketi */}
              <span className={`badge badge-status badge-status-${getStatusClass(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
            </div>
          </div>

          {/* Görevin Açıklaması */}
          <div className="task-card-body">
            <p className="task-desc">{task.description}</p>
          </div>

          {/* Eğer çalışanın yazdığı bir geri bildirim varsa ekrana yazdır */}
          {task.feedback && (
            <div className="task-feedback-section">
              <span className="feedback-title">Geri Bildirim:</span>
              <p className="feedback-text">“{task.feedback}”</p>
            </div>
          )}

          {/* Eğer görev yöneticiden ret yediyse, ret sebebini göster */}
          {task.rejectionReason && (
            <div className="task-feedback-section" style={{ borderLeftColor: 'var(--priority-yuksek)', backgroundColor: '#fff5f5' }}>
              <span className="feedback-title" style={{ color: 'var(--priority-yuksek)' }}>Reddedilme Nedeni:</span>
              <p className="feedback-text" style={{ color: '#b91c1c' }}>“{task.rejectionReason}”</p>
            </div>
          )}

          {/* Takım Lideri eğer görevi geliştiriciye aktarmışsa, geliştiricinin süreci bu kutuda görünür */}
          {task.delegatedTaskId && (
            <div className="delegation-info-badge">
              <span className="delegation-info-title">💻 Geliştirici Süreç Durumu:</span>
              <span className={`badge badge-status badge-status-${getStatusClass(task.delegatedTaskStatus)}`}>
                {getStatusLabel(task.delegatedTaskStatus)}
              </span>
              {task.delegatedTaskFeedback && (
                <p className="delegation-feedback-text">
                  <strong>Geliştirici Geri Bildirimi:</strong> “{task.delegatedTaskFeedback}”
                </p>
              )}
              {task.delegatedTaskRejectionReason && (
                <p className="delegation-feedback-text" style={{ color: '#b91c1c' }}>
                  <strong>Ret Nedeni:</strong> “{task.delegatedTaskRejectionReason}”
                </p>
              )}
            </div>
          )}

          {/* Kartın En Altındaki Veren/Alan ve Tarih Bilgisi */}
          <div className="task-card-meta">
            <span className="task-creator">
              {/* Eğer bu kart bana atanmışsa 'Gönderen' kelimesini, benim oluşturduğum bir kartsa 'Sorumlu' kelimesini yaz */}
              {viewMode === 'assigned_to_me' ? 'Gönderen: ' : 'Sorumlu: '}
              <strong>
                {viewMode === 'assigned_to_me' 
                  ? (assignedByUser ? `${assignedByUser.icon} ${assignedByUser.fullName}` : task.assignedByRole)
                  : (assignedToUser ? `${assignedToUser.icon} ${assignedToUser.fullName}` : task.assignedToRole)
                }
              </strong>
            </span>
            <span className="task-date">
              ⏳ Teslim: <strong>{task.dueDate}</strong>
            </span>
          </div>

          {/* GÖREVİ VEREN KİŞİ İÇİN KONTROLLER (Düzenle ve İptal Et) */}
          {isManageable && (
            <div className="task-card-manage-row">
              {showConfirmDelete ? (
                // İptal Butonuna Basıldığında Çıkan Onay Ekranı
                <div className="confirm-delete-box">
                  <span>Bu görevi iptal etmek istediğinize emin misiniz?</span>
                  <div className="btn-action-group">
                    <button 
                      type="button" 
                      className="btn-danger btn-sm"
                      onClick={handleConfirmDelete}
                    >
                      Evet, İptal Et
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary btn-sm"
                      onClick={() => setShowConfirmDelete(false)}
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                // Düzenle ve İptal Et Butonları
                <>
                  <button 
                    type="button" 
                    className="btn-manage btn-manage-edit"
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️ Düzenle
                  </button>
                  <button 
                    type="button" 
                    className="btn-manage btn-manage-delete"
                    onClick={() => setShowConfirmDelete(true)}
                  >
                    🗑️ Görevi İptal Et
                  </button>
                </>
              )}
            </div>
          )}

          {/* GÖREVİ ALAN KİŞİ İÇİN KONTROLLER (Durum Bildirme, Form, Geri Bildirim Gönderme) */}
          {isEditable && (
            <div className="task-actions">
              {/* Durum Seçimi Butonları */}
              <div className="status-button-group">
                <button
                  type="button"
                  className={`btn-status-toggle ${localStatus === 'devam_ediyor' ? 'active' : ''}`}
                  data-status="devam_ediyor"
                  onClick={() => setLocalStatus('devam_ediyor')}
                >
                  Devam Ediyor
                </button>
                <button
                  type="button"
                  className={`btn-status-toggle ${localStatus === 'tamamlandi' ? 'active' : ''}`}
                  data-status="tamamlandi"
                  onClick={() => setLocalStatus('tamamlandi')}
                >
                  Tamamlandı
                </button>
                <button
                  type="button"
                  className={`btn-status-toggle ${localStatus === 'tamamlanmadi' ? 'active' : ''}`}
                  data-status="tamamlanmadi"
                  onClick={() => setLocalStatus('tamamlanmadi')}
                >
                  Tamamlanmadı
                </button>
              </div>

              {/* Geri Bildirim Yazma Kutusu */}
              <div className="feedback-input-group">
                <label htmlFor={`feedback-${task.id}`}>Geri Bildirim Metni</label>
                <textarea
                  id={`feedback-${task.id}`}
                  className="feedback-textarea"
                  placeholder="Görevle ilgili durumu, notlarınızı veya çıktıları buraya yazınız..."
                  value={localFeedback}
                  onChange={(e) => setLocalFeedback(e.target.value)}
                  required
                />
              </div>

              <button 
                type="button" 
                className="btn-primary"
                onClick={handleSendFeedback}
              >
                🤝 Geri Bildirim Gönder
              </button>

              {/* Eğer Görevi Alan Kişi 'Takım Lideri' ise Geliştiriciye Görev Gönderme Butonunu Göster */}
              {userRole === 'teamLeader' && !task.delegatedTaskId && (
                <div className="delegation-box">
                  {!showDelegateForm ? (
                    <button 
                      type="button" 
                      className="btn-manage btn-manage-delegate"
                      style={{ width: '100%', marginTop: '8px' }}
                      onClick={() => setShowDelegateForm(true)}
                    >
                      💻 Geliştiriciye Gönder (Görevlendir)
                    </button>
                  ) : (
                    <form onSubmit={handleDelegateSubmit} className="delegate-subform">
                      {/* Geliştirici Seçim Kutusu */}
                      {groupDevelopers.length > 0 && (
                        <div className="feedback-input-group">
                          <label>Görevlendirilecek Geliştirici</label>
                          <select
                            className="form-control"
                            value={delegateToId}
                            onChange={(e) => setDelegateToId(e.target.value)}
                            required
                            style={{ marginBottom: '12px' }}
                          >
                            {groupDevelopers.map(dev => (
                              <option key={dev.id} value={dev.id}>
                                {dev.icon} {dev.fullName}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="feedback-input-group">
                        <label>Geliştirici Görev Emri</label>
                        <textarea
                          className="feedback-textarea"
                          placeholder="Geliştiriciye aktarılacak detaylı görev tanımını giriniz..."
                          value={delegationText}
                          onChange={(e) => setDelegationText(e.target.value)}
                          required
                        />
                      </div>
                      <div className="btn-action-group">
                        <button type="submit" className="btn-primary">🚀 Gönder</button>
                        <button type="button" className="btn-secondary" onClick={() => setShowDelegateForm(false)}>İptal</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* GÖREVİ VEREN KİŞİ İÇİN KONTROLLER (Onaylama veya Reddetme Ekranı) */}
          {/* Görev "tamamlandı" dendiğinde sadece veren kişi onay verebilir. */}
          {isReviewable && (
            <div className="task-actions">
              <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--navy-dark)', fontStyle: 'italic' }}>
                Görevli çalışmasını tamamladığını beyan etti. Bu görevi onaylıyor musunuz?
              </p>
              
              {!showRejectionInput ? (
                // Onay veya Ret butonları
                <div className="btn-action-group">
                  <button
                    type="button"
                    className="btn-success"
                    onClick={() => {
                      // Onaylandığında görevi arşivleme sürecine sokar
                      dispatch(completeTaskThunk(task.id));
                      
                      // Görevi yapana bildirim gider
                      dispatch(addNotificationThunk({
                        message: `Tebrikler! "${task.title}" başlıklı göreviniz onaylandı.`,
                        type: 'success',
                        assignedTo: task.assignedTo
                      }));

                      dispatch(addNotificationThunk({ message: 'Görev başarıyla onaylandı.', type: 'success' }));
                    }}
                  >
                    ✔️ Onayla
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setShowRejectionInput(true)} // Ret Sebebi kutusunu açar
                  >
                    ❌ Reddet
                  </button>
                </div>
              ) : (
                // Ret Sebebi Yazma Formu
                <div className="rejection-form" style={{ marginTop: '10px', width: '100%' }}>
                  <div className="feedback-input-group">
                    <label style={{ color: 'var(--priority-yuksek)', fontWeight: 'bold' }}>Ret Sebebi (Zorunlu)</label>
                    <textarea
                      className="feedback-textarea"
                      placeholder="Görevin reddedilme sebebini yazınız..."
                      value={rejectionReasonText}
                      onChange={(e) => setRejectionReasonText(e.target.value)}
                      required
                    />
                  </div>
                  <div className="btn-action-group" style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => {
                        // Eğer ret sebebi boşsa hata ver
                        if (!rejectionReasonText.trim()) {
                          dispatch(addNotificationThunk({ message: "Lütfen ret sebebini yazınız!", type: "error" }));
                          return;
                        }
                        
                        // Durumu reddedildi olarak güncelle
                        dispatch(changeTaskStatusThunk({ id: task.id, status: 'reddedildi', rejectionReason: rejectionReasonText }));
                        
                        // Yapana bildir
                        dispatch(addNotificationThunk({
                          message: `Görev reddedildi: "${task.title}". Sebep: ${rejectionReasonText}`,
                          type: 'error',
                          assignedTo: task.assignedTo
                        }));

                        dispatch(addNotificationThunk({ message: 'Görev onaylanmadı ve reddedildi.', type: 'error' }));
                        setShowRejectionInput(false);
                        setRejectionReasonText('');
                      }}
                    >
                      ❌ Reddetmeyi Tamamla
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowRejectionInput(false);
                        setRejectionReasonText('');
                      }}
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskCard;
