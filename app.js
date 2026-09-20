/* =========================================================
   DALZON SHULE — app.js
   Version Supabase
   ========================================================= */

(function () {
  "use strict";

  /* =======================================================
     CONFIGURATION
     ======================================================= */

  const APP = {
    name: "DALZON SHULE",
    version: "2.0.0"
  };

  let currentUser = null;
  let currentRoute = "dashboard";
  let DB = {
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

  /* =======================================================
     SUPABASE
     ======================================================= */

  function getSupabase() {
    return window.DALZON_SUPABASE || null;
  }

  function getAuth() {
    return window.DALZON_AUTH || {};
  }

  /* =======================================================
     OUTILS
     ======================================================= */

  function byId(id) {
    return document.getElementById(id);
  }

  function query(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function queryAll(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
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

  function arrayFrom(value) {
    return Array.isArray(value) ? value : [];
  }

  function getValue(object, ...keys) {
    if (!object) return "";

    for (const key of keys) {
      if (
        object[key] !== undefined &&
        object[key] !== null
      ) {
        return object[key];
      }
    }

    return "";
  }

  function initials(name) {
    return String(name || "DS")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word =>
        word.charAt(0).toUpperCase()
      )
      .join("") || "DS";
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

  function formatNumber(value) {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return value || "0";
    }

    return number.toLocaleString("fr-FR");
  }

  function average(values) {
    const numbers = arrayFrom(values)
      .map(Number)
      .filter(number => !Number.isNaN(number));

    if (!numbers.length) {
      return null;
    }

    return numbers.reduce(
      (sum, number) => sum + number,
      0
    ) / numbers.length;
  }

  function loadingHTML() {
    return `
      <div class="loading">
        <i class="fa-solid fa-spinner fa-spin"></i>
        Chargement...
      </div>
    `;
  }

  function emptyHTML(icon, title, text) {
    return `
      <div class="empty-state">
        <i class="fa-solid ${escapeHTML(icon || "fa-inbox")}"></i>
        <strong>${escapeHTML(title || "Aucune donnée")}</strong>
        <p>${escapeHTML(text || "")}</p>
      </div>
    `;
  }

  function tableHTML(headers, rows) {
    if (!rows.length) {
      return emptyHTML(
        "fa-database",
        "Aucune donnée",
        "Aucune information disponible pour le moment."
      );
    }

    return `
      <table class="data-table">
        <thead>
          <tr>
            ${headers
              .map(header =>
                `<th>${escapeHTML(header)}</th>`
              )
              .join("")}
          </tr>
        </thead>

        <tbody>
          ${rows.join("")}
        </tbody>
      </table>
    `;
  }

  /* =======================================================
     UTILISATEUR
     ======================================================= */

  function getCurrentUser() {
    if (currentUser) {
      return currentUser;
    }

    const auth = getAuth();

    try {
      if (
        typeof auth.getAuthenticatedUser ===
        "function"
      ) {
        currentUser =
          auth.getAuthenticatedUser() || null;
      }
    } catch (error) {
      console.warn(
        "Impossible de récupérer l'utilisateur :",
        error
      );
    }

    return currentUser;
  }

  function userRole() {
    const user = getCurrentUser();

    return String(
      getValue(
        user,
        "role",
        "type",
        "profil",
        "userRole"
      ) || ""
    ).toLowerCase();
  }

  function isAdmin() {
    const role = userRole();

    return [
      "admin",
      "administrateur",
      "direction",
      "superadmin"
    ].some(value =>
      role.includes(value)
    );
  }

  function isTeacher() {
    const role = userRole();

    return [
      "enseignant",
      "professeur",
      "teacher"
    ].some(value =>
      role.includes(value)
    );
  }

  function isStudent() {
    const role = userRole();

    return [
      "élève",
      "eleve",
      "student"
    ].some(value =>
      role.includes(value)
    );
  }

  function isParent() {
    const role = userRole();

    return [
      "parent",
      "tuteur"
    ].some(value =>
      role.includes(value)
    );
  }

  /* =======================================================
     CHARGEMENT SUPABASE
     ======================================================= */

  async function loadTable(tableName) {
    const supabase = getSupabase();

    if (!supabase) {
      console.error(
        "DALZON_SUPABASE n'est pas disponible."
      );

      return [];
    }

    try {
      const {
        data,
        error
      } = await supabase
        .from(tableName)
        .select("*");

      if (error) {
        console.error(
          `Erreur Supabase [${tableName}] :`,
          error
        );

        return [];
      }

      return Array.isArray(data)
        ? data
        : [];

    } catch (error) {
      console.error(
        `Erreur chargement ${tableName}:`,
        error
      );

      return [];
    }
  }

  async function loadDatabase() {

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
        tables.map(table =>
          loadTable(table)
        )
      );

    tables.forEach(
      (table, index) => {
        DB[table] =
          results[index] || [];
      }
    );

    buildRelations();

    console.log(
      "DALZON SHULE — données Supabase chargées",
      DB
    );
  }

  /* =======================================================
     RELATIONS / DONNÉES AFFICHABLES
     ======================================================= */

  function buildRelations() {

    /*
     * Classe des élèves
     */

    DB.students =
      DB.students.map(student => {

        const classe =
          DB.classes.find(
            item =>
              String(item.id) ===
              String(student.class_id)
          );

        const profile =
          DB.profiles.find(
            item =>
              String(item.id) ===
              String(student.profile_id)
          );

        return {
          ...student,

          name:
            `${student.first_name || ""} ${student.last_name || ""}`
              .trim(),

          fullName:
            `${student.first_name || ""} ${student.last_name || ""}`
              .trim(),

          className:
            classe?.name || "—",

          class:
            classe?.name || "—",

          classe:
            classe?.name || "—",

          email:
            profile?.email || "",

          profile
        };
      });


    /*
     * Enseignants
     */

    DB.teachers =
      DB.teachers.map(teacher => {

        const profile =
          DB.profiles.find(
            item =>
              String(item.id) ===
              String(teacher.profile_id)
          );

        return {
          ...teacher,

          name:
            `${teacher.first_name || ""} ${teacher.last_name || ""}`
              .trim(),

          fullName:
            `${teacher.first_name || ""} ${teacher.last_name || ""}`
              .trim(),

          email:
            profile?.email || "",

          profile
        };
      });


    /*
     * Cours
     */

    DB.courses =
      DB.courses.map(course => {

        const subject =
          DB.subjects.find(
            item =>
              String(item.id) ===
              String(course.subject_id)
          );

        const teacher =
          DB.teachers.find(
            item =>
              String(item.id) ===
              String(course.teacher_id)
          );

        const classe =
          DB.classes.find(
            item =>
              String(item.id) ===
              String(course.class_id)
          );

        return {
          ...course,

          subjectName:
            subject?.name || "—",

          subject:
            subject?.name || "—",

          teacherName:
            teacher?.name || "—",

          teacher:
            teacher?.name || "—",

          className:
            classe?.name || "—"
        };
      });


    /*
     * Notes
     */

    DB.grades =
      DB.grades.map(grade => {

        const student =
          DB.students.find(
            item =>
              String(item.id) ===
              String(grade.student_id)
          );

        const subject =
          DB.subjects.find(
            item =>
              String(item.id) ===
              String(grade.subject_id)
          );

        const teacher =
          DB.teachers.find(
            item =>
              String(item.id) ===
              String(grade.teacher_id)
          );

        return {
          ...grade,

          studentName:
            student?.name || "—",

          student:
            student?.name || "—",

          subjectName:
            subject?.name || "—",

          subject:
            subject?.name || "—",

          teacherName:
            teacher?.name || "—",

          evaluation:
            grade.evaluation_name,

          value:
            grade.score,

          note:
            grade.score,

          max:
            grade.max_score
        };
      });


    /*
     * Présences
     */

    DB.attendance =
      DB.attendance.map(item => {

        const student =
          DB.students.find(
            student =>
              String(student.id) ===
              String(item.student_id)
          );

        const course =
          DB.courses.find(
            course =>
              String(course.id) ===
              String(item.course_id)
          );

        return {
          ...item,

          studentName:
            student?.name || "—",

          student:
            student?.name || "—",

          date:
            item.attendance_date,

          courseName:
            course?.title || "—"
        };
      });


    /*
     * Documents
     */

    DB.documents =
      DB.documents.map(document => ({
        ...document,

        name:
          document.title,

        url:
          document.file_url,

        type:
          document.file_type || "Document",

        date:
          document.created_at
      }));


    /*
     * Événements
     */

    DB.events =
      DB.events.map(event => ({
        ...event,

        date:
          event.event_date,

        start:
          event.event_date,

        location:
          event.location
      }));


    /*
     * Paiements
     */

    DB.payments =
      DB.payments.map(payment => {

        const student =
          DB.students.find(
            student =>
              String(student.id) ===
              String(payment.student_id)
          );

        return {
          ...payment,

          studentName:
            student?.name || "—",

          student:
            student?.name || "—",

          amount:
            payment.amount,

          currency:
            payment.currency,

          date:
            payment.payment_date ||
            payment.created_at
        };
      });
  }

  /* =======================================================
     INITIALISATION
     ======================================================= */

  async function init(user) {

    currentUser =
      user ||
      getCurrentUser();

    if (!currentUser) {
      return;
    }

    updateUserUI();

    setupNavigation();

    setupSearch();

    setupQuickActions();

    applyRolePermissions();

    await loadDatabase();

    renderDashboard();

    navigate(
      getInitialRoute()
    );

    console.log(
      `${APP.name} ${APP.version} initialisé avec Supabase.`
    );
  }

  function getInitialRoute() {
    const hash =
      window.location.hash
        .replace("#", "")
        .trim();

    return hash || "dashboard";
  }

  /* =======================================================
     INTERFACE UTILISATEUR
     ======================================================= */

  function updateUserUI() {

    const user =
      getCurrentUser();

    if (!user) return;

    const name =
      getValue(
        user,
        "name",
        "fullName",
        "nom",
        "username"
      ) || "Utilisateur";

    const role =
      getValue(
        user,
        "role",
        "type",
        "profil"
      ) || "Utilisateur";

    const email =
      getValue(
        user,
        "email",
        "mail"
      ) || "—";

    const matricule =
      getValue(
        user,
        "matricule",
        "studentId",
        "userId"
      ) || "—";

    const classe =
      getValue(
        user,
        "className",
        "class",
        "classe"
      ) || "—";

    const userInitials =
      initials(name);

    const topName =
      byId("top-user-name");

    const topRole =
      byId("top-user-role");

    const topAvatar =
      byId("top-avatar");

    const profileAvatar =
      byId("profile-avatar");

    const profileName =
      byId("profile-name");

    const profileRoleTitle =
      byId("profile-role-title");

    const profileEmail =
      byId("profile-email");

    const profileMatricule =
      byId("profile-matricule");

    const profileRoleValue =
      byId("profile-role-value");

    const profileClass =
      byId("profile-class");

    const greeting =
      byId("dashboard-greeting");

    const summary =
      byId("dashboard-user-summary");

    if (topName) {
      topName.textContent = name;
    }

    if (topRole) {
      topRole.textContent = role;
    }

    if (topAvatar) {
      topAvatar.textContent = userInitials;
    }

    if (profileAvatar) {
      profileAvatar.textContent =
        userInitials;
    }

    if (profileName) {
      profileName.textContent = name;
    }

    if (profileRoleTitle) {
      profileRoleTitle.textContent =
        role;
    }

    if (profileEmail) {
      profileEmail.textContent = email;
    }

    if (profileMatricule) {
      profileMatricule.textContent =
        matricule;
    }

    if (profileRoleValue) {
      profileRoleValue.textContent =
        role;
    }

    if (profileClass) {
      profileClass.textContent =
        classe;
    }

    if (greeting) {
      greeting.textContent =
        `Bonjour ${name}`;
    }

    if (summary) {
      summary.textContent =
        `${name} · ${role}`;
    }
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function setupNavigation() {

    queryAll("[data-route]").forEach(button => {

      button.addEventListener(
        "click",
        function () {

          const route =
            this.getAttribute(
              "data-route"
            );

          if (route) {
            navigate(route);
          }
        }
      );
    });


    window.addEventListener(
      "hashchange",
      function () {

        const route =
          window.location.hash
            .replace("#", "")
            .trim() ||
          "dashboard";

        navigate(
          route,
          false
        );
      }
    );
  }


  function navigate(
    route,
    updateHash = true
  ) {

    const validRoutes = [
      "dashboard",
      "grades",
      "courses",
      "attendance",
      "documents",
      "calendar",
      "students",
      "teachers",
      "classes",
      "subjects",
      "payments",
      "profile"
    ];

    if (!validRoutes.includes(route)) {
      route = "dashboard";
    }

    if (!hasPermission(route)) {
      route = "dashboard";
    }

    currentRoute = route;

    if (updateHash) {
      try {
        history.replaceState(
          null,
          "",
          "#" + route
        );
      } catch (_) {
        window.location.hash =
          route;
      }
    }

    queryAll(".page").forEach(page => {
      page.classList.remove("active");
    });

    const page =
      byId(`page-${route}`);

    if (page) {
      page.classList.add("active");
    }

    queryAll(
      ".nav-item[data-route]"
    ).forEach(item => {

      item.classList.toggle(
        "active",
        item.getAttribute(
          "data-route"
        ) === route
      );
    });

    updatePageTitle(route);

    renderRoute(route);
  }


  function updatePageTitle(route) {

    const titles = {
      dashboard: "Tableau de bord",
      grades: "Notes & résultats",
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

    const title =
      byId("page-title");

    if (title) {
      title.textContent =
        titles[route] ||
        "DALZON SHULE";
    }
  }


  function renderRoute(route) {

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
    }
  }

  /* =======================================================
     PERMISSIONS
     ======================================================= */

  function hasPermission(route) {

    const role = userRole();

    if (
      [
        "dashboard",
        "grades",
        "courses",
        "attendance",
        "documents",
        "calendar",
        "profile"
      ].includes(route)
    ) {
      return true;
    }

    if (
      [
        "students",
        "teachers",
        "classes",
        "subjects",
        "payments"
      ].includes(route)
    ) {
      return (
        isAdmin() ||
        isTeacher() ||
        role.includes("secr") ||
        role.includes("gestion")
      );
    }

    return false;
  }


  function applyRolePermissions() {

    queryAll(
      ".nav-item[data-route]"
    ).forEach(item => {

      const route =
        item.getAttribute(
          "data-route"
        );

      if (
        route &&
        !hasPermission(route)
      ) {
        item.style.display =
          "none";
      }
    });
  }

  /* =======================================================
     DASHBOARD
     ======================================================= */

  function renderDashboard() {

    setText(
      "stat-students",
      formatNumber(
        DB.students.length
      )
    );

    setText(
      "stat-teachers",
      formatNumber(
        DB.teachers.length
      )
    );

    setText(
      "stat-classes",
      formatNumber(
        DB.classes.length
      )
    );

    setText(
      "stat-subjects",
      formatNumber(
        DB.subjects.length
      )
    );

    updateStudentDashboard();
  }


  function updateStudentDashboard() {

    const user =
      getCurrentUser();

    if (!user) return;

    const student =
      findStudentForUser(user);

    if (!student) {
      return;
    }

    const studentId =
      student.id;

    const studentGrades =
      DB.grades.filter(
        grade =>
          String(
            grade.student_id
          ) ===
          String(studentId)
      );

    const values =
      studentGrades
        .map(
          grade =>
            Number(grade.score)
        )
        .filter(
          value =>
            !Number.isNaN(value)
        );

    const avg =
      average(values);

    setText(
      "student-class",
      student.className || "—"
    );

    setText(
      "student-average",
      avg === null
        ? "—"
        : avg.toFixed(2)
    );

    const studentAttendance =
      DB.attendance.filter(
        item =>
          String(
            item.student_id
          ) ===
          String(studentId)
      );

    const present =
      studentAttendance.filter(
        item =>
          item.status ===
          "present"
      ).length;

    const attendanceRate =
      studentAttendance.length
        ? (
            present /
            studentAttendance.length
          ) * 100
        : null;

    setText(
      "student-attendance",
      attendanceRate === null
        ? "—"
        : `${attendanceRate.toFixed(0)}%`
    );
  }

  /* =======================================================
     NOTES
     ======================================================= */

  function renderGrades() {

    const container =
      byId("grades-container");

    if (!container) return;

    container.innerHTML =
      loadingHTML();

    let visibleGrades =
      [...DB.grades];

    const user =
      getCurrentUser();

    if (
      isStudent() ||
      isParent()
    ) {

      const student =
        findStudentForUser(user);

      if (student) {

        visibleGrades =
          DB.grades.filter(
            grade =>
              String(
                grade.student_id
              ) ===
              String(student.id)
          );
      }
    }

    const rows =
      visibleGrades.map(grade => {

        return `
          <tr>

            <td>
              ${escapeHTML(
                grade.studentName || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                grade.subjectName || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                grade.evaluation_name ||
                "Évaluation"
              )}
            </td>

            <td>
              <span class="badge">
                ${escapeHTML(
                  grade.score
                )}
                /
                ${escapeHTML(
                  grade.max_score || 20
                )}
              </span>
            </td>

          </tr>
        `;
      });

    container.innerHTML =
      tableHTML(
        [
          "Élève",
          "Matière",
          "Évaluation",
          "Note"
        ],
        rows
      );
  }

  /* =======================================================
     COURS
     ======================================================= */

  function renderCourses() {

    const container =
      byId("courses-container");

    if (!container) return;

    container.innerHTML =
      loadingHTML();

    if (!DB.courses.length) {

      container.innerHTML =
        emptyHTML(
          "fa-book-open",
          "Aucun cours",
          "Aucun cours n'est disponible actuellement."
        );

      return;
    }

    let courses =
      [...DB.courses];

    const user =
      getCurrentUser();

    if (isStudent()) {

      const student =
        findStudentForUser(user);

      if (student) {

        courses =
          courses.filter(
            course =>
              String(
                course.class_id
              ) ===
              String(
                student.class_id
              )
          );
      }
    }

    if (isTeacher()) {

      const teacher =
        DB.teachers.find(
          item =>
            String(
              item.profile_id
            ) ===
            String(user?.id)
        );

      if (teacher) {

        courses =
          courses.filter(
            course =>
              String(
                course.teacher_id
              ) ===
              String(teacher.id)
          );
      }
    }

    container.innerHTML = `
      <div class="quick-grid">

        ${courses.map(course => {

          return `
            <div class="quick-action">

              <i class="fa-solid fa-book-open"></i>

              <strong>
                ${escapeHTML(
                  course.title || "Cours"
                )}
              </strong>

              <span>
                ${escapeHTML(
                  course.subjectName || ""
                )}

                ${
                  course.teacherName
                    ? " · " +
                      escapeHTML(
                        course.teacherName
                      )
                    : ""
                }
              </span>

              ${
                course.start_time
                  ? `
                    <small
                      style="
                        color:#66758a;
                        display:block;
                        margin-top:5px;
                      ">
                      ${escapeHTML(
                        formatDate(
                          course.start_time
                        )
                      )}
                    </small>
                  `
                  : ""
              }

            </div>
          `;

        }).join("")}

      </div>
    `;
  }

  /* =======================================================
     PRÉSENCES
     ======================================================= */

  function renderAttendance() {

    const container =
      byId("attendance-container");

    if (!container) return;

    container.innerHTML =
      loadingHTML();

    let visible =
      [...DB.attendance];

    if (isStudent()) {

      const student =
        findStudentForUser(
          getCurrentUser()
        );

      if (student) {

        visible =
          visible.filter(
            item =>
              String(
                item.student_id
              ) ===
              String(student.id)
          );
      }
    }

    const rows =
      visible.map(item => {

        let badgeClass = "";

        if (
          item.status ===
          "present"
        ) {
          badgeClass = "green";
        }

        if (
          item.status ===
          "absent"
        ) {
          badgeClass = "red";
        }

        if (
          item.status ===
          "late"
        ) {
          badgeClass = "orange";
        }

        return `
          <tr>

            <td>
              ${escapeHTML(
                formatDate(
                  item.attendance_date
                )
              )}
            </td>

            <td>
              ${escapeHTML(
                item.studentName || "—"
              )}
            </td>

            <td>
              <span class="badge ${badgeClass}">
                ${escapeHTML(
                  item.status || "—"
                )}
              </span>
            </td>

          </tr>
        `;
      });

    container.innerHTML =
      tableHTML(
        [
          "Date",
          "Élève",
          "Statut"
        ],
        rows
      );
  }

  /* =======================================================
     DOCUMENTS
     ======================================================= */

  function renderDocuments() {

    const container =
      byId("documents-container");

    if (!container) return;

    container.innerHTML =
      loadingHTML();

    if (!DB.documents.length) {

      container.innerHTML =
        emptyHTML(
          "fa-folder-open",
          "Aucun document",
          "Aucun document n'est disponible."
        );

      return;
    }

    const rows =
      DB.documents.map(document => {

        return `
          <tr>

            <td>
              <i class="fa-solid fa-file"></i>
              &nbsp;
              ${escapeHTML(
                document.title
              )}
            </td>

            <td>
              ${escapeHTML(
                document.file_type ||
                "Document"
              )}
            </td>

            <td>
              ${escapeHTML(
                formatDate(
                  document.created_at
                )
              )}
            </td>

            <td>

              ${
                document.file_url
                  ? `
                    <a
                      href="${escapeHTML(
                        document.file_url
                      )}"
                      target="_blank"
                      rel="noopener"
                      class="badge">
                      Ouvrir
                    </a>
                  `
                  : `
                    <span class="badge">
                      Disponible
                    </span>
                  `
              }

            </td>

          </tr>
        `;
      });

    container.innerHTML =
      tableHTML(
        [
          "Document",
          "Type",
          "Date",
          "Accès"
        ],
        rows
      );
  }

  /* =======================================================
     CALENDRIER
     ======================================================= */

  function renderCalendar() {

    const container =
      byId("calendar-container");

    if (!container) return;

    container.innerHTML =
      loadingHTML();

    if (!DB.events.length) {

      container.innerHTML =
        emptyHTML(
          "fa-calendar-days",
          "Aucun événement",
          "Aucun événement scolaire n'est programmé."
        );

      return;
    }

    const sorted =
      [...DB.events].sort(
        (a, b) =>
          new Date(
            a.event_date
          ) -
          new Date(
            b.event_date
          )
      );

    container.innerHTML = `
      <div
        style="
          display:grid;
          gap:10px;
        ">

        ${sorted.map(event => {

          return `
            <div
              class="quick-action"
              style="min-height:auto;">

              <i class="fa-solid fa-calendar-days"></i>

              <strong>
                ${escapeHTML(
                  event.title ||
                  "Événement"
                )}
              </strong>

              <span>

                ${escapeHTML(
                  formatDate(
                    event.event_date
                  )
                )}

                ${
                  event.location
                    ? " · " +
                      escapeHTML(
                        event.location
                      )
                    : ""
                }

              </span>

              ${
                event.description
                  ? `
                    <small
                      style="
                        display:block;
                        color:#68768a;
                        margin-top:7px;
                      ">
                      ${escapeHTML(
                        event.description
                      )}
                    </small>
                  `
                  : ""
              }

            </div>
          `;

        }).join("")}

      </div>
    `;
  }

  /* =======================================================
     ÉLÈVES
     ======================================================= */

  function renderStudents() {

    const container =
      byId("students-container");

    if (!container) return;

    container.innerHTML =
      loadingHTML();

    const rows =
      DB.students.map(student => {

        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(
                  student.name || "—"
                )}
              </strong>
            </td>

            <td>
              ${escapeHTML(
                student.matricule || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                student.className || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                student.gender || "—"
              )}
            </td>

          </tr>
        `;
      });

    container.innerHTML =
      tableHTML(
        [
          "Nom",
          "Matricule",
          "Classe",
          "Sexe"
        ],
        rows
      );
  }

  /* =======================================================
     ENSEIGNANTS
     ======================================================= */

  function renderTeachers() {

    const container =
      byId("teachers-container");

    if (!container) return;

    container.innerHTML =
      loadingHTML();

    const rows =
      DB.teachers.map(teacher => {

        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(
                  teacher.name || "—"
                )}
              </strong>
            </td>

            <td>
              ${escapeHTML(
                teacher.matricule || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                teacher.specialization ||
                "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                teacher.email || "—"
              )}
            </td>

          </tr>
        `;
      });

    container.innerHTML =
      tableHTML(
        [
          "Nom",
          "Matricule",
          "Spécialisation",
          "Email"
        ],
        rows
      );
  }

  /* =======================================================
     CLASSES
     ======================================================= */

  function renderClasses() {

    const container =
      byId("classes-container");

    if (!container) return;

    container.innerHTML =
      loadingHTML();

    const rows =
      DB.classes.map(item => {

        const count =
          DB.students.filter(
            student =>
              String(
                student.class_id
              ) ===
              String(item.id)
          ).length;

        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(
                  item.name || "—"
                )}
              </strong>
            </td>

            <td>
              ${escapeHTML(
                item.level ||
                item.section ||
                "—"
              )}
            </td>

            <td>
              <span class="badge">
                ${formatNumber(count)}
              </span>
            </td>

          </tr>
        `;
      });

    container.innerHTML =
      tableHTML(
        [
          "Classe",
          "Niveau",
          "Élèves"
        ],
        rows
      );
  }

  /* =======================================================
     MATIÈRES
     ======================================================= */

  function renderSubjects() {

    const container =
      byId("subjects-container");

    if (!container) return;

    container.innerHTML =
      loadingHTML();

    const rows =
      DB.subjects.map(subject => {

        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(
                  subject.name || "—"
                )}
              </strong>
            </td>

            <td>
              ${escapeHTML(
                subject.code || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                subject.coefficient ??
                "—"
              )}
            </td>

          </tr>
        `;
      });

    container.innerHTML =
      tableHTML(
        [
          "Matière",
          "Code",
          "Coefficient"
        ],
        rows
      );
  }

  /* =======================================================
     PAIEMENTS
     ======================================================= */

  function renderPayments() {

    const container =
      byId("payments-container");

    if (!container) return;

    container.innerHTML =
      loadingHTML();

    let visible =
      [...DB.payments];

    if (isStudent()) {

      const student =
        findStudentForUser(
          getCurrentUser()
        );

      if (student) {

        visible =
          visible.filter(
            payment =>
              String(
                payment.student_id
              ) ===
              String(student.id)
          );
      }
    }

    const rows =
      visible.map(payment => {

        let badgeClass = "";

        if (
          payment.status ===
          "paid"
        ) {
          badgeClass = "green";
        }

        if (
          payment.status ===
          "pending"
        ) {
          badgeClass = "orange";
        }

        if (
          payment.status ===
          "cancelled"
        ) {
          badgeClass = "red";
        }

        return `
          <tr>

            <td>
              ${escapeHTML(
                payment.studentName ||
                "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                payment.payment_type ||
                "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                formatNumber(
                  payment.amount
                )
              )}
              ${escapeHTML(
                payment.currency ||
                "USD"
              )}
            </td>

            <td>
              <span
                class="badge ${badgeClass}">
                ${escapeHTML(
                  payment.status ||
                  "—"
                )}
              </span>
            </td>

            <td>
              ${escapeHTML(
                formatDate(
                  payment.payment_date
                )
              )}
            </td>

          </tr>
        `;
      });

    container.innerHTML =
      tableHTML(
        [
          "Élève",
          "Type",
          "Montant",
          "Statut",
          "Date"
        ],
        rows
      );
  }

  /* =======================================================
     PROFIL
     ======================================================= */

  function renderProfile() {
    updateUserUI();
  }

  /* =======================================================
     RECHERCHE
     ======================================================= */

  function setupSearch() {

    const input =
      byId("student-search");

    if (!input) return;

    input.addEventListener(
      "input",
      function () {

        const search =
          this.value
            .trim()
            .toLowerCase();

        const filtered =
          DB.students.filter(
            student => {

              const name =
                String(
                  student.name || ""
                ).toLowerCase();

              const matricule =
                String(
                  student.matricule || ""
                ).toLowerCase();

              const classe =
                String(
                  student.className || ""
                ).toLowerCase();

              return (
                name.includes(search) ||
                matricule.includes(search) ||
                classe.includes(search)
              );
            }
          );

        renderStudentRows(
          filtered
        );
      }
    );
  }


  function renderStudentRows(
    students
  ) {

    const container =
      byId("students-container");

    if (!container) return;

    const rows =
      students.map(student => {

        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(
                  student.name || "—"
                )}
              </strong>
            </td>

            <td>
              ${escapeHTML(
                student.matricule || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                student.className || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                student.gender || "—"
              )}
            </td>

          </tr>
        `;
      });

    container.innerHTML =
      tableHTML(
        [
          "Nom",
          "Matricule",
          "Classe",
          "Sexe"
        ],
        rows
      );
  }

  /* =======================================================
     ACTIONS RAPIDES
     ======================================================= */

  function setupQuickActions() {

    queryAll(
      ".quick-action[data-route]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        function () {

          const route =
            this.getAttribute(
              "data-route"
            );

          if (route) {
            navigate(route);
          }
        }
      );
    });
  }

  /* =======================================================
     RECHERCHE ÉLÈVE CONNECTÉ
     ======================================================= */

  function findStudentForUser(user) {

    if (!user) {
      return null;
    }

    const matricule =
      getValue(
        user,
        "matricule"
      );

    const profileId =
      getValue(
        user,
        "id",
        "authUserId"
      );

    return DB.students.find(
      student => {

        return (
          (
            matricule &&
            String(
              student.matricule
            ) ===
            String(matricule)
          ) ||
          (
            profileId &&
            String(
              student.profile_id
            ) ===
            String(profileId)
          )
        );
      }
    ) || null;
  }

  /* =======================================================
     TEXTE
     ======================================================= */

  function setText(
    id,
    value
  ) {

    const element =
      byId(id);

    if (element) {
      element.textContent =
        value === undefined ||
        value === null
          ? "—"
          : value;
    }
  }

  /* =======================================================
     EXPORT
     ======================================================= */

  window.DALZON_APP = {

    init,

    navigate,

    getCurrentUser,

    renderDashboard,

    renderGrades,

    renderCourses,

    renderAttendance,

    renderDocuments,

    renderCalendar,

    renderStudents,

    renderTeachers,

    renderClasses,

    renderSubjects,

    renderPayments,

    renderProfile,

    reloadData: loadDatabase

  };

})();
