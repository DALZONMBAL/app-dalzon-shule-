/* =========================================================
   DALZON SHULE
   APP.JS
   Gestion de l'application + CRUD ÉLÈVES
   ========================================================= */

(function () {
  "use strict";

  let currentUser = null;
  let currentProfile = null;

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

  let currentStudentId = null;

  /* =======================================================
     SUPABASE
     ======================================================= */

  function getSupabase() {
    if (!window.DALZON_SUPABASE) {
      throw new Error(
        "Supabase n'est pas initialisé. Vérifie index.html."
      );
    }

    return window.DALZON_SUPABASE;
  }

  /* =======================================================
     UTILITAIRES
     ======================================================= */

  function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getElement(id) {
    return document.getElementById(id);
  }

  function showElement(id) {
    const el = getElement(id);
    if (el) el.style.display = "";
  }

  function hideElement(id) {
    const el = getElement(id);
    if (el) el.style.display = "none";
  }

  function normalizeRole(role) {
    return String(role || "").toLowerCase().trim();
  }

  function getRole() {
    return normalizeRole(
      currentProfile?.role ||
      currentUser?.role ||
      ""
    );
  }

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

  /* =======================================================
     LABELS
     ======================================================= */

  function getRoleLabel(role) {
    const labels = {
      admin: "Administrateur",
      direction: "Direction",
      secretariat: "Secrétariat",
      teacher: "Enseignant",
      student: "Élève",
      parent: "Parent",
      gestion: "Gestion"
    };

    return labels[normalizeRole(role)] || role || "Utilisateur";
  }

  function getStudentStatusLabel(status) {
    const labels = {
      active: "Actif",
      inactive: "Inactif",
      graduated: "Diplômé"
    };

    return labels[status] || status || "Actif";
  }

  /* =======================================================
     AUTHENTIFICATION
     ======================================================= */

  async function loadCurrentUser() {
    if (
      !window.DALZON_AUTH ||
      typeof window.DALZON_AUTH.getAuthenticatedUserAsync !== "function"
    ) {
      throw new Error(
        "DALZON_AUTH n'est pas disponible."
      );
    }

    const result =
      await window.DALZON_AUTH.getAuthenticatedUserAsync();

    if (!result) {
      currentUser = null;
      currentProfile = null;
      return null;
    }

    currentUser = result.user || result;
    currentProfile =
      result.profile ||
      result.user?.profile ||
      null;

    return result;
  }

  /* =======================================================
     CHARGEMENT DES DONNÉES
     ======================================================= */

  async function loadTable(tableName) {
    const supabase = getSupabase();

    const { data, error } = await supabase
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

    const results = await Promise.all(
      tables.map(table => loadTable(table))
    );

    tables.forEach((table, index) => {
      state[table] = results[index];
    });

    console.log("DALZON SHULE : données chargées", state);
  }

  /* =======================================================
     ÉCOLE COURANTE
     ======================================================= */

  function getCurrentSchoolId() {
    return (
      currentProfile?.school_id ||
      null
    );
  }

  function getCurrentSchool() {
    const schoolId = getCurrentSchoolId();

    if (!schoolId) return null;

    return (
      state.schools.find(
        school => school.id === schoolId
      ) || null
    );
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function getRouteElements() {
    return document.querySelectorAll(
      "[data-route]"
    );
  }

  function hideAllPages() {
    document
      .querySelectorAll(
        '[id^="page-"]'
      )
      .forEach(page => {
        page.style.display = "none";
      });
  }

  function navigate(route) {
    if (!route) return;

    const page = getElement(
      `page-${route}`
    );

    if (!page) {
      console.warn(
        "Page introuvable :",
        route
      );
      return;
    }

    hideAllPages();

    page.style.display = "";

    getRouteElements().forEach(item => {
      item.classList.toggle(
        "active",
        item.dataset.route === route
      );
    });

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

    const title = getElement("page-title");

    if (title) {
      title.textContent =
        titles[route] || "DALZON SHULE";
    }

    if (route === "students") {
      renderStudents();
    }

    if (route === "dashboard") {
      renderDashboard();
    }

    if (route === "grades") {
      renderGrades();
    }

    if (route === "courses") {
      renderCourses();
    }

    if (route === "attendance") {
      renderAttendance();
    }

    if (route === "documents") {
      renderDocuments();
    }

    if (route === "calendar") {
      renderCalendar();
    }

    if (route === "teachers") {
      renderTeachers();
    }

    if (route === "classes") {
      renderClasses();
    }

    if (route === "subjects") {
      renderSubjects();
    }

    if (route === "payments") {
      renderPayments();
    }

    if (route === "profile") {
      renderProfile();
    }
  }

  /* =======================================================
     PERMISSIONS DES ROUTES
     ======================================================= */

  function hasPermission(route) {
    if (isAdmin()) return true;

    if (isDirection()) return true;

    if (isSecretariat()) {
      return [
        "dashboard",
        "students",
        "classes",
        "documents",
        "calendar",
        "profile"
      ].includes(route);
    }

    if (isTeacher()) {
      return [
        "dashboard",
        "grades",
        "courses",
        "attendance",
        "documents",
        "calendar",
        "profile"
      ].includes(route);
    }

    if (isStudent()) {
      return [
        "dashboard",
        "grades",
        "courses",
        "attendance",
        "documents",
        "calendar",
        "profile"
      ].includes(route);
    }

    if (isParent()) {
      return [
        "dashboard",
        "grades",
        "courses",
        "attendance",
        "documents",
        "calendar",
        "profile"
      ].includes(route);
    }

    if (isGestion()) {
      return [
        "dashboard",
        "payments",
        "documents",
        "profile"
      ].includes(route);
    }

    return [
      "dashboard",
      "profile"
    ].includes(route);
  }

  function applyRoutePermissions() {
    getRouteElements().forEach(item => {
      const route = item.dataset.route;

      if (!route) return;

      item.style.display =
        hasPermission(route)
          ? ""
          : "none";
    });
  }

  /* =======================================================
     DASHBOARD
     ======================================================= */

  function renderDashboard() {
    const students = state.students.filter(
      student =>
        !getCurrentSchoolId() ||
        student.school_id === getCurrentSchoolId()
    );

    const teachers = state.teachers.filter(
      teacher =>
        !getCurrentSchoolId() ||
        teacher.school_id === getCurrentSchoolId()
    );

    const classes = state.classes.filter(
      item =>
        !getCurrentSchoolId() ||
        item.school_id === getCurrentSchoolId()
    );

    const subjects = state.subjects.filter(
      item =>
        !getCurrentSchoolId() ||
        item.school_id === getCurrentSchoolId()
    );

    const statStudents =
      getElement("stat-students");

    const statTeachers =
      getElement("stat-teachers");

    const statClasses =
      getElement("stat-classes");

    const statSubjects =
      getElement("stat-subjects");

    if (statStudents) {
      statStudents.textContent =
        students.length;
    }

    if (statTeachers) {
      statTeachers.textContent =
        teachers.length;
    }

    if (statClasses) {
      statClasses.textContent =
        classes.length;
    }

    if (statSubjects) {
      statSubjects.textContent =
        subjects.length;
    }

    const greeting =
      getElement("dashboard-greeting");

    if (greeting) {
      const name =
        currentProfile?.first_name ||
        currentUser?.email?.split("@")[0] ||
        "Utilisateur";

      greeting.textContent =
        `Bonjour ${name}`;
    }

    const summary =
      getElement("dashboard-user-summary");

    if (summary) {
      summary.textContent =
        `${getRoleLabel(getRole())}${
          getCurrentSchool()
            ? ` • ${getCurrentSchool().name}`
            : ""
        }`;
    }
  }

  /* =======================================================
     ÉLÈVES
     ======================================================= */

  function getSchoolStudents() {
    const schoolId =
      getCurrentSchoolId();

    return state.students.filter(
      student =>
        !schoolId ||
        student.school_id === schoolId
    );
  }

  function getClassName(classId) {
    const cls =
      state.classes.find(
        item => item.id === classId
      );

    return cls
      ? cls.name
      : "Non attribuée";
  }

  function renderStudents() {
    const container =
      getElement("students-container");

    if (!container) return;

    const students =
      getSchoolStudents();

    container.innerHTML = `
      <div class="dalzon-students-toolbar">
        <div class="dalzon-students-search">
          <input
            id="student-search"
            type="search"
            placeholder="Rechercher un élève..."
            autocomplete="off"
          >
        </div>

        ${
          canManageStudents()
            ? `
              <button
                type="button"
                class="dalzon-crud-btn"
                id="add-student-button"
              >
                <i class="fa-solid fa-plus"></i>
                <span>Ajouter un élève</span>
              </button>
            `
            : ""
        }
      </div>

      <div
        id="student-form-container"
        class="dalzon-student-form-container"
        style="display:none;"
      ></div>

      <div
        id="students-list"
        class="dalzon-students-list"
      ></div>
    `;

    const search =
      getElement("student-search");

    if (search) {
      search.addEventListener(
        "input",
        () => {
          renderStudentList(
            search.value
          );
        }
      );
    }

    const addButton =
      getElement("add-student-button");

    if (addButton) {
      addButton.addEventListener(
        "click",
        () => {
          openStudentForm();
        }
      );
    }

    renderStudentList("");
  }

  function renderStudentList(searchTerm) {
    const container =
      getElement("students-list");

    if (!container) return;

    const term =
      String(searchTerm || "")
        .toLowerCase()
        .trim();

    let students =
      getSchoolStudents();

    if (term) {
      students =
        students.filter(student => {
          const text = [
            student.first_name,
            student.last_name,
            student.matricule,
            student.parent_name,
            student.parent_phone,
            getClassName(student.class_id)
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(term);
        });
    }

    if (!students.length) {
      container.innerHTML = `
        <div class="dalzon-empty-state">
          <i class="fa-solid fa-user-graduate"></i>
          <p>Aucun élève trouvé.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="dalzon-table-wrapper">
        <table class="dalzon-data-table">
          <thead>
            <tr>
              <th>Élève</th>
              <th>Matricule</th>
              <th>Classe</th>
              <th>Statut</th>
              ${
                canManageStudents()
                  ? "<th>Actions</th>"
                  : ""
              }
            </tr>
          </thead>

          <tbody>
            ${students.map(student => `
              <tr>
                <td>
                  <div class="dalzon-student-name">
                    <strong>
                      ${escapeHTML(
                        `${student.first_name || ""} ${
                          student.last_name || ""
                        }`
                      )}
                    </strong>
                  </div>
                </td>

                <td>
                  ${escapeHTML(
                    student.matricule || "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    getClassName(
                      student.class_id
                    )
                  )}
                </td>

                <td>
                  <span class="dalzon-status ${
                    student.status || "active"
                  }">
                    ${escapeHTML(
                      getStudentStatusLabel(
                        student.status
                      )
                    )}
                  </span>
                </td>

                ${
                  canManageStudents()
                    ? `
                      <td>
                        <div class="dalzon-row-actions">

                          <button
                            type="button"
                            class="dalzon-action-btn"
                            data-edit-student="${student.id}"
                            title="Modifier"
                          >
                            <i class="fa-solid fa-pen"></i>
                          </button>

                          ${
                            canDeleteStudents()
                              ? `
                                <button
                                  type="button"
                                  class="dalzon-action-btn danger"
                                  data-delete-student="${student.id}"
                                  title="Désactiver"
                                >
                                  <i class="fa-solid fa-user-slash"></i>
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
            `).join("")}
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
            openStudentForm(
              button.dataset.editStudent
            );
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
          () => {
            deactivateStudent(
              button.dataset.deleteStudent
            );
          }
        );
      });
  }

  /* =======================================================
     FORMULAIRE ÉLÈVE
     ======================================================= */

  function openStudentForm(studentId = null) {
    if (!canManageStudents()) {
      showAppMessage(
        "Vous n'avez pas l'autorisation de gérer les élèves.",
        "error"
      );

      return;
    }

    currentStudentId =
      studentId || null;

    const container =
      getElement(
        "student-form-container"
      );

    if (!container) return;

    const student =
      studentId
        ? state.students.find(
            item => item.id === studentId
          )
        : null;

    const classes =
      state.classes.filter(
        cls =>
          !getCurrentSchoolId() ||
          cls.school_id === getCurrentSchoolId()
      );

    container.style.display = "";

    container.innerHTML = `
      <div class="dalzon-student-form">

        <div class="dalzon-form-header">

          <div>
            <h3>
              ${
                student
                  ? "Modifier l'élève"
                  : "Ajouter un élève"
              }
            </h3>

            <p>
              ${
                student
                  ? "Modifiez les informations de l'élève."
                  : "Enregistrez un nouvel élève dans votre école."
              }
            </p>
          </div>

          <button
            type="button"
            class="dalzon-close-form"
            id="close-student-form"
            title="Fermer"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

        </div>

        <form id="student-form">

          <div class="dalzon-form-grid">

            <div class="dalzon-field">
              <label for="student-first-name">
                Prénom
              </label>

              <input
                id="student-first-name"
                type="text"
                required
                value="${escapeHTML(
                  student?.first_name || ""
                )}"
              >
            </div>

            <div class="dalzon-field">
              <label for="student-last-name">
                Nom
              </label>

              <input
                id="student-last-name"
                type="text"
                required
                value="${escapeHTML(
                  student?.last_name || ""
                )}"
              >
            </div>

            <div class="dalzon-field">
              <label for="student-matricule">
                Matricule
              </label>

              <input
                id="student-matricule"
                type="text"
                required
                value="${escapeHTML(
                  student?.matricule || ""
                )}"
              >
            </div>

            <div class="dalzon-field">
              <label for="student-class">
                Classe
              </label>

              <select id="student-class">
                <option value="">
                  Sélectionner une classe
                </option>

                ${classes.map(cls => `
                  <option
                    value="${cls.id}"
                    ${
                      student?.class_id === cls.id
                        ? "selected"
                        : ""
                    }
                  >
                    ${escapeHTML(
                      cls.name
                    )}
                  </option>
                `).join("")}
              </select>
            </div>

            <div class="dalzon-field">
              <label for="student-dob">
                Date de naissance
              </label>

              <input
                id="student-dob"
                type="date"
                value="${escapeHTML(
                  student?.date_of_birth || ""
                )}"
              >
            </div>

            <div class="dalzon-field">
              <label for="student-gender">
                Sexe
              </label>

              <select id="student-gender">

                <option value="">
                  Sélectionner
                </option>

                <option
                  value="M"
                  ${
                    student?.gender === "M"
                      ? "selected"
                      : ""
                  }
                >
                  Masculin
                </option>

                <option
                  value="F"
                  ${
                    student?.gender === "F"
                      ? "selected"
                      : ""
                  }
                >
                  Féminin
                </option>

              </select>
            </div>

            <div class="dalzon-field">
              <label for="student-parent">
                Parent / Tuteur
              </label>

              <input
                id="student-parent"
                type="text"
                value="${escapeHTML(
                  student?.parent_name || ""
                )}"
              >
            </div>

            <div class="dalzon-field">
              <label for="student-parent-phone">
                Téléphone du parent
              </label>

              <input
                id="student-parent-phone"
                type="tel"
                value="${escapeHTML(
                  student?.parent_phone || ""
                )}"
              >
            </div>

            <div class="dalzon-field">
              <label for="student-status">
                Statut
              </label>

              <select id="student-status">

                <option
                  value="active"
                  ${
                    !student ||
                    student.status === "active"
                      ? "selected"
                      : ""
                  }
                >
                  Actif
                </option>

                <option
                  value="inactive"
                  ${
                    student?.status === "inactive"
                      ? "selected"
                      : ""
                  }
                >
                  Inactif
                </option>

                <option
                  value="graduated"
                  ${
                    student?.status === "graduated"
                      ? "selected"
                      : ""
                  }
                >
                  Diplômé
                </option>

              </select>
            </div>

          </div>

          <div
            id="student-form-error"
            class="dalzon-form-error"
            style="display:none;"
          ></div>

          <div class="dalzon-form-actions">

            <button
              type="button"
              class="dalzon-secondary-btn"
              id="cancel-student-form"
            >
              Annuler
            </button>

            <button
              type="submit"
              class="dalzon-primary-btn"
              id="save-student-button"
            >
              <i class="fa-solid fa-floppy-disk"></i>

              ${
                student
                  ? "Enregistrer les modifications"
                  : "Enregistrer l'élève"
              }
            </button>

          </div>

        </form>
      </div>
    `;

    const close =
      getElement(
        "close-student-form"
      );

    if (close) {
      close.addEventListener(
        "click",
        closeStudentForm
      );
    }

    const cancel =
      getElement(
        "cancel-student-form"
      );

    if (cancel) {
      cancel.addEventListener(
        "click",
        closeStudentForm
      );
    }

    const form =
      getElement("student-form");

    if (form) {
      form.addEventListener(
        "submit",
        saveStudent
      );
    }

    container.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function closeStudentForm() {
    const container =
      getElement(
        "student-form-container"
      );

    if (container) {
      container.style.display = "none";
      container.innerHTML = "";
    }

    currentStudentId = null;
  }

  /* =======================================================
     AJOUT / MODIFICATION ÉLÈVE
     ======================================================= */

  async function saveStudent(event) {
    event.preventDefault();

    if (!canManageStudents()) {
      showStudentFormError(
        "Vous n'avez pas l'autorisation d'effectuer cette action."
      );

      return;
    }

    const firstName =
      getElement("student-first-name")?.value.trim();

    const lastName =
      getElement("student-last-name")?.value.trim();

    const matricule =
      getElement("student-matricule")?.value.trim();

    const classId =
      getElement("student-class")?.value || null;

    const dateOfBirth =
      getElement("student-dob")?.value || null;

    const gender =
      getElement("student-gender")?.value || null;

    const parentName =
      getElement("student-parent")?.value.trim() || null;

    const parentPhone =
      getElement("student-parent-phone")?.value.trim() || null;

    const status =
      getElement("student-status")?.value || "active";

    if (!firstName || !lastName || !matricule) {
      showStudentFormError(
        "Le prénom, le nom et le matricule sont obligatoires."
      );

      return;
    }

    const schoolId =
      getCurrentSchoolId();

    if (!schoolId) {
      showStudentFormError(
        "Votre compte n'est associé à aucune école."
      );

      return;
    }

    const button =
      getElement(
        "save-student-button"
      );

    if (button) {
      button.disabled = true;

      button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Enregistrement...
      `;
    }

    const payload = {
      school_id: schoolId,
      first_name: firstName,
      last_name: lastName,
      matricule: matricule,
      class_id: classId,
      date_of_birth: dateOfBirth,
      gender: gender,
      parent_name: parentName,
      parent_phone: parentPhone,
      status: status
    };

    try {
      const supabase =
        getSupabase();

      let result;

      if (currentStudentId) {

        result =
          await supabase
            .from("students")
            .update(payload)
            .eq("id", currentStudentId)
            .select()
            .single();

      } else {

        result =
          await supabase
            .from("students")
            .insert(payload)
            .select()
            .single();

      }

      if (result.error) {
        console.error(
          "Erreur Supabase élève:",
          result.error
        );

        throw result.error;
      }

      await loadData();

      closeStudentForm();

      renderStudents();

      renderDashboard();

      showAppMessage(
        currentStudentId
          ? "Les informations de l'élève ont été modifiées."
          : "L'élève a été ajouté avec succès.",
        "success"
      );

      currentStudentId = null;

    } catch (error) {

      console.error(error);

      let message =
        "Une erreur est survenue.";

      if (
        error?.code === "23505"
      ) {
        message =
          "Ce matricule existe déjà.";
      }

      else if (
        error?.code === "42501"
      ) {
        message =
          "Supabase a refusé cette opération. Vérifiez les permissions RLS de votre compte.";
      }

      else if (
        error?.message
      ) {
        message =
          error.message;
      }

      showStudentFormError(
        message
      );

      if (button) {
        button.disabled = false;

        button.innerHTML = `
          <i class="fa-solid fa-floppy-disk"></i>
          ${
            currentStudentId
              ? "Enregistrer les modifications"
              : "Enregistrer l'élève"
          }
        `;
      }
    }
  }

  function showStudentFormError(message) {
    const error =
      getElement(
        "student-form-error"
      );

    if (!error) return;

    error.textContent =
      message;

    error.style.display = "";
  }

  /* =======================================================
     DÉSACTIVER ÉLÈVE
     ======================================================= */

  async function deactivateStudent(studentId) {
    if (!canDeleteStudents()) {
      showAppMessage(
        "Vous n'avez pas l'autorisation de désactiver les élèves.",
        "error"
      );

      return;
    }

    const student =
      state.students.find(
        item => item.id === studentId
      );

    if (!student) return;

    const confirmed =
      window.confirm(
        `Voulez-vous désactiver l'élève ${student.first_name || ""} ${student.last_name || ""} ?`
      );

    if (!confirmed) return;

    try {
      const supabase =
        getSupabase();

      const { error } =
        await supabase
          .from("students")
          .update({
            status: "inactive"
          })
          .eq("id", studentId);

      if (error) {
        throw error;
      }

      await loadData();

      renderStudents();

      renderDashboard();

      showAppMessage(
        "L'élève a été désactivé.",
        "success"
      );

    } catch (error) {

      console.error(error);

      showAppMessage(
        error?.message ||
        "Impossible de désactiver l'élève.",
        "error"
      );
    }
  }

  /* =======================================================
     MESSAGE GLOBAL
     ======================================================= */

  function showAppMessage(
    message,
    type = "success"
  ) {
    let box =
      getElement(
        "dalzon-app-message"
      );

    if (!box) {

      box =
        document.createElement(
          "div"
        );

      box.id =
        "dalzon-app-message";

      document.body.appendChild(
        box
      );
    }

    box.className =
      `dalzon-app-message ${type}`;

    box.innerHTML = `
      <i class="fa-solid ${
        type === "error"
          ? "fa-circle-exclamation"
          : "fa-circle-check"
      }"></i>

      <span>
        ${escapeHTML(message)}
      </span>
    `;

    box.style.display =
      "flex";

    clearTimeout(
      box._timeout
    );

    box._timeout =
      setTimeout(() => {
        box.style.display =
          "none";
      }, 4500);
  }

  /* =======================================================
     AUTRES PAGES
     ======================================================= */

  function renderGrades() {
    const container =
      getElement("grades-container");

    if (!container) return;

    if (!state.grades.length) {
      container.innerHTML = `
        <div class="dalzon-empty-state">
          <i class="fa-solid fa-chart-line"></i>
          <p>Aucune note disponible.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="dalzon-table-wrapper">
        <table class="dalzon-data-table">
          <thead>
            <tr>
              <th>Évaluation</th>
              <th>Note</th>
              <th>Année</th>
              <th>Période</th>
            </tr>
          </thead>

          <tbody>
            ${state.grades.map(grade => `
              <tr>
                <td>
                  ${escapeHTML(
                    grade.evaluation_name
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    grade.score
                  )}
                  /
                  ${escapeHTML(
                    grade.max_score || 20
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    grade.academic_year || "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    grade.term || "—"
                  )}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderCourses() {
    const container =
      getElement("courses-container");

    if (!container) return;

    if (!state.courses.length) {
      container.innerHTML = `
        <div class="dalzon-empty-state">
          <i class="fa-solid fa-book-open"></i>
          <p>Aucun cours disponible.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="dalzon-table-wrapper">
        <table class="dalzon-data-table">
          <thead>
            <tr>
              <th>Cours</th>
              <th>Salle</th>
              <th>Début</th>
              <th>Fin</th>
            </tr>
          </thead>

          <tbody>
            ${state.courses.map(course => `
              <tr>
                <td>
                  ${escapeHTML(
                    course.title
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    course.room || "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    course.start_time || "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    course.end_time || "—"
                  )}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderAttendance() {
    const container =
      getElement("attendance-container");

    if (!container) return;

    if (!state.attendance.length) {
      container.innerHTML = `
        <div class="dalzon-empty-state">
          <i class="fa-solid fa-calendar-check"></i>
          <p>Aucune présence enregistrée.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="dalzon-table-wrapper">
        <table class="dalzon-data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Statut</th>
              <th>Commentaire</th>
            </tr>
          </thead>

          <tbody>
            ${state.attendance.map(item => `
              <tr>
                <td>
                  ${escapeHTML(
                    item.attendance_date
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    item.status
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    item.comment || "—"
                  )}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderDocuments() {
    const container =
      getElement("documents-container");

    if (!container) return;

    if (!state.documents.length) {
      container.innerHTML = `
        <div class="dalzon-empty-state">
          <i class="fa-solid fa-file-lines"></i>
          <p>Aucun document disponible.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="dalzon-table-wrapper">
        <table class="dalzon-data-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Visibilité</th>
            </tr>
          </thead>

          <tbody>
            ${state.documents.map(doc => `
              <tr>
                <td>
                  ${escapeHTML(
                    doc.title
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    doc.file_type || "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    doc.visibility || "school"
                  )}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderCalendar() {
    const container =
      getElement("calendar-container");

    if (!container) return;

    if (!state.events.length) {
      container.innerHTML = `
        <div class="dalzon-empty-state">
          <i class="fa-solid fa-calendar"></i>
          <p>Aucun événement disponible.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="dalzon-table-wrapper">
        <table class="dalzon-data-table">
          <thead>
            <tr>
              <th>Événement</th>
              <th>Date</th>
              <th>Lieu</th>
            </tr>
          </thead>

          <tbody>
            ${state.events.map(event => `
              <tr>
                <td>
                  ${escapeHTML(
                    event.title
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    event.event_date
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    event.location || "—"
                  )}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderTeachers() {
    const container =
      getElement("teachers-container");

    if (!container) return;

    if (!state.teachers.length) {
      container.innerHTML = `
        <div class="dalzon-empty-state">
          <i class="fa-solid fa-chalkboard-user"></i>
          <p>Aucun enseignant disponible.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="dalzon-table-wrapper">
        <table class="dalzon-data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Matricule</th>
              <th>Spécialisation</th>
              <th>Statut</th>
            </tr>
          </thead>

          <tbody>
            ${state.teachers.map(teacher => `
              <tr>
                <td>
                  ${escapeHTML(
                    `${teacher.first_name || ""} ${
                      teacher.last_name || ""
                    }`
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    teacher.matricule || "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    teacher.specialization || "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    teacher.status || "active"
                  )}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderClasses() {
    const container =
      getElement("classes-container");

    if (!container) return;

    if (!state.classes.length) {
      container.innerHTML = `
        <div class="dalzon-empty-state">
          <i class="fa-solid fa-school"></i>
          <p>Aucune classe disponible.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="dalzon-table-wrapper">
        <table class="dalzon-data-table">
          <thead>
            <tr>
              <th>Classe</th>
              <th>Niveau</th>
              <th>Section</th>
              <th>Année</th>
            </tr>
          </thead>

          <tbody>
            ${state.classes.map(cls => `
              <tr>
                <td>
                  ${escapeHTML(
                    cls.name
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    cls.level || "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    cls.section || "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    cls.academic_year || "—"
                  )}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderSubjects() {
    const container =
      getElement("subjects-container");

    if (!container) return;

    if (!state.subjects.length) {
      container.innerHTML = `
        <div class="dalzon-empty-state">
          <i class="fa-solid fa-book"></i>
          <p>Aucune matière disponible.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="dalzon-table-wrapper">
        <table class="dalzon-data-table">
          <thead>
            <tr>
              <th>Matière</th>
              <th>Code</th>
              <th>Coefficient</th>
            </tr>
          </thead>

          <tbody>
            ${state.subjects.map(subject => `
              <tr>
                <td>
                  ${escapeHTML(
                    subject.name
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    subject.code || "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    subject.coefficient || 1
                  )}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderPayments() {
    const container =
      getElement("payments-container");

    if (!container) return;

    if (!state.payments.length) {
      container.innerHTML = `
        <div class="dalzon-empty-state">
          <i class="fa-solid fa-money-bill"></i>
          <p>Aucun paiement disponible.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="dalzon-table-wrapper">
        <table class="dalzon-data-table">
          <thead>
            <tr>
              <th>Montant</th>
              <th>Devise</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            ${state.payments.map(payment => `
              <tr>
                <td>
                  ${escapeHTML(
                    payment.amount
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    payment.currency || "USD"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    payment.payment_type || "—"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    payment.status || "pending"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    payment.payment_date || "—"
                  )}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  /* =======================================================
     PROFIL
     ======================================================= */

  function renderProfile() {
    const firstName =
      currentProfile?.first_name || "";

    const lastName =
      currentProfile?.last_name || "";

    const fullName =
      `${firstName} ${lastName}`.trim() ||
      currentUser?.email ||
      "Utilisateur";

    const avatar =
      getElement("profile-avatar");

    const name =
      getElement("profile-name");

    const roleTitle =
      getElement("profile-role-title");

    const email =
      getElement("profile-email");

    const matricule =
      getElement("profile-matricule");

    const roleValue =
      getElement("profile-role-value");

    const classValue =
      getElement("profile-class");

    if (avatar) {
      avatar.textContent =
        fullName
          .charAt(0)
          .toUpperCase();
    }

    if (name) {
      name.textContent =
        fullName;
    }

    if (roleTitle) {
      roleTitle.textContent =
        getRoleLabel(
          getRole()
        );
    }

    if (email) {
      email.textContent =
        currentProfile?.email ||
        currentUser?.email ||
        "—";
    }

    if (matricule) {
      matricule.textContent =
        currentProfile?.matricule ||
        "—";
    }

    if (roleValue) {
      roleValue.textContent =
        getRoleLabel(
          getRole()
        );
    }

    if (classValue) {
      const student =
        state.students.find(
          item =>
            item.profile_id ===
            currentUser?.id
        );

      classValue.textContent =
        student
          ? getClassName(
              student.class_id
            )
          : "—";
    }
  }

  /* =======================================================
     TOP BAR
     ======================================================= */

  function updateTopUser() {
    const name =
      getElement("top-user-name");

    const role =
      getElement("top-user-role");

    const avatar =
      getElement("top-avatar");

    const fullName =
      `${
        currentProfile?.first_name || ""
      } ${
        currentProfile?.last_name || ""
      }`.trim() ||
      currentUser?.email ||
      "Utilisateur";

    if (name) {
      name.textContent =
        fullName;
    }

    if (role) {
      role.textContent =
        getRoleLabel(
          getRole()
        );
    }

    if (avatar) {
      avatar.textContent =
        fullName
          .charAt(0)
          .toUpperCase();
    }
  }

  /* =======================================================
     LOGOUT
     ======================================================= */

  async function logout() {
    try {
      if (
        window.DALZON_AUTH &&
        typeof window.DALZON_AUTH.logout ===
          "function"
      ) {
        await window.DALZON_AUTH.logout();
      }
    } catch (error) {
      console.error(
        "Erreur logout:",
        error
      );
    }
  }

  /* =======================================================
     ÉVÉNEMENTS
     ======================================================= */

  function setupNavigation() {
    getRouteElements().forEach(item => {

      item.addEventListener(
        "click",
        event => {

          event.preventDefault();

          const route =
            item.dataset.route;

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

  function setupLogout() {
    document
      .querySelectorAll(
        '[data-action="logout"]'
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          event => {

            event.preventDefault();

            logout();

          }
        );

      });
  }

  function setupMobileMenu() {
    const sidebar =
      getElement("sidebar");

    if (!sidebar) return;

    document
      .querySelectorAll(
        '[data-action="menu"]'
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {
            sidebar.classList.toggle(
              "open"
            );
          }
        );

      });
  }

  /* =======================================================
     INITIALISATION
     ======================================================= */

  async function init() {
    try {

      const auth =
        await loadCurrentUser();

      if (!auth) {
        return;
      }

      await loadData();

      updateTopUser();

      applyRoutePermissions();

      setupNavigation();

      setupLogout();

      setupMobileMenu();

      renderDashboard();

      renderProfile();

      navigate("dashboard");

      console.log(
        "DALZON SHULE : application initialisée."
      );

    } catch (error) {

      console.error(
        "Erreur initialisation DALZON SHULE:",
        error
      );

    }
  }

  /* =======================================================
     RECHARGEMENT
     ======================================================= */

  async function reloadData() {
    await loadData();

    renderDashboard();

    renderProfile();

    const currentPage =
      document.querySelector(
        '[id^="page-"]:not([style*="display: none"])'
      );

    if (currentPage) {
      const route =
        currentPage.id.replace(
          "page-",
          ""
        );

      if (route === "students") {
        renderStudents();
      }
    }
  }

  /* =======================================================
     API PUBLIQUE
     ======================================================= */

  window.DALZON_APP = {

    init,

    navigate,

    reloadData,

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

    canManageStudents,

    canDeleteStudents,

    getCurrentUser: () => currentUser,

    getCurrentProfile: () =>
      currentProfile,

    getState: () =>
      state

  };

  /* =======================================================
     DÉMARRAGE
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }

})();
