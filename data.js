/* =========================================================
   DALZON SHULE — DATA.JS
   Couche de données locale / prototype
   Version : 1.0
   ========================================================= */

"use strict";

/* =========================================================
   1. CONFIGURATION GÉNÉRALE
   ========================================================= */

const DALZON_CONFIG = {
    appName: "DALZON SHULE",
    version: "1.0.0",
    schoolId: "SCH-0001",
    schoolName: "Collège Mwanga",
    country: "RDC",
    currency: "USD",
    defaultLanguage: "fr",
    storagePrefix: "dalzon_shule_"
};


/* =========================================================
   2. ÉTABLISSEMENTS
   ========================================================= */

const DALZON_SCHOOLS = [
    {
        id: "SCH-0001",
        name: "Collège Mwanga",
        shortName: "CM",
        country: "RDC",
        province: "Nord-Kivu",
        city: "Goma",
        address: "Goma, Nord-Kivu, RDC",
        phone: "+243 000 000 000",
        email: "contact@dalzonshule.com",
        status: "active",
        createdAt: "2026-01-01"
    }
];


/* =========================================================
   3. UTILISATEURS
   ========================================================= */

const DALZON_USERS = [

    /* ADMINISTRATEUR */
    {
        id: "USR-0001",
        schoolId: "SCH-0001",
        email: "salomon@dalzonshule.com",
        matricule: "DZ-SHL-001",
        name: "Salomon M’BAL",
        firstName: "Salomon",
        lastName: "M’BAL",
        role: "admin",
        roleLabel: "Administration",
        status: "active",
        demoCode: "DZ-SHL-001",
        studentId: null,
        teacherId: null,
        parentId: null
    },

    /* ÉLÈVE */
    {
        id: "USR-0002",
        schoolId: "SCH-0001",
        email: "eleve01@dalzonshule.com",
        matricule: "DZ-SHL-002",
        name: "Élève 01",
        firstName: "Élève",
        lastName: "01",
        role: "student",
        roleLabel: "Élève",
        status: "active",
        demoCode: "DZ-SHL-002",
        studentId: "STD-0001",
        teacherId: null,
        parentId: null
    },

    {
        id: "USR-0003",
        schoolId: "SCH-0001",
        email: "eleve02@dalzonshule.com",
        matricule: "DZ-SHL-008",
        name: "Élève 02",
        firstName: "Élève",
        lastName: "02",
        role: "student",
        roleLabel: "Élève",
        status: "active",
        demoCode: "DZ-SHL-008",
        studentId: "STD-0002",
        teacherId: null,
        parentId: null
    },

    /* PARENT */
    {
        id: "USR-0004",
        schoolId: "SCH-0001",
        email: "parent01@dalzonshule.com",
        matricule: "DZ-SHL-003",
        name: "Parent 01",
        firstName: "Parent",
        lastName: "01",
        role: "parent",
        roleLabel: "Parent",
        status: "active",
        demoCode: "DZ-SHL-003",
        studentId: null,
        teacherId: null,
        parentId: "PAR-0001"
    },

    /* ENSEIGNANT */
    {
        id: "USR-0005",
        schoolId: "SCH-0001",
        email: "prof01@dalzonshule.com",
        matricule: "DZ-SHL-004",
        name: "Professeur 01",
        firstName: "Professeur",
        lastName: "01",
        role: "teacher",
        roleLabel: "Enseignant",
        status: "active",
        demoCode: "DZ-SHL-004",
        studentId: null,
        teacherId: "TCH-0001",
        parentId: null
    },

    /* DIRECTION */
    {
        id: "USR-0006",
        schoolId: "SCH-0001",
        email: "direction@dalzonshule.com",
        matricule: "DZ-SHL-005",
        name: "Direction",
        firstName: "Direction",
        lastName: "",
        role: "admin",
        roleLabel: "Direction",
        status: "active",
        demoCode: "DZ-SHL-005",
        studentId: null,
        teacherId: null,
        parentId: null
    },

    /* SECRÉTARIAT */
    {
        id: "USR-0007",
        schoolId: "SCH-0001",
        email: "secretariat@dalzonshule.com",
        matricule: "DZ-SHL-006",
        name: "Secrétariat",
        firstName: "Secrétariat",
        lastName: "",
        role: "secretary",
        roleLabel: "Secrétariat",
        status: "active",
        demoCode: "DZ-SHL-006",
        studentId: null,
        teacherId: null,
        parentId: null
    },

    /* COMPTABILITÉ */
    {
        id: "USR-0008",
        schoolId: "SCH-0001",
        email: "compta@dalzonshule.com",
        matricule: "DZ-SHL-007",
        name: "Comptabilité",
        firstName: "Comptabilité",
        lastName: "",
        role: "finance",
        roleLabel: "Comptabilité",
        status: "active",
        demoCode: "DZ-SHL-007",
        studentId: null,
        teacherId: null,
        parentId: null
    },

    /* SUPPORT */
    {
        id: "USR-0009",
        schoolId: "SCH-0001",
        email: "support@dalzonshule.com",
        matricule: "DZ-SHL-015",
        name: "Support DALZON",
        firstName: "Support",
        lastName: "DALZON",
        role: "support",
        roleLabel: "Support",
        status: "active",
        demoCode: "DZ-SHL-015",
        studentId: null,
        teacherId: null,
        parentId: null
    }
];


