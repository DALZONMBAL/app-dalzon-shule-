/* =========================================================
   DALZON SHULE — AUTH.JS
   Authentification réelle avec Supabase
   Version : 2.0
   ========================================================= */

"use strict";

/* =========================================================
   1. CONFIGURATION SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://pdjzottshwqyvbjzqivw.supabase.co";

const SUPABASE_KEY =
    "COLLE_ICI_TA_PUBLISHABLE_KEY";


/* =========================================================
   2. CLIENT SUPABASE
   ========================================================= */

let supabaseClient = null;

if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
) {
    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );
} else {
    console.error(
        "Supabase JS n'est pas chargé."
    );
}


/* =========================================================
   3. ÉTAT
   ========================================================= */

let currentUser = null;
let currentProfile = null;


/* =========================================================
   4. NORMALISER LE PROFIL
   ========================================================= */

function normalizeProfile(profile, authUser) {

    if (!profile) {
        return null;
    }

    return {

        id: profile.id,

        userId: profile.id,

        schoolId:
            profile.school_id || null,

        firstName:
            profile.first_name || "",

        lastName:
            profile.last_name || "",

        name:
            `${profile.first_name || ""} ${profile.last_name || ""}`
                .trim(),

        email:
            profile.email ||
            authUser?.email ||
            "",

        phone:
            profile.phone || "",

        role:
            profile.role || "student",

        roleLabel:
            getRoleLabel(
                profile.role
            ),

        matricule:
            profile.matricule || "",

        avatarUrl:
            profile.avatar_url || "",

        status:
            "active"

    };
}


/* =========================================================
   5. LIBELLÉ DES RÔLES
   ========================================================= */

function getRoleLabel(role) {

    const labels = {

        admin:
            "Administrateur",

        direction:
            "Direction",

        secretariat:
            "Secrétariat",

        teacher:
            "Enseignant",

        student:
            "Élève",

        parent:
            "Parent",

        gestion:
            "Gestion"

    };

    return (
        labels[role] ||
        "Utilisateur"
    );
}


/* =========================================================
   6. RÉCUPÉRER LE PROFIL
   ========================================================= */

async function fetchProfile(authUser) {

    if (!supabaseClient || !authUser) {
        return null;
    }

    const { data, error } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();

    if (error) {

        console.error(
            "Erreur récupération profil :",
            error
        );

        return null;
    }

    if (!data) {
        return null;
    }

    currentProfile =
        normalizeProfile(
            data,
            authUser
        );

    return currentProfile;
}


/* =========================================================
   7. CONNEXION
   ========================================================= */

async function login(
    identifier,
    password
) {

    if (!identifier || !password) {

        return {

            success: false,

            message:
                "Veuillez remplir tous les champs."

        };

    }

    if (!supabaseClient) {

        return {

            success: false,

            message:
                "Supabase n'est pas correctement chargé."

        };

    }

    let email =
        String(identifier)
            .trim()
            .toLowerCase();


    /*
       Pour le moment, la connexion directe
       utilise l'adresse email.

       La connexion par matricule sera ajoutée
       juste après lorsque la table students
       sera reliée aux profils.
    */

    if (!email.includes("@")) {

        return {

            success: false,

            message:
                "Utilisez votre adresse e-mail pour vous connecter."

        };

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


        if (error) {

            console.error(
                "Erreur connexion :",
                error
            );

            return {

                success: false,

                message:
                    getAuthErrorMessage(
                        error
                    )

            };

        }


        if (!data.user) {

            return {

                success: false,

                message:
                    "Utilisateur introuvable."

            };

        }


        currentUser =
            data.user;


        const profile =
            await fetchProfile(
                data.user
            );


        if (!profile) {

            await supabaseClient.auth.signOut();

            return {

                success: false,

                message:
                    "Votre compte existe, mais votre profil DALZON SHULE n'est pas encore configuré."

            };

        }


        currentProfile =
            profile;


        /*
           Compatibilité avec l'index.html actuel.
        */

        window.dispatchEvent(

            new CustomEvent(
                "dalzon:authenticated",
                {
                    detail: {
                        user: profile
                    }
                }
            )

        );


        return {

            success: true,

            user: profile,

            session:
                data.session,

            message:
                `Bienvenue ${profile.firstName || profile.name}.`

        };


    } catch (error) {

        console.error(
            "Erreur inattendue :",
            error
        );

        return {

            success: false,

            message:
                "Une erreur est survenue pendant la connexion."

        };

    }

}


/* =========================================================
   8. MESSAGE D'ERREUR
   ========================================================= */

function getAuthErrorMessage(error) {

    const message =
        String(
            error?.message || ""
        ).toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return "Adresse e-mail ou mot de passe incorrect.";

    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return "Votre adresse e-mail n'est pas encore confirmée.";

    }


    if (
        message.includes(
            "too many requests"
        )
    ) {

        return "Trop de tentatives. Réessayez dans quelques instants.";

    }


    return (
        error?.message ||
        "Impossible de se connecter."
    );

}


/* =========================================================
   9. UTILISATEUR CONNECTÉ
   ========================================================= */

async function getAuthenticatedUserAsync() {

    if (!supabaseClient) {
        return null;
    }

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (error || !data?.user) {

        currentUser = null;
        currentProfile = null;

        return null;

    }


    currentUser =
        data.user;


    if (!currentProfile) {

        await fetchProfile(
            data.user
        );

    }


    return currentProfile;

}


/* =========================================================
   10. UTILISATEUR SYNCHRONE
   ========================================================= */

function getAuthenticatedUser() {

    return currentProfile;

}


/* =========================================================
   11. SESSION
   ========================================================= */

