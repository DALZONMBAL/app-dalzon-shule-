/* =========================================================
   DALZON SHULE
   APP.JS — VERSION CORRIGÉE
   Compatible avec l'index.html actuel
   ========================================================= */

"use strict";

/* =========================================================
   ÉTAT
   ========================================================= */

const state = {
  schools: [],
  profiles: [],
  classes: [],
  students: [],
  teachers: [],
  subjects: [],
  courses: [],
  grades: [],
  attendance: [],
  documents: [],
  events: [],
  payments: []
};

let currentUser = null;
let currentProfile = null;
let currentRoute = "dashboard";
let initialized = false;

/* =========================================================
   SUPABASE
   ========================================================= */

function getSupabase() {
  if (!window.DALZON_SUPABASE) {
    throw new Error(
      "Supabase n'est pas initialisé. Vérifie index.html."
    );
  }

  return window.DALZON_SUPABASE;
}

/* =========================================================
   UTILITAIRES
   ========================================================= */

function getElement(id) {
  return document.getElementById(id);
}

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function initialsFromName(name) {
  if (!name) return "DS";

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "DS";

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function normalizeRole(role) {
  const value = String(role || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");

  const aliases = {
    secretary: "secretariat",
    secretaire: "secretariat",
    secretariat: "secretariat",
    finance: "gestion",
    comptabilite: "gestion",
    accountant: "gestion",
    accounting: "gestion",
    principal: "direction",
    headmaster: "direction"
  };

  return aliases[value] || value;
}

function getRole() {
  return normalizeRole(
    currentProfile?.role ||
    currentUser?.role ||
    ""
  );
}

function getCurrentSchoolId() {
  return (
    currentProfile?.school_id ||
    currentUser?.schoolId ||
    null
  );
}

/* =========================================================
   RÔLES
   ========================================================= */

function isAdmin() {
  return getRole() === "admin";
}

function isDirection() {
  return getRole() === "direction";
}

function isSecretariat() {
  return getRole() === "secretariat";
}

function isTeacher() {
  return getRole() === "teacher";
}

function isStudent() {
  return getRole() === "student";
}

function isParent() {
  return getRole() === "parent";
}

function isGestion() {
  return getRole() === "gestion";
}

function canManageStudents() {
  return (
    isAdmin() ||
    isDirection() ||
    isSecretariat()
  );
}

function canDeleteStudents() {
  return (
    isAdmin() ||
    isDirection()
  );
}

/* =========================================================
   PERMISSIONS DES PAGES
   ========================================================= */

function hasPermission(route) {
  if (isAdmin()) {
    return true;
  }

  const permissions = {
    dashboard: [
      "direction",
      "secretariat",
      "teacher",
      "student",
      "parent",
      "gestion"
    ],

    grades: [
      "direction",
      "secretariat",
      "teacher",
      "student",
      "parent"
    ],

    bulletins: [
      "direction",
      "secretariat",
      "teacher",
      "student",
      "parent"
    ],

    users: [],

    courses: [
      "direction",
      "secretariat",
      "teacher",
      "student",
      "parent"
    ],

    attendance: [
      "direction",
      "secretariat",
      "teacher",
      "student",
      "parent"
    ],

    documents: [
      "direction",
      "secretariat",
      "teacher",
      "student",
      "parent"
    ],

    calendar: [
      "direction",
      "secretariat",
      "teacher",
      "student",
      "parent"
    ],

    students: [
      "direction",
      "secretariat",
      "teacher"
    ],

    teachers: [
      "direction",
      "secretariat"
    ],

    classes: [
      "direction",
      "secretariat",
      "teacher"
    ],

    subjects: [
      "direction",
      "secretariat",
      "teacher"
    ],

    payments: [
      "direction",
      "secretariat",
      "gestion",
      "student",
      "parent"
    ],

    profile: [
      "direction",
      "secretariat",
      "teacher",
      "student",
      "parent",
      "gestion"
    ]
  };

  return (
    permissions[route] || []
  ).includes(getRole());
}

/* =========================================================
   CHARGEMENT UTILISATEUR
   ========================================================= */

async function loadCurrentUser() {
  if (
    !window.DALZON_AUTH ||
    typeof window.DALZON_AUTH
      .getAuthenticatedUserAsync !== "function"
  ) {
    throw new Error(
      "DALZON_AUTH n'est pas disponible."
    );
  }

  const result =
    await window.DALZON_AUTH
      .getAuthenticatedUserAsync();

  if (!result) {
    currentUser = null;
    currentProfile = null;
    return null;
  }

  currentUser =
    result.user || result;

  currentProfile =
    result.profile ||
    result.user?.profile ||
    null;

  return result;
}

/* =========================================================
   CHARGEMENT DES DONNÉES
   ========================================================= */

async function loadTable(tableName) {
  const supabase = getSupabase();

  try {
    const { data, error } =
      await supabase
        .from(tableName)
        .select("*");

    if (error) {
      console.error(
        `Erreur chargement ${tableName}:`,
        error
      );

      return [];
    }

    return data || [];

  } catch (error) {
    console.error(
      `Erreur chargement ${tableName}:`,
      error
    );

    return [];
  }
}

async function loadData() {
  const tables = [
    "schools",
    "profiles",
    "classes",
    "students",
    "teachers",
    "subjects",
    "courses",
    "grades",
    "attendance",
    "documents",
    "events",
    "payments"
  ];

  const results =
    await Promise.all(
      tables.map(loadTable)
    );

  tables.forEach(
    (table, index) => {
      state[table] =
        results[index] || [];
    }
  );

  console.log(
    "DALZON SHULE : données chargées",
    state
  );
}

/* =========================================================
   FILTRAGE ÉCOLE
   ========================================================= */

function filterBySchool(rows) {
  const schoolId =
    getCurrentSchoolId();

  if (!schoolId) {
    return rows || [];
  }

  return (rows || []).filter(
    row =>
      !row.school_id ||
      row.school_id === schoolId
  );
}

/* =========================================================
   TOPBAR
   ========================================================= */

function updateTopUser() {
  const nameElement =
    getElement("top-user-name");

  const roleElement =
    getElement("top-user-role");

  const avatarElement =
    getElement("top-avatar");

  if (!currentUser) {
    return;
  }

  const name =
    currentUser.name ||
    currentUser.fullName ||
    [
      currentUser.firstName,
      currentUser.lastName
    ]
      .filter(Boolean)
      .join(" ") ||
    currentUser.email ||
    "Utilisateur";

  if (nameElement) {
    nameElement.textContent = name;
  }

  if (roleElement) {
    roleElement.textContent =
      currentUser.roleLabel ||
      currentUser.role ||
      "Utilisateur";
  }

  if (avatarElement) {
    avatarElement.textContent =
      currentUser.initials ||
      initialsFromName(name);
  }
}

/* =========================================================
   STRUCTURE DE PAGE
   ========================================================= */

function pageHeader(
  title,
  description = "",
  actionHTML = ""
) {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">
          ${escapeHTML(title)}
        </h1>

        ${
          description
            ? `
              <p class="page-description">
                ${escapeHTML(description)}
              </p>
            `
            : ""
        }
      </div>

      ${
        actionHTML
          ? `
            <div>
              ${actionHTML}
            </div>
          `
          : ""
      }
    </div>
  `;
}

function emptyState(
  icon,
  title,
  description
) {
  return `
    <div class="empty-state">
      <i class="${escapeHTML(icon)}"></i>

      <div class="empty-state-title">
        ${escapeHTML(title)}
      </div>

      <div>
        ${escapeHTML(description)}
      </div>
    </div>
  `;
}

function setContent(html) {
  const container =
    getElement("app-content");

  if (!container) {
    console.error(
      "DALZON SHULE : #app-content introuvable."
    );

    return;
  }

  container.innerHTML = html;
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function updatePageTitle(title) {
  const element =
    getElement("topbar-title");

  if (element) {
    element.textContent =
      title;
  }
}

function updateNavigation(route) {
  document
    .querySelectorAll("[data-route]")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.route === route
      );
    });
}

function applyRoutePermissions() {
  document
    .querySelectorAll("[data-route]")
    .forEach(button => {
      const route =
        button.dataset.route;

      button.style.display =
        hasPermission(route)
          ? ""
          : "none";
    });
}

function navigate(route) {
  if (!route) {
    route = "dashboard";
  }

  if (!hasPermission(route)) {
    route = "dashboard";
  }

  currentRoute = route;

  updateNavigation(route);

  const titles = {
    dashboard: "Tableau de bord",
    grades: "Notes",
    bulletins: "Bulletins",
    users: "Comptes utilisateurs",
    courses: "Cours",
    attendance: "Présences",
    documents: "Documents",
    calendar: "Calendrier",
    students: "Élèves",
    teachers: "Enseignants",
    classes: "Classes",
    subjects: "Matières",
    payments: "Paiements",
    profile: "Mon profil"
  };

  updatePageTitle(
    titles[route] ||
    "DALZON SHULE"
  );

  switch (route) {
    case "dashboard":
      renderDashboard();
      break;

    case "grades":
      renderGrades();
      break;

    case "bulletins":
      renderBulletins();
      break;

    case "users":
      renderUsers();
      break;

    case "courses":
      renderCourses();
      break;

    case "attendance":
      renderAttendance();
      break;

    case "documents":
      renderDocuments();
      break;

    case "calendar":
      renderCalendar();
      break;

    case "students":
      renderStudents();
      break;

    case "teachers":
      renderTeachers();
      break;

    case "classes":
      renderClasses();
      break;

    case "subjects":
      renderSubjects();
      break;

    case "payments":
      renderPayments();
      break;

    case "profile":
      renderProfile();
      break;

    default:
      renderDashboard();
  }

  if (
    window.innerWidth <= 900
  ) {
    const sidebar =
      getElement("sidebar");

    if (sidebar) {
      sidebar.classList.remove(
        "open"
      );
    }
  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {
  const personalView = isStudent() || isParent();
  const students = personalView
    ? getVisibleStudents()
    : filterBySchool(state.students);

  const teachers = personalView
    ? []
    : filterBySchool(state.teachers);

  const personalClassIds = new Set(students.map(student => String(student.class_id || "")));
  const classes = personalView
    ? filterBySchool(state.classes).filter(cls => personalClassIds.has(String(cls.id)))
    : filterBySchool(state.classes);

  const subjects = personalView
    ? filterBySchool(state.subjects).filter(subject =>
        getVisibleGrades().some(grade => String(grade.subject_id) === String(subject.id))
      )
    : filterBySchool(state.subjects);

  const name =
    currentUser?.firstName ||
    currentUser?.name ||
    "Utilisateur";

  const recentStudents =
    students.slice(0, 5);

  setContent(`
    ${pageHeader(
      "Tableau de bord",
      "Vue générale de votre établissement scolaire."
    )}

    <div class="cards-grid">

      <div class="card stat-card">
        <div class="stat-icon">
          <i class="fa-solid fa-users"></i>
        </div>

        <div class="stat-value">
          ${students.length}
        </div>

        <div class="stat-label">
          Élèves
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-icon">
          <i class="fa-solid fa-chalkboard-user"></i>
        </div>

        <div class="stat-value">
          ${teachers.length}
        </div>

        <div class="stat-label">
          Enseignants
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-icon">
          <i class="fa-solid fa-school"></i>
        </div>

        <div class="stat-value">
          ${classes.length}
        </div>

        <div class="stat-label">
          Classes
        </div>
      </div>

      <div class="card stat-card">
        <div class="stat-icon">
          <i class="fa-solid fa-book"></i>
        </div>

        <div class="stat-value">
          ${subjects.length}
        </div>

        <div class="stat-label">
          Matières
        </div>
      </div>

    </div>

    <div style="height:20px"></div>

    <div class="card">

      <h2 style="
        font-family:'Space Grotesk',sans-serif;
        font-size:19px;
        margin-bottom:7px;
      ">
        Bonjour ${escapeHTML(name)}
      </h2>

      <p style="
        color:var(--muted);
        font-size:13px;
        line-height:1.6;
      ">
        Bienvenue dans DALZON SHULE,
        votre plateforme de gestion scolaire.
      </p>

    </div>

    <div style="height:20px"></div>

    <div class="card">

      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:15px;
        margin-bottom:18px;
      ">

        <div>
          <h2 style="
            font-family:'Space Grotesk',sans-serif;
            font-size:18px;
          ">
            Élèves récents
          </h2>

          <p style="
            color:var(--muted);
            font-size:12px;
            margin-top:4px;
          ">
            Derniers élèves enregistrés
          </p>
        </div>

        ${
          hasPermission("students")
            ? `
              <button
                class="btn"
                data-dashboard-route="students"
              >
                <i class="fa-solid fa-users"></i>
                Voir les élèves
              </button>
            `
            : ""
        }

      </div>

      ${
        recentStudents.length
          ? `
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Matricule</th>
                    <th>Classe</th>
                  </tr>
                </thead>

                <tbody>

                  ${recentStudents
                    .map(student => `
                      <tr>
                        <td>
                          ${escapeHTML(
                            [
                              student.first_name,
                              student.last_name
                            ]
                              .filter(Boolean)
                              .join(" ") ||
                            student.name ||
                            "—"
                          )}
                        </td>

                        <td>
                          ${escapeHTML(
                            student.matricule ||
                            "—"
                          )}
                        </td>

                        <td>
                          ${escapeHTML(
                            student.class_name ||
                            student.class_id ||
                            "—"
                          )}
                        </td>
                      </tr>
                    `)
                    .join("")}

                </tbody>
              </table>
            </div>
          `
          : emptyState(
              "fa-solid fa-users",
              "Aucun élève",
              "Aucun élève n'est encore disponible."
            )
      }

    </div>
  `);

  const dashboardButton =
    document.querySelector(
      "[data-dashboard-route='students']"
    );

  if (dashboardButton) {
    dashboardButton.addEventListener(
      "click",
      () => navigate("students")
    );
  }
}

/* =========================================================
   ÉLÈVES
   ========================================================= */

function renderStudents() {
  const students =
    filterBySchool(
      state.students
    );

  const canManage =
    canManageStudents();

  setContent(`
    ${pageHeader(
      "Élèves",
      "Gestion des élèves de l'établissement.",
      canManage
        ? `
          <button
            class="btn btn-primary"
            id="add-student-button"
          >
            <i class="fa-solid fa-user-plus"></i>
            Ajouter un élève
          </button>
        `
        : ""
    )}

    <div class="card">

      <div style="
        display:flex;
        gap:12px;
        margin-bottom:18px;
      ">

        <input
          id="student-search"
          class="app-input"
          type="search"
          placeholder="Rechercher un élève..."
        >

      </div>

      <div id="students-list"></div>

    </div>

    ${
      canManage
        ? `
          <div
            id="student-form-container"
            style="margin-top:20px;"
          ></div>
        `
        : ""
    }
  `);

  renderStudentList(
    students
  );

  const search =
    getElement("student-search");

  if (search) {
    search.addEventListener(
      "input",
      () => {
        const query =
          search.value
            .trim()
            .toLowerCase();

        const filtered =
          students.filter(student => {
            const text = [
              student.first_name,
              student.last_name,
              student.name,
              student.matricule,
              student.email,
              student.phone
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return text.includes(query);
          });

        renderStudentList(
          filtered
        );
      }
    );
  }

  const addButton =
    getElement(
      "add-student-button"
    );

  if (addButton) {
    addButton.addEventListener(
      "click",
      () => renderStudentForm()
    );
  }
}

function renderStudentList(
  students
) {
  const container =
    getElement("students-list");

  if (!container) return;

  if (!students.length) {
    container.innerHTML =
      emptyState(
        "fa-solid fa-users",
        "Aucun élève trouvé",
        "La liste des élèves est actuellement vide."
      );

    return;
  }

  container.innerHTML = `
    <div class="table-container">

      <table>

        <thead>
          <tr>
            <th>Nom</th>
            <th>Matricule</th>
            <th>Email</th>
            <th>Téléphone</th>
            ${
              canManageStudents()
                ? "<th>Actions</th>"
                : ""
            }
          </tr>
        </thead>

        <tbody>

          ${students
            .map(student => `
              <tr>

                <td>
                  <strong>
                    ${escapeHTML(
                      [
                        student.first_name,
                        student.last_name
                      ]
                        .filter(Boolean)
                        .join(" ") ||
                      student.name ||
                      "—"
                    )}
                  </strong>
                </td>

                <td>
                  ${escapeHTML(
                    student.matricule ||
                    "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    student.email ||
                    "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    student.phone ||
                    "—"
                  )}
                </td>

                ${
                  canManageStudents()
                    ? `
                      <td>

                        <div style="
                          display:flex;
                          gap:7px;
                        ">

                          <button
                            class="btn"
                            data-edit-student="${escapeHTML(
                              student.id
                            )}"
                            title="Modifier"
                          >
                            <i class="fa-solid fa-pen"></i>
                          </button>

                          ${
                            canDeleteStudents()
                              ? `
                                <button
                                  class="btn btn-danger"
                                  data-delete-student="${escapeHTML(
                                    student.id
                                  )}"
                                  title="Supprimer"
                                >
                                  <i class="fa-solid fa-trash"></i>
                                </button>
                              `
                              : ""
                          }

                        </div>

                      </td>
                    `
                    : ""
                }

              </tr>
            `)
            .join("")}

        </tbody>

      </table>

    </div>
  `;

  container
    .querySelectorAll(
      "[data-edit-student]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const student =
            state.students.find(
              item =>
                String(item.id) ===
                String(
                  button.dataset
                    .editStudent
                )
            );

          if (student) {
            renderStudentForm(
              student
            );
          }
        }
      );
    });

  container
    .querySelectorAll(
      "[data-delete-student]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          await deleteStudent(
            button.dataset
              .deleteStudent
          );
        }
      );
    });
}

/* =========================================================
   FORMULAIRE ÉLÈVE
   ========================================================= */

function renderStudentForm(
  student = null
) {
  const container =
    getElement(
      "student-form-container"
    );

  if (!container) return;

  const editing =
    Boolean(student);

  container.innerHTML = `
    <div class="card">

      <div class="modal-header">

        <div class="modal-title">
          ${
            editing
              ? "Modifier l'élève"
              : "Ajouter un élève"
          }
        </div>

        <button
          class="modal-close"
          id="close-student-form"
          type="button"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>

      </div>

      <form id="student-form">

        <div class="form-grid">

          <div>
            <label class="form-label">
              Prénom
            </label>

            <input
              class="app-input"
              name="first_name"
              value="${escapeHTML(
                student?.first_name || ""
              )}"
              required
            >
          </div>

          <div>
            <label class="form-label">
              Nom
            </label>

            <input
              class="app-input"
              name="last_name"
              value="${escapeHTML(
                student?.last_name || ""
              )}"
              required
            >
          </div>

          <div>
            <label class="form-label">
              Matricule
            </label>

            <input
              class="app-input"
              name="matricule"
              value="${escapeHTML(
                student?.matricule || ""
              )}"
            >
          </div>

          <div>
            <label class="form-label">
              Email
            </label>

            <input
              class="app-input"
              type="email"
              name="email"
              value="${escapeHTML(
                student?.email || ""
              )}"
            >
          </div>

          <div>
            <label class="form-label">
              Téléphone
            </label>

            <input
              class="app-input"
              name="phone"
              value="${escapeHTML(
                student?.phone || ""
              )}"
            >
          </div>

          <div>
            <label class="form-label">
              Classe
            </label>

            <select
              class="app-select"
              name="class_id"
            >
              <option value="">
                Sélectionner une classe
              </option>

              ${
                filterBySchool(
                  state.classes
                )
                  .map(cls => `
                    <option
                      value="${escapeHTML(
                        cls.id
                      )}"
                      ${
                        String(
                          student?.class_id ||
                          ""
                        ) ===
                        String(cls.id)
                          ? "selected"
                          : ""
                      }
                    >
                      ${escapeHTML(
                        cls.name ||
                        cls.class_name ||
                        "Classe"
                      )}
                    </option>
                  `)
                  .join("")
              }

            </select>
          </div>

          <div class="full">

            <label class="form-label">
              Adresse
            </label>

            <textarea
              class="app-textarea"
              name="address"
            >${escapeHTML(
              student?.address || ""
            )}</textarea>

          </div>

        </div>

        <div style="
          display:flex;
          justify-content:flex-end;
          gap:10px;
          margin-top:18px;
        ">

          <button
            type="button"
            class="btn"
            id="cancel-student-form"
          >
            Annuler
          </button>

          <button
            type="submit"
            class="btn btn-primary"
          >
            <i class="fa-solid fa-check"></i>
            ${
              editing
                ? "Enregistrer"
                : "Ajouter"
            }
          </button>

        </div>

        <div
          id="student-form-error"
          style="
            display:none;
            margin-top:15px;
            padding:12px;
            border-radius:10px;
            background:rgba(255,93,115,.08);
            color:#ff91a0;
            font-size:13px;
          "
        ></div>

      </form>

    </div>
  `;

  const closeButtons = [
    getElement(
      "close-student-form"
    ),
    getElement(
      "cancel-student-form"
    )
  ];

  closeButtons.forEach(
    button => {
      if (button) {
        button.addEventListener(
          "click",
          () => {
            container.innerHTML = "";
          }
        );
      }
    }
  );

  const form =
    getElement("student-form");

  if (form) {
    form.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        await saveStudent(
          form,
          student
        );
      }
    );
  }
}

/* =========================================================
   AJOUT / MODIFICATION ÉLÈVE
   ========================================================= */

async function saveStudent(
  form,
  existingStudent
) {
  const supabase =
    getSupabase();

  const formData =
    new FormData(form);

  const payload = {
    first_name:
      formData.get("first_name")
        ?.toString()
        .trim() || null,

    last_name:
      formData.get("last_name")
        ?.toString()
        .trim() || null,

    matricule:
      formData.get("matricule")
        ?.toString()
        .trim() || null,

    email:
      formData.get("email")
        ?.toString()
        .trim() || null,

    phone:
      formData.get("phone")
        ?.toString()
        .trim() || null,

    class_id:
      formData.get("class_id") ||
      null,

    address:
      formData.get("address")
        ?.toString()
        .trim() || null
  };

  const schoolId =
    getCurrentSchoolId();

  if (schoolId) {
    payload.school_id =
      schoolId;
  }

  const errorBox =
    getElement(
      "student-form-error"
    );

  try {
    let result;

    if (existingStudent) {
      result =
        await supabase
          .from("students")
          .update(payload)
          .eq(
            "id",
            existingStudent.id
          );
    } else {
      result =
        await supabase
          .from("students")
          .insert(payload);
    }

    if (result.error) {
      throw result.error;
    }

    await loadData();

    renderStudents();

  } catch (error) {
    console.error(
      "Erreur sauvegarde élève:",
      error
    );

    if (errorBox) {
      errorBox.textContent =
        error.message ||
        "Impossible d'enregistrer l'élève.";

      errorBox.style.display =
        "block";
    }
  }
}

/* =========================================================
   SUPPRESSION ÉLÈVE
   ========================================================= */

async function deleteStudent(
  studentId
) {
  if (!canDeleteStudents()) {
    return;
  }

  const confirmed =
    window.confirm(
      "Voulez-vous vraiment supprimer cet élève ?"
    );

  if (!confirmed) {
    return;
  }

  try {
    const supabase =
      getSupabase();

    const { error } =
      await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

    if (error) {
      throw error;
    }

    await loadData();

    renderStudents();

  } catch (error) {
    console.error(
      "Erreur suppression élève:",
      error
    );

    window.alert(
      error.message ||
      "Impossible de supprimer cet élève."
    );
  }
}

/* =========================================================
   NOTES
   ========================================================= */

function canManageGrades() {
  return isAdmin() || isDirection() || isTeacher();
}

function getVisibleStudents() {
  const students = filterBySchool(state.students);
  const role = getRole();
  const profile = currentProfile || currentUser?.profile || {};
  const userId = String(profile.id || currentUser?.id || "");
  const matricule = String(profile.matricule || currentUser?.matricule || "");

  if (isAdmin() || isDirection() || isSecretariat() || isTeacher() || isGestion()) {
    return students;
  }

  if (role === "student") {
    return students.filter(student =>
      String(student.user_id || student.profile_id || student.auth_user_id || "") === userId ||
      (matricule && String(student.matricule || "") === matricule)
    );
  }

  if (role === "parent") {
    return students.filter(student =>
      String(student.parent_profile_id || student.parent_user_id || student.guardian_user_id || "") === userId ||
      String(student.parent_id || "") === userId
    );
  }

  return [];
}

function getVisibleGrades() {
  const grades = filterBySchool(state.grades);
  if (isAdmin() || isDirection() || isSecretariat() || isTeacher() || isGestion()) {
    return grades;
  }
  const ids = new Set(getVisibleStudents().map(student => String(student.id)));
  return grades.filter(grade => ids.has(String(grade.student_id || "")));
}

function getStudentLabel(student) {
  return [
    student?.first_name,
    student?.last_name
  ].filter(Boolean).join(" ") || student?.name || student?.matricule || "Élève";
}

function getSubjectLabel(subjectId) {
  const subject = state.subjects.find(item => String(item.id) === String(subjectId));
  return subject?.name || subject?.title || subjectId || "Matière";
}

function renderGrades() {
  const grades = getVisibleGrades();
  const students = getVisibleStudents();
  const canManage = canManageGrades();
  const subjectOptions = filterBySchool(state.subjects).map(subject =>
    `<option value="${escapeHTML(subject.id)}">${escapeHTML(subject.name || subject.title || "Matière")}</option>`
  ).join("");
  const studentOptions = students.map(student =>
    `<option value="${escapeHTML(student.id)}">${escapeHTML(getStudentLabel(student))}</option>`
  ).join("");

  setContent(`
    ${pageHeader(
      "Notes",
      canManage
        ? "Saisir et consulter les résultats scolaires."
        : "Consulter les résultats qui vous concernent.",
      `<button class="btn btn-secondary" type="button" data-open-bulletins><i class="fa-solid fa-file-pdf"></i> Voir les bulletins</button>`
    )}

    ${canManage ? `
      <div class="card" style="margin-bottom:18px">
        <h3 style="font-family:'Space Grotesk',sans-serif;margin-bottom:14px">Saisir une note</h3>
        ${students.length && state.subjects.length ? `
          <form id="grade-form">
            <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
              <div>
                <label class="form-label" for="grade-student">Élève</label>
                <select class="app-input" id="grade-student" name="student_id" required><option value="">Choisir un élève</option>${studentOptions}</select>
              </div>
              <div>
                <label class="form-label" for="grade-subject">Matière</label>
                <select class="app-input" id="grade-subject" name="subject_id" required><option value="">Choisir une matière</option>${subjectOptions}</select>
              </div>
              <div>
                <label class="form-label" for="grade-score">Note obtenue</label>
                <input class="app-input" id="grade-score" name="score" type="number" step="0.01" required placeholder="Ex. 14">
              </div>
              <div>
                <label class="form-label" for="grade-coefficient">Coefficient</label>
                <input class="app-input" id="grade-coefficient" name="coefficient" type="number" min="0.01" step="0.01" value="1" required>
              </div>
              <div>
                <label class="form-label" for="grade-date">Date</label>
                <input class="app-input" id="grade-date" name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required>
              </div>
            </div>
            <p id="grade-form-error" role="alert" style="display:none;color:#ff91a0;margin-top:10px"></p>
            <button class="btn btn-primary" type="submit" style="margin-top:14px"><i class="fa-solid fa-floppy-disk"></i> Enregistrer la note</button>
          </form>
        ` : `<p style="color:var(--muted)">Ajoutez d'abord au moins un élève et une matière.</p>`}
      </div>
    ` : ""}

    <div class="card">
      ${grades.length ? `
        <div class="table-container">
          <table>
            <thead><tr><th>Élève</th><th>Matière</th><th>Note</th><th>Coefficient</th><th>Date</th></tr></thead>
            <tbody>
              ${grades.slice().sort((a,b) => String(b.date || b.created_at || "").localeCompare(String(a.date || a.created_at || ""))).map(grade => {
                const student = students.find(item => String(item.id) === String(grade.student_id));
                return `<tr>
                  <td>${escapeHTML(grade.student_name || (student ? getStudentLabel(student) : "Élève"))}</td>
                  <td>${escapeHTML(grade.subject_name || getSubjectLabel(grade.subject_id))}</td>
                  <td><span class="badge">${escapeHTML(grade.score ?? grade.note ?? "—")}</span></td>
                  <td>${escapeHTML(grade.coefficient ?? "1")}</td>
                  <td>${formatDate(grade.date || grade.created_at)}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      ` : emptyState("fa-solid fa-graduation-cap","Aucune note disponible","Les notes autorisées pour votre compte apparaîtront ici.")}
    </div>
  `);

  const form = getElement("grade-form");
  if (form) form.addEventListener("submit", async event => {
    event.preventDefault();
    await saveGrade(form);
  });
  const bulletinButton = document.querySelector("[data-open-bulletins]");
  if (bulletinButton) bulletinButton.addEventListener("click", () => navigate("bulletins"));
}

async function saveGrade(form) {
  if (!canManageGrades()) return;
  const data = new FormData(form);
  const studentId = String(data.get("student_id") || "").trim();
  const subjectId = String(data.get("subject_id") || "").trim();
  const score = Number(String(data.get("score") || "").replace(",", "."));
  const coefficient = Number(String(data.get("coefficient") || "1").replace(",", "."));
  const date = String(data.get("date") || "").trim();
  const errorBox = getElement("grade-form-error");

  if (!studentId || !subjectId || !Number.isFinite(score) || !Number.isFinite(coefficient) || coefficient <= 0 || !date) {
    if (errorBox) {
      errorBox.textContent = "Vérifiez l'élève, la matière, la note, le coefficient et la date.";
      errorBox.style.display = "block";
    }
    return;
  }

  const sample = state.grades[0] || {};
  const scoreColumn = Object.prototype.hasOwnProperty.call(sample, "note") &&
    !Object.prototype.hasOwnProperty.call(sample, "score") ? "note" : "score";
  const payload = {
    student_id: studentId,
    subject_id: subjectId,
    [scoreColumn]: score,
    coefficient,
    date
  };
  const schoolId = getCurrentSchoolId();
  if (schoolId) payload.school_id = schoolId;

  try {
    const { error } = await getSupabase().from("grades").insert(payload);
    if (error) throw error;
    await loadData();
    renderGrades();
  } catch (error) {
    console.error("Erreur saisie note :", error);
    if (errorBox) {
      errorBox.textContent = error.message || "Impossible d'enregistrer la note. Vérifiez les colonnes et les autorisations de la table grades.";
      errorBox.style.display = "block";
    }
  }
}

function renderBulletins() {
  const students = getVisibleStudents();
  const isPersonal = isStudent() || isParent();
  const canChooseStudent = !isStudent() && !isParent();
  const studentOptions = students.map(student =>
    `<option value="${escapeHTML(student.id)}">${escapeHTML(getStudentLabel(student))}</option>`
  ).join("");

  setContent(`
    ${pageHeader("Bulletins scolaires","Prévisualiser et imprimer le relevé des résultats.")}
    <div class="card" style="margin-bottom:18px">
      <form id="bulletin-filter-form">
        <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px">
          <div>
            <label class="form-label" for="bulletin-student">Élève</label>
            <select class="app-input" id="bulletin-student" name="student_id" ${canChooseStudent ? "required" : "disabled"}>
              ${canChooseStudent ? '<option value="">Choisir un élève</option>' : ""}
              ${studentOptions}
            </select>
          </div>
          <div>
            <label class="form-label" for="bulletin-from">Du</label>
            <input class="app-input" id="bulletin-from" name="from_date" type="date">
          </div>
          <div>
            <label class="form-label" for="bulletin-to">Au</label>
            <input class="app-input" id="bulletin-to" name="to_date" type="date">
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
          <button class="btn btn-primary" type="submit"><i class="fa-solid fa-eye"></i> Afficher le bulletin</button>
          <button class="btn btn-secondary" type="button" id="print-bulletin" disabled><i class="fa-solid fa-file-pdf"></i> Imprimer / PDF</button>
        </div>
      </form>
      ${isPersonal && !students.length ? '<p role="status" style="margin-top:12px;color:#ffb347">Aucun élève n’est encore associé à ce compte. Le secrétariat doit relier ce compte à la fiche de l’élève.</p>' : ""}
    </div>
    <div id="bulletin-preview"></div>
  `);

  const form = getElement("bulletin-filter-form");
  const printButton = getElement("print-bulletin");
  let currentBulletin = null;

  const build = () => {
    const data = new FormData(form);
    const studentId = String(data.get("student_id") || (isStudent() && students[0] ? students[0].id : "")).trim();
    const fromDate = String(data.get("from_date") || "");
    const toDate = String(data.get("to_date") || "");
    const student = students.find(item => String(item.id) === studentId);
    if (!student) {
      getElement("bulletin-preview").innerHTML = emptyState("fa-solid fa-file-circle-exclamation","Élève non sélectionné","Sélectionnez un élève associé à votre compte.");
      printButton.disabled = true;
      currentBulletin = null;
      return;
    }

    const rows = getVisibleGrades().filter(grade => {
      if (String(grade.student_id) !== studentId) return false;
      const day = String(grade.date || grade.created_at || "").slice(0,10);
      if (fromDate && day && day < fromDate) return false;
      if (toDate && day && day > toDate) return false;
      return true;
    });

    const groups = new Map();
    rows.forEach(grade => {
      const key = String(grade.subject_id || grade.subject_name || "other");
      if (!groups.has(key)) groups.set(key, { name: grade.subject_name || getSubjectLabel(grade.subject_id), weighted: 0, coefficients: 0, count: 0 });
      const group = groups.get(key);
      const value = Number(String(grade.score ?? grade.note ?? "").replace(",", "."));
      const coefficient = Number(grade.coefficient || 1);
      if (Number.isFinite(value) && Number.isFinite(coefficient) && coefficient > 0) {
        group.weighted += value * coefficient;
        group.coefficients += coefficient;
        group.count += 1;
      }
    });

    const subjects = Array.from(groups.values()).map(group => ({
      ...group,
      average: group.coefficients ? group.weighted / group.coefficients : null
    }));
    const totalWeighted = subjects.reduce((sum, subject) => sum + (subject.average === null ? 0 : subject.average * subject.coefficients), 0);
    const totalCoefficient = subjects.reduce((sum, subject) => sum + subject.coefficients, 0);
    const average = totalCoefficient ? totalWeighted / totalCoefficient : null;
    const fromLabel = fromDate ? formatDate(fromDate) : "Début des enregistrements";
    const toLabel = toDate ? formatDate(toDate) : "Aujourd’hui";

    currentBulletin = { student, subjects, average, fromLabel, toLabel, rowsCount: rows.length };
    const subjectRows = subjects.length ? subjects.map(subject => `
      <tr><td>${escapeHTML(subject.name)}</td><td>${subject.count}</td><td>${subject.coefficients.toLocaleString("fr-FR")}</td><td>${subject.average === null ? "—" : subject.average.toLocaleString("fr-FR",{maximumFractionDigits:2})}</td></tr>
    `).join("") : '<tr><td colspan="4">Aucune note pour cette période.</td></tr>';

    getElement("bulletin-preview").innerHTML = `
      <div class="card" id="bulletin-paper">
        <div style="text-align:center;border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:16px">
          <div style="font-size:12px;color:var(--muted);letter-spacing:.12em">DOCUMENT SCOLAIRE</div>
          <h2 style="font-family:'Space Grotesk',sans-serif;margin:7px 0">DALZON SHULE</h2>
          <h3>Bulletin de résultats</h3>
          <p style="color:var(--muted);font-size:12px;margin-top:6px">Période : ${escapeHTML(fromLabel)} — ${escapeHTML(toLabel)}</p>
        </div>
        <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:18px">
          <div><small>Nom de l’élève</small><strong style="display:block">${escapeHTML(getStudentLabel(student))}</strong></div>
          <div><small>Matricule</small><strong style="display:block">${escapeHTML(student.matricule || "—")}</strong></div>
          <div><small>Classe</small><strong style="display:block">${escapeHTML(student.class_name || student.class_id || "—")}</strong></div>
        </div>
        <div class="table-container">
          <table><thead><tr><th>Matière</th><th>Évaluations</th><th>Total coefficients</th><th>Moyenne</th></tr></thead><tbody>${subjectRows}</tbody></table>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:18px">
          <div style="padding:14px 18px;border:1px solid var(--border);border-radius:12px;text-align:right">
            <small>Moyenne générale pondérée</small>
            <div style="font-size:25px;font-weight:800">${average === null ? "—" : average.toLocaleString("fr-FR",{maximumFractionDigits:2})}</div>
          </div>
        </div>
        <p style="font-size:11px;color:var(--muted);margin-top:20px">Document généré par DALZON SHULE. Les résultats reflètent les notes enregistrées dans la période sélectionnée.</p>
      </div>
    `;
    printButton.disabled = !rows.length;
  };

  if (form) form.addEventListener("submit", event => {
    event.preventDefault();
    build();
  });
  if (canChooseStudent && students.length) {
    const select = getElement("bulletin-student");
    if (select) select.addEventListener("change", () => { printButton.disabled = true; });
  }
  if (isStudent() && students.length) build();
  if (printButton) printButton.addEventListener("click", () => {
    if (!currentBulletin) return;
    const { student, subjects, average, fromLabel, toLabel } = currentBulletin;
    const popup = window.open("", "_blank");
    if (!popup) {
      window.alert("Autorisez les fenêtres contextuelles pour imprimer le bulletin.");
      return;
    }
    const rows = subjects.map(subject => `<tr><td>${escapeHTML(subject.name)}</td><td>${subject.count}</td><td>${subject.coefficients.toLocaleString("fr-FR")}</td><td>${subject.average === null ? "—" : subject.average.toLocaleString("fr-FR",{maximumFractionDigits:2})}</td></tr>`).join("");
    popup.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bulletin — ${escapeHTML(getStudentLabel(student))}</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:32px}header{text-align:center;border-bottom:2px solid #172033;padding-bottom:18px;margin-bottom:22px}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #cbd5e1;padding:10px;text-align:left}th{background:#eef2f7}.meta{display:flex;gap:30px;flex-wrap:wrap}.average{text-align:right;font-size:20px;font-weight:bold;margin-top:25px}.muted{color:#64748b;font-size:12px}@media print{body{padding:0}}</style></head><body><header><div class="muted">DOCUMENT SCOLAIRE</div><h1>DALZON SHULE</h1><h2>Bulletin de résultats</h2><p>Période : ${escapeHTML(fromLabel)} — ${escapeHTML(toLabel)}</p></header><div class="meta"><div><b>Élève :</b> ${escapeHTML(getStudentLabel(student))}</div><div><b>Matricule :</b> ${escapeHTML(student.matricule || "—")}</div><div><b>Classe :</b> ${escapeHTML(student.class_name || student.class_id || "—")}</div></div><table><thead><tr><th>Matière</th><th>Évaluations</th><th>Coefficients</th><th>Moyenne</th></tr></thead><tbody>${rows || "<tr><td colspan='4'>Aucune note</td></tr>"}</tbody></table><div class="average">Moyenne générale pondérée : ${average === null ? "—" : average.toLocaleString("fr-FR",{maximumFractionDigits:2})}</div><p class="muted">Généré par DALZON SHULE</p><script>window.onload=()=>window.print()<\/script></body></html>`);
    popup.document.close();
  });
}