/* =========================================================
   4. CLASSES
   ========================================================= */

const DALZON_CLASSES = [

    {
        id: "CLS-0001",
        schoolId: "SCH-0001",
        name: "7ème Scientifique",
        level: "7ème",
        section: "Scientifique",
        academicYear: "2026-2027",
        room: "A1",
        teacherId: "TCH-0001",
        status: "active"
    },

    {
        id: "CLS-0002",
        schoolId: "SCH-0001",
        name: "8ème Scientifique",
        level: "8ème",
        section: "Scientifique",
        academicYear: "2026-2027",
        room: "A2",
        teacherId: "TCH-0001",
        status: "active"
    },

    {
        id: "CLS-0003",
        schoolId: "SCH-0001",
        name: "1ère Scientifique",
        level: "1ère",
        section: "Scientifique",
        academicYear: "2026-2027",
        room: "B1",
        teacherId: "TCH-0001",
        status: "active"
    },

    {
        id: "CLS-0004",
        schoolId: "SCH-0001",
        name: "2ème Scientifique",
        level: "2ème",
        section: "Scientifique",
        academicYear: "2026-2027",
        room: "B2",
        teacherId: "TCH-0001",
        status: "active"
    },

    {
        id: "CLS-0005",
        schoolId: "SCH-0001",
        name: "3ème Scientifique",
        level: "3ème",
        section: "Scientifique",
        academicYear: "2026-2027",
        room: "C1",
        teacherId: "TCH-0001",
        status: "active"
    },

    {
        id: "CLS-0006",
        schoolId: "SCH-0001",
        name: "4ème Scientifique",
        level: "4ème",
        section: "Scientifique",
        academicYear: "2026-2027",
        room: "C2",
        teacherId: "TCH-0001",
        status: "active"
    },

    {
        id: "CLS-0007",
        schoolId: "SCH-0001",
        name: "5ème Scientifique",
        level: "5ème",
        section: "Scientifique",
        academicYear: "2026-2027",
        room: "D1",
        teacherId: "TCH-0001",
        status: "active"
    },

    {
        id: "CLS-0008",
        schoolId: "SCH-0001",
        name: "6ème Scientifique",
        level: "6ème",
        section: "Scientifique",
        academicYear: "2026-2027",
        room: "D2",
        teacherId: "TCH-0001",
        status: "active"
    }
];


/* =========================================================
   5. ÉLÈVES
   ========================================================= */

const DALZON_STUDENTS = [

    {
        id: "STD-0001",
        userId: "USR-0002",
        schoolId: "SCH-0001",
        matricule: "DZ-SHL-002",
        firstName: "Élève",
        lastName: "01",
        fullName: "Élève 01",
        gender: "M",
        birthDate: "2010-01-01",
        classId: "CLS-0007",
        parentId: "PAR-0001",
        academicYear: "2026-2027",
        enrollmentStatus: "active"
    },

    {
        id: "STD-0002",
        userId: "USR-0003",
        schoolId: "SCH-0001",
        matricule: "DZ-SHL-008",
        firstName: "Élève",
        lastName: "02",
        fullName: "Élève 02",
        gender: "F",
        birthDate: "2011-02-02",
        classId: "CLS-0007",
        parentId: "PAR-0001",
        academicYear: "2026-2027",
        enrollmentStatus: "active"
    },

    {
        id: "STD-0003",
        userId: null,
        schoolId: "SCH-0001",
        matricule: "DZ-SHL-009",
        firstName: "Élève",
        lastName: "03",
        fullName: "Élève 03",
        gender: "M",
        birthDate: "2010-03-03",
        classId: "CLS-0007",
        parentId: null,
        academicYear: "2026-2027",
        enrollmentStatus: "active"
    },

    {
        id: "STD-0004",
        userId: null,
        schoolId: "SCH-0001",
        matricule: "DZ-SHL-010",
        firstName: "Élève",
        lastName: "04",
        fullName: "Élève 04",
        gender: "F",
        birthDate: "2010-04-04",
        classId: "CLS-0007",
        parentId: null,
        academicYear: "2026-2027",
        enrollmentStatus: "active"
    },

    {
        id: "STD-0005",
        userId: null,
        schoolId: "SCH-0001",
        matricule: "DZ-SHL-011",
        firstName: "Élève",
        lastName: "05",
        fullName: "Élève 05",
        gender: "M",
        birthDate: "2010-05-05",
        classId: "CLS-0008",
        parentId: null,
        academicYear: "2026-2027",
        enrollmentStatus: "active"
    }
];


/* =========================================================
   6. PARENTS
   ========================================================= */

