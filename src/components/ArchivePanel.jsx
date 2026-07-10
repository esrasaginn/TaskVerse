import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectArchivedTasksForUser } from '../features/archive/archiveSlice';
import { selectFilters, setFilter, resetFilters } from '../features/filters/filterSlice';
import { selectAllUsers } from '../features/users/userSlice';

const ArchivePanel = () => {
  const dispatch = useDispatch();
  const historyTasks = useSelector(selectArchivedTasksForUser);
  const filters = useSelector(selectFilters);
  const users = useSelector(selectAllUsers);

  // Calculate statistics
  const totalCount = historyTasks.length;
  const approvedCount = historyTasks.filter(t => t.status === 'onaylandi').length;
  const deletedCount = historyTasks.filter(t => t.status === 'iptal_edildi').length;

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'yuksek': return 'Yüksek';
      case 'orta': return 'Orta';
      case 'dusuk': return 'Düşük';
      default: return priority;
    }
  };

  const getStatusLabel = (task) => {
    if (task.status === 'iptal_edildi') return 'İptal Edildi (Silindi)';
    switch (task.status) {
      case 'bekliyor': return 'Bekliyor';
      case 'devam_ediyor': return 'Devam Ediyor';
      case 'tamamlandi': return 'Tamamlandı (Onay Bekliyor)';
      case 'tamamlanmadi': return 'Tamamlanmadı (Onay Bekliyor)';
      case 'onaylandi': return 'Onaylandı';
      case 'reddedildi': return 'Reddedildi';
      default: return task.status;
    }
  };

  const getStatusClass = (task) => {
    if (task.status === 'iptal_edildi') return 'deleted';
    return task.status;
  };

  const getActorName = (userId) => {
    const u = users.find(x => x.id === userId);
    return u ? `${u.icon} ${u.fullName}` : userId;
  };

  // Filter logic
  const filteredTasks = historyTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesStatus = filters.status === 'all' || task.status === filters.status;
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort logic: Sorted by timestamp of task ID, newest first
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const timeA = parseInt(a.id.replace(/^[a-zA-Z-]+/, '')) || 0;
    const timeB = parseInt(b.id.replace(/^[a-zA-Z-]+/, '')) || 0;
    return timeB - timeA;
  });

  const handleClearFilters = () => {
    dispatch(resetFilters());
  };

  // Split into first 6 (cards) and remaining (data table)
  const cardTasks = sortedTasks.slice(0, 6);
  const tableTasks = sortedTasks.slice(6);

  // Pagination for tableTasks
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(tableTasks.length / itemsPerPage);
  const displayedTableTasks = tableTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset pagination if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.searchTerm, filters.status, filters.priority]);

  return (
    <div className="archive-page" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="dashboard-title-section">
        <h2 className="serif-font">📂 Görev Arşivi</h2>
        <p className="dashboard-subtitle">
          Tamamlanan (onaylanan) ve iptal edilen geçmiş görevlerinizin tüm detaylarını buradan inceleyebilirsiniz.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="archive-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="archive-stat-card">
          <div className="archive-stat-icon-box" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            📂
          </div>
          <div className="archive-stat-content">
            <span className="archive-stat-value">{totalCount}</span>
            <span className="archive-stat-label">Toplam Kayıt</span>
          </div>
        </div>

        <div className="archive-stat-card">
          <div className="archive-stat-icon-box" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
            ✔️
          </div>
          <div className="archive-stat-content">
            <span className="archive-stat-value">{approvedCount}</span>
            <span className="archive-stat-label">Onaylananlar</span>
          </div>
        </div>

        <div className="archive-stat-card">
          <div className="archive-stat-icon-box" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
            ❌
          </div>
          <div className="archive-stat-content">
            <span className="archive-stat-value">{deletedCount}</span>
            <span className="archive-stat-label">Silinen / İptaller</span>
          </div>
        </div>
      </div>

      {/* Filters Form */}
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="archive-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div className="filter-group" style={{ flex: '2 1 300px' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Arama</label>
            <input
              type="text"
              className="form-control"
              placeholder="Görev başlığı veya açıklama..."
              value={filters.searchTerm}
              onChange={(e) => dispatch(setFilter({ field: 'searchTerm', value: e.target.value }))}
            />
          </div>

          <div className="filter-group" style={{ flex: '1 1 150px' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Durum</label>
            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => dispatch(setFilter({ field: 'status', value: e.target.value }))}
            >
              <option value="all">Tümü (Tarihçe)</option>
              <option value="onaylandi">Onaylandı</option>
              <option value="iptal_edildi">İptal Edilenler</option>
            </select>
          </div>

          <div className="filter-group" style={{ flex: '1 1 150px' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Öncelik</label>
            <select
              className="form-control"
              value={filters.priority}
              onChange={(e) => dispatch(setFilter({ field: 'priority', value: e.target.value }))}
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="dusuk">Düşük</option>
              <option value="orta">Orta</option>
              <option value="yuksek">Yüksek</option>
            </select>
          </div>

          <button 
            type="button" 
            className="btn-secondary" 
            style={{ height: '40px', padding: '0 16px', whiteSpace: 'nowrap' }}
            onClick={handleClearFilters}
          >
            🧹 Filtreleri Temizle
          </button>
        </div>
      </div>

      {/* Grid of Archived Tasks (First 6 items as Cards) */}
      {sortedTasks.length === 0 ? (
        <div className="empty-state panel-card" style={{ padding: '40px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>📂</span>
          <p style={{ fontWeight: '600', color: 'var(--navy-dark)' }}>Arşivde kriterlere uygun görev bulunmamaktadır.</p>
        </div>
      ) : (
        <>
          {cardTasks.length > 0 && (
            <div className="tasks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {cardTasks.map(task => (
                <div key={task.id} className="task-card archived-task-card" style={{ opacity: 0.9 }}>
                  <div className="task-card-header">
                    <h4 className="task-card-title">{task.title}</h4>
                    <div className="task-badges">
                      <span className={`badge badge-priority-${task.priority}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      <span className={`badge badge-status-${getStatusClass(task)}`}>
                        {getStatusLabel(task)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="task-card-body">
                    <p className="task-desc">{task.description}</p>
                    {task.feedback && (
                      <div className="task-feedback-section">
                        <span className="feedback-title">Geri Bildirim:</span>
                        <p className="feedback-text">“{task.feedback}”</p>
                      </div>
                    )}
                    {task.rejectionReason && (
                      <div className="task-feedback-section" style={{ borderLeftColor: 'var(--priority-yuksek)', backgroundColor: '#fff5f5' }}>
                        <span className="feedback-title" style={{ color: 'var(--priority-yuksek)' }}>Reddedilme Nedeni:</span>
                        <p className="feedback-text" style={{ color: '#b91c1c' }}>“{task.rejectionReason}”</p>
                      </div>
                    )}
                  </div>

                  <div className="task-card-footer">
                    <div className="task-actors">
                      <span>Veren: <strong>{getActorName(task.assignedBy)}</strong></span>
                      <span>Alan: <strong>{getActorName(task.assignedTo)}</strong></span>
                    </div>
                    <div className="task-date">
                      Süreç Sonu: <strong>{task.dueDate}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Remaining items shown in tabular Data Table with pagination */}
          {tableTasks.length > 0 && (
            <div className="archive-table-container">
              <h4 style={{ margin: '4px 0 12px', color: 'var(--navy-dark)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Diğer Arşivlenmiş Görevler (Tablo Görünümü)
              </h4>
              <table className="archive-table">
                <thead>
                  <tr>
                    <th>Görev Başlığı</th>
                    <th>Öncelik</th>
                    <th>Durum</th>
                    <th>Veren / Alan</th>
                    <th>Süreç Sonu</th>
                    <th>Detay / Geri Bildirim</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTableTasks.map(task => (
                    <tr key={task.id}>
                      <td style={{ fontWeight: '600' }}>{task.title}</td>
                      <td>
                        <span className={`badge badge-priority-${task.priority}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-status-${getStatusClass(task)}`}>
                          {getStatusLabel(task)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column' }}>
                          <span>Veren: {getActorName(task.assignedBy)}</span>
                          <span>Alan: {getActorName(task.assignedTo)}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '500' }}>{task.dueDate}</td>
                      <td>
                        <div style={{ fontSize: '0.8rem', maxWidth: '320px' }}>
                          <p style={{ margin: 0 }}><strong>Açıklama:</strong> {task.description}</p>
                          {task.feedback && <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}><strong>Geri Bildirim:</strong> “{task.feedback}”</p>}
                          {task.rejectionReason && <p style={{ margin: '4px 0 0', color: '#b91c1c' }}><strong>Ret Nedeni:</strong> “{task.rejectionReason}”</p>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {totalPages > 1 && (
                <div className="archive-pagination">
                  <button 
                    className="archive-pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    ◀ Önceki
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    Sayfa {currentPage} / {totalPages}
                  </span>
                  <button 
                    className="archive-pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Sonraki ▶
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ArchivePanel;