function renderUsers() {
  if (!isAdmin()) {
    setContent(emptyState("fa-solid fa-lock","Accès réservé","Seul l'administrateur peut gérer les comptes."));
    return;
  }

  const profiles = filterBySchool(state.profiles);
  const roleLabels = {
    admin: "Administrateur",
    direction: "Direction",
    secretariat: "Secrétariat",
    teacher: "Enseignant",
    student: "Élève",
    parent: "Parent",
    gestion: "Comptabilité"
  };

  setContent(`
    ${pageHeader("Comptes utilisateurs","Créer les accès individuels de chaque membre de l’établissement.")}
    <div class="card" style="margin-bottom:18px">
      <h3 style="font-family:'Space Grotesk',sans-serif;margin-bottom:14px">Créer un compte</h3>
      <form id="user-account-form">
        <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px">
          <div><label class="form-label" for="account-first-name">Prénom</label><input class="app-input" id="account-first-name" name="first_name" required maxlength="100"></div>
          <div><label class="form-label" for="account-last-name">Nom</label><input class="app-input" id="account-last-name" name="last_name" required maxlength="100"></div>
          <div><label class="form-label" for="account-email">Adresse e-mail</label><input class="app-input" id="account-email" name="email" type="email" required maxlength="180"></div>
          <div><label class="form-label" for="account-role">Rôle</label><select class="app-input" id="account-role" name="role" required>
            <option value="direction">Direction</option><option value="secretariat">Secrétariat</option><option value="teacher">Enseignant</option><option value="student">Élève</option><option value="parent">Parent</option><option value="gestion">Comptabilité</option><option value="admin">Administrateur</option>
          </select></div>
          <div id="account-student-link" style="grid-column:1/-1;display:none"><label class="form-label" for="account-student-ids">Associer à un ou plusieurs élèves</label><select class="app-input" id="account-student-ids" name="linked_student_ids" multiple size="4">${filterBySchool(state.students).map(student => `<option value="${escapeHTML(student.id)}">${escapeHTML(getStudentLabel(student))}</option>`).join("")}</select><small style="color:var(--muted)">Pour un compte élève, sélectionnez un seul élève. Pour un parent, vous pouvez sélectionner plusieurs enfants.</small></div>
          <div id="account-teacher-link" style="grid-column:1/-1;display:none"><label class="form-label" for="account-teacher-id">Associer à la fiche enseignant</label><select class="app-input" id="account-teacher-id" name="linked_teacher_id"><option value="">Choisir un enseignant</option>${filterBySchool(state.teachers).map(teacher => `<option value="${escapeHTML(teacher.id)}">${escapeHTML([teacher.first_name,teacher.last_name].filter(Boolean).join(" ") || teacher.email || "Enseignant")}</option>`).join("")}</select></div>
          <div style="grid-column:1/-1"><label class="form-label" for="account-password">Mot de passe provisoire (8 caractères minimum)</label><input class="app-input" id="account-password" name="password" type="password" minlength="8" required autocomplete="new-password"></div>
        </div>
        <p id="user-account-error" role="alert" style="display:none;color:#ff91a0;margin-top:10px"></p>
        <p id="user-account-success" role="status" style="display:none;color:#24d18b;margin-top:10px"></p>
        <button class="btn btn-primary" type="submit" style="margin-top:14px"><i class="fa-solid fa-user-plus"></i> Créer le compte</button>
      </form>
      <p style="font-size:12px;color:var(--muted);margin-top:12px">La création utilise une fonction sécurisée côté serveur. Ne placez jamais la clé service_role dans le site web.</p>
    </div>
    <div class="card">
      <h3 style="font-family:'Space Grotesk',sans-serif;margin-bottom:14px">Comptes existants (${profiles.length})</h3>
      ${profiles.length ? `
        <div class="table-container"><table>
          <thead><tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Matricule</th></tr></thead>
          <tbody>${profiles.map(profile => {
            const fullName = [profile.first_name,profile.last_name].filter(Boolean).join(" ") || profile.email || "Utilisateur";
            const role = normalizeRole(profile.role);
            return `<tr><td>${escapeHTML(fullName)}</td><td>${escapeHTML(profile.email || "—")}</td><td>${escapeHTML(roleLabels[role] || profile.role || "—")}</td><td>${escapeHTML(profile.matricule || "—")}</td></tr>`;
          }).join("")}</tbody>
        </table></div>
      ` : emptyState("fa-solid fa-users","Aucun compte listé","Les profils autorisés apparaîtront ici.")}
    </div>
  `);

  const form = getElement("user-account-form");
  const roleSelect = getElement("account-role");
  const studentLink = getElement("account-student-link");
  const teacherLink = getElement("account-teacher-link");
  const refreshLinkFields = () => {
    const role = normalizeRole(roleSelect?.value);
    if (studentLink) studentLink.style.display = role === "student" || role === "parent" ? "block" : "none";
    if (teacherLink) teacherLink.style.display = role === "teacher" ? "block" : "none";
  };
  if (roleSelect) roleSelect.addEventListener("change", refreshLinkFields);
  refreshLinkFields();

  if (form) form.addEventListener("submit", async event => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      first_name: String(data.get("first_name") || "").trim(),
      last_name: String(data.get("last_name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      role: String(data.get("role") || "").trim(),
      password: String(data.get("password") || ""),
      linked_student_ids: data.getAll("linked_student_ids").map(value => String(value)).filter(Boolean),
      linked_teacher_id: String(data.get("linked_teacher_id") || "").trim()
    };
    const errorBox = getElement("user-account-error");
    const successBox = getElement("user-account-success");
    if (errorBox) errorBox.style.display = "none";
    if (successBox) successBox.style.display = "none";

    if (!payload.first_name || !payload.last_name || !payload.email || payload.password.length < 8) {
      if (errorBox) {
        errorBox.textContent = "Complétez tous les champs et utilisez un mot de passe d'au moins 8 caractères.";
        errorBox.style.display = "block";
      }
      return;
    }

    try {
      const { data: result, error } = await getSupabase().functions.invoke("admin-create-user", { body: payload });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      if (successBox) {
        successBox.textContent = "Compte créé. Communiquez les identifiants à la personne concernée de manière privée.";
        successBox.style.display = "block";
      }
      form.reset();
      await loadData();
      renderUsers();
    } catch (error) {
      console.error("Erreur création compte :", error);
      if (errorBox) {
        errorBox.textContent = error.message || "La fonction admin-create-user n'est pas encore déployée ou la création a échoué.";
        errorBox.style.display = "block";
      }
    }
  });
}