const DALZON_PARENTS = [

    {
        id: "PAR-0001",
        userId: "USR-0004",
        schoolId: "SCH-0001",
        firstName: "Parent",
        lastName: "01",
        fullName: "Parent 01",
        phone: "+243 000 000 001",
        email: "parent01@dalzonshule.com",
        studentIds: [
            "STD-0001",
            "STD-0002"
        ],
        status: "active"
    }
];


/* =========================================================
   7. ENSEIGNANTS
   ========================================================= */

const DALZON_TEACHERS = [

    {
        id: "TCH-0001",
        userId: "USR-0005",
        schoolId: "SCH-0001",
        matricule: "TCH-001",
        firstName: "Professeur",
        lastName: "01",
        fullName: "Professeur 01",
        email: "prof01@dalzonshule.com",
        phone: "+243 000 000 002",
        specialization: "Sciences",
        subjects: [
            "SUB-0001",
            "SUB-0002",
            "SUB-0003"
        ],
        classIds: [
            "CLS-0001",
            "CLS-0002",
            "CLS-0003",
            "CLS-0004",
            "CLS-0005",
            "CLS-0006",
            "CLS-0007",
            "CLS-0008"
        ],
        status: "active"
    }
];


/* =========================================================
   8. MATIÈRES
   ========================================================= */

const DALZON_SUBJECTS = [

    {
        id: "SUB-0001",
        schoolId: "SCH-0001",
        name: "Mathématiques",
        shortName: "MATH",
        category: "Scientifique",
        coefficient: 3,
        status: "active"
    },

    {
        id: "SUB-0002",
        schoolId: "SCH-0001",
        name: "Physique",
        shortName: "PHY",
        category: "Scientifique",
        coefficient: 3,
        status: "active"
    },

    {
        id: "SUB-0003",
        schoolId: "SCH-0001",
        name: "Chimie",
        shortName: "CHIM",
        category: "Scientifique",
        coefficient: 3,
        status: "active"
    },

    {
        id: "SUB-0004",
        schoolId: "SCH-0001",
        name: "Biologie",
        shortName: "BIO",
        category: "Scientifique",
        coefficient: 2,
        status: "active"
    },

    {
        id: "SUB-0005",
        schoolId: "SCH-0001",
        name: "Français",
        shortName: "FR",
        category: "Littéraire",
        coefficient: 2,
        status: "active"
    },

    {
        id: "SUB-0006",
        schoolId: "SCH-0001",
        name: "Anglais",
        shortName: "ANG",
        category: "Langues",
        coefficient: 2,
        status: "active"
    },

    {
        id: "SUB-0007",
        schoolId: "SCH-0001",
        name: "Informatique",
        shortName: "INFO",
        category: "Technologie",
        coefficient: 2,
        status: "active"
    },

    {
        id: "SUB-0008",
        schoolId: "SCH-0001",
        name: "Éducation physique",
        shortName: "EPS",
        category: "Sport",
        coefficient: 1,
        status: "active"
    }
];


/* =========================================================
   9. COURS
   ========================================================= */

const DALZON_COURSES = [

    {
        id: "CRS-0001",
        schoolId: "SCH-0001",
        classId: "CLS-0007",
        subjectId: "SUB-0001",
        teacherId: "TCH-0001",
        title: "Mathématiques",
        room: "D1",
        day: "Lundi",
        startTime: "08:00",
        endTime: "09:00",
        status: "scheduled"
    },

    {
        id: "CRS-0002",
        schoolId: "SCH-0001",
        classId: "CLS-0007",
        subjectId: "SUB-0002",
        teacherId: "TCH-0001",
        title: "Physique",
        room: "Laboratoire",
        day: "Lundi",
        startTime: "09:15",
        endTime: "10:15",
        status: "scheduled"
    },

    {
        id: "CRS-0003",
        schoolId: "SCH-0001",
        classId: "CLS-0007",
        subjectId: "SUB-0003",
        teacherId: "TCH-0001",
        title: "Chimie",
        room: "Laboratoire",
        day: "Mardi",
        startTime: "08:00",
        endTime: "09:00",
        status: "scheduled"
    },

    {
        id: "CRS-0004",
        schoolId: "SCH-0001",
        classId: "CLS-0007",
        subjectId: "SUB-0005",
        teacherId: "TCH-0001",
        title: "Français",
        room: "D1",
        day: "Mardi",
        startTime: "09:15",
        endTime: "10:15",
        status: "scheduled"
    },

    {
        id: "CRS-0005",
        schoolId: "SCH-0001",
        classId: "CLS-0007",
        subjectId: "SUB-0007",
        teacherId: "TCH-0001",
        title: "Informatique",
        room: "Salle informatique",
        day: "Mercredi",
        startTime: "08:00",
        endTime: "10:00",
        status: "scheduled"
    },

    {
        id: "CRS-0006",
        schoolId: "SCH-0001",
        classId: "CLS-0007",
        subjectId: "SUB-0004",
        teacherId: "TCH-0001",
        title: "Biologie",
        room: "Laboratoire",
        day: "Jeudi",
        startTime: "08:00",
        endTime: "09:00",
        status: "scheduled"
    }
];


