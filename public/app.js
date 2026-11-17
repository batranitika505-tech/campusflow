/**
 * CampusFlow — Frontend Foundation, Dashboard & Assignment Listing
 * Phase 4.1, 4.2 & 4.3
 */

(function () {
  "use strict";

  // Navigation & Shell DOM Elements
  const sidebar = document.getElementById("app-sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".content-section");
  const statusBadge = document.getElementById("api-status-badge");

  // Dashboard DOM Elements (Phase 4.2)
  const statsGrid = document.getElementById("dashboard-stats-grid");
  const progressCard = document.getElementById("dashboard-progress-card");
  const upcomingContainer = document.getElementById("upcoming-list-container");
  const dashboardError = document.getElementById("dashboard-error-state");
  const dashboardErrorText = document.getElementById("dashboard-error-text");
  const dashboardRetryBtn = document.getElementById("dashboard-retry-btn");
  const refreshDashboardBtn = document.getElementById("refresh-dashboard-btn");

  // Assignment Listing DOM Elements (Phase 4.3 & 4.4)
  const assignmentsContainer = document.getElementById("assignments-list-container");
  const assignmentsError = document.getElementById("assignments-error-state");
  const assignmentsErrorText = document.getElementById("assignments-error-text");
  const assignmentsRetryBtn = document.getElementById("assignments-retry-btn");
  const refreshAssignmentsBtn = document.getElementById("refresh-assignments-btn");

  // Search, Filters & Pagination DOM Elements (Phase 4.4)
  const searchInput = document.getElementById("assignments-search-input");
  const filterStatus = document.getElementById("filter-status");
  const filterPriority = document.getElementById("filter-priority");
  const filterSubject = document.getElementById("filter-subject");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");
  const paginationBar = document.getElementById("assignments-pagination");
  const paginationInfoText = document.getElementById("pagination-info-text");
  const paginationPagesText = document.getElementById("pagination-pages-text");
  const paginationPrevBtn = document.getElementById("pagination-prev-btn");
  const paginationNextBtn = document.getElementById("pagination-next-btn");

  // Assignment CRUD & Modal DOM Elements (Phase 4.5)
  const openCreateBtn = document.getElementById("open-create-assignment-btn");
  const assignmentModal = document.getElementById("assignment-modal");
  const closeAssignmentModalBtn = document.getElementById("close-assignment-modal-btn");
  const assignmentForm = document.getElementById("assignment-form");
  const assignmentFormId = document.getElementById("assignment-form-id");
  const assignmentFormTitle = document.getElementById("assignment-form-title");
  const assignmentFormSubject = document.getElementById("assignment-form-subject");
  const assignmentFormSubjectDatalist = document.getElementById("assignment-form-subject-datalist");
  const assignmentFormDueDate = document.getElementById("assignment-form-duedate");
  const assignmentFormPriority = document.getElementById("assignment-form-priority");
  const assignmentFormStatus = document.getElementById("assignment-form-status");
  const assignmentFormDesc = document.getElementById("assignment-form-description");
  const assignmentFormError = document.getElementById("assignment-form-error");
  const assignmentFormErrorText = document.getElementById("assignment-form-error-text");
  const assignmentFormCancelBtn = document.getElementById("assignment-form-cancel-btn");
  const assignmentFormSubmitBtn = document.getElementById("assignment-form-submit-btn");
  const modalAssignmentTitle = document.getElementById("modal-assignment-title");

  // Delete Modal DOM Elements (Phase 4.5)
  const deleteModal = document.getElementById("delete-modal");
  const deleteAssignmentTitle = document.getElementById("delete-assignment-title");
  const deleteModalError = document.getElementById("delete-modal-error");
  const deleteModalErrorText = document.getElementById("delete-modal-error-text");
  const closeDeleteModalBtn = document.getElementById("close-delete-modal-btn");
  const deleteModalCancelBtn = document.getElementById("delete-modal-cancel-btn");
  const deleteModalConfirmBtn = document.getElementById("delete-modal-confirm-btn");

  // Toast Notification Elements (Phase 4.5)
  const toastNotification = document.getElementById("toast-notification");
  const toastMessage = document.getElementById("toast-message");
  const toastIconSuccess = document.getElementById("toast-icon-success");
  const toastIconError = document.getElementById("toast-icon-error");
  const toastCloseBtn = document.getElementById("toast-close-btn");

  // Deadline Management DOM Elements (Phase 4.6)
  const overdueContainer = document.getElementById("overdue-list-container");
  const deadlinesUpcomingContainer = document.getElementById("deadlines-upcoming-list-container");
  const overdueCountBadge = document.getElementById("overdue-count-badge");
  const upcomingCountBadge = document.getElementById("upcoming-count-badge");
  const deadlinesError = document.getElementById("deadlines-error-state");
  const deadlinesErrorText = document.getElementById("deadlines-error-text");
  const deadlinesRetryBtn = document.getElementById("deadlines-retry-btn");
  const refreshDeadlinesBtn = document.getElementById("refresh-deadlines-btn");

  // Active mutation state
  let pendingDeleteId = null;
  let toastTimer = null;

  // Assignment List State (Phase 4.4)
  const assignmentsState = {
    search: "",
    status: "",
    priority: "",
    subject: "",
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
    loadedSubjects: false,
  };

  // Valid route section names
  const VALID_SECTIONS = ["dashboard", "assignments", "deadlines", "subjects"];
  const DEFAULT_SECTION = "dashboard";

  /**
   * Helper to format YYYY-MM-DD into readable calendar date
   * @param {string} dateStr
   * @returns {string}
   */
  function formatCalendarDate(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return "";
    const parts = dateStr.slice(0, 10).split("-");
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  /**
   * Calculate human-friendly relative deadline text
   * @param {string} dateStr
   * @returns {string}
   */
  function getDaysUntil(dateStr) {
    const parts = dateStr.slice(0, 10).split("-");
    if (parts.length !== 3) return "";
    const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays === -1) return "1 day overdue";
    return `${Math.abs(diffDays)} days overdue`;
  }

  /**
   * Prevent XSS by escaping HTML special chars
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (!str || typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Debounce helper function to delay function execution
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
  function debounce(func, wait = 300) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Validate Gregorian calendar date matching YYYY-MM-DD
   * @param {string} dateStr
   * @returns {boolean}
   */
  function isValidCalendarDate(dateStr) {
    if (typeof dateStr !== "string") return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (year < 1 || year > 9999) return false;
    if (month < 1 || month > 12) return false;

    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    let maxDays;
    if (month === 2) {
      maxDays = isLeap ? 29 : 28;
    } else if (month === 4 || month === 6 || month === 9 || month === 11) {
      maxDays = 30;
    } else {
      maxDays = 31;
    }

    return day >= 1 && day <= maxDays;
  }

  /**
   * Validate client form inputs before submission
   * @param {Object} data
   * @returns {string|null} Error message or null if valid
   */
  function validateAssignmentInput(data) {
    if (!data.title || !data.title.trim()) {
      return "Assignment title is required.";
    }
    if (!data.subject || !data.subject.trim()) {
      return "Subject is required.";
    }
    if (!data.dueDate || !data.dueDate.trim()) {
      return "Due date is required.";
    }
    if (!isValidCalendarDate(data.dueDate)) {
      return "Due date must be a valid calendar date in YYYY-MM-DD format.";
    }
    return null;
  }

  /**
   * Surface a floating toast message for success or error feedback
   * @param {string} message
   * @param {"success"|"error"} type
   */
  function showToast(message, type = "success") {
    if (!toastNotification) return;

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    if (toastMessage) {
      toastMessage.textContent = message;
    }

    toastNotification.className = `toast toast-${type}`;
    if (toastIconSuccess) toastIconSuccess.hidden = type !== "success";
    if (toastIconError) toastIconError.hidden = type !== "error";

    toastNotification.hidden = false;

    toastTimer = setTimeout(() => {
      hideToast();
    }, 4000);
  }

  /**
   * Dismiss the floating toast message
   */
  function hideToast() {
    if (!toastNotification) return;
    toastNotification.hidden = true;
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
  }

  /* ==========================================================================
     Dashboard Operations (Phase 4.2)
     ========================================================================== */

  /**
   * Render loading skeleton state for the dashboard
   */
  function renderDashboardLoading() {
    if (dashboardError) dashboardError.hidden = true;

    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="stat-card skeleton skeleton-card"></div>
        <div class="stat-card skeleton skeleton-card"></div>
        <div class="stat-card skeleton skeleton-card"></div>
        <div class="stat-card skeleton skeleton-card"></div>
        <div class="stat-card skeleton skeleton-card"></div>
      `;
    }

    if (progressCard) {
      progressCard.innerHTML = `
        <div class="skeleton" style="height: 20px; width: 40%; margin-bottom: 16px;"></div>
        <div class="skeleton" style="height: 10px; width: 100%; margin-bottom: 12px;"></div>
        <div class="skeleton" style="height: 14px; width: 30%;"></div>
      `;
    }

    if (upcomingContainer) {
      upcomingContainer.innerHTML = `
        <div class="skeleton skeleton-item"></div>
        <div class="skeleton skeleton-item"></div>
        <div class="skeleton skeleton-item"></div>
      `;
    }
  }

  /**
   * Render error state for the dashboard
   * @param {string} message
   */
  function renderDashboardError(message = "Unable to connect to the CampusFlow API.") {
    if (dashboardError) {
      dashboardError.hidden = false;
      if (dashboardErrorText) {
        dashboardErrorText.textContent = message;
      }
    }

    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="stat-card" style="grid-column: 1 / -1; justify-content: center; color: var(--color-text-muted);">
          <span>Statistics unavailable due to error.</span>
        </div>
      `;
    }

    if (progressCard) {
      progressCard.innerHTML = `
        <div style="text-align: center; color: var(--color-text-muted); padding: var(--space-4);">
          <span>Progress data unavailable.</span>
        </div>
      `;
    }

    if (upcomingContainer) {
      upcomingContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon" aria-hidden="true" style="color: var(--color-danger);">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p class="empty-state-title">Failed to load upcoming assignments</p>
          <p class="empty-state-desc">Please retry using the button above.</p>
        </div>
      `;
    }
  }

  /**
   * Render real statistics and progress data into the dashboard
   * @param {Object} stats
   */
  function renderStats(stats) {
    if (!statsGrid || !progressCard) return;

    const {
      total = 0,
      pending = 0,
      inProgress = 0,
      completed = 0,
      overdue = 0,
      completionPercentage = 0,
    } = stats;

    statsGrid.innerHTML = `
      <div class="stat-card stat-card-total">
        <div class="stat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-number">${total}</span>
          <span class="stat-label">Total</span>
        </div>
      </div>

      <div class="stat-card stat-card-pending">
        <div class="stat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-number">${pending}</span>
          <span class="stat-label">Pending</span>
        </div>
      </div>

      <div class="stat-card stat-card-inprogress">
        <div class="stat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-number">${inProgress}</span>
          <span class="stat-label">In-Progress</span>
        </div>
      </div>

      <div class="stat-card stat-card-completed">
        <div class="stat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-number">${completed}</span>
          <span class="stat-label">Completed</span>
        </div>
      </div>

      <div class="stat-card stat-card-overdue">
        <div class="stat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-number">${overdue}</span>
          <span class="stat-label">Overdue</span>
        </div>
      </div>
    `;

    const percentageFormatted = Number(completionPercentage).toFixed(
      completionPercentage % 1 === 0 ? 0 : 1
    );

    progressCard.innerHTML = `
      <div class="progress-header">
        <div class="progress-title-group">
          <h2>Overall Completion Progress</h2>
          <p>Academic coursework completion rate</p>
        </div>
        <span class="progress-percentage">${percentageFormatted}%</span>
      </div>
      <div class="progress-track" role="progressbar" aria-valuenow="${completionPercentage}" aria-valuemin="0" aria-valuemax="100" aria-label="Assignment completion rate">
        <div class="progress-fill" style="width: ${Math.min(100, Math.max(0, completionPercentage))}%;"></div>
      </div>
      <div class="progress-meta">
        <span>${completed} of ${total} assignments completed</span>
        <span>${total - completed} remaining</span>
      </div>
    `;
  }

  /**
   * Render upcoming assignments preview or empty state
   * @param {Array} upcoming
   */
  function renderUpcomingAssignments(upcoming) {
    if (!upcomingContainer) return;

    if (!Array.isArray(upcoming) || upcoming.length === 0) {
      upcomingContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <p class="empty-state-title">No upcoming deadlines</p>
          <p class="empty-state-desc">You have no assignments due in the next 7 calendar days. Great job staying on track!</p>
        </div>
      `;
      return;
    }

    upcomingContainer.innerHTML = upcoming
      .map((item) => {
        const readableDate = formatCalendarDate(item.dueDate);
        const daysUntilText = getDaysUntil(item.dueDate);

        return `
          <article class="upcoming-item" aria-label="${escapeHtml(item.title)}">
            <div class="upcoming-main">
              <h3 class="upcoming-title">${escapeHtml(item.title)}</h3>
              <div class="upcoming-meta">
                <span class="badge badge-subject">${escapeHtml(item.subject || "General")}</span>
                <span class="upcoming-date-box" title="${readableDate}">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>${readableDate}</span>
                  ${daysUntilText ? `&bull; <strong>${daysUntilText}</strong>` : ""}
                </span>
              </div>
            </div>

            <div class="upcoming-badges">
              <span class="badge badge-priority-${item.priority || "medium"}" title="Priority">
                ${escapeHtml(item.priority || "medium")}
              </span>
              <span class="badge badge-status-${item.status || "pending"}" title="Status">
                ${escapeHtml(item.status || "pending")}
              </span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  /**
   * Fetch and render real data for the dashboard
   */
  async function loadDashboardData() {
    renderDashboardLoading();

    try {
      const [statsRes, upcomingRes] = await Promise.all([
        fetch("/api/assignments/stats"),
        fetch("/api/assignments/upcoming"),
      ]);

      if (!statsRes.ok || !upcomingRes.ok) {
        throw new Error("Failed to fetch dashboard data from server");
      }

      const statsData = await statsRes.json();
      const upcomingData = await upcomingRes.json();

      if (!statsData.success || !upcomingData.success) {
        throw new Error("Server returned an unsuccessful response");
      }

      if (dashboardError) dashboardError.hidden = true;

      renderStats(statsData.data);
      renderUpcomingAssignments(upcomingData.data);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      renderDashboardError(err.message || "Failed to load dashboard data.");
    }
  }

  /* ==========================================================================
     Assignment Listing Operations (Phase 4.3)
     ========================================================================== */

  /**
   * Render loading skeleton state for assignments list
   */
  function renderAssignmentsLoading() {
    if (assignmentsError) assignmentsError.hidden = true;

    if (assignmentsContainer) {
      assignmentsContainer.innerHTML = `
        <div class="skeleton skeleton-assignment-card"></div>
        <div class="skeleton skeleton-assignment-card"></div>
        <div class="skeleton skeleton-assignment-card"></div>
        <div class="skeleton skeleton-assignment-card"></div>
      `;
    }
  }

  /**
   * Render error state for assignments list
   * @param {string} message
   */
  function renderAssignmentsError(message = "Unable to connect to the CampusFlow API.") {
    if (assignmentsError) {
      assignmentsError.hidden = false;
      if (assignmentsErrorText) {
        assignmentsErrorText.textContent = message;
      }
    }

    if (assignmentsContainer) {
      assignmentsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon" aria-hidden="true" style="color: var(--color-danger);">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p class="empty-state-title">Failed to load assignments</p>
          <p class="empty-state-desc">Please retry using the button above.</p>
        </div>
      `;
    }
  }

  /**
   * Load subjects dynamically from GET /api/subjects (Phase 4.4)
   */
  async function loadSubjectsOptions() {
    if (!filterSubject) return;

    try {
      const res = await fetch("/api/subjects");
      if (!res.ok) return;

      const resData = await res.json();
      if (!resData.success || !Array.isArray(resData.data)) return;

      const currentVal = filterSubject.value;
      let optionsHtml = '<option value="">All Subjects</option>';
      resData.data.forEach((subject) => {
        const escaped = escapeHtml(subject);
        optionsHtml += `<option value="${escaped}">${escaped}</option>`;
      });

      filterSubject.innerHTML = optionsHtml;
      if (currentVal) {
        filterSubject.value = currentVal;
      }

      if (assignmentFormSubjectDatalist) {
        let datalistHtml = "";
        resData.data.forEach((subject) => {
          const escaped = escapeHtml(subject);
          datalistHtml += `<option value="${escaped}"></option>`;
        });
        assignmentFormSubjectDatalist.innerHTML = datalistHtml;
      }

      assignmentsState.loadedSubjects = true;
    } catch (err) {
      console.warn("Unable to load subjects dynamically:", err);
    }
  }

  /**
   * Build query string for assignments API with search, filters & pagination (Phase 4.4)
   * @returns {string}
   */
  function buildAssignmentsQuery() {
    const params = new URLSearchParams();

    const searchTrimmed = assignmentsState.search.trim();
    if (searchTrimmed) {
      params.set("search", searchTrimmed);
    }

    if (assignmentsState.status) {
      params.set("status", assignmentsState.status);
    }

    if (assignmentsState.priority) {
      params.set("priority", assignmentsState.priority);
    }

    if (assignmentsState.subject) {
      params.set("subject", assignmentsState.subject);
    }

    params.set("page", String(assignmentsState.page || 1));
    params.set("limit", String(assignmentsState.limit || 5));

    return params.toString();
  }

  /**
   * Render pagination controls state (Phase 4.4)
   * @param {boolean} isError
   */
  function renderPaginationControls(isError = false) {
    if (!paginationBar) return;

    const { page, limit, total, totalPages } = assignmentsState;

    if (isError || total === 0) {
      if (paginationInfoText) {
        paginationInfoText.textContent = isError
          ? "Unable to load page info"
          : "Showing 0 assignments";
      }
      if (paginationPagesText) {
        paginationPagesText.textContent = "Page 0 of 0";
      }
      if (paginationPrevBtn) paginationPrevBtn.disabled = true;
      if (paginationNextBtn) paginationNextBtn.disabled = true;
      return;
    }

    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    if (paginationInfoText) {
      paginationInfoText.textContent = `Showing ${startItem}–${endItem} of ${total} assignment${total === 1 ? "" : "s"}`;
    }

    if (paginationPagesText) {
      paginationPagesText.textContent = `Page ${page} of ${totalPages || 1}`;
    }

    if (paginationPrevBtn) {
      paginationPrevBtn.disabled = page <= 1;
    }

    if (paginationNextBtn) {
      paginationNextBtn.disabled = page >= totalPages;
    }
  }

  /**
   * Reset all search and filter criteria to defaults (Phase 4.4)
   */
  function clearAllFilters() {
    assignmentsState.search = "";
    assignmentsState.status = "";
    assignmentsState.priority = "";
    assignmentsState.subject = "";
    assignmentsState.page = 1;

    if (searchInput) searchInput.value = "";
    if (filterStatus) filterStatus.value = "";
    if (filterPriority) filterPriority.value = "";
    if (filterSubject) filterSubject.value = "";

    loadAssignmentsData();
  }

  /**
   * Render real assignments list into the assignments section
   * @param {Array} assignments
   */
  function renderAssignmentsList(assignments) {
    if (!assignmentsContainer) return;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      const hasActiveFilters = Boolean(
        assignmentsState.search.trim() ||
        assignmentsState.status ||
        assignmentsState.priority ||
        assignmentsState.subject
      );

      if (hasActiveFilters) {
        assignmentsContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </div>
            <p class="empty-state-title">No assignments match your criteria</p>
            <p class="empty-state-desc">Try clearing or adjusting your search keyword and filter criteria.</p>
            <button id="empty-clear-filters-btn" class="btn btn-secondary btn-sm" style="margin-top: var(--space-4);">
              Clear All Filters
            </button>
          </div>
        `;
        const emptyClearBtn = document.getElementById("empty-clear-filters-btn");
        if (emptyClearBtn) {
          emptyClearBtn.addEventListener("click", clearAllFilters);
        }
      } else {
        assignmentsContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <p class="empty-state-title">No assignments found</p>
            <p class="empty-state-desc">You do not have any recorded coursework assignments yet.</p>
          </div>
        `;
      }
      return;
    }

    assignmentsContainer.innerHTML = assignments
      .map((item) => {
        const readableDate = formatCalendarDate(item.dueDate);
        const daysUntilText = getDaysUntil(item.dueDate);
        const hasDescription = item.description && typeof item.description === "string" && item.description.trim().length > 0;

        return `
          <article class="assignment-card" aria-label="${escapeHtml(item.title)}">
            <div class="assignment-header">
              <h2 class="assignment-title">${escapeHtml(item.title)}</h2>
              <div class="assignment-badges">
                <span class="badge badge-priority-${item.priority || "medium"}" title="Priority: ${item.priority || "medium"}">
                  ${escapeHtml(item.priority || "medium")}
                </span>
                <span class="badge badge-status-${item.status || "pending"}" title="Status: ${item.status || "pending"}">
                  ${escapeHtml(item.status || "pending")}
                </span>
              </div>
            </div>

            ${hasDescription ? `<p class="assignment-desc">${escapeHtml(item.description.trim())}</p>` : ""}

            <div class="assignment-footer">
              <div class="assignment-info-group">
                <span class="badge badge-subject" title="Subject">
                  ${escapeHtml(item.subject || "General")}
                </span>
                <span class="assignment-date" title="Due date: ${readableDate}">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>${readableDate}</span>
                  ${daysUntilText ? `&bull; <strong>${daysUntilText}</strong>` : ""}
                </span>
              </div>

              <div class="assignment-actions">
                <button type="button" class="btn btn-sm btn-outline edit-assignment-btn" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.title)}">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Edit</span>
                </button>
                <button type="button" class="btn btn-sm btn-outline btn-danger-outline delete-assignment-btn" data-id="${item.id}" data-title="${escapeHtml(item.title)}" aria-label="Delete ${escapeHtml(item.title)}">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  /**
   * Fetch and render real data for the assignments section (Phase 4.4 Search, Filters, Pagination)
   */
  async function loadAssignmentsData() {
    renderAssignmentsLoading();

    // Ensure subjects are loaded for dropdown filter
    if (!assignmentsState.loadedSubjects) {
      loadSubjectsOptions();
    }

    try {
      const queryString = buildAssignmentsQuery();
      const res = await fetch(`/api/assignments?${queryString}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const errMsg =
          (errorJson && errorJson.message) ||
          (errorJson && errorJson.errors && errorJson.errors.join(", ")) ||
          "Failed to fetch assignments from server";
        throw new Error(errMsg);
      }

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.message || "Server returned an unsuccessful response");
      }

      if (assignmentsError) assignmentsError.hidden = true;

      // Update state pagination
      if (resData.pagination) {
        assignmentsState.page = resData.pagination.page;
        assignmentsState.limit = resData.pagination.limit;
        assignmentsState.total = resData.pagination.total;
        assignmentsState.totalPages = resData.pagination.totalPages;
      } else {
        assignmentsState.total = Array.isArray(resData.data) ? resData.data.length : 0;
        assignmentsState.totalPages = 1;
      }

      renderAssignmentsList(resData.data);
      renderPaginationControls(false);
    } catch (err) {
      console.error("Assignments data load error:", err);
      renderAssignmentsError(err.message || "Failed to load assignments.");
      renderPaginationControls(true);
    }
  }

  /* ==========================================================================
     Assignment CRUD Operations (Phase 4.5)
     ========================================================================== */

  /**
   * Show inline error within the assignment form modal
   * @param {string} message
   */
  function showFormError(message) {
    if (assignmentFormError) {
      assignmentFormError.hidden = false;
      if (assignmentFormErrorText) {
        assignmentFormErrorText.textContent = message;
      }
    }
  }

  /**
   * Hide inline error in assignment form modal
   */
  function hideFormError() {
    if (assignmentFormError) {
      assignmentFormError.hidden = true;
    }
  }

  /**
   * Open modal in Create mode
   */
  function openCreateModal() {
    hideFormError();

    if (modalAssignmentTitle) {
      modalAssignmentTitle.textContent = "New Assignment";
    }

    if (assignmentFormSubmitBtn) {
      assignmentFormSubmitBtn.innerHTML = "<span>Create Assignment</span>";
    }

    if (assignmentFormId) assignmentFormId.value = "";
    if (assignmentFormTitle) assignmentFormTitle.value = "";
    if (assignmentFormSubject) assignmentFormSubject.value = "";
    if (assignmentFormDueDate) assignmentFormDueDate.value = "";
    if (assignmentFormPriority) assignmentFormPriority.value = "medium";
    if (assignmentFormStatus) assignmentFormStatus.value = "pending";
    if (assignmentFormDesc) assignmentFormDesc.value = "";

    if (assignmentModal) {
      assignmentModal.hidden = false;
      assignmentModal.removeAttribute("aria-hidden");
    }

    if (assignmentFormTitle) {
      setTimeout(() => assignmentFormTitle.focus(), 50);
    }
  }

  /**
   * Open modal in Edit mode with existing assignment data
   * @param {number|string} id
   */
  async function openEditModal(id) {
    hideFormError();

    try {
      const res = await fetch(`/api/assignments/${id}`);
      if (!res.ok) {
        throw new Error("Unable to fetch assignment details.");
      }
      const resData = await res.json();
      if (!resData.success || !resData.data) {
        throw new Error(resData.message || "Unable to fetch assignment.");
      }

      const item = resData.data;

      if (modalAssignmentTitle) {
        modalAssignmentTitle.textContent = "Edit Assignment";
      }

      if (assignmentFormSubmitBtn) {
        assignmentFormSubmitBtn.innerHTML = "<span>Save Changes</span>";
      }

      if (assignmentFormId) assignmentFormId.value = item.id;
      if (assignmentFormTitle) assignmentFormTitle.value = item.title || "";
      if (assignmentFormSubject) assignmentFormSubject.value = item.subject || "";
      if (assignmentFormDueDate) assignmentFormDueDate.value = item.dueDate || "";
      if (assignmentFormPriority) assignmentFormPriority.value = item.priority || "medium";
      if (assignmentFormStatus) assignmentFormStatus.value = item.status || "pending";
      if (assignmentFormDesc) assignmentFormDesc.value = item.description || "";

      if (assignmentModal) {
        assignmentModal.hidden = false;
        assignmentModal.removeAttribute("aria-hidden");
      }

      if (assignmentFormTitle) {
        setTimeout(() => assignmentFormTitle.focus(), 50);
      }
    } catch (err) {
      console.error("Open edit modal error:", err);
      showToast(err.message || "Failed to load assignment for editing.", "error");
    }
  }

  /**
   * Close assignment modal
   */
  function closeAssignmentModal() {
    if (assignmentModal) {
      assignmentModal.hidden = true;
      assignmentModal.setAttribute("aria-hidden", "true");
    }
    hideFormError();
  }

  /**
   * Handle assignment form submission for Create and Edit
   * @param {Event} e
   */
  async function handleAssignmentFormSubmit(e) {
    e.preventDefault();
    hideFormError();

    const id = assignmentFormId ? assignmentFormId.value : "";
    const isEditing = Boolean(id);

    const payload = {
      title: assignmentFormTitle ? assignmentFormTitle.value.trim() : "",
      subject: assignmentFormSubject ? assignmentFormSubject.value.trim() : "",
      dueDate: assignmentFormDueDate ? assignmentFormDueDate.value.trim() : "",
      priority: assignmentFormPriority ? assignmentFormPriority.value : "medium",
      status: assignmentFormStatus ? assignmentFormStatus.value : "pending",
      description: assignmentFormDesc ? assignmentFormDesc.value.trim() : "",
    };

    // Client-side validation
    const validationError = validateAssignmentInput(payload);
    if (validationError) {
      showFormError(validationError);
      return;
    }

    // Set submitting loading state
    const originalBtnText = assignmentFormSubmitBtn.innerHTML;
    assignmentFormSubmitBtn.disabled = true;
    assignmentFormSubmitBtn.innerHTML = `<span>${isEditing ? "Saving..." : "Creating..."}</span>`;

    try {
      const url = isEditing ? `/api/assignments/${id}` : "/api/assignments";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok || !resData || !resData.success) {
        const errMsg =
          (resData && resData.message) ||
          (resData && resData.errors && resData.errors.join(", ")) ||
          `Failed to ${isEditing ? "update" : "create"} assignment`;
        throw new Error(errMsg);
      }

      closeAssignmentModal();
      showToast(
        isEditing
          ? "Assignment updated successfully!"
          : "Assignment created successfully!",
        "success"
      );

      // Refresh assignments list, dashboard statistics, and subjects filter
      await Promise.all([
        loadAssignmentsData(),
        loadDashboardData(),
        loadDeadlinesData(),
        loadSubjectsOptions(),
      ]);
    } catch (err) {
      console.error("Assignment submission error:", err);
      showFormError(err.message || "An error occurred during submission.");
    } finally {
      assignmentFormSubmitBtn.disabled = false;
      assignmentFormSubmitBtn.innerHTML = originalBtnText;
    }
  }

  /**
   * Show inline error in delete confirmation modal
   * @param {string} message
   */
  function showDeleteError(message) {
    if (deleteModalError) {
      deleteModalError.hidden = false;
      if (deleteModalErrorText) {
        deleteModalErrorText.textContent = message;
      }
    }
  }

  /**
   * Hide inline error in delete confirmation modal
   */
  function hideDeleteError() {
    if (deleteModalError) {
      deleteModalError.hidden = true;
    }
  }

  /**
   * Open delete confirmation modal
   * @param {number|string} id
   * @param {string} title
   */
  function openDeleteModal(id, title) {
    pendingDeleteId = id;
    hideDeleteError();

    if (deleteAssignmentTitle) {
      deleteAssignmentTitle.textContent = `"${title}"`;
    }

    if (deleteModal) {
      deleteModal.hidden = false;
      deleteModal.removeAttribute("aria-hidden");
    }

    if (deleteModalConfirmBtn) {
      deleteModalConfirmBtn.focus();
    }
  }

  /**
   * Close delete confirmation modal
   */
  function closeDeleteModal() {
    pendingDeleteId = null;
    hideDeleteError();

    if (deleteModal) {
      deleteModal.hidden = true;
      deleteModal.setAttribute("aria-hidden", "true");
    }
  }

  /**
   * Confirm deletion and execute DELETE /api/assignments/:id
   */
  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;

    deleteModalConfirmBtn.disabled = true;
    const originalBtnText = deleteModalConfirmBtn.innerHTML;
    deleteModalConfirmBtn.innerHTML = "<span>Deleting...</span>";

    try {
      const res = await fetch(`/api/assignments/${pendingDeleteId}`, {
        method: "DELETE",
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok || !resData || !resData.success) {
        const errMsg =
          (resData && resData.message) || "Failed to delete assignment.";
        throw new Error(errMsg);
      }

      closeDeleteModal();
      showToast("Assignment deleted successfully!", "success");

      // If deleting the last item on current page, adjust page if needed
      if (
        assignmentsState.total > 0 &&
        assignmentsState.total - 1 <= (assignmentsState.page - 1) * assignmentsState.limit
      ) {
        assignmentsState.page = Math.max(1, assignmentsState.page - 1);
      }

      // Refresh assignments list, dashboard stats, and subjects filter
      await Promise.all([
        loadAssignmentsData(),
        loadDashboardData(),
        loadDeadlinesData(),
        loadSubjectsOptions(),
      ]);
    } catch (err) {
      console.error("Delete assignment error:", err);
      showDeleteError(err.message || "Failed to delete assignment.");
    } finally {
      deleteModalConfirmBtn.disabled = false;
      deleteModalConfirmBtn.innerHTML = originalBtnText;
    }
  }

  /* ==========================================================================
     Deadline Management (Phase 4.6)
     ========================================================================== */

  /**
   * Render loading skeleton state for deadline lists
   */
  function renderDeadlinesLoading() {
    if (deadlinesError) deadlinesError.hidden = true;

    if (overdueCountBadge) {
      overdueCountBadge.textContent = "Loading...";
      overdueCountBadge.className = "badge badge-priority-low";
    }

    if (upcomingCountBadge) {
      upcomingCountBadge.textContent = "Loading...";
      upcomingCountBadge.className = "badge badge-priority-low";
    }

    if (overdueContainer) {
      overdueContainer.innerHTML = `
        <div class="skeleton skeleton-item" style="height: 80px; border-radius: var(--radius-lg);"></div>
        <div class="skeleton skeleton-item" style="height: 80px; border-radius: var(--radius-lg);"></div>
      `;
    }

    if (deadlinesUpcomingContainer) {
      deadlinesUpcomingContainer.innerHTML = `
        <div class="skeleton skeleton-item" style="height: 80px; border-radius: var(--radius-lg);"></div>
        <div class="skeleton skeleton-item" style="height: 80px; border-radius: var(--radius-lg);"></div>
      `;
    }
  }

  /**
   * Render error state for deadline management section
   * @param {string} message
   */
  function renderDeadlinesError(message = "Unable to connect to the CampusFlow API.") {
    if (deadlinesError) {
      deadlinesError.hidden = false;
      if (deadlinesErrorText) {
        deadlinesErrorText.textContent = message;
      }
    }

    if (overdueCountBadge) {
      overdueCountBadge.textContent = "Error";
      overdueCountBadge.className = "badge badge-priority-low";
    }

    if (upcomingCountBadge) {
      upcomingCountBadge.textContent = "Error";
      upcomingCountBadge.className = "badge badge-priority-low";
    }

    if (overdueContainer) {
      overdueContainer.innerHTML = `
        <div class="empty-state" style="padding: var(--space-6);">
          <p class="empty-state-title">Data unavailable</p>
          <p class="empty-state-desc">Please retry using the button above.</p>
        </div>
      `;
    }

    if (deadlinesUpcomingContainer) {
      deadlinesUpcomingContainer.innerHTML = `
        <div class="empty-state" style="padding: var(--space-6);">
          <p class="empty-state-title">Data unavailable</p>
          <p class="empty-state-desc">Please retry using the button above.</p>
        </div>
      `;
    }
  }

  /**
   * Render list of overdue assignments
   * @param {Array} overdueList
   */
  function renderOverdueList(overdueList) {
    if (!overdueContainer) return;

    const count = Array.isArray(overdueList) ? overdueList.length : 0;
    if (overdueCountBadge) {
      overdueCountBadge.textContent = `${count} Overdue`;
      overdueCountBadge.className = count > 0 ? "badge badge-priority-high" : "badge badge-priority-low";
    }

    if (!Array.isArray(overdueList) || overdueList.length === 0) {
      overdueContainer.innerHTML = `
        <div class="empty-state" style="padding: var(--space-6);">
          <div class="empty-state-icon" aria-hidden="true" style="color: var(--color-success); background-color: var(--color-success-bg);">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <p class="empty-state-title">No overdue assignments!</p>
          <p class="empty-state-desc">All past assignments are submitted or completed. Great work staying on schedule!</p>
        </div>
      `;
      return;
    }

    overdueContainer.innerHTML = overdueList
      .map((item) => {
        const readableDate = formatCalendarDate(item.dueDate);
        const daysText = getDaysUntil(item.dueDate);
        const hasDesc = item.description && typeof item.description === "string" && item.description.trim().length > 0;

        return `
          <article class="deadline-card overdue-card" aria-label="${escapeHtml(item.title)}">
            <div class="deadline-card-header">
              <h3 class="deadline-card-title">${escapeHtml(item.title)}</h3>
              <div class="assignment-badges">
                <span class="badge badge-priority-${item.priority || "medium"}">${escapeHtml(item.priority || "medium")}</span>
                <span class="badge badge-status-${item.status || "pending"}">${escapeHtml(item.status || "pending")}</span>
              </div>
            </div>

            ${hasDesc ? `<p class="deadline-card-desc">${escapeHtml(item.description.trim())}</p>` : ""}

            <div class="deadline-card-footer">
              <div class="deadline-card-info">
                <span class="badge badge-subject">${escapeHtml(item.subject || "General")}</span>
                <span class="assignment-date" title="Due date: ${readableDate}">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>${readableDate}</span>
                </span>
                <span class="deadline-days-tag overdue">${daysText || "Overdue"}</span>
              </div>

              <div class="assignment-actions">
                <button type="button" class="btn btn-sm btn-outline edit-assignment-btn" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.title)}">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  /**
   * Render list of upcoming assignments
   * @param {Array} upcomingList
   */
  function renderDeadlinesUpcomingList(upcomingList) {
    if (!deadlinesUpcomingContainer) return;

    const count = Array.isArray(upcomingList) ? upcomingList.length : 0;
    if (upcomingCountBadge) {
      upcomingCountBadge.textContent = `${count} Upcoming`;
      upcomingCountBadge.className = count > 0 ? "badge badge-status-in-progress" : "badge badge-priority-low";
    }

    if (!Array.isArray(upcomingList) || upcomingList.length === 0) {
      deadlinesUpcomingContainer.innerHTML = `
        <div class="empty-state" style="padding: var(--space-6);">
          <div class="empty-state-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <p class="empty-state-title">No upcoming deadlines</p>
          <p class="empty-state-desc">You do not have any assignments due within the next 7 calendar days.</p>
        </div>
      `;
      return;
    }

    deadlinesUpcomingContainer.innerHTML = upcomingList
      .map((item) => {
        const readableDate = formatCalendarDate(item.dueDate);
        const daysText = getDaysUntil(item.dueDate);
        const hasDesc = item.description && typeof item.description === "string" && item.description.trim().length > 0;

        return `
          <article class="deadline-card upcoming-card" aria-label="${escapeHtml(item.title)}">
            <div class="deadline-card-header">
              <h3 class="deadline-card-title">${escapeHtml(item.title)}</h3>
              <div class="assignment-badges">
                <span class="badge badge-priority-${item.priority || "medium"}">${escapeHtml(item.priority || "medium")}</span>
                <span class="badge badge-status-${item.status || "pending"}">${escapeHtml(item.status || "pending")}</span>
              </div>
            </div>

            ${hasDesc ? `<p class="deadline-card-desc">${escapeHtml(item.description.trim())}</p>` : ""}

            <div class="deadline-card-footer">
              <div class="deadline-card-info">
                <span class="badge badge-subject">${escapeHtml(item.subject || "General")}</span>
                <span class="assignment-date" title="Due date: ${readableDate}">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>${readableDate}</span>
                </span>
                <span class="deadline-days-tag upcoming">${daysText || "Upcoming"}</span>
              </div>

              <div class="assignment-actions">
                <button type="button" class="btn btn-sm btn-outline edit-assignment-btn" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.title)}">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  /**
   * Fetch data from /api/assignments/overdue and /api/assignments/upcoming
   */
  async function loadDeadlinesData() {
    renderDeadlinesLoading();

    try {
      const [overdueResult, upcomingResult] = await Promise.allSettled([
        fetch("/api/assignments/overdue").then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch overdue assignments");
          const json = await res.json();
          if (!json.success || !Array.isArray(json.data)) throw new Error("Invalid overdue response");
          return json.data;
        }),
        fetch("/api/assignments/upcoming").then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch upcoming assignments");
          const json = await res.json();
          if (!json.success || !Array.isArray(json.data)) throw new Error("Invalid upcoming response");
          return json.data;
        }),
      ]);

      const overdueFailed = overdueResult.status === "rejected";
      const upcomingFailed = upcomingResult.status === "rejected";

      if (overdueFailed && upcomingFailed) {
        throw new Error("Unable to connect to the CampusFlow API.");
      }

      if (overdueFailed || upcomingFailed) {
        const failedName = overdueFailed ? "overdue" : "upcoming";
        if (deadlinesError) {
          deadlinesError.hidden = false;
          if (deadlinesErrorText) {
            deadlinesErrorText.textContent = `Unable to load ${failedName} assignments. Some deadline data may be unavailable.`;
          }
        }
      } else {
        if (deadlinesError) deadlinesError.hidden = true;
      }

      if (!overdueFailed) {
        renderOverdueList(overdueResult.value);
      } else {
        if (overdueCountBadge) {
          overdueCountBadge.textContent = "Error";
          overdueCountBadge.className = "badge badge-priority-low";
        }
        if (overdueContainer) {
          overdueContainer.innerHTML = `
            <div class="empty-state" style="padding: var(--space-6);">
              <p class="empty-state-title">Data unavailable</p>
              <p class="empty-state-desc">Failed to load overdue assignments.</p>
            </div>
          `;
        }
      }

      if (!upcomingFailed) {
        renderDeadlinesUpcomingList(upcomingResult.value);
      } else {
        if (upcomingCountBadge) {
          upcomingCountBadge.textContent = "Error";
          upcomingCountBadge.className = "badge badge-priority-low";
        }
        if (deadlinesUpcomingContainer) {
          deadlinesUpcomingContainer.innerHTML = `
            <div class="empty-state" style="padding: var(--space-6);">
              <p class="empty-state-title">Data unavailable</p>
              <p class="empty-state-desc">Failed to load upcoming assignments.</p>
            </div>
          `;
        }
      }
    } catch (err) {
      console.error("Deadlines load error:", err);
      renderDeadlinesError(err.message || "Failed to load deadline data.");
    }
  }

  /* ==========================================================================
     Navigation & Routing (Phase 4.1)
     ========================================================================== */

  /**
   * Navigate to a specified section by name
   * @param {string} sectionName
   * @param {boolean} updateHash
   */
  function navigateTo(sectionName, updateHash = true) {
    const targetSection = VALID_SECTIONS.includes(sectionName)
      ? sectionName
      : DEFAULT_SECTION;

    // Update nav links active state
    navLinks.forEach((link) => {
      const isTarget = link.getAttribute("data-section") === targetSection;
      if (isTarget) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    });

    // Update section visibility
    sections.forEach((section) => {
      const isTarget = section.id === `section-${targetSection}`;
      if (isTarget) {
        section.classList.add("active");
        section.removeAttribute("hidden");
      } else {
        section.classList.remove("active");
        section.setAttribute("hidden", "true");
      }
    });

    // Sync URL hash
    if (updateHash && window.location.hash !== `#${targetSection}`) {
      window.history.pushState(null, "", `#${targetSection}`);
    }

    // Close mobile drawer if open
    closeMobileSidebar();

    // Trigger section-specific data loads
    if (targetSection === "dashboard") {
      loadDashboardData();
    } else if (targetSection === "assignments") {
      loadAssignmentsData();
    } else if (targetSection === "deadlines") {
      loadDeadlinesData();
    }
  }

  /**
   * Open the mobile navigation drawer
   */
  function openMobileSidebar() {
    if (sidebar) {
      sidebar.classList.add("open");
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.add("active");
      sidebarBackdrop.removeAttribute("aria-hidden");
    }
    if (sidebarToggle) {
      sidebarToggle.setAttribute("aria-expanded", "true");
    }
  }

  /**
   * Close the mobile navigation drawer
   */
  function closeMobileSidebar() {
    if (sidebar) {
      sidebar.classList.remove("open");
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.remove("active");
      sidebarBackdrop.setAttribute("aria-hidden", "true");
    }
    if (sidebarToggle) {
      sidebarToggle.setAttribute("aria-expanded", "false");
    }
  }

  /**
   * Toggle the mobile navigation drawer
   */
  function toggleMobileSidebar() {
    const isOpen = sidebar && sidebar.classList.contains("open");
    if (isOpen) {
      closeMobileSidebar();
    } else {
      openMobileSidebar();
    }
  }

  /**
   * Check API connectivity via the existing /api/health endpoint
   */
  async function checkApiHealth() {
    if (!statusBadge) return;

    try {
      const response = await fetch("/api/health");
      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          statusBadge.className = "status-indicator online";
          const statusText = statusBadge.querySelector(".status-text");
          if (statusText) statusText.textContent = "Connected";
          return;
        }
      }
      throw new Error("Health check failed");
    } catch {
      statusBadge.className = "status-indicator offline";
      const statusText = statusBadge.querySelector(".status-text");
      if (statusText) statusText.textContent = "Offline";
    }
  }

  /**
   * Handle hashchange events for browser forward/back buttons
   */
  function handleHashChange() {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    navigateTo(hash, false);
  }

  /**
   * Initialize event listeners
   */
  function initEvents() {
    // Nav link click events
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.getAttribute("data-section");
        if (section) {
          navigateTo(section, true);
        }
      });
    });

    // Mobile sidebar toggle button
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMobileSidebar();
      });
    }

    // Backdrop click closes sidebar
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener("click", () => {
        closeMobileSidebar();
      });
    }

    // Escape key closes mobile sidebar and modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeMobileSidebar();
        closeAssignmentModal();
        closeDeleteModal();
      }
    });

    // Refresh Dashboard button
    if (refreshDashboardBtn) {
      refreshDashboardBtn.addEventListener("click", () => {
        loadDashboardData();
      });
    }

    // Retry Dashboard button
    if (dashboardRetryBtn) {
      dashboardRetryBtn.addEventListener("click", () => {
        loadDashboardData();
      });
    }

    // Refresh Assignments button
    if (refreshAssignmentsBtn) {
      refreshAssignmentsBtn.addEventListener("click", () => {
        loadAssignmentsData();
      });
    }

    // Retry Assignments button
    if (assignmentsRetryBtn) {
      assignmentsRetryBtn.addEventListener("click", () => {
        loadAssignmentsData();
      });
    }

    // Search input (debounced with page reset) (Phase 4.4)
    if (searchInput) {
      const handleSearchDebounced = debounce((e) => {
        assignmentsState.search = e.target.value;
        assignmentsState.page = 1;
        loadAssignmentsData();
      }, 300);

      searchInput.addEventListener("input", handleSearchDebounced);

      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          assignmentsState.search = searchInput.value;
          assignmentsState.page = 1;
          loadAssignmentsData();
        }
      });
    }

    // Filter controls change listeners (Phase 4.4)
    if (filterStatus) {
      filterStatus.addEventListener("change", (e) => {
        assignmentsState.status = e.target.value;
        assignmentsState.page = 1;
        loadAssignmentsData();
      });
    }

    if (filterPriority) {
      filterPriority.addEventListener("change", (e) => {
        assignmentsState.priority = e.target.value;
        assignmentsState.page = 1;
        loadAssignmentsData();
      });
    }

    if (filterSubject) {
      filterSubject.addEventListener("change", (e) => {
        assignmentsState.subject = e.target.value;
        assignmentsState.page = 1;
        loadAssignmentsData();
      });
    }

    // Clear filters action (Phase 4.4)
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        clearAllFilters();
      });
    }

    // Pagination buttons (Phase 4.4)
    if (paginationPrevBtn) {
      paginationPrevBtn.addEventListener("click", () => {
        if (assignmentsState.page > 1) {
          assignmentsState.page -= 1;
          loadAssignmentsData();
        }
      });
    }

    if (paginationNextBtn) {
      paginationNextBtn.addEventListener("click", () => {
        if (assignmentsState.page < assignmentsState.totalPages) {
          assignmentsState.page += 1;
          loadAssignmentsData();
        }
      });
    }

    // Phase 4.5 Assignment CRUD & Modal Listeners
    if (openCreateBtn) {
      openCreateBtn.addEventListener("click", () => {
        openCreateModal();
      });
    }

    if (closeAssignmentModalBtn) {
      closeAssignmentModalBtn.addEventListener("click", () => {
        closeAssignmentModal();
      });
    }

    if (assignmentFormCancelBtn) {
      assignmentFormCancelBtn.addEventListener("click", () => {
        closeAssignmentModal();
      });
    }

    if (assignmentForm) {
      assignmentForm.addEventListener("submit", handleAssignmentFormSubmit);
    }

    // Card edit & delete action delegation
    if (assignmentsContainer) {
      assignmentsContainer.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".edit-assignment-btn");
        if (editBtn) {
          const id = editBtn.getAttribute("data-id");
          if (id) openEditModal(id);
          return;
        }

        const deleteBtn = e.target.closest(".delete-assignment-btn");
        if (deleteBtn) {
          const id = deleteBtn.getAttribute("data-id");
          const title = deleteBtn.getAttribute("data-title") || "this assignment";
          if (id) openDeleteModal(id, title);
          return;
        }
      });
    }

    // Deadlines section event listeners (Phase 4.6)
    if (refreshDeadlinesBtn) {
      refreshDeadlinesBtn.addEventListener("click", () => {
        loadDeadlinesData();
      });
    }

    if (deadlinesRetryBtn) {
      deadlinesRetryBtn.addEventListener("click", () => {
        loadDeadlinesData();
      });
    }

    // Edit action delegation in overdue container
    if (overdueContainer) {
      overdueContainer.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".edit-assignment-btn");
        if (editBtn) {
          const id = editBtn.getAttribute("data-id");
          if (id) openEditModal(id);
        }
      });
    }

    // Edit action delegation in upcoming deadlines container
    if (deadlinesUpcomingContainer) {
      deadlinesUpcomingContainer.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".edit-assignment-btn");
        if (editBtn) {
          const id = editBtn.getAttribute("data-id");
          if (id) openEditModal(id);
        }
      });
    }

    if (closeDeleteModalBtn) {
      closeDeleteModalBtn.addEventListener("click", () => {
        closeDeleteModal();
      });
    }

    if (deleteModalCancelBtn) {
      deleteModalCancelBtn.addEventListener("click", () => {
        closeDeleteModal();
      });
    }

    if (deleteModalConfirmBtn) {
      deleteModalConfirmBtn.addEventListener("click", () => {
        handleConfirmDelete();
      });
    }

    if (toastCloseBtn) {
      toastCloseBtn.addEventListener("click", () => {
        hideToast();
      });
    }

    // Backdrop click closes modals
    if (assignmentModal) {
      assignmentModal.addEventListener("click", (e) => {
        if (e.target === assignmentModal) {
          closeAssignmentModal();
        }
      });
    }

    if (deleteModal) {
      deleteModal.addEventListener("click", (e) => {
        if (e.target === deleteModal) {
          closeDeleteModal();
        }
      });
    }

    // Hash change event for routing
    window.addEventListener("hashchange", handleHashChange);
  }

  /**
   * Initialize application on DOM ready
   */
  function init() {
    initEvents();

    // Determine initial route from URL hash or default
    const initialHash = window.location.hash.replace("#", "").toLowerCase();
    navigateTo(initialHash || DEFAULT_SECTION, false);

    // Initial API health check
    checkApiHealth();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