/* =========================================================
   COURS
   ========================================================= */

function renderCourses() {
  const courses =
    filterBySchool(
      state.courses
    );

  setContent(`
    ${pageHeader(
      "Cours",
      "Cours et contenus pédagogiques."
    )}

    <div class="cards-grid">

      ${
        courses.length
          ? courses
              .map(course => `
                <div class="card">

                  <div class="stat-icon">
                    <i class="fa-solid fa-book-open"></i>
                  </div>

                  <h3 style="
                    font-family:'Space Grotesk',sans-serif;
                    font-size:17px;
                    margin-bottom:7px;
                  ">
                    ${escapeHTML(
                      course.title ||
                      course.name ||
                      "Cours"
                    )}
                  </h3>

                  <p style="
                    color:var(--muted);
                    font-size:13px;
                    line-height:1.5;
                  ">
                    ${escapeHTML(
                      course.description ||
                      "Aucune description disponible."
                    )}
                  </p>

                </div>
              `)
              .join("")
          : `
            <div
              class="card"
              style="grid-column:1/-1"
            >
              ${emptyState(
                "fa-solid fa-book-open",
                "Aucun cours",
                "Aucun cours n'est actuellement disponible."
              )}
            </div>
          `
      }

    </div>
  `);
}

/* =========================================================
   PRÉSENCES
   ========================================================= */