/* =========================================================
   10. NOTES
   ========================================================= */

const DALZON_GRADES = [

    {
        id: "GRD-0001",
        studentId: "STD-0001",
        subjectId: "SUB-0001",
        teacherId: "TCH-0001",
        classId: "CLS-0007",
        academicYear: "2026-2027",
        period: "Trimestre 1",
        evaluation: "Interrogation 1",
        score: 15,
        maxScore: 20,
        coefficient: 3,
        date: "2026-09-05"
    },

    {
        id: "GRD-0002",
        studentId: "STD-0001",
        subjectId: "SUB-0002",
        teacherId: "TCH-0001",
        classId: "CLS-0007",
        academicYear: "2026-2027",
        period: "Trimestre 1",
        evaluation: "Interrogation 1",
        score: 14,
        maxScore: 20,
        coefficient: 3,
        date: "2026-09-06"
    },

    {
        id: "GRD-0003",
        studentId: "STD-0001",
        subjectId: "SUB-0003",
        teacherId: "TCH-0001",
        classId: "CLS-0007",
        academicYear: "2026-2027",
        period: "Trimestre 1",
        evaluation: "Interrogation 1",
        score: 16,
        maxScore: 20,
        coefficient: 3,
        date: "2026-09-07"
    },

    {
        id: "GRD-0004",
        studentId: "STD-0001",
        subjectId: "SUB-0005",
        teacherId: "TCH-0001",
        classId: "CLS-0007",
        academicYear: "2026-2027",
        period: "Trimestre 1",
        evaluation: "Interrogation 1",
        score: 17,
        maxScore: 20,
        coefficient: 2,
        date: "2026-09-08"
    },

    {
        id: "GRD-0005",
        studentId: "STD-0001",
        subjectId: "SUB-0007",
        teacherId: "TCH-0001",
        classId: "CLS-0007",
        academicYear: "2026-2027",
        period: "Trimestre 1",
        evaluation: "Travail pratique",
        score: 18,
        maxScore: 20,
        coefficient: 2,
        date: "2026-09-10"
    },

    {
        id: "GRD-0006",
        studentId: "STD-0002",
        subjectId: "SUB-0001",
        teacherId: "TCH-0001",
        classId: "CLS-0007",
        academicYear: "2026-2027",
        period: "Trimestre 1",
        evaluation: "Interrogation 1",
        score: 13,
        maxScore: 20,
        coefficient: 3,
        date: "2026-09-05"
    },

    {
        id: "GRD-0007",
        studentId: "STD-0002",
        subjectId: "SUB-0002",
        teacherId: "TCH-0001",
        classId: "CLS-0007",
        academicYear: "2026-2027",
        period: "Trimestre 1",
        evaluation: "Interrogation 1",
        score: 15,
        maxScore: 20,
        coefficient: 3,
        date: "2026-09-06"
    }
];


/* =========================================================
   11. PRÉSENCES
   ========================================================= */

const DALZON_ATTENDANCE = [

    {
        id: "ATT-0001",
        studentId: "STD-0001",
        classId: "CLS-0007",
        courseId: "CRS-0001",
        date: "2026-09-14",
        status: "present",
        justification: null
    },

    {
        id: "ATT-0002",
        studentId: "STD-0001",
        classId: "CLS-0007",
        courseId: "CRS-0002",
        date: "2026-09-14",
        status: "present",
        justification: null
    },

    {
        id: "ATT-0003",
        studentId: "STD-0001",
        classId: "CLS-0007",
        courseId: "CRS-0003",
        date: "2026-09-15",
        status: "late",
        justification: "Arrivée tardive",
    },

    {
        id: "ATT-0004",
        studentId: "STD-0001",
        classId: "CLS-0007",
        courseId: "CRS-0004",
        date: "2026-09-15",
        status: "present",
        justification: null
    },

    {
        id: "ATT-0005",
        studentId: "STD-0001",
        classId: "CLS-0007",
        courseId: "CRS-0005",
        date: "2026-09-16",
        status: "absent",
        justification: "Non justifiée"
    }
];


/* =========================================================
   12. DOCUMENTS
   ========================================================= */

const DALZON_DOCUMENTS = [

    {
        id: "DOC-0001",
        schoolId: "SCH-0001",
        title: "Règlement intérieur",
        type: "reglement",
        category: "Administration",
        description: "Règlement intérieur de l'établissement.",
        fileUrl: "#",
        visibility: "all",
        createdAt: "2026-09-01",
        status: "published"
    },

    {
        id: "DOC-0002",
        schoolId: "SCH-0001",
        title: "Calendrier scolaire 2026-2027",
        type: "calendar",
        category: "Scolarité",
        description: "Calendrier scolaire de l'année 2026-2027.",
        fileUrl: "#",
        visibility: "all",
        createdAt: "2026-09-01",
        status: "published"
    },

    {
        id: "DOC-0003",
        schoolId: "SCH-0001",
        title: "Guide DALZON SHULE",
        type: "guide",
        category: "DALZON SHULE",
        description: "Guide d'utilisation de la plateforme.",
        fileUrl: "#",
        visibility: "all",
        createdAt: "2026-09-05",
        status: "published"
    },

    {
        id: "DOC-0004",
        schoolId: "SCH-0001",
        title: "Avis aux élèves",
        type: "notice",
        category: "Communication",
        description: "Avis officiel destiné aux élèves.",
        fileUrl: "#",
        visibility: "students",
        createdAt: "2026-09-10",
        status: "published"
    }
];


