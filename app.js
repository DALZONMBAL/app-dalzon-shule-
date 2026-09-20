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
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
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
      "gestion"
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
  const students =
    filterBySchool(
      state.students
    );

  const teachers =
    filterBySchool(
      state.teachers
    );

  const classes =
    filterBySchool(
      state.classes
    );

  const subjects =
    filterBySchool(
      state.subjects
    );

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

function renderGrades() {
  const grades =
    filterBySchool(
      state.grades
    );

  setContent(`
    ${pageHeader(
      "Notes",
      "Consultez les résultats scolaires et les évaluations."
    )}

    <div class="card">

      ${
        grades.length
          ? `
            <div class="table-container">

              <table>

                <thead>
                  <tr>
                    <th>Élève</th>
                    <th>Matière</th>
                    <th>Note</th>
                    <th>Coefficient</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>

                  ${grades
                    .map(grade => `
                      <tr>

                        <td>
                          ${escapeHTML(
                            grade.student_name ||
                            grade.student_id ||
                            "—"
                          )}
                        </td>

                        <td>
                          ${escapeHTML(
                            grade.subject_name ||
                            grade.subject_id ||
                            "—"
                          )}
                        </td>

                        <td>
                          <span class="badge">
                            ${escapeHTML(
                              grade.score ??
                              grade.note ??
                              "—"
                            )}
                          </span>
                        </td>

                        <td>
                          ${escapeHTML(
                            grade.coefficient ||
                            "—"
                          )}
                        </td>

                        <td>
                          ${formatDate(
                            grade.created_at ||
                            grade.date
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
              "fa-solid fa-graduation-cap",
              "Aucune note",
              "Aucune note n'est actuellement disponible."
            )
      }

    </div>
  `);
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

function renderAttendance() {
  const attendance =
    filterBySchool(
      state.attendance
    );

  setContent(`
    ${pageHeader(
      "Présences",
      "Suivi des présences et absences."
    )}

    <div class="card">

      ${
        attendance.length
          ? `
            <div class="table-container">

              <table>

                <thead>
                  <tr>
                    <th>Élève</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Observation</th>
                  </tr>
                </thead>

                <tbody>

                  ${attendance
                    .map(item => {

                      const status =
                        String(
                          item.status ||
                          item.statut ||
                          ""
                        ).toLowerCase();

                      let badge =
                        "badge";

                      if (
                        status.includes(
                          "present"
                        )
                      ) {
                        badge +=
                          " badge-success";
                      } else if (
                        status.includes(
                          "abs"
                        )
                      ) {
                        badge +=
                          " badge-danger";
                      } else {
                        badge +=
                          " badge-warning";
                      }

                      return `
                        <tr>

                          <td>
                            ${escapeHTML(
                              item.student_name ||
                              item.student_id ||
                              "—"
                            )}
                          </td>

                          <td>
                            ${formatDate(
                              item.date ||
                              item.created_at
                            )}
                          </td>

                          <td>
                            <span class="${badge}">
                              ${escapeHTML(
                                item.status ||
                                item.statut ||
                                "—"
                              )}
                            </span>
                          </td>

                          <td>
                            ${escapeHTML(
                              item.note ||
                              item.observation ||
                              "—"
                            )}
                          </td>

                        </tr>
                      `;
                    })
                    .join("")}

                </tbody>

              </table>

            </div>
          `
          : emptyState(
              "fa-solid fa-calendar-check",
              "Aucune présence",
              "Aucune donnée de présence n'est actuellement disponible."
            )
      }

    </div>
  `);
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

function renderTeachers() {
  const teachers =
    filterBySchool(
      state.teachers
    );

  setContent(`
    ${pageHeader(
      "Enseignants",
      "Liste des enseignants de l'établissement."
    )}

    <div class="card">

      ${
        teachers.length
          ? `
            <div class="table-container">

              <table>

                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Matière</th>
                  </tr>
                </thead>

                <tbody>

                  ${teachers
                    .map(teacher => `
                      <tr>

                        <td>
                          ${escapeHTML(
                            [
                              teacher.first_name,
                              teacher.last_name
                            ]
                              .filter(Boolean)
                              .join(" ") ||
                            teacher.name ||
                            "—"
                          )}
                        </td>

                        <td>
                          ${escapeHTML(
                            teacher.email ||
                            "—"
                          )}
                        </td>

                        <td>
                          ${escapeHTML(
                            teacher.phone ||
                            "—"
                          )}
                        </td>

                        <td>
                          ${escapeHTML(
                            teacher.subject_name ||
                            teacher.subject_id ||
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
              "fa-solid fa-chalkboard-user",
              "Aucun enseignant",
              "Aucun enseignant n'est actuellement disponible."
            )
      }

    </div>
  `);
}

/* =========================================================
   CLASSES
   ========================================================= */

function renderClasses() {
  const classes =
    filterBySchool(
      state.classes
    );

  setContent(`
    ${pageHeader(
      "Classes",
      "Classes et groupes scolaires."
    )}

    <div class="cards-grid">

      ${
        classes.length
          ? classes
              .map(cls => `
                <div class="card">

                  <div class="stat-icon">
                    <i class="fa-solid fa-school"></i>
                  </div>

                  <h3 style="
                    font-family:'Space Grotesk',sans-serif;
                    font-size:18px;
                    margin-bottom:8px;
                  ">
                    ${escapeHTML(
                      cls.name ||
                      cls.class_name ||
                      "Classe"
                    )}
                  </h3>

                  <p style="
                    color:var(--muted);
                    font-size:12px;
                  ">
                    ${
                      cls.level
                        ? `Niveau : ${escapeHTML(
                            cls.level
                          )}`
                        : "Classe scolaire"
                    }
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
                "fa-solid fa-school",
                "Aucune classe",
                "Aucune classe n'est actuellement disponible."
              )}
            </div>
          `
      }

    </div>
  `);
}

/* =========================================================
   MATIÈRES
   ========================================================= */

function renderSubjects() {
  const subjects =
    filterBySchool(
      state.subjects
    );

  setContent(`
    ${pageHeader(
      "Matières",
      "Matières enseignées dans l'établissement."
    )}

    <div class="cards-grid">

      ${
        subjects.length
          ? subjects
              .map(subject => `
                <div class="card">

                  <div class="stat-icon">
                    <i class="fa-solid fa-book"></i>
                  </div>

                  <h3 style="
                    font-family:'Space Grotesk',sans-serif;
                    font-size:17px;
                  ">
                    ${escapeHTML(
                      subject.name ||
                      subject.title ||
                      "Matière"
                    )}
                  </h3>

                  ${
                    subject.description
                      ? `
                        <p style="
                          color:var(--muted);
                          font-size:12px;
                          line-height:1.5;
                          margin-top:7px;
                        ">
                          ${escapeHTML(
                            subject.description
                          )}
                        </p>
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
                "fa-solid fa-book",
                "Aucune matière",
                "Aucune matière n'est actuellement disponible."
              )}
            </div>
          `
      }

    </div>
  `);
}

/* =========================================================
   PAIEMENTS
   ========================================================= */

function renderPayments() {
  const payments =
    filterBySchool(
      state.payments
    );

  setContent(`
    ${pageHeader(
      "Paiements",
      "Suivi des paiements scolaires."
    )}

    <div class="card">

      ${
        payments.length
          ? `
            <div class="table-container">

              <table>

                <thead>
                  <tr>
                    <th>Élève</th>
                    <th>Montant</th>
                    <th>Devise</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>

                  ${payments
                    .map(payment => {

                      const status =
                        String(
                          payment.status ||
                          payment.statut ||
                          ""
                        ).toLowerCase();

                      const success =
                        status.includes(
                          "paid"
                        ) ||
                        status.includes(
                          "payé"
                        ) ||
                        status.includes(
                          "complete"
                        );

                      return `
                        <tr>

                          <td>
                            ${escapeHTML(
                              payment.student_name ||
                              payment.student_id ||
                              "—"
                            )}
                          </td>

                          <td>
                            ${escapeHTML(
                              payment.amount ||
                              "—"
                            )}
                          </td>

                          <td>
                            ${escapeHTML(
                              payment.currency ||
                              "—"
                            )}
                          </td>

                          <td>
                            <span class="badge ${
                              success
                                ? "badge-success"
                                : "badge-warning"
                            }">
                              ${escapeHTML(
                                payment.status ||
                                payment.statut ||
                                "—"
                              )}
                            </span>
                          </td>

                          <td>
                            ${formatDate(
                              payment.created_at ||
                              payment.date
                            )}
                          </td>

                        </tr>
                      `;
                    })
                    .join("")}

                </tbody>

              </table>

            </div>
          `
          : emptyState(
              "fa-solid fa-wallet",
              "Aucun paiement",
              "Aucun paiement n'est actuellement enregistré."
            )
      }

    </div>
  `);
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