function canRecordAttendance() {
  return isAdmin() || isDirection() || isSecretariat() || isTeacher();
}

function renderAttendance() {
  const personalView = isStudent() || isParent();
  const students = getVisibleStudents();
  const visibleStudentIds = new Set(students.map(student => String(student.id)));
  const attendance = filterBySchool(state.attendance).filter(item =>
    !personalView || visibleStudentIds.has(String(item.student_id || ""))
  );
  const today = new Date();
  const todayValue = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  setContent(`
    ${pageHeader("Présences","Suivi des présences et absences.")}
    ${canRecordAttendance() ? `
      <div class="card" style="margin-bottom:18px">
        <h3 style="margin:0 0 14px;font-family:'Space Grotesk',sans-serif">Enregistrer une présence</h3>
        ${students.length ? `
          <form id="attendance-form">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px">
              <div>
                <label class="form-label" for="attendance-student">Élève</label>
                <select class="app-input" id="attendance-student" name="student_id" required>
                  <option value="">Choisir un élève</option>
                  ${students.map(student => {
                    const label = [student.first_name,student.last_name].filter(Boolean).join(" ") || student.name || student.matricule || "Élève";
                    return `<option value="${escapeHTML(student.id)}">${escapeHTML(label)}</option>`;
                  }).join("")}
                </select>
              </div>
              <div>
                <label class="form-label" for="attendance-date">Date</label>
                <input class="app-input" id="attendance-date" type="date" name="date" value="${todayValue}" required>
              </div>
              <div>
                <label class="form-label" for="attendance-status">Statut</label>
                <select class="app-input" id="attendance-status" name="status" required>
                  <option value="present">Présent</option>
                  <option value="absent">Absent</option>
                  <option value="late">En retard</option>
                  <option value="justified">Absence justifiée</option>
                </select>
              </div>
            </div>
            <div style="margin-top:12px">
              <label class="form-label" for="attendance-note">Observation (facultatif)</label>
              <textarea class="app-input" id="attendance-note" name="note" rows="2" placeholder="Ajouter une observation..."></textarea>
            </div>
            <p id="attendance-form-error" role="alert" style="display:none;color:var(--danger,#dc2626);margin-top:10px"></p>
            <button class="btn btn-primary" type="submit" style="margin-top:12px">
              <i class="fa-solid fa-check"></i> Enregistrer
            </button>
          </form>
        ` : `
          <p style="color:var(--muted)">Ajoute d'abord des élèves pour pouvoir enregistrer leurs présences.</p>
        `}
      </div>
    ` : ""}
    <div class="card">
      <h3 style="margin:0 0 14px;font-family:'Space Grotesk',sans-serif">Historique des présences</h3>
      ${
        attendance.length ? `
          <div class="table-container">
            <table>
              <thead><tr><th>Élève</th><th>Date</th><th>Statut</th><th>Observation</th></tr></thead>
              <tbody>
                ${attendance.slice().sort((a,b) => String(b.date || b.created_at || "").localeCompare(String(a.date || a.created_at || ""))).map(item => {
                  const student = students.find(s => String(s.id) === String(item.student_id));
                  const studentLabel = item.student_name || (student ? [student.first_name,student.last_name].filter(Boolean).join(" ") || student.name : null) || item.student_id || "—";
                  const status = String(item.status || item.statut || "").toLowerCase();
                  const badge = status.includes("present") ? "badge badge-success" : status.includes("abs") ? "badge badge-danger" : "badge badge-warning";
                  const statusLabel = ({present:"Présent",absent:"Absent",late:"En retard",justified:"Absence justifiée"})[status] || item.status || item.statut || "—";
                  return `
                    <tr>
                      <td>${escapeHTML(studentLabel)}</td>
                      <td>${formatDate(item.date || item.created_at)}</td>
                      <td><span class="${badge}">${escapeHTML(statusLabel)}</span></td>
                      <td>${escapeHTML(item.note || item.observation || "—")}</td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        ` : emptyState("fa-solid fa-calendar-check","Aucune présence","Les enregistrements apparaîtront ici.")
      }
    </div>
  `);

  const form = getElement("attendance-form");
  if (form) form.addEventListener("submit", async event => {
    event.preventDefault();
    await saveAttendance(form);
  });
}

async function saveAttendance(form) {
  if (!canRecordAttendance()) return;
  const data = new FormData(form);
  const studentId = String(data.get("student_id") || "").trim();
  const date = String(data.get("date") || "").trim();
  const status = String(data.get("status") || "").trim();
  const note = String(data.get("note") || "").trim();
  const errorBox = getElement("attendance-form-error");

  if (!studentId || !date || !status) {
    if (errorBox) {
      errorBox.textContent = "Sélectionne un élève, une date et un statut.";
      errorBox.style.display = "block";
    }
    return;
  }

  const payload = { student_id: studentId, date, status, note: note || null };
  const schoolId = getCurrentSchoolId();
  if (schoolId) payload.school_id = schoolId;

  try {
    const { error } = await getSupabase().from("attendance").insert(payload);
    if (error) throw error;
    await loadData();
    renderAttendance();
  } catch (error) {
    console.error("Erreur enregistrement présence :", error);
    if (errorBox) {
      errorBox.textContent = error.message || "Impossible d'enregistrer cette présence.";
      errorBox.style.display = "block";
    }
  }
}

/* =========================================================
   DOCUMENTS
   ========================================================= */

function renderDocuments() {
  const documents =
    filterBySchool(
      state.documents
    );

  setContent(`
    ${pageHeader(
      "Documents",
      "Documents scolaires et administratifs."
    )}

    <div class="cards-grid">

      ${
        documents.length
          ? documents
              .map(document => `
                <div class="card">

                  <div style="
                    display:flex;
                    align-items:center;
                    gap:13px;
                  ">

                    <div class="stat-icon">
                      <i class="fa-solid fa-file-lines"></i>
                    </div>

                    <div>

                      <div style="
                        font-weight:700;
                        font-size:14px;
                      ">
                        ${escapeHTML(
                          document.title ||
                          document.name ||
                          "Document"
                        )}
                      </div>

                      <div style="
                        color:var(--muted);
                        font-size:11px;
                        margin-top:3px;
                      ">
                        ${formatDate(
                          document.created_at
                        )}
                      </div>

                    </div>

                  </div>

                  ${
                    document.url ||
                    document.file_url
                      ? `
                        <a
                          href="${escapeHTML(
                            document.url ||
                            document.file_url
                          )}"
                          target="_blank"
                          rel="noopener"
                          class="btn"
                          style="margin-top:15px;"
                        >
                          <i class="fa-solid fa-arrow-up-right-from-square"></i>
                          Ouvrir
                        </a>
                      `
                      : ""
                  }

                </div>
              `)
              .join("")
          : `
            <div
              class="card"
              style="grid-column:1/-1"
            >
              ${emptyState(
                "fa-solid fa-file-lines",
                "Aucun document",
                "Aucun document n'est actuellement disponible."
              )}
            </div>
          `
      }

    </div>
  `);
}

/* =========================================================
   CALENDRIER
   ========================================================= */

function renderCalendar() {
  const events =
    filterBySchool(
      state.events
    );

  setContent(`
    ${pageHeader(
      "Calendrier",
      "Événements et activités scolaires."
    )}

    <div class="cards-grid">

      ${
        events.length
          ? events
              .map(event => `
                <div class="card">

                  <div class="stat-icon">
                    <i class="fa-solid fa-calendar-days"></i>
                  </div>

                  <h3 style="
                    font-family:'Space Grotesk',sans-serif;
                    font-size:17px;
                    margin-bottom:7px;
                  ">
                    ${escapeHTML(
                      event.title ||
                      event.name ||
                      "Événement"
                    )}
                  </h3>

                  <div style="
                    color:var(--muted);
                    font-size:12px;
                    margin-bottom:10px;
                  ">
                    ${formatDate(
                      event.start_date ||
                      event.date ||
                      event.created_at
                    )}
                  </div>

                  <p style="
                    color:var(--muted);
                    font-size:13px;
                    line-height:1.5;
                  ">
                    ${escapeHTML(
                      event.description ||
                      "Aucune description."
                    )}
                  </p>

                </div>
              `)
              .join("")
          : `
            <div
              class="card"
              style="grid-column:1/-1"
            >
              ${emptyState(
                "fa-solid fa-calendar-days",
                "Aucun événement",
                "Aucun événement n'est actuellement enregistré."
              )}
            </div>
          `
      }

    </div>
  `);
}

/* =========================================================
   ENSEIGNANTS
   ========================================================= */

function canManageTeachers() {
  return isAdmin() || isDirection() || isSecretariat();
}

function canDeleteTeachers() {
  return isAdmin() || isDirection();
}

function renderTeachers() {
  const teachers = filterBySchool(state.teachers);
  const canManage = canManageTeachers();

  setContent(`
    ${pageHeader("Enseignants","Gestion des enseignants de l'établissement.")}
    ${canManage ? `
      <div style="display:flex;justify-content:flex-end;margin:0 0 16px">
        <button class="btn btn-primary" id="add-teacher-btn" type="button">
          <i class="fa-solid fa-plus"></i> Ajouter un enseignant
        </button>
      </div>
    ` : ""}
    <div class="card">
      ${
        teachers.length ? `
          <div class="table-container">
            <table>
              <thead><tr>
                <th>Nom</th><th>Email</th><th>Téléphone</th><th>Matière</th>
                ${canManage ? "<th>Actions</th>" : ""}
              </tr></thead>
              <tbody>
                ${teachers.map(teacher => {
                  const subject = state.subjects.find(item =>
                    String(item.id) === String(teacher.subject_id)
                  );
                  return `
                    <tr>
                      <td>${escapeHTML([teacher.first_name,teacher.last_name].filter(Boolean).join(" ") || teacher.name || "—")}</td>
                      <td>${escapeHTML(teacher.email || "—")}</td>
                      <td>${escapeHTML(teacher.phone || "—")}</td>
                      <td>${escapeHTML(teacher.subject_name || subject?.name || subject?.title || teacher.subject_id || "—")}</td>
                      ${canManage ? `
                        <td>
                          <div style="display:flex;gap:7px;flex-wrap:wrap">
                            <button class="btn btn-secondary" type="button" data-edit-teacher="${escapeHTML(teacher.id)}">
                              <i class="fa-solid fa-pen"></i> Modifier
                            </button>
                            ${canDeleteTeachers() ? `
                              <button class="btn btn-danger" type="button" data-delete-teacher="${escapeHTML(teacher.id)}">
                                <i class="fa-solid fa-trash"></i> Supprimer
                              </button>
                            ` : ""}
                          </div>
                        </td>
                      ` : ""}
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        ` : emptyState("fa-solid fa-chalkboard-user","Aucun enseignant","Ajoute le premier enseignant de ton établissement.")
      }
    </div>
  `);

  const addButton = getElement("add-teacher-btn");
  if (addButton) addButton.addEventListener("click", () => renderTeacherForm());
  document.querySelectorAll("[data-edit-teacher]").forEach(button => {
    button.addEventListener("click", () => {
      const teacher = state.teachers.find(item => String(item.id) === button.dataset.editTeacher);
      if (teacher) renderTeacherForm(teacher);
    });
  });
  document.querySelectorAll("[data-delete-teacher]").forEach(button => {
    button.addEventListener("click", () => deleteTeacher(button.dataset.deleteTeacher));
  });
}

function renderTeacherForm(existingTeacher = null) {
  if (!canManageTeachers()) return;
  const teacher = existingTeacher || {};
  const selectedSubject = teacher.subject_id || "";
  const subjectOptions = state.subjects.map(subject => {
    const id = String(subject.id);
    const label = subject.name || subject.title || "Matière";
    return `<option value="${escapeHTML(id)}" ${String(selectedSubject) === id ? "selected" : ""}>${escapeHTML(label)}</option>`;
  }).join("");

  setContent(`
    ${pageHeader(existingTeacher ? "Modifier un enseignant" : "Ajouter un enseignant","Renseigne les informations professionnelles.")}
    <div class="card" style="max-width:680px">
      <form id="teacher-form">
        <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">
          <div class="form-group">
            <label class="form-label" for="teacher-first-name">Prénom</label>
            <input class="app-input" id="teacher-first-name" name="first_name" maxlength="100" value="${escapeHTML(teacher.first_name || "")}" placeholder="Prénom">
          </div>
          <div class="form-group">
            <label class="form-label" for="teacher-last-name">Nom</label>
            <input class="app-input" id="teacher-last-name" name="last_name" maxlength="100" value="${escapeHTML(teacher.last_name || "")}" placeholder="Nom" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="teacher-email">Adresse e-mail</label>
            <input class="app-input" id="teacher-email" name="email" type="email" maxlength="180" value="${escapeHTML(teacher.email || "")}" placeholder="enseignant@exemple.com">
          </div>
          <div class="form-group">
            <label class="form-label" for="teacher-phone">Téléphone</label>
            <input class="app-input" id="teacher-phone" name="phone" maxlength="40" value="${escapeHTML(teacher.phone || "")}" placeholder="+243...">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label" for="teacher-subject">Matière principale</label>
            <select class="app-input" id="teacher-subject" name="subject_id">
              <option value="">Non attribuée</option>
              ${subjectOptions}
            </select>
          </div>
        </div>
        <p id="teacher-form-error" role="alert" style="display:none;color:var(--danger,#dc2626);margin-top:12px"></p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
          <button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> Enregistrer</button>
          <button class="btn btn-secondary" id="cancel-teacher" type="button">Annuler</button>
        </div>
      </form>
    </div>
  `);

  const form = getElement("teacher-form");
  if (form) form.addEventListener("submit", async event => {
    event.preventDefault();
    await saveTeacher(form, existingTeacher);
  });
  const cancel = getElement("cancel-teacher");
  if (cancel) cancel.addEventListener("click", renderTeachers);
}

async function saveTeacher(form, existingTeacher = null) {
  if (!canManageTeachers()) return;
  const formData = new FormData(form);
  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const subjectId = String(formData.get("subject_id") || "").trim();
  const errorBox = getElement("teacher-form-error");

  if (!lastName) {
    if (errorBox) {
      errorBox.textContent = "Le nom de l'enseignant est obligatoire.";
      errorBox.style.display = "block";
    }
    return;
  }

  const payload = {
    first_name: firstName || null,
    last_name: lastName,
    email: email || null,
    phone: phone || null,
    subject_id: subjectId || null
  };
  const schoolId = getCurrentSchoolId();
  if (schoolId) payload.school_id = schoolId;

  try {
    const supabase = getSupabase();
    const result = existingTeacher
      ? await supabase.from("teachers").update(payload).eq("id", existingTeacher.id)
      : await supabase.from("teachers").insert(payload);
    if (result.error) throw result.error;
    await loadData();
    renderTeachers();
  } catch (error) {
    console.error("Erreur enregistrement enseignant :", error);
    if (errorBox) {
      errorBox.textContent = error.message || "Impossible d'enregistrer l'enseignant. Vérifie les colonnes de la table teachers.";
      errorBox.style.display = "block";
    }
  }
}

async function deleteTeacher(teacherId) {
  if (!canDeleteTeachers()) return;
  if (!window.confirm("Supprimer cet enseignant ?")) return;
  try {
    const { error } = await getSupabase().from("teachers").delete().eq("id", teacherId);
    if (error) throw error;
    await loadData();
    renderTeachers();
  } catch (error) {
    console.error("Erreur suppression enseignant :", error);
    window.alert(error.message || "Impossible de supprimer cet enseignant.");
  }
}

/* =========================================================
   CLASSES
   ========================================================= */

function canManageClasses() {
  return isAdmin() || isDirection() || isSecretariat();
}

function canDeleteClasses() {
  return isAdmin() || isDirection();
}

function renderClasses() {
  const classes = filterBySchool(state.classes);
  const canManage = canManageClasses();

  setContent(`
    ${pageHeader(
      "Classes",
      "Création et organisation des classes scolaires.",
      canManage ? `
        <button class="btn btn-primary" id="add-class-button">
          <i class="fa-solid fa-plus"></i> Ajouter une classe
        </button>
      ` : ""
    )}

    <div id="class-form-container" style="margin-bottom:18px;"></div>

    <div class="cards-grid">
      ${
        classes.length
          ? classes.map(cls => `
              <div class="card">
                <div class="stat-icon">
                  <i class="fa-solid fa-school"></i>
                </div>
                <h3 style="font-family:'Space Grotesk',sans-serif;font-size:18px;margin-bottom:8px;">
                  ${escapeHTML(cls.name || cls.class_name || "Classe")}
                </h3>
                <p style="color:var(--muted);font-size:12px;">
                  ${cls.level ? `Niveau : ${escapeHTML(cls.level)}` : "Classe scolaire"}
                </p>
                ${canManage ? `
                  <div style="display:flex;gap:8px;margin-top:15px;">
                    <button class="btn" data-edit-class="${escapeHTML(cls.id)}">
                      <i class="fa-solid fa-pen"></i> Modifier
                    </button>
                    ${canDeleteClasses() ? `
                      <button class="btn btn-danger" data-delete-class="${escapeHTML(cls.id)}">
                        <i class="fa-solid fa-trash"></i> Supprimer
                      </button>
                    ` : ""}
                  </div>
                ` : ""}
              </div>
            `).join("")
          : `<div class="card" style="grid-column:1/-1;">${emptyState("fa-solid fa-school","Aucune classe","Ajoutez la première classe de votre établissement.")}</div>`
      }
    </div>
  `);

  const addButton = getElement("add-class-button");
  if (addButton) addButton.addEventListener("click", () => renderClassForm());

  document.querySelectorAll("[data-edit-class]").forEach(button => {
    button.addEventListener("click", () => {
      const cls = state.classes.find(item => String(item.id) === String(button.dataset.editClass));
      if (cls) renderClassForm(cls);
    });
  });

  document.querySelectorAll("[data-delete-class]").forEach(button => {
    button.addEventListener("click", () => deleteClass(button.dataset.deleteClass));
  });
}

function renderClassForm(existingClass = null) {
  if (!canManageClasses()) return;
  const container = getElement("class-form-container");
  if (!container) return;

  const editing = Boolean(existingClass);
  container.innerHTML = `
    <div class="card">
      <div class="modal-header">
        <div class="modal-title">${editing ? "Modifier la classe" : "Nouvelle classe"}</div>
        <button class="modal-close" id="close-class-form" type="button" aria-label="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <form id="class-form">
        <div class="form-grid">
          <div>
            <label class="form-label">Nom de la classe</label>
            <input class="app-input" name="name" required maxlength="100"
              value="${escapeHTML(existingClass?.name || existingClass?.class_name || "")}"
              placeholder="Ex. 1ère scientifique">
          </div>
          <div>
            <label class="form-label">Niveau / section</label>
            <input class="app-input" name="level" maxlength="100"
              value="${escapeHTML(existingClass?.level || "")}"
              placeholder="Ex. Secondaire">
          </div>
        </div>
        <div id="class-form-error" style="display:none;margin-top:12px;color:#ff91a0;"></div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
          <button type="button" class="btn" id="cancel-class-form">Annuler</button>
          <button type="submit" class="btn btn-primary">${editing ? "Enregistrer" : "Créer la classe"}</button>
        </div>
      </form>
    </div>
  `;

  ["close-class-form","cancel-class-form"].forEach(id => {
    const button = getElement(id);
    if (button) button.addEventListener("click", () => container.innerHTML = "");
  });

  const form = getElement("class-form");
  if (form) form.addEventListener("submit", async event => {
    event.preventDefault();
    await saveClass(form, existingClass);
  });
}

async function saveClass(form, existingClass = null) {
  if (!canManageClasses()) return;
  const supabase = getSupabase();
  const formData = new FormData(form);
  const className = String(formData.get("name") || "").trim();
  const level = String(formData.get("level") || "").trim();
  const errorBox = getElement("class-form-error");

  if (!className) {
    if (errorBox) {
      errorBox.textContent = "Le nom de la classe est obligatoire.";
      errorBox.style.display = "block";
    }
    return;
  }

  const sample = state.classes[0] || {};
  const nameColumn = Object.prototype.hasOwnProperty.call(sample, "class_name") &&
    !Object.prototype.hasOwnProperty.call(sample, "name") ? "class_name" : "name";
  const payload = { [nameColumn]: className, level: level || null };
  const schoolId = getCurrentSchoolId();
  if (schoolId) payload.school_id = schoolId;

  try {
    const result = existingClass
      ? await supabase.from("classes").update(payload).eq("id", existingClass.id)
      : await supabase.from("classes").insert(payload);

    if (result.error) throw result.error;
    await loadData();
    renderClasses();
  } catch (error) {
    console.error("Erreur enregistrement classe :", error);
    if (errorBox) {
      errorBox.textContent = error.message || "Impossible d'enregistrer la classe.";
      errorBox.style.display = "block";
    }
  }
}

async function deleteClass(classId) {
  if (!canDeleteClasses()) return;
  if (!window.confirm("Supprimer cette classe ? Les élèves déjà associés peuvent empêcher cette opération.")) return;

  try {
    const { error } = await getSupabase().from("classes").delete().eq("id", classId);
    if (error) throw error;
    await loadData();
    renderClasses();
  } catch (error) {
    console.error("Erreur suppression classe :", error);
    window.alert(error.message || "Impossible de supprimer cette classe.");
  }
}

/* =========================================================
   MATIÈRES
   ========================================================= */

function canManageSubjects() {
  return isAdmin() || isDirection() || isSecretariat();
}

function canDeleteSubjects() {
  return isAdmin() || isDirection();
}

function renderSubjects() {
  const subjects = filterBySchool(state.subjects);
  const canManage = canManageSubjects();

  setContent(`
    ${pageHeader(
      "Matières",
      "Gestion des matières enseignées dans l'établissement."
    )}

    ${canManage ? `
      <div style="display:flex;justify-content:flex-end;margin:0 0 16px">
        <button class="btn btn-primary" id="add-subject-btn" type="button">
          <i class="fa-solid fa-plus"></i> Ajouter une matière
        </button>
      </div>
    ` : ""}

    <div class="cards-grid">
      ${
        subjects.length
          ? subjects.map(subject => `
              <div class="card">
                <div class="stat-icon"><i class="fa-solid fa-book"></i></div>
                <h3 style="font-family:'Space Grotesk',sans-serif;font-size:17px">
                  ${escapeHTML(subject.name || subject.title || "Matière")}
                </h3>
                ${subject.description ? `
                  <p style="color:var(--muted);font-size:12px;line-height:1.5;margin-top:7px">
                    ${escapeHTML(subject.description)}
                  </p>
                ` : ""}
                ${canManage ? `
                  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
                    <button class="btn btn-secondary" type="button" data-edit-subject="${escapeHTML(subject.id)}">
                      <i class="fa-solid fa-pen"></i> Modifier
                    </button>
                    ${canDeleteSubjects() ? `
                      <button class="btn btn-danger" type="button" data-delete-subject="${escapeHTML(subject.id)}">
                        <i class="fa-solid fa-trash"></i> Supprimer
                      </button>
                    ` : ""}
                  </div>
                ` : ""}
              </div>
            `).join("")
          : `
            <div class="card" style="grid-column:1/-1">
              ${emptyState("fa-solid fa-book","Aucune matière","Aucune matière n'est actuellement disponible.")}
            </div>
          `
      }
    </div>
  `);

  const addButton = getElement("add-subject-btn");
  if (addButton) addButton.addEventListener("click", () => renderSubjectForm());

  document.querySelectorAll("[data-edit-subject]").forEach(button => {
    button.addEventListener("click", () => {
      const subject = state.subjects.find(item => String(item.id) === button.dataset.editSubject);
      if (subject) renderSubjectForm(subject);
    });
  });

  document.querySelectorAll("[data-delete-subject]").forEach(button => {
    button.addEventListener("click", () => deleteSubject(button.dataset.deleteSubject));
  });
}

function renderSubjectForm(existingSubject = null) {
  if (!canManageSubjects()) return;
  const subject = existingSubject || {};
  setContent(`
    ${pageHeader(existingSubject ? "Modifier une matière" : "Ajouter une matière","Renseigne les informations de la matière.")}
    <div class="card" style="max-width:620px">
      <form id="subject-form">
        <div class="form-group">
          <label class="form-label" for="subject-name">Nom de la matière</label>
          <input class="app-input" id="subject-name" name="name" required maxlength="120"
            value="${escapeHTML(subject.name || subject.title || "")}" placeholder="Ex. Mathématiques">
        </div>
        <div class="form-group" style="margin-top:14px">
          <label class="form-label" for="subject-description">Description (facultatif)</label>
          <textarea class="app-input" id="subject-description" name="description" rows="3"
            placeholder="Description de la matière">${escapeHTML(subject.description || "")}</textarea>
        </div>
        <p id="subject-form-error" role="alert" style="display:none;color:var(--danger,#dc2626);margin-top:12px"></p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
          <button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> Enregistrer</button>
          <button class="btn btn-secondary" id="cancel-subject" type="button">Annuler</button>
        </div>
      </form>
    </div>
  `);

  const form = getElement("subject-form");
  if (form) form.addEventListener("submit", async event => {
    event.preventDefault();
    await saveSubject(form, existingSubject);
  });
  const cancel = getElement("cancel-subject");
  if (cancel) cancel.addEventListener("click", renderSubjects);
}

async function saveSubject(form, existingSubject = null) {
  if (!canManageSubjects()) return;
  const supabase = getSupabase();
  const formData = new FormData(form);
  const subjectName = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const errorBox = getElement("subject-form-error");

  if (!subjectName) {
    if (errorBox) {
      errorBox.textContent = "Le nom de la matière est obligatoire.";
      errorBox.style.display = "block";
    }
    return;
  }

  const sample = state.subjects[0] || {};
  const nameColumn = Object.prototype.hasOwnProperty.call(sample, "title") &&
    !Object.prototype.hasOwnProperty.call(sample, "name") ? "title" : "name";
  const payload = { [nameColumn]: subjectName, description: description || null };
  const schoolId = getCurrentSchoolId();
  if (schoolId) payload.school_id = schoolId;

  try {
    const result = existingSubject
      ? await supabase.from("subjects").update(payload).eq("id", existingSubject.id)
      : await supabase.from("subjects").insert(payload);
    if (result.error) throw result.error;
    await loadData();
    renderSubjects();
  } catch (error) {
    console.error("Erreur enregistrement matière :", error);
    if (errorBox) {
      errorBox.textContent = error.message || "Impossible d'enregistrer la matière.";
      errorBox.style.display = "block";
    }
  }
}

async function deleteSubject(subjectId) {
  if (!canDeleteSubjects()) return;
  if (!window.confirm("Supprimer cette matière ?")) return;
  try {
    const { error } = await getSupabase().from("subjects").delete().eq("id", subjectId);
    if (error) throw error;
    await loadData();
    renderSubjects();
  } catch (error) {
    console.error("Erreur suppression matière :", error);
    window.alert(error.message || "Impossible de supprimer cette matière.");
  }
}

/* =========================================================
   PAIEMENTS
   ========================================================= */

function canManagePayments() {
  return isAdmin() || isDirection() || isSecretariat() || isGestion();
}

function getVisiblePayments() {
  const payments = filterBySchool(state.payments);
  if (canManagePayments()) return payments;
  const ids = new Set(getVisibleStudents().map(student => String(student.id)));
  return payments.filter(payment => ids.has(String(payment.student_id || "")));
}

function renderPayments() {
  const payments = getVisiblePayments();
  const students = getVisibleStudents();
  const canManage = canManagePayments();

  setContent(`
    ${pageHeader("Paiements","Suivi des frais et paiements scolaires.")}
    ${canManage ? `
      <div class="card" style="margin-bottom:18px">
        <h3 style="font-family:'Space Grotesk',sans-serif;margin-bottom:14px">Enregistrer un paiement</h3>
        ${students.length ? `
          <form id="payment-form">
            <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
              <div><label class="form-label" for="payment-student">Élève</label><select class="app-input" id="payment-student" name="student_id" required><option value="">Choisir un élève</option>${students.map(student => `<option value="${escapeHTML(student.id)}">${escapeHTML(getStudentLabel(student))}</option>`).join("")}</select></div>
              <div><label class="form-label" for="payment-amount">Montant</label><input class="app-input" id="payment-amount" name="amount" type="number" min="0.01" step="0.01" required></div>
              <div><label class="form-label" for="payment-currency">Devise</label><select class="app-input" id="payment-currency" name="currency"><option value="USD">USD</option><option value="CDF">CDF</option></select></div>
              <div><label class="form-label" for="payment-status">Statut</label><select class="app-input" id="payment-status" name="status"><option value="paid">Payé</option><option value="pending">En attente</option><option value="partial">Partiel</option></select></div>
            </div>
            <p id="payment-form-error" role="alert" style="display:none;color:#ff91a0;margin-top:10px"></p>
            <button class="btn btn-primary" type="submit" style="margin-top:14px"><i class="fa-solid fa-receipt"></i> Enregistrer le paiement</button>
          </form>
        ` : '<p style="color:var(--muted)">Aucun élève disponible.</p>'}
      </div>
    ` : ""}
    <div class="card">
      ${payments.length ? `
        <div class="table-container"><table>
          <thead><tr><th>Élève</th><th>Montant</th><th>Devise</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody>${payments.slice().sort((a,b) => String(b.created_at || b.date || "").localeCompare(String(a.created_at || a.date || ""))).map(payment => {
            const student = students.find(item => String(item.id) === String(payment.student_id));
            const status = String(payment.status || payment.statut || "").toLowerCase();
            const success = status.includes("paid") || status.includes("payé") || status.includes("complete");
            const label = payment.student_name || (student ? getStudentLabel(student) : payment.student_id || "—");
            return `<tr><td>${escapeHTML(label)}</td><td>${escapeHTML(payment.amount ?? "—")}</td><td>${escapeHTML(payment.currency || "—")}</td><td><span class="badge ${success ? "badge-success" : "badge-warning"}">${escapeHTML(payment.status || payment.statut || "—")}</span></td><td>${formatDate(payment.created_at || payment.date)}</td></tr>`;
          }).join("")}</tbody>
        </table></div>
      ` : emptyState("fa-solid fa-wallet","Aucun paiement","Les paiements autorisés pour votre compte apparaîtront ici.")}
    </div>
  `);

  const form = getElement("payment-form");
  if (form) form.addEventListener("submit", async event => {
    event.preventDefault();
    await savePayment(form);
  });
}

async function savePayment(form) {
  if (!canManagePayments()) return;
  const data = new FormData(form);
  const studentId = String(data.get("student_id") || "").trim();
  const amount = Number(data.get("amount"));
  const currency = String(data.get("currency") || "USD");
  const status = String(data.get("status") || "paid");
  const errorBox = getElement("payment-form-error");

  if (!studentId || !Number.isFinite(amount) || amount <= 0) {
    if (errorBox) {
      errorBox.textContent = "Sélectionnez un élève et saisissez un montant valide.";
      errorBox.style.display = "block";
    }
    return;
  }

  const payload = { student_id: studentId, amount, currency, status };
  const schoolId = getCurrentSchoolId();
  if (schoolId) payload.school_id = schoolId;

  try {
    const { error } = await getSupabase().from("payments").insert(payload);
    if (error) throw error;
    await loadData();
    renderPayments();
  } catch (error) {
    console.error("Erreur enregistrement paiement :", error);
    if (errorBox) {
      errorBox.textContent = error.message || "Impossible d'enregistrer ce paiement. Vérifiez les colonnes et les autorisations de la table payments.";
      errorBox.style.display = "block";
    }
  }
}

/* =========================================================
   PROFIL
   ========================================================= */

function renderProfile() {
  const profile =
    currentProfile ||
    currentUser?.profile ||
    {};

  const name =
    currentUser?.name ||
    currentUser?.fullName ||
    [
      profile.first_name,
      profile.last_name
    ]
      .filter(Boolean)
      .join(" ") ||
    currentUser?.email ||
    "Utilisateur";

  const role =
    currentUser?.roleLabel ||
    profile.role ||
    "Utilisateur";

  const initials =
    currentUser?.initials ||
    initialsFromName(name);

  setContent(`
    ${pageHeader(
      "Mon profil",
      "Informations de votre compte DALZON SHULE."
    )}

    <div class="card">

      <div style="
        display:flex;
        align-items:center;
        gap:18px;
        margin-bottom:25px;
      ">

        <div class="avatar"
          style="
            width:65px;
            height:65px;
            font-size:18px;
          "
        >
          ${escapeHTML(initials)}
        </div>

        <div>

          <h2 style="
            font-family:'Space Grotesk',sans-serif;
            font-size:22px;
          ">
            ${escapeHTML(name)}
          </h2>

          <p style="
            color:var(--muted);
            font-size:13px;
            margin-top:4px;
          ">
            ${escapeHTML(role)}
          </p>

        </div>

      </div>

      <div class="form-grid">

        <div>
          <div class="form-label">
            Email
          </div>

          <div class="app-input"
            style="
              display:flex;
              align-items:center;
            "
          >
            ${escapeHTML(
              currentUser?.email ||
              profile.email ||
              "—"
            )}
          </div>
        </div>

        <div>
          <div class="form-label">
            Matricule
          </div>

          <div class="app-input"
            style="
              display:flex;
              align-items:center;
            "
          >
            ${escapeHTML(
              currentUser?.matricule ||
              profile.matricule ||
              "—"
            )}
          </div>
        </div>

        <div>
          <div class="form-label">
            Rôle
          </div>

          <div class="app-input"
            style="
              display:flex;
              align-items:center;
            "
          >
            ${escapeHTML(role)}
          </div>
        </div>

        <div>
          <div class="form-label">
            Classe
          </div>

          <div class="app-input"
            style="
              display:flex;
              align-items:center;
            "
          >
            ${escapeHTML(
              currentUser?.className ||
              profile.class_name ||
              profile.class_id ||
              "—"
            )}
          </div>
        </div>

      </div>

    </div>
  `);
}

/* =========================================================
   NAVIGATION — ÉVÉNEMENTS
   ========================================================= */

function setupNavigation() {
  document
    .querySelectorAll("[data-route]")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();

          const route =
            button.dataset.route;

          if (
            route &&
            hasPermission(route)
          ) {
            navigate(route);
          }

        }
      );

    });
}

