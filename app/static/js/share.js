
document.addEventListener('DOMContentLoaded', () => {
  let selectedTournamentId = document.querySelector('#shareTabsContent .active')?.dataset.id;

  // Show loading overlay
  function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'block';
  }

  // Hide loading overlay
  function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
  }

  // Show toast notification
  function showNotification(message, type = 'success') {
    const notificationEl = document.getElementById('notification');
    const messageEl = document.getElementById('notificationMessage');
    
    // Set message text
    messageEl.textContent = message;
    
    // Remove previous classes
    notificationEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
    
    // Add appropriate class based on type
    if (type === 'success') {
      notificationEl.classList.add('text-bg-success');
    } else if (type === 'error') {
      notificationEl.classList.add('text-bg-danger');
    } else if (type === 'warning') {
      notificationEl.classList.add('text-bg-warning');
    } else if (type === 'info') {
      notificationEl.classList.add('text-bg-info');
    }
    
    // Show the toast
    const bsToast = bootstrap.Toast.getOrCreateInstance(notificationEl, { delay: 3000 });
    bsToast.show();
  }

  // Load current shares
  function loadAccessList(tid) {
    if (!tid) return;
    
    showLoading();
    
    fetch(`/api/tournament/${tid}/access_list`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const tbody = document.querySelector('#currentSharesTable tbody');
        tbody.innerHTML = '';

        if (data.length === 0) {
          // Show empty state message
          const tr = document.createElement('tr');
          tr.innerHTML = '<td colspan="4" class="text-center text-muted">No users have access to this tournament</td>';
          tbody.appendChild(tr);
          hideLoading();
          return;
        }

        data.forEach(share => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${share.email}</td>
            <td><span class="badge bg-info">View Only</span></td>
            <td>${new Date(share.access_granted).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-sm btn-danger remove-share-btn" data-user-id="${share.user_id}">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          tbody.appendChild(tr);
        });
        
        hideLoading();
      })
      .catch(err => {
        console.error('Error loading access list:', err);
        showNotification(`Failed to load access list: ${err.message}`, 'error');
        hideLoading();
      });
  }

  // Handle tournament tab switching
  document.querySelectorAll('#shareTabsContent .list-group-item').forEach(button => {
    button.addEventListener('click', () => {
      // Skip if already active
      if (button.classList.contains('active')) return;
      
      document.querySelectorAll('#shareTabsContent .list-group-item').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      selectedTournamentId = button.dataset.id;
      loadAccessList(selectedTournamentId);
      document.getElementById('userSearchResults').innerHTML = '';
      document.getElementById('userSearchInput').value = '';
    });
  });

  // Initial load
  if (selectedTournamentId) {
    loadAccessList(selectedTournamentId);
  }

  // Handle user search
  const searchInput = document.getElementById('userSearchInput');
  
  // Search on button click
  document.getElementById('userSearchBtn').addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (!query || !selectedTournamentId) return;
    
    searchUsers(query);
  });
  
  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (!query || !selectedTournamentId) return;
      
      searchUsers(query);
    }
  });
  
  // Function to search users
  function searchUsers(query) {
    showLoading();
    
    fetch(`/api/users?q=${encodeURIComponent(query)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(users => {
        const list = document.getElementById('userSearchResults');
        list.innerHTML = '';

        if (users.length === 0) {
          const li = document.createElement('li');
          li.className = 'list-group-item text-center text-muted';
          li.textContent = 'No users found matching your search';
          list.appendChild(li);
          hideLoading();
          return;
        }

        // Get current access list to check if users already have access
        fetch(`/api/tournament/${selectedTournamentId}/access_list`)
          .then(res => res.json())
          .then(currentAccess => {
            const currentUserIds = currentAccess.map(a => a.user_id);
            
            users.forEach(user => {
              const hasAccess = currentUserIds.includes(user.id);
              const li = document.createElement('li');
              li.className = 'list-group-item d-flex justify-content-between align-items-center';
              
              if (hasAccess) {
                li.innerHTML = `
                  ${user.username} (${user.email})
                  <span class="badge bg-secondary">Already has access</span>
                `;
              } else {
                li.innerHTML = `
                  ${user.username} (${user.email})
                  <button class="btn btn-sm btn-success grant-access-btn" data-user-id="${user.id}">
                    <i class="fas fa-plus"></i>
                  </button>
                `;
              }
              
              list.appendChild(li);
            });
            
            hideLoading();
          })
          .catch(err => {
            console.error('Error checking access list:', err);
            hideLoading();
          });
      })
      .catch(err => {
        console.error('Error searching users:', err);
        showNotification(`Failed to search users: ${err.message}`, 'error');
        hideLoading();
      });
  }

  // Delegate granting and removing access
  document.addEventListener('click', e => {
    const grantBtn = e.target.closest('.grant-access-btn');
    const removeBtn = e.target.closest('.remove-share-btn');

    if (grantBtn && selectedTournamentId) {
      const userId = grantBtn.dataset.userId;
      
      showLoading();
      
      fetch(`/api/tournament/${selectedTournamentId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
          return res.json();
        })
        .then(response => {
          if (response.success) {
            showNotification('Access granted successfully', 'success');
            loadAccessList(selectedTournamentId);
            document.getElementById('userSearchResults').innerHTML = '';
            document.getElementById('userSearchInput').value = '';
          } else {
            showNotification(response.error || 'Could not grant access', 'error');
          }
          hideLoading();
        })
        .catch(err => {
          console.error('Error granting access:', err);
          showNotification(`Failed to grant access: ${err.message}`, 'error');
          hideLoading();
        });
    }

    if (removeBtn && selectedTournamentId) {
      const userId = removeBtn.dataset.userId;
      
      if (confirm('Are you sure you want to revoke access for this user?')) {
        showLoading();
        
        fetch(`/api/tournament/${selectedTournamentId}/access/${userId}`, {
          method: 'DELETE'
        })
          .then(res => {
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return res.json();
          })
          .then(response => {
            if (response.success) {
              showNotification('Access revoked successfully', 'success');
              loadAccessList(selectedTournamentId);
            } else {
              showNotification(response.error || 'Could not revoke access', 'error');
            }
            hideLoading();
          })
          .catch(err => {
            console.error('Error revoking access:', err);
            showNotification(`Failed to revoke access: ${err.message}`, 'error');
            hideLoading();
          });
      }
    }
  });
});