/* =========================================================
   13. CALENDRIER / ÉVÉNEMENTS
   ========================================================= */

const DALZON_EVENTS = [

    {
        id: "EVT-0001",
        schoolId: "SCH-0001",
        title: "Rentrée scolaire",
        description: "Début de l'année scolaire 2026-2027.",
        type: "school",
        date: "2026-09-01",
        startTime: "07:30",
        endTime: "08:00",
        location: "Établissement",
        visibility: "all",
        status: "published"
    },

    {
        id: "EVT-0002",
        schoolId: "SCH-0001",
        title: "Réunion pédagogique",
        description: "Réunion avec les enseignants.",
        type: "meeting",
        date: "2026-09-25",
        startTime: "14:00",
        endTime: "16:00",
        location: "Salle des enseignants",
        visibility: "teachers",
        status: "published"
    },

    {
        id: "EVT-0003",
        schoolId: "SCH-0001",
        title: "Évaluation trimestrielle",
        description: "Période des évaluations du premier trimestre.",
        type: "exam",
        date: "2026-10-05",
        startTime: "08:00",
        endTime: "12:00",
        location: "Salles de classe",
        visibility: "students",
        status: "published"
    }
];


/* =========================================================
   14. PAIEMENTS
   ========================================================= */

const DALZON_PAYMENTS = [

    {
        id: "PAY-0001",
        schoolId: "SCH-0001",
        studentId: "STD-0001",
        reference: "PAY-2026-0001",
        type: "frais_scolaires",
        amount: 150,
        currency: "USD",
        period: "2026-2027",
        status: "paid",
        method: "cash",
        date: "2026-09-02"
    },

    {
        id: "PAY-0002",
        schoolId: "SCH-0001",
        studentId: "STD-0002",
        reference: "PAY-2026-0002",
        type: "frais_scolaires",
        amount: 150,
        currency: "USD",
        period: "2026-2027",
        status: "pending",
        method: null,
        date: null
    }
];


/* =========================================================
   15. NOTIFICATIONS
   ========================================================= */

const DALZON_NOTIFICATIONS = [

    {
        id: "NTF-0001",
        schoolId: "SCH-0001",
        title: "Bienvenue sur DALZON SHULE",
        message: "Votre espace scolaire est prêt.",
        type: "system",
        target: "all",
        date: "2026-09-01",
        read: false
    },

    {
        id: "NTF-0002",
        schoolId: "SCH-0001",
        title: "Nouvelles notes",
        message: "De nouvelles notes sont disponibles.",
        type: "grades",
        target: "students",
        studentId: "STD-0001",
        date: "2026-09-10",
        read: false
    }
];


/* =========================================================
   16. BASE DE DONNÉES CENTRALE
   ========================================================= */

const DALZON_DB = {

    config: DALZON_CONFIG,

    schools: DALZON_SCHOOLS,

    users: DALZON_USERS,

    classes: DALZON_CLASSES,

    students: DALZON_STUDENTS,

    parents: DALZON_PARENTS,

    teachers: DALZON_TEACHERS,

    subjects: DALZON_SUBJECTS,

    courses: DALZON_COURSES,

    grades: DALZON_GRADES,

    attendance: DALZON_ATTENDANCE,

    documents: DALZON_DOCUMENTS,

    events: DALZON_EVENTS,

    payments: DALZON_PAYMENTS,

    notifications: DALZON_NOTIFICATIONS
};


/* =========================================================
   17. UTILITAIRES
   ========================================================= */

/**
 * Cherche un utilisateur par son adresse email.
 */
function getUserByEmail(email) {

    if (!email) return null;

    const normalizedEmail = String(email)
        .trim()
        .toLowerCase();

    return DALZON_DB.users.find(
        user => user.email.toLowerCase() === normalizedEmail
    ) || null;
}


/**
 * Cherche un utilisateur par son matricule.
 */
function getUserByMatricule(matricule) {

    if (!matricule) return null;

    const normalized = String(matricule)
        .trim()
        .toUpperCase();

    return DALZON_DB.users.find(
        user => user.matricule.toUpperCase() === normalized
    ) || null;
}


/**
 * Cherche un utilisateur par son ID.
 */
function getUserById(id) {

    return DALZON_DB.users.find(
        user => user.id === id
    ) || null;
}


/**
 * Cherche un élève.
 */
function getStudentById(id) {

    return DALZON_DB.students.find(
        student => student.id === id
    ) || null;
}