async function getAuthSession() {

    if (!supabaseClient) {
        return null;
    }

    const {
        data
    } =
        await supabaseClient.auth.getSession();

    return data?.session || null;

}


/* =========================================================
   12. VÉRIFIER LA CONNEXION
   ========================================================= */

function isAuthenticated() {

    return !!currentProfile;

}


/* =========================================================
   13. DÉCONNEXION
   ========================================================= */

async function logout() {

    if (supabaseClient) {

        const {
            error
        } =
            await supabaseClient.auth.signOut();

        if (error) {

            console.error(
                "Erreur déconnexion :",
                error
            );

        }

    }


    currentUser = null;
    currentProfile = null;


    window.dispatchEvent(

        new CustomEvent(
            "dalzon:logout"
        )

    );


    return true;

}


/* =========================================================
   14. RÔLE
   ========================================================= */

function hasRole(role) {

    if (!currentProfile) {
        return false;
    }

    return (
        currentProfile.role === role
    );

}


/* =========================================================
   15. PLUSIEURS RÔLES
   ========================================================= */

function hasAnyRole(roles) {

    if (
        !currentProfile ||
        !Array.isArray(roles)
    ) {

        return false;

    }

    return roles.includes(
        currentProfile.role
    );

}


/* =========================================================
   16. PERMISSIONS
   ========================================================= */

function can(permission) {

    if (!currentProfile) {
        return false;
    }


    const permissions = {

        admin: [
            "*"
        ],

        direction: [
            "students.read",
            "students.write",
            "teachers.read",
            "classes.read",
            "subjects.read",
            "grades.read",
            "attendance.read",
            "documents.read",
            "events.read",
            "payments.read"
        ],

        secretariat: [
            "students.read",
            "students.write",
            "documents.read",
            "documents.write"
        ],

        teacher: [
            "students.read",
            "courses.read",
            "courses.write",
            "grades.read",
            "grades.write",
            "attendance.read",
            "attendance.write"
        ],

        student: [
            "grades.read.own",
            "courses.read",
            "attendance.read.own",
            "documents.read",
            "events.read"
        ],

        parent: [
            "grades.read.child",
            "attendance.read.child",
            "documents.read",
            "events.read"
        ],

        gestion: [
            "payments.read",
            "payments.write",
            "students.read"
        ]

    };


    const userPermissions =
        permissions[
            currentProfile.role
        ] || [];


    if (
        userPermissions.includes("*")
    ) {

        return true;

    }


    return userPermissions.includes(
        permission
    );

}


/* =========================================================
   17. PROTECTION
   ========================================================= */

function requireAuth() {

    if (!isAuthenticated()) {

        window.location.hash = "";

        return false;

    }

    return true;

}


/* =========================================================
   18. PROTECTION PAR RÔLE
   ========================================================= */

function requireRole(roles) {

    if (!currentProfile) {

        window.location.hash = "";

        return false;

    }


    const allowedRoles =
        Array.isArray(roles)
            ? roles
            : [roles];


    return allowedRoles.includes(
        currentProfile.role
    );

}


/* =========================================================
   19. PROTECTION PAR PERMISSION
   ========================================================= */

function requirePermission(
    permission
) {

    if (!currentProfile) {

        window.location.hash = "";

        return false;

    }


    return can(
        permission
    );

}


/* =========================================================
   20. INFORMATIONS SESSION
   ========================================================= */

function getAuthInfo() {

    if (!currentProfile) {
        return null;
    }

    return {

        user:
            currentProfile,

        session:
            null,

        isAuthenticated:
            true,

        role:
            currentProfile.role,

        roleLabel:
            currentProfile.roleLabel,

        schoolId:
            currentProfile.schoolId

    };

}


/* =========================================================
   21. INITIALISATION
   ========================================================= */

async function initAuth() {

    if (!supabaseClient) {

        console.error(
            "Supabase client indisponible."
        );

        return;

    }


    const {
        data
    } =
        await supabaseClient.auth.getSession();


    if (
        data?.session?.user
    ) {

        currentUser =
            data.session.user;


        const profile =
            await fetchProfile(
                currentUser
            );


        if (profile) {

            currentProfile =
                profile;


            window.dispatchEvent(

                new CustomEvent(
                    "dalzon:authenticated",
                    {
                        detail: {
                            user: profile
                        }
                    }
                )

            );

        }

    } else {

        window.dispatchEvent(

            new CustomEvent(
                "dalzon:unauthenticated"
            )

        );

    }


    /*
       Écoute les changements de session
       Supabase.
    */

    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            if (
                event === "SIGNED_IN" &&
                session?.user
            ) {

                currentUser =
                    session.user;

                const profile =
                    await fetchProfile(
                        session.user
                    );

                if (profile) {

                    currentProfile =
                        profile;

                    window.dispatchEvent(

                        new CustomEvent(
                            "dalzon:authenticated",
                            {
                                detail: {
                                    user:
                                        profile
                                }
                            }
                        )

                    );

                }

            }


            if (
                event === "SIGNED_OUT"
            ) {

                currentUser = null;
                currentProfile = null;

            }

        }
    );

}


/* =========================================================
   22. API PUBLIQUE
   ========================================================= */

window.DALZON_AUTH = {

    login,

    logout,

    isAuthenticated,

    getAuthenticatedUser,

    getAuthenticatedUserAsync,

    getAuthSession,

    getAuthInfo,

    hasRole,

    hasAnyRole,

    can,

    requireAuth,

    requireRole,

    requirePermission,

    initAuth,

    fetchProfile

};


/* =========================================================
   23. COMPATIBILITÉ
   ========================================================= */

window.DALZON_LOGIN =
    login;

window.DALZON_LOGOUT =
    logout;


/* =========================================================
   FIN
   ========================================================= */
