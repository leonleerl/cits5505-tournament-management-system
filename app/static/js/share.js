// share.js - Enhanced implementation

document.addEventListener('DOMContentLoaded', () => {
  let selectedTournamentId = document.querySelector('#shareTabsContent .list-group-item.active')?.dataset.id;
  
  // Show loading spinner function
  function showLoading() {
    const loadingElement = document.querySelector('.loading-overlay');
    if (loadingElement) {
      loadingElement.style.display = 'flex';
    }
  }
  
  // Hide loading spinner function
  function hideLoading() {
    const loadingElement = document.querySelector('.loading-overlay');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }
  
  // Show notification message
  function showNotification(message, type = 'success') {
    const notificationElement = document.getElementById('notification');
    if (!notificationElement) return;
    
    notificationElement.textContent = message;
    notificationElement.className = `alert alert-${type} alert-dismissible fade show`;
    notificationElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      notificationElement.style.display = 'none';
    }, 5000);
  }

  // Load current shares with improved error handling
  function loadAccessList(tid) {
    if (!tid) {
      console.error('No tournament ID provided for access list');
      return;
    }
    
    showLoading();
    
    fetch(`/api/tournament/${tid}/access_list`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load access list: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        const tbody = document.querySelector('#currentSharesTable tbody');
        tbody.innerHTML = '';

        if (data.length === 0) {
          // Display a message when no shares exist
          const tr = document.createElement('tr');
          tr.innerHTML = '<td colspan="4" class="text-center text-muted">No users have been granted access yet</td>';
          tbody.appendChild(tr);
          hideLoading();
          return;
        }

        data.forEach(share => {
          const tr = document.createElement('tr');
          
          // Format the date in a user-friendly way
          const accessDate = new Date(share.access_granted);
          const formattedDate = accessDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short', 
            day: 'numeric'
          });
          
          tr.innerHTML = `
            <td>${share.email}</td>
            <td><span class="badge bg-info">View Only</span></td>
            <td>${formattedDate}</td>
            <td>
              <button class="btn btn-sm btn-danger remove-share-btn" 
                      data-user-id="${share.user_id}"
                      data-user-email="${share.email}">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          tbody.appendChild(tr);
        });
        
        hideLoading();
      })
      .catch(error => {
        console.error('Error loading access list:', error);
        showNotification(`Error loading access list: ${error.message}`, 'danger');
        hideLoading();
      });
  }

  // Handle tournament tab switching with improved UX
  document.querySelectorAll('#shareTabsContent .list-group-item').forEach(button => {
    button.addEventListener('click', () => {
      // Don't reload if already selected
      if (button.classList.contains('active')) {
        return;
      }
      
      document.querySelectorAll('#shareTabsContent .list-group-item').forEach(btn => {
        btn.classList.remove('active');
      });
      
      button.classList.add('active');
      selectedTournamentId = button.dataset.id;
      
      // Update page title to show selected tournament
      const tournamentName = button.textContent.trim();
      document.getElementById('currentTournamentName').textContent = tournamentName;
      
      loadAccessList(selectedTournamentId);
      
      // Clear search results and input when switching tournaments
      document.getElementById('userSearchResults').innerHTML = '';
      document.getElementById('userSearchInput').value = '';
    });
  });

  // Initial load
  if (selectedTournamentId) {
    loadAccessList(selectedTournamentId);
    
    // Set initial tournament name in the header
    const initialTournament = document.querySelector('#shareTabsContent .list-group-item.active');
    if (initialTournament) {
      document.getElementById('currentTournamentName').textContent = initialTournament.textContent.trim();
    }
  }

  // Handle user search with debounce and improved UX
  const searchInput = document.getElementById('userSearchInput');
  let debounceTimer;
  
  // Search on input with debounce
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = searchInput.value.trim();
      if (query.length >= 2) { // Only search with at least 2 characters
        searchUsers(query);
      } else {
        document.getElementById('userSearchResults').innerHTML = '';
      }
    }, 500); // 500ms debounce
  });
  
  // Also search on search button click
  document.getElementById('userSearchBtn').addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query.length >= 2) {
      searchUsers(query);
    }
  });
  
  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query.length >= 2) {
        searchUsers(query);
      }
    }
  });

  // Function to search users
  function searchUsers(query) {
    if (!selectedTournamentId) {
      showNotification('Please select a tournament first', 'warning');
      return;
    }
    
    showLoading();
    
    fetch(`/api/users?q=${encodeURIComponent(query)}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Search failed: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(users => {
        const list = document.getElementById('userSearchResults');
        list.innerHTML = '';

        if (users.length === 0) {
          list.innerHTML = '<li class="list-group-item text-center text-muted">No users found</li>';
          hideLoading();
          return;
        }

        // Get current users with access to check if user already has access
        fetch(`/api/tournament/${selectedTournamentId}/access_list`)
          .then(res => res.json())
          .then(currentUsers => {
            const currentUserIds = currentUsers.map(u => u.user_id);
            
            users.forEach(user => {
              const li = document.createElement('li');
              li.className = 'list-group-item d-flex justify-content-between align-items-center';
              
              const userAlreadyHasAccess = currentUserIds.includes(user.id);
              
              // User information with email
              const userInfo = document.createElement('div');
              userInfo.innerHTML = `
                <strong>${user.username}</strong>
                <small class="text-muted d-block">${user.email}</small>
              `;
              
              // Button with appropriate state
              const button = document.createElement('button');
              if (userAlreadyHasAccess) {
                button.className = 'btn btn-sm btn-secondary';
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-check"></i> Already shared';
              } else {
                button.className = 'btn btn-sm btn-success grant-access-btn';
                button.dataset.userId = user.id;
                button.dataset.username = user.username;
                button.innerHTML = '<i class="fas fa-plus"></i> Grant Access';
              }
              
              li.appendChild(userInfo);
              li.appendChild(button);
              list.appendChild(li);
            });
            
            hideLoading();
          })
          .catch(error => {
            console.error('Error checking current access:', error);
            hideLoading();
          });
      })
      .catch(error => {
        console.error('Error searching users:', error);
        showNotification(`Error searching users: ${error.message}`, 'danger');
        hideLoading();
      });
  }

  // Delegate granting and removing access with confirmations
  document.addEventListener('click', e => {
    const grantBtn = e.target.closest('.grant-access-btn');
    const removeBtn = e.target.closest('.remove-share-btn');

    // Grant access button clicked
    if (grantBtn && selectedTournamentId) {
      const userId = grantBtn.dataset.userId;
      const username = grantBtn.dataset.username || 'this user';
      
      if (confirm(`Grant tournament access to ${username}?`)) {
        showLoading();
        
        fetch(`/api/tournament/${selectedTournamentId}/access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`Failed to grant access: ${res.status} ${res.statusText}`);
            }
            return res.json();
          })
          .then(response => {
            if (response.success) {
              showNotification(`Access granted to ${username} successfully!`);
              loadAccessList(selectedTournamentId);
              document.getElementById('userSearchResults').innerHTML = '';
              document.getElementById('userSearchInput').value = '';
            } else {
              showNotification(response.error || 'Could not grant access', 'danger');
            }
            hideLoading();
          })
          .catch(error => {
            console.error('Error granting access:', error);
            showNotification(`Error granting access: ${error.message}`, 'danger');
            hideLoading();
          });
      }
    }

    // Remove access button clicked
    if (removeBtn && selectedTournamentId) {
      const userId = removeBtn.dataset.userId;
      const userEmail = removeBtn.dataset.userEmail || 'this user';
      
      if (confirm(`Revoke access for ${userEmail}? They will no longer be able to view this tournament.`)) {
        showLoading();
        
        fetch(`/api/tournament/${selectedTournamentId}/access/${userId}`, {
          method: 'DELETE'
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`Failed to revoke access: ${res.status} ${res.statusText}`);
            }
            return res.json();
          })
          .then(response => {
            if (response.success) {
              showNotification(`Access revoked for ${userEmail}`);
              loadAccessList(selectedTournamentId);
            } else {
              showNotification(response.error || 'Could not revoke access', 'danger');
            }
            hideLoading();
          })
          .catch(error => {
            console.error('Error revoking access:', error);
            showNotification(`Error revoking access: ${error.message}`, 'danger');
            hideLoading();
          });
      }
    }
  });
});