/**
 * Cherche un élève avec son matricule.
 */
function getStudentByMatricule(matricule) {

    if (!matricule) return null;

    const normalized = String(matricule)
        .trim()
        .toUpperCase();

    return DALZON_DB.students.find(
        student =>
            student.matricule.toUpperCase() === normalized
    ) || null;
}


/**
 * Cherche une classe.
 */
function getClassById(id) {

    return DALZON_DB.classes.find(
        schoolClass => schoolClass.id === id
    ) || null;
}


/**
 * Cherche une matière.
 */
function getSubjectById(id) {

    return DALZON_DB.subjects.find(
        subject => subject.id === id
    ) || null;
}


/**
 * Cherche un enseignant.
 */
function getTeacherById(id) {

    return DALZON_DB.teachers.find(
        teacher => teacher.id === id
    ) || null;
}


/**
 * Cherche un parent.
 */
function getParentById(id) {

    return DALZON_DB.parents.find(
        parent => parent.id === id
    ) || null;
}


/* =========================================================
   18. DONNÉES D'UN ÉLÈVE
   ========================================================= */

/**
 * Récupère les notes d'un élève.
 */
function getStudentGrades(studentId) {

    return DALZON_DB.grades.filter(
        grade => grade.studentId === studentId
    );
}


/**
 * Récupère les notes d'un élève pour une matière.
 */
function getStudentSubjectGrades(studentId, subjectId) {

    return DALZON_DB.grades.filter(
        grade =>
            grade.studentId === studentId &&
            grade.subjectId === subjectId
    );
}


/**
 * Récupère les présences d'un élève.
 */
function getStudentAttendance(studentId) {

    return DALZON_DB.attendance.filter(
        attendance =>
            attendance.studentId === studentId
    );
}


/**
 * Récupère les cours d'une classe.
 */
function getClassCourses(classId) {

    return DALZON_DB.courses.filter(
        course =>
            course.classId === classId
    );
}


/**
 * Récupère les élèves d'une classe.
 */
function getClassStudents(classId) {

    return DALZON_DB.students.filter(
        student =>
            student.classId === classId
    );
}


/**
 * Récupère les élèves d'un parent.
 */
function getParentStudents(parentId) {

    const parent = getParentById(parentId);

    if (!parent) return [];

    return DALZON_DB.students.filter(
        student =>
            parent.studentIds.includes(student.id)
    );
}


/* =========================================================
   19. MOYENNES
   ========================================================= */

/**
 * Calcule la moyenne simple.
 */
function calculateAverage(values) {

    if (!Array.isArray(values) || values.length === 0) {
        return 0;
    }

    const total = values.reduce(
        (sum, value) => sum + Number(value || 0),
        0
    );

    return total / values.length;
}


/**
 * Calcule la moyenne pondérée.
 */
function calculateWeightedAverage(grades) {

    if (!Array.isArray(grades) || grades.length === 0) {
        return 0;
    }

    let totalPoints = 0;
    let totalCoefficient = 0;

    grades.forEach(grade => {

        const score = Number(grade.score || 0);
        const coefficient = Number(grade.coefficient || 1);

        totalPoints += score * coefficient;
        totalCoefficient += coefficient;

    });

    if (totalCoefficient === 0) {
        return 0;
    }

    return totalPoints / totalCoefficient;
}


/**
 * Moyenne générale d'un élève.
 */
function getStudentAverage(studentId) {

    const grades = getStudentGrades(studentId);

    return Number(
        calculateWeightedAverage(grades).toFixed(2)
    );
}


/**
 * Moyenne d'un élève dans une matière.
 */
function getStudentSubjectAverage(studentId, subjectId) {

    const grades = getStudentSubjectGrades(
        studentId,
        subjectId
    );

    return Number(
        calculateWeightedAverage(grades).toFixed(2)
    );
}


/* =========================================================
   20. STATISTIQUES DE PRÉSENCE
   ========================================================= */

function getAttendanceStats(studentId) {

    const records = getStudentAttendance(studentId);

    const total = records.length;

    const present = records.filter(
        item => item.status === "present"
    ).length;

    const absent = records.filter(
        item => item.status === "absent"
    ).length;

    const late = records.filter(
        item => item.status === "late"
    ).length;

    const percentage = total > 0
        ? (present / total) * 100
        : 0;

    return {

        total,

        present,

        absent,

        late,

        percentage: Number(
            percentage.toFixed(1)
        )
    };
}


/* =========================================================
   21. DOCUMENTS
   ========================================================= */

function getDocumentsForUser(user) {

    if (!user) return [];

    return DALZON_DB.documents.filter(document => {

        if (document.visibility === "all") {
            return true;
        }

        if (
            document.visibility === "students" &&
            user.role === "student"
        ) {
            return true;
        }

        if (
            document.visibility === "teachers" &&
            user.role === "teacher"
        ) {
            return true;
        }

        if (
            document.visibility === "administration" &&
            (
                user.role === "admin" ||
                user.role === "secretary"
            )
        ) {
            return true;
        }

        return false;
    });
}