/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {
  document
    .querySelectorAll(
      '[data-action="logout"]'
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async event => {

          event.preventDefault();

          try {

            await window.DALZON_AUTH.logout();

          } catch (error) {

            console.error(
              "Erreur déconnexion:",
              error
            );

          }

        }
      );

    });
}

/* =========================================================
   MENU MOBILE
   ========================================================= */

function setupMobileMenu() {
  const mobileMenu =
    getElement("mobile-menu");

  const sidebar =
    getElement("sidebar");

  if (
    !mobileMenu ||
    !sidebar
  ) {
    return;
  }

  if (
    mobileMenu.dataset
      .dalzonReady === "true"
  ) {
    return;
  }

  mobileMenu.dataset
    .dalzonReady = "true";

  mobileMenu.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      sidebar.classList.toggle(
        "open"
      );

    }
  );

  document.addEventListener(
    "click",
    event => {

      if (
        window.innerWidth > 900
      ) {
        return;
      }

      if (
        !sidebar.contains(
          event.target
        ) &&
        !mobileMenu.contains(
          event.target
        )
      ) {
        sidebar.classList.remove(
          "open"
        );
      }

    }
  );
}

/* =========================================================
   INITIALISATION
   ========================================================= */

async function init(userFromLogin = null) {

  /*
   * Protection contre les doubles initialisations.
   */

  if (initialized) {

    if (userFromLogin) {
      currentUser =
        userFromLogin;

      currentProfile =
        userFromLogin.profile ||
        currentProfile;

      updateTopUser();
      applyRoutePermissions();

      navigate(
        currentRoute ||
        "dashboard"
      );
    }

    return;

  }

  try {

    /*
     * Si l'interface nous donne déjà
     * l'utilisateur connecté, on l'utilise.
     */

    if (userFromLogin) {

      currentUser =
        userFromLogin;

      currentProfile =
        userFromLogin.profile ||
        null;

    } else {

      const auth =
        await loadCurrentUser();

      if (!auth) {
        return;
      }

    }

    /*
     * Chargement des données.
     */

    await loadData();

    /*
     * Interface.
     */

    updateTopUser();

    applyRoutePermissions();

    setupNavigation();

    setupLogout();

    setupMobileMenu();

    initialized = true;

    navigate("dashboard");

    console.log(
      "DALZON SHULE : application initialisée."
    );

  } catch (error) {

    console.error(
      "DALZON SHULE : erreur initialisation application:",
      error
    );

    /*
     * Affichage d'une erreur dans l'application
     * au lieu de laisser une page complètement vide.
     */

    setContent(`
      <div class="card">

        <div style="
          display:flex;
          align-items:flex-start;
          gap:15px;
        ">

          <div class="stat-icon"
            style="
              background:rgba(255,93,115,.10);
              color:#ff7185;
            "
          >
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>

          <div>

            <h2 style="
              font-family:'Space Grotesk',sans-serif;
              font-size:19px;
              margin-bottom:7px;
            ">
              Erreur de chargement
            </h2>

            <p style="
              color:var(--muted);
              font-size:13px;
              line-height:1.6;
            ">
              L'application est connectée,
              mais certaines données n'ont pas pu être chargées.
            </p>

            <button
              class="btn btn-primary"
              id="retry-app"
              style="margin-top:16px;"
            >
              <i class="fa-solid fa-rotate"></i>
              Réessayer
            </button>

          </div>

        </div>

      </div>
    `);

    const retry =
      getElement("retry-app");

    if (retry) {
      retry.addEventListener(
        "click",
        () => {
          initialized = false;
          init(userFromLogin);
        }
      );
    }
  }
}

/* =========================================================
   EXPOSITION GLOBALE
   ========================================================= */

window.DALZON_APP = {
  init,
  navigate,
  renderDashboard,
  renderStudents,
  renderGrades,
  renderCourses,
  renderAttendance,
  renderDocuments,
  renderCalendar,
  renderTeachers,
  renderClasses,
  renderSubjects,
  renderPayments,
  renderProfile,
  loadData,
  state
};

/* =========================================================
   IMPORTANT :
   PAS DE DOMContentLoaded INIT ICI.
   
   index.html appelle déjà :
   window.DALZON_APP.init(user)
   
   Cela évite la double initialisation.
   ========================================================= */
