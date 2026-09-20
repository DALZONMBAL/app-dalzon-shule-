/* =========================================================
   DALZON SHULE — app.js
   Logique principale de l'application
   ========================================================= */

(function () {
  "use strict";

  /* =======================================================
     CONFIGURATION
     ======================================================= */

  const APP = {
    name: "DALZON SHULE",
    version: "1.0.0"
  };

  let currentUser = null;
  let currentRoute = "dashboard";

  /* =======================================================
     OUTILS
     ======================================================= */

  function getDB() {
    return window.DALZON_DB || {};
  }

  function getAuth() {
    return window.DALZON_AUTH || {};
  }

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

  function firstDefined(...values) {
    return values.find(
      value => value !== undefined && value !== null
    );
  }

  function getArray(...names) {
    const db = getDB();

    for (const name of names) {
      if (Array.isArray(db[name])) {
        return db[name];
      }
    }

    return [];
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
      .map(word => word.charAt(0).toUpperCase())
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
              .map(header => `<th>${escapeHTML(header)}</th>`)
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
     UTILISATEUR CONNECTÉ
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
    ].some(value => role.includes(value));
  }

  function isTeacher() {
    const role = userRole();

    return [
      "enseignant",
      "professeur",
      "teacher"
    ].some(value => role.includes(value));
  }

  function isStudent() {
    const role = userRole();

    return [
      "élève",
      "eleve",
      "student"
    ].some(value => role.includes(value));
  }

  function isParent() {
    const role = userRole();

    return [
      "parent",
      "tuteur"
    ].some(value => role.includes(value));
  }

  /* =======================================================
     INITIALISATION
     ======================================================= */

  function init(user) {

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

    renderDashboard();

    navigate(
      getInitialRoute()
    );

    console.log(
      `${APP.name} ${APP.version} initialisé.`
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

    const user = getCurrentUser();

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
        "userId",
        "id"
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
      profileAvatar.textContent = userInitials;
    }

    if (profileName) {
      profileName.textContent = name;
    }

    if (profileRoleTitle) {
      profileRoleTitle.textContent = role;
    }

    if (profileEmail) {
      profileEmail.textContent = email;
    }

    if (profileMatricule) {
      profileMatricule.textContent = matricule;
    }

    if (profileRoleValue) {
      profileRoleValue.textContent = role;
    }

    if (profileClass) {
      profileClass.textContent = classe;
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
            this.getAttribute("data-route");

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
            .trim() || "dashboard";

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


    queryAll(".nav-item[data-route]")
      .forEach(item => {

        item.classList.toggle(
          "active",
          item.getAttribute("data-route") === route
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

    /*
     * Les pages principales sont accessibles
     * à tous les utilisateurs connectés.
     */

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


    /*
     * Administration.
     */

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
        item.getAttribute("data-route");

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

    const students =
      getArray(
        "students",
        "eleves",
        "studentsData"
      );

    const teachers =
      getArray(
        "teachers",
        "enseignants",
        "teachersData"
      );

    const classes =
      getArray(
        "classes",
        "classrooms",
        "classesData"
      );

    const subjects =
      getArray(
        "subjects",
        "matieres",
        "subjectsData"
      );

    const courses =
      getArray(
        "courses",
        "cours",
        "coursesData"
      );

    const documents =
      getArray(
        "documents",
        "docs",
        "documentsData"
      );

    const events =
      getArray(
        "events",
        "calendar",
        "eventsData"
      );


    setText(
      "stat-students",
      formatNumber(
        students.length
      )
    );

    setText(
      "stat-teachers",
      formatNumber(
        teachers.length
      )
    );

    setText(
      "stat-classes",
      formatNumber(
        classes.length
      )
    );

    setText(
      "stat-subjects",
      formatNumber(
        subjects.length
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


    const grades =
      getArray(
        "grades",
        "notes",
        "results"
      );


    const studentId =
      getValue(
        student,
        "id",
        "studentId",
        "matricule"
      );


    const studentGrades =
      grades.filter(grade => {

        const id =
          getValue(
            grade,
            "studentId",
            "studentId",
            "eleveId",
            "student"
          );

        return String(id) ===
          String(studentId);

      });


    const values =
      studentGrades
        .map(grade =>
          Number(
            getValue(
              grade,
              "value",
              "note",
              "score",
              "mark"
            )
          )
        )
        .filter(value =>
          !Number.isNaN(value)
        );


    const avg =
      average(values);


    const classValue =
      getValue(
        student,
        "className",
        "class",
        "classe"
      ) || "—";


    setText(
      "student-class",
      classValue
    );

    setText(
      "student-average",
      avg === null
        ? "—"
        : avg.toFixed(2)
    );


    const attendance =
      getArray(
        "attendance",
        "presences"
      );


    const studentAttendance =
      attendance.filter(item => {

        const id =
          getValue(
            item,
            "studentId",
            "eleveId",
            "student"
          );

        return String(id) ===
          String(studentId);

      });


    const present =
      studentAttendance.filter(item => {

        const status =
          String(
            getValue(
              item,
              "status",
              "etat"
            )
          ).toLowerCase();

        return (
          status === "present" ||
          status === "présent" ||
          status === "p"
        );

      }).length;


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


    const grades =
      getArray(
        "grades",
        "notes",
        "results"
      );


    const user =
      getCurrentUser();


    let visibleGrades =
      grades;


    if (
      isStudent() ||
      isParent()
    ) {

      const student =
        findStudentForUser(user);


      if (student) {

        const studentId =
          getValue(
            student,
            "id",
            "studentId",
            "matricule"
          );


        visibleGrades =
          grades.filter(item => {

            const id =
              getValue(
                item,
                "studentId",
                "eleveId",
                "student"
              );

            return String(id) ===
              String(studentId);

          });

      }

    }


    const rows =
      visibleGrades.map(grade => {

        const subject =
          getValue(
            grade,
            "subjectName",
            "subject",
            "matiere",
            "subjectId"
          ) || "—";


        const student =
          getValue(
            grade,
            "studentName",
            "student",
            "eleve"
          ) || "—";


        const evaluation =
          getValue(
            grade,
            "evaluation",
            "type",
            "title"
          ) || "Évaluation";


        const score =
          getValue(
            grade,
            "value",
            "note",
            "score",
            "mark"
          );


        const max =
          getValue(
            grade,
            "max",
            "outOf",
            "maximum"
          ) || 20;


        return `
          <tr>
            <td>${escapeHTML(student)}</td>
            <td>${escapeHTML(subject)}</td>
            <td>${escapeHTML(evaluation)}</td>
            <td>
              <span class="badge">
                ${escapeHTML(score)} / ${escapeHTML(max)}
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


    const courses =
      getArray(
        "courses",
        "cours",
        "coursesData"
      );


    if (!courses.length) {

      container.innerHTML =
        emptyHTML(
          "fa-book-open",
          "Aucun cours",
          "Aucun cours n'est disponible actuellement."
        );

      return;
    }


    container.innerHTML = `
      <div class="quick-grid">
        ${courses.map(course => {

          const title =
            getValue(
              course,
              "title",
              "name",
              "nom"
            ) || "Cours";


          const subject =
            getValue(
              course,
              "subjectName",
              "subject",
              "matiere"
            ) || "";


          const teacher =
            getValue(
              course,
              "teacherName",
              "teacher",
              "enseignant"
            ) || "";


          const date =
            getValue(
              course,
              "date",
              "createdAt"
            );


          return `
            <div class="quick-action">

              <i class="fa-solid fa-book-open"></i>

              <strong>
                ${escapeHTML(title)}
              </strong>

              <span>
                ${escapeHTML(subject)}
                ${teacher
                  ? " · " + escapeHTML(teacher)
                  : ""}
              </span>

              ${
                date
                  ? `<small style="color:#66758a;display:block;margin-top:5px;">
                      ${escapeHTML(formatDate(date))}
                    </small>`
                  : ""
              }

            </div>
          `;

        }).join("")}
      </div>
    `;
  }

  /* =======================================================
     PRESENCES
     ======================================================= */

  function renderAttendance() {

    const container =
      byId("attendance-container");

    if (!container) return;

    container.innerHTML =
      loadingHTML();


    const attendance =
      getArray(
        "attendance",
        "presences",
        "attendanceData"
      );


    let visible =
      attendance;


    if (isStudent()) {

      const student =
        findStudentForUser(
          getCurrentUser()
        );


      if (student) {

        const studentId =
          getValue(
            student,
            "id",
            "studentId",
            "matricule"
          );


        visible =
          attendance.filter(item => {

            const id =
              getValue(
                item,
                "studentId",
                "eleveId",
                "student"
              );

            return String(id) ===
              String(studentId);

          });

      }

    }


    const rows =
      visible.map(item => {

        const date =
          getValue(
            item,
            "date",
            "day"
          );


        const student =
          getValue(
            item,
            "studentName",
            "student",
            "eleve"
          ) || "—";


        const status =
          getValue(
            item,
            "status",
            "etat"
          ) || "—";


        const normalized =
          String(status)
            .toLowerCase();


        let badgeClass = "";

        if (
          normalized.includes("présent") ||
          normalized === "present" ||
          normalized === "p"
        ) {
          badgeClass = "green";
        }

        if (
          normalized.includes("absent")
        ) {
          badgeClass = "red";
        }

        if (
          normalized.includes("retard")
        ) {
          badgeClass = "orange";
        }


        return `
          <tr>

            <td>
              ${escapeHTML(
                formatDate(date)
              )}
            </td>

            <td>
              ${escapeHTML(student)}
            </td>

            <td>
              <span class="badge ${badgeClass}">
                ${escapeHTML(status)}
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


    const documents =
      getArray(
        "documents",
        "docs",
        "documentsData"
      );


    if (!documents.length) {

      container.innerHTML =
        emptyHTML(
          "fa-folder-open",
          "Aucun document",
          "Aucun document n'est disponible."
        );

      return;
    }


    const rows =
      documents.map(document => {

        const title =
          getValue(
            document,
            "title",
            "name",
            "nom"
          ) || "Document";


        const type =
          getValue(
            document,
            "type",
            "category",
            "categorie"
          ) || "Document";


        const date =
          getValue(
            document,
            "date",
            "createdAt"
          );


        const url =
          getValue(
            document,
            "url",
            "link",
            "href"
          );


        return `
          <tr>

            <td>
              <i class="fa-solid fa-file"></i>
              &nbsp;
              ${escapeHTML(title)}
            </td>

            <td>
              ${escapeHTML(type)}
            </td>

            <td>
              ${escapeHTML(
                formatDate(date)
              )}
            </td>

            <td>
              ${
                url
                  ? `<a
                      href="${escapeHTML(url)}"
                      target="_blank"
                      rel="noopener"
                      class="badge">
                      Ouvrir
                    </a>`
                  : `<span class="badge">
                      Disponible
                    </span>`
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


    const events =
      getArray(
        "events",
        "calendar",
        "eventsData"
      );


    if (!events.length) {

      container.innerHTML =
        emptyHTML(
          "fa-calendar-days",
          "Aucun événement",
          "Aucun événement scolaire n'est programmé."
        );

      return;
    }


    const sorted =
      [...events].sort(
        (a, b) =>
          new Date(
            getValue(a, "date", "start")
          ) -
          new Date(
            getValue(b, "date", "start")
          )
      );


    container.innerHTML = `
      <div style="display:grid;gap:10px;">

        ${sorted.map(event => {

          const title =
            getValue(
              event,
              "title",
              "name",
              "nom"
            ) || "Événement";


          const date =
            getValue(
              event,
              "date",
              "start"
            );


          const location =
            getValue(
              event,
              "location",
              "lieu"
            );


          const description =
            getValue(
              event,
              "description",
              "details"
            );


          return `
            <div
              class="quick-action"
              style="min-height:auto;">

              <i class="fa-solid fa-calendar-days"></i>

              <strong>
                ${escapeHTML(title)}
              </strong>

              <span>
                ${escapeHTML(
                  formatDate(date)
                )}

                ${
                  location
                    ? " · " +
                      escapeHTML(location)
                    : ""
                }
              </span>

              ${
                description
                  ? `<small
                      style="
                        display:block;
                        color:#68768a;
                        margin-top:7px;
                      ">
                      ${escapeHTML(description)}
                    </small>`
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


    const students =
      getArray(
        "students",
        "eleves",
        "studentsData"
      );


    const rows =
      students.map(student => {

        const name =
          getValue(
            student,
            "name",
            "fullName",
            "nom"
          ) || "—";


        const matricule =
          getValue(
            student,
            "matricule",
            "studentId",
            "id"
          ) || "—";


        const classe =
          getValue(
            student,
            "className",
            "class",
            "classe"
          ) || "—";


        const gender =
          getValue(
            student,
            "gender",
            "sexe"
          ) || "—";


        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(name)}
              </strong>
            </td>

            <td>
              ${escapeHTML(matricule)}
            </td>

            <td>
              ${escapeHTML(classe)}
            </td>

            <td>
              ${escapeHTML(gender)}
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


    const teachers =
      getArray(
        "teachers",
        "enseignants",
        "teachersData"
      );


    const rows =
      teachers.map(teacher => {

        const name =
          getValue(
            teacher,
            "name",
            "fullName",
            "nom"
          ) || "—";


        const matricule =
          getValue(
            teacher,
            "matricule",
            "teacherId",
            "id"
          ) || "—";


        const subject =
          getValue(
            teacher,
            "subjectName",
            "subject",
            "matiere"
          ) || "—";


        const email =
          getValue(
            teacher,
            "email",
            "mail"
          ) || "—";


        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(name)}
              </strong>
            </td>

            <td>
              ${escapeHTML(matricule)}
            </td>

            <td>
              ${escapeHTML(subject)}
            </td>

            <td>
              ${escapeHTML(email)}
            </td>

          </tr>
        `;

      });


    container.innerHTML =
      tableHTML(
        [
          "Nom",
          "Matricule",
          "Matière",
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


    const classes =
      getArray(
        "classes",
        "classrooms",
        "classesData"
      );


    const students =
      getArray(
        "students",
        "eleves"
      );


    const rows =
      classes.map(item => {

        const id =
          getValue(
            item,
            "id",
            "classId"
          );


        const name =
          getValue(
            item,
            "name",
            "className",
            "nom"
          ) || "—";


        const level =
          getValue(
            item,
            "level",
            "niveau",
            "section"
          ) || "—";


        const count =
          students.filter(student => {

            const classId =
              getValue(
                student,
                "classId"
              );


            const className =
              getValue(
                student,
                "className",
                "class",
                "classe"
              );


            return (
              (
                id &&
                String(classId) ===
                String(id)
              ) ||
              (
                className &&
                String(className) ===
                String(name)
              )
            );

          }).length;


        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(name)}
              </strong>
            </td>

            <td>
              ${escapeHTML(level)}
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


    const subjects =
      getArray(
        "subjects",
        "matieres",
        "subjectsData"
      );


    const rows =
      subjects.map(subject => {

        const name =
          getValue(
            subject,
            "name",
            "title",
            "nom"
          ) || "—";


        const code =
          getValue(
            subject,
            "code",
            "subjectCode"
          ) || "—";


        const teacher =
          getValue(
            subject,
            "teacherName",
            "teacher",
            "enseignant"
          ) || "—";


        const coefficient =
          getValue(
            subject,
            "coefficient",
            "coef"
          ) || "—";


        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(name)}
              </strong>
            </td>

            <td>
              ${escapeHTML(code)}
            </td>

            <td>
              ${escapeHTML(teacher)}
            </td>

            <td>
              ${escapeHTML(coefficient)}
            </td>

          </tr>
        `;

      });


    container.innerHTML =
      tableHTML(
        [
          "Matière",
          "Code",
          "Enseignant",
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


    const payments =
      getArray(
        "payments",
        "paiements",
        "fees",
        "transactions"
      );


    const rows =
      payments.map(payment => {

        const student =
          getValue(
            payment,
            "studentName",
            "student",
            "eleve"
          ) || "—";


        const description =
          getValue(
            payment,
            "description",
            "label",
            "motif"
          ) || "—";


        const amount =
          getValue(
            payment,
            "amount",
            "montant"
          );


        const currency =
          getValue(
            payment,
            "currency",
            "devise"
          ) || "CDF";


        const status =
          getValue(
            payment,
            "status",
            "etat"
          ) || "—";


        const date =
          getValue(
            payment,
            "date",
            "createdAt"
          );


        let badgeClass = "";

        const normalized =
          String(status)
            .toLowerCase();


        if (
          normalized.includes("pay") ||
          normalized.includes("valid")
        ) {
          badgeClass = "green";
        }

        if (
          normalized.includes("attente") ||
          normalized.includes("pending")
        ) {
          badgeClass = "orange";
        }

        if (
          normalized.includes("impay") ||
          normalized.includes("failed")
        ) {
          badgeClass = "red";
        }


        return `
          <tr>

            <td>
              ${escapeHTML(student)}
            </td>

            <td>
              ${escapeHTML(description)}
            </td>

            <td>
              ${escapeHTML(
                formatNumber(amount)
              )}
              ${escapeHTML(currency)}
            </td>

            <td>
              <span class="badge ${badgeClass}">
                ${escapeHTML(status)}
              </span>
            </td>

            <td>
              ${escapeHTML(
                formatDate(date)
              )}
            </td>

          </tr>
        `;

      });


    container.innerHTML =
      tableHTML(
        [
          "Élève",
          "Motif",
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
     RECHERCHE ÉLÈVES
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


        const students =
          getArray(
            "students",
            "eleves",
            "studentsData"
          );


        const filtered =
          students.filter(student => {

            const name =
              String(
                getValue(
                  student,
                  "name",
                  "fullName",
                  "nom"
                )
              ).toLowerCase();


            const matricule =
              String(
                getValue(
                  student,
                  "matricule",
                  "studentId",
                  "id"
                )
              ).toLowerCase();


            const classe =
              String(
                getValue(
                  student,
                  "className",
                  "class",
                  "classe"
                )
              ).toLowerCase();


            return (
              name.includes(search) ||
              matricule.includes(search) ||
              classe.includes(search)
            );

          });


        renderStudentRows(
          filtered
        );

      }
    );
  }


  function renderStudentRows(students) {

    const container =
      byId("students-container");

    if (!container) return;


    const rows =
      students.map(student => {

        const name =
          getValue(
            student,
            "name",
            "fullName",
            "nom"
          ) || "—";


        const matricule =
          getValue(
            student,
            "matricule",
            "studentId",
            "id"
          ) || "—";


        const classe =
          getValue(
            student,
            "className",
            "class",
            "classe"
          ) || "—";


        const gender =
          getValue(
            student,
            "gender",
            "sexe"
          ) || "—";


        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(name)}
              </strong>
            </td>

            <td>
              ${escapeHTML(matricule)}
            </td>

            <td>
              ${escapeHTML(classe)}
            </td>

            <td>
              ${escapeHTML(gender)}
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
     RECHERCHE D'UN ÉLÈVE
     ======================================================= */

  function findStudentForUser(user) {

    if (!user) {
      return null;
    }


    const students =
      getArray(
        "students",
        "eleves",
        "studentsData"
      );


    const userId =
      getValue(
        user,
        "studentId",
        "matricule",
        "id"
      );


    const email =
      String(
        getValue(
          user,
          "email",
          "mail"
        ) || ""
      ).toLowerCase();


    return students.find(student => {

      const studentId =
        getValue(
          student,
          "id",
          "studentId",
          "matricule"
        );


      const studentEmail =
        String(
          getValue(
            student,
            "email",
            "mail"
          ) || ""
        ).toLowerCase();


      return (
        (
          userId &&
          studentId &&
          String(userId) ===
          String(studentId)
        ) ||
        (
          email &&
          studentEmail &&
          email === studentEmail
        )
      );

    }) || null;
  }

  /* =======================================================
     MISE À JOUR DU TEXTE
     ======================================================= */

  function setText(id, value) {

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
     EXPORT PUBLIC
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

    renderProfile

  };

})();