/* =========================================================
   22. ÉVÉNEMENTS
   ========================================================= */

function getEventsForUser(user) {

    if (!user) return [];

    return DALZON_DB.events.filter(event => {

        if (event.visibility === "all") {
            return true;
        }

        if (
            event.visibility === "students" &&
            user.role === "student"
        ) {
            return true;
        }

        if (
            event.visibility === "teachers" &&
            user.role === "teacher"
        ) {
            return true;
        }

        if (
            event.visibility === "administration" &&
            (
                user.role === "admin" ||
                user.role === "secretary"
            )
        ) {
            return true;
        }

        return false;
    });
}


/* =========================================================
   23. NOTIFICATIONS
   ========================================================= */

function getNotificationsForUser(user) {

    if (!user) return [];

    return DALZON_DB.notifications.filter(notification => {

        if (notification.target === "all") {
            return true;
        }

        if (
            notification.target === "students" &&
            user.role === "student"
        ) {

            if (
                notification.studentId &&
                user.studentId &&
                notification.studentId !== user.studentId
            ) {
                return false;
            }

            return true;
        }

        return false;
    });
}


/* =========================================================
   24. PAIEMENTS
   ========================================================= */

function getStudentPayments(studentId) {

    return DALZON_DB.payments.filter(
        payment =>
            payment.studentId === studentId
    );
}


function getStudentPaymentTotal(studentId) {

    const payments = getStudentPayments(studentId);

    return payments.reduce(
        (total, payment) =>
            total + Number(payment.amount || 0),
        0
    );
}


/* =========================================================
   25. RECHERCHE GÉNÉRALE
   ========================================================= */

function searchStudents(query) {

    if (!query) {
        return DALZON_DB.students;
    }

    const q = String(query)
        .trim()
        .toLowerCase();

    return DALZON_DB.students.filter(student => {

        return (
            student.fullName.toLowerCase().includes(q) ||
            student.matricule.toLowerCase().includes(q)
        );

    });
}


function searchUsers(query) {

    if (!query) {
        return DALZON_DB.users;
    }

    const q = String(query)
        .trim()
        .toLowerCase();

    return DALZON_DB.users.filter(user => {

        return (
            user.name.toLowerCase().includes(q) ||
            user.email.toLowerCase().includes(q) ||
            user.matricule.toLowerCase().includes(q)
        );

    });
}


/* =========================================================
   26. GÉNÉRATION D'ID
   ========================================================= */

function generateId(prefix, collection) {

    const list = Array.isArray(collection)
        ? collection
        : [];

    let maxNumber = 0;

    list.forEach(item => {

        if (!item.id) return;

        const match = item.id.match(
            new RegExp("^" + prefix + "-(\\d+)$")
        );

        if (match) {

            const number = parseInt(
                match[1],
                10
            );

            if (number > maxNumber) {
                maxNumber = number;
            }
        }
    });

    return (
        prefix +
        "-" +
        String(maxNumber + 1).padStart(4, "0")
    );
}


/* =========================================================
   27. FORMATAGE
   ========================================================= */

function formatScore(score, maxScore = 20) {

    const value = Number(score || 0);
    const max = Number(maxScore || 20);

    if (!max) return "0/0";

    return `${value}/${max}`;
}


function formatPercentage(value) {

    const number = Number(value || 0);

    return `${number.toFixed(1)}%`;
}


function formatCurrency(amount, currency = "USD") {

    const value = Number(amount || 0);

    try {

        return new Intl.NumberFormat(
            "fr-FR",
            {
                style: "currency",
                currency: currency
            }
        ).format(value);

    } catch (error) {

        return `${value} ${currency}`;

    }
}


/* =========================================================
   28. AUTORISATIONS
   ========================================================= */

const DALZON_PERMISSIONS = {

    admin: [
        "dashboard",
        "students",
        "teachers",
        "classes",
        "subjects",
        "courses",
        "grades",
        "attendance",
        "documents",
        "calendar",
        "payments",
        "settings"
    ],

    secretary: [
        "dashboard",
        "students",
        "classes",
        "documents",
        "calendar"
    ],

    teacher: [
        "dashboard",
        "students",
        "courses",
        "grades",
        "attendance",
        "documents",
        "calendar"
    ],

    student: [
        "dashboard",
        "grades",
        "courses",
        "attendance",
        "documents",
        "calendar",
        "profile"
    ],

    parent: [
        "dashboard",
        "grades",
        "attendance",
        "documents",
        "calendar",
        "payments",
        "profile"
    ],

    finance: [
        "dashboard",
        "students",
        "payments",
        "documents",
        "profile"
    ],

    support: [
        "dashboard",
        "profile"
    ]

};


function hasPermission(role, permission) {

    if (!role || !permission) {
        return false;
    }

    const permissions =
        DALZON_PERMISSIONS[role];

    if (!permissions) {
        return false;
    }

    return permissions.includes(permission);
}


/* =========================================================
   29. AUTHENTIFICATION LOCALE DE DÉMO
   ========================================================= */

/*
   IMPORTANT :
   Cette fonction est uniquement destinée au prototype.

   Dans la version de production :
   - aucun code secret ne doit être stocké ici ;
   - l'authentification devra être faite côté serveur ;
   - les mots de passe devront être hashés ;
   - les sessions devront être sécurisées.
*/

function authenticateUser(identifier, code) {

    if (!identifier || !code) {
        return {
            success: false,
            message: "Identifiants incomplets."
        };
    }

    const value = String(identifier)
        .trim()
        .toLowerCase();

    const user = DALZON_DB.users.find(item => {

        const emailMatch =
            item.email.toLowerCase() === value;

        const matriculeMatch =
            item.matricule.toLowerCase() === value;

        return emailMatch || matriculeMatch;

    });

    if (!user) {

        return {
            success: false,
            message: "Compte introuvable."
        };
    }

    if (user.status !== "active") {

        return {
            success: false,
            message: "Ce compte est désactivé."
        };
    }

    if (String(code).trim() !== user.demoCode) {

        return {
            success: false,
            message: "Code d'accès incorrect."
        };
    }

    return {
        success: true,
        user: user
    };
}


/* =========================================================
   30. SESSION
   ========================================================= */

const DALZON_SESSION_KEY =
    DALZON_CONFIG.storagePrefix + "session";


function saveSession(user) {

    if (!user) return false;

    const session = {

        userId: user.id,

        schoolId: user.schoolId,

        role: user.role,

        loginAt: new Date().toISOString()

    };

    try {

        sessionStorage.setItem(
            DALZON_SESSION_KEY,
            JSON.stringify(session)
        );

        return true;

    } catch (error) {

        console.error(
            "Impossible d'enregistrer la session.",
            error
        );

        return false;
    }
}


function getSession() {

    try {

        const raw =
            sessionStorage.getItem(
                DALZON_SESSION_KEY
            );

        if (!raw) {
            return null;
        }

        return JSON.parse(raw);

    } catch (error) {

        console.error(
            "Session invalide.",
            error
        );

        return null;
    }
}


function getCurrentUser() {

    const session = getSession();

    if (!session) {
        return null;
    }

    return getUserById(
        session.userId
    );
}


function clearSession() {

    try {

        sessionStorage.removeItem(
            DALZON_SESSION_KEY
        );

        return true;

    } catch (error) {

        return false;
    }
}


/* =========================================================
   31. RÉSUMÉ DU TABLEAU DE BORD
   ========================================================= */

function getDashboardStats() {

    return {

        students:
            DALZON_DB.students.filter(
                student =>
                    student.enrollmentStatus === "active"
            ).length,

        teachers:
            DALZON_DB.teachers.filter(
                teacher =>
                    teacher.status === "active"
            ).length,

        classes:
            DALZON_DB.classes.filter(
                schoolClass =>
                    schoolClass.status === "active"
            ).length,

        subjects:
            DALZON_DB.subjects.filter(
                subject =>
                    subject.status === "active"
            ).length,

        courses:
            DALZON_DB.courses.filter(
                course =>
                    course.status === "scheduled"
            ).length,

        documents:
            DALZON_DB.documents.filter(
                document =>
                    document.status === "published"
            ).length,

        events:
            DALZON_DB.events.filter(
                event =>
                    event.status === "published"
            ).length
    };
}


/* =========================================================
   32. EXPORT GLOBAL
   ========================================================= */

/*
   On place les données et fonctions dans window.DALZON
   afin que index.html, app.js et les autres fichiers
   puissent les utiliser facilement.
*/

window.DALZON = {

    config: DALZON_CONFIG,

    db: DALZON_DB,

    permissions: DALZON_PERMISSIONS,

    getUserByEmail,
    getUserByMatricule,
    getUserById,

    getStudentById,
    getStudentByMatricule,

    getClassById,
    getSubjectById,
    getTeacherById,
    getParentById,

    getStudentGrades,
    getStudentSubjectGrades,
    getStudentAttendance,

    getClassCourses,
    getClassStudents,
    getParentStudents,

    calculateAverage,
    calculateWeightedAverage,

    getStudentAverage,
    getStudentSubjectAverage,

    getAttendanceStats,

    getDocumentsForUser,
    getEventsForUser,
    getNotificationsForUser,

    getStudentPayments,
    getStudentPaymentTotal,

    searchStudents,
    searchUsers,

    generateId,

    formatScore,
    formatPercentage,
    formatCurrency,

    hasPermission,

    authenticateUser,

    saveSession,
    getSession,
    getCurrentUser,
    clearSession,

    getDashboardStats
};


/* =========================================================
   33. MESSAGE DE CONTRÔLE
   ========================================================= */

console.log(
    `%c${DALZON_CONFIG.appName} — Data layer ${DALZON_CONFIG.version}`,
    "font-weight:bold;font-size:14px;"
);

console.log(
    "Base locale chargée :",
    DALZON_DB
);
