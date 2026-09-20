/* =========================================================
   DALZON SHULE — AUTH.JS
   Gestion de l'authentification et des sessions
   Version : 1.0
   ========================================================= */

"use strict";


/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const DALZON_AUTH = {

    sessionKey:
        "dalzon_shule_session",

    maxSessionAge:
        24 * 60 * 60 * 1000

};


/* =========================================================
   2. ÉTAT DE L'AUTHENTIFICATION
   ========================================================= */

let currentUser = null;


/* =========================================================
   3. CONNEXION
   ========================================================= */

function login(identifier, code) {

    if (!identifier || !code) {

        return {
            success: false,
            message: "Veuillez remplir tous les champs."
        };

    }

    const result =
        DALZON.authenticateUser(
            identifier,
            code
        );

    if (!result.success) {

        return result;

    }

    const user = result.user;

    const session = {

        userId: user.id,

        schoolId: user.schoolId,

        role: user.role,

        loginAt: new Date().toISOString(),

        expiresAt:
            new Date(
                Date.now() +
                DALZON_AUTH.maxSessionAge
            ).toISOString()

    };


    try {

        sessionStorage.setItem(
            DALZON_AUTH.sessionKey,
            JSON.stringify(session)
        );

    } catch (error) {

        console.error(
            "Erreur session :",
            error
        );

        return {
            success: false,
            message:
                "Impossible de créer la session."
        };

    }


    currentUser = user;


    return {

        success: true,

        user: user,

        session: session,

        message:
            `Bienvenue ${user.firstName || user.name}.`

    };

}


/* =========================================================
   4. RÉCUPÉRER LA SESSION
   ========================================================= */

function getAuthSession() {

    try {

        const raw =
            sessionStorage.getItem(
                DALZON_AUTH.sessionKey
            );

        if (!raw) {

            return null;

        }


        const session =
            JSON.parse(raw);


        if (!session.userId) {

            clearAuthSession();

            return null;

        }


        if (session.expiresAt) {

            const expiration =
                new Date(
                    session.expiresAt
                ).getTime();

            if (
                Date.now() >= expiration
            ) {

                clearAuthSession();

                return null;

            }

        }


        return session;

    } catch (error) {

        console.error(
            "Session corrompue :",
            error
        );

        clearAuthSession();

        return null;

    }

}


/* =========================================================
   5. RÉCUPÉRER L'UTILISATEUR CONNECTÉ
   ========================================================= */

function getAuthenticatedUser() {

    const session =
        getAuthSession();


    if (!session) {

        currentUser = null;

        return null;

    }


    const user =
        DALZON.getUserById(
            session.userId
        );


    if (!user) {

        clearAuthSession();

        currentUser = null;

        return null;

    }


    if (user.status !== "active") {

        clearAuthSession();

        currentUser = null;

        return null;

    }


    currentUser = user;


    return user;

}


/* =========================================================
   6. VÉRIFIER SI CONNECTÉ
   ========================================================= */

function isAuthenticated() {

    return (
        getAuthenticatedUser() !== null
    );

}


/* =========================================================
   7. DÉCONNEXION
   ========================================================= */

function logout() {

    clearAuthSession();

    currentUser = null;


    /*
       On revient à la page de connexion.
    */

    if (
        window.location.hash
    ) {

        window.location.hash = "";

    }


    window.dispatchEvent(
        new CustomEvent(
            "dalzon:logout"
        )
    );


    return true;

}


/* =========================================================
   8. SUPPRIMER LA SESSION
   ========================================================= */

function clearAuthSession() {

    try {

        sessionStorage.removeItem(
            DALZON_AUTH.sessionKey
        );

        /*
           Nettoyage de l'ancien système
           si présent.
        */

        sessionStorage.removeItem(
            "dalzon_session"
        );

        return true;

    } catch (error) {

        console.error(
            "Impossible de supprimer la session.",
            error
        );

        return false;

    }

}


/* =========================================================
   9. VÉRIFIER LE RÔLE
   ========================================================= */

function hasRole(role) {

    const user =
        getAuthenticatedUser();


    if (!user) {

        return false;

    }


    return user.role === role;

}


/* =========================================================
   10. VÉRIFIER PLUSIEURS RÔLES
   ========================================================= */

function hasAnyRole(roles) {

    const user =
        getAuthenticatedUser();


    if (!user) {

        return false;

    }


    if (!Array.isArray(roles)) {

        return false;

    }


    return roles.includes(
        user.role
    );

}


/* =========================================================
   11. VÉRIFIER UNE PERMISSION
   ========================================================= */

function can(permission) {

    const user =
        getAuthenticatedUser();


    if (!user) {

        return false;

    }


    return DALZON.hasPermission(
        user.role,
        permission
    );

}


/* =========================================================
   12. PROTECTION D'UNE PAGE
   ========================================================= */

function requireAuth() {

    const user =
        getAuthenticatedUser();


    if (!user) {

        window.location.hash = "";

        return false;

    }


    return true;

}


/* =========================================================
   13. PROTECTION PAR RÔLE
   ========================================================= */

function requireRole(roles) {

    const user =
        getAuthenticatedUser();


    if (!user) {

        window.location.hash = "";

        return false;

    }


    const allowedRoles =
        Array.isArray(roles)
            ? roles
            : [roles];


    if (
        !allowedRoles.includes(
            user.role
        )
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "dalzon:unauthorized",
                {
                    detail: {
                        user: user,
                        requiredRoles:
                            allowedRoles
                    }
                }
            )
        );

        return false;

    }


    return true;

}


/* =========================================================
   14. PROTECTION PAR PERMISSION
   ========================================================= */

function requirePermission(permission) {

    const user =
        getAuthenticatedUser();


    if (!user) {

        window.location.hash = "";

        return false;

    }


    if (
        !DALZON.hasPermission(
            user.role,
            permission
        )
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "dalzon:unauthorized",
                {
                    detail: {
                        user: user,
                        permission:
                            permission
                    }
                }
            )
        );

        return false;

    }


    return true;

}


/* =========================================================
   15. INFORMATIONS DE SESSION
   ========================================================= */

function getAuthInfo() {

    const user =
        getAuthenticatedUser();

    const session =
        getAuthSession();


    if (!user || !session) {

        return null;

    }


    return {

        user: user,

        session: session,

        isAuthenticated: true,

        role: user.role,

        roleLabel: user.roleLabel,

        schoolId: user.schoolId

    };

}


/* =========================================================
   16. TEMPS RESTANT DE SESSION
   ========================================================= */

function getSessionRemainingTime() {

    const session =
        getAuthSession();


    if (!session || !session.expiresAt) {

        return 0;

    }


    const expiration =
        new Date(
            session.expiresAt
        ).getTime();


    const remaining =
        expiration - Date.now();


    return Math.max(
        0,
        remaining
    );

}


/* =========================================================
   17. RENOUVELLEMENT DE SESSION
   ========================================================= */

function refreshSession() {

    const session =
        getAuthSession();


    if (!session) {

        return false;

    }


    session.expiresAt =
        new Date(
            Date.now() +
            DALZON_AUTH.maxSessionAge
        ).toISOString();


    try {

        sessionStorage.setItem(
            DALZON_AUTH.sessionKey,
            JSON.stringify(session)
        );

        return true;

    } catch (error) {

        console.error(
            "Impossible de renouveler la session.",
            error
        );

        return false;

    }

}


/* =========================================================
   18. AUTO-INITIALISATION
   ========================================================= */

function initAuth() {

    const user =
        getAuthenticatedUser();


    if (user) {

        console.log(
            `Session active : ${user.name}`
        );

        window.dispatchEvent(
            new CustomEvent(
                "dalzon:authenticated",
                {
                    detail: {
                        user: user
                    }
                }
            )
        );

    } else {

        console.log(
            "Aucune session active."
        );

        window.dispatchEvent(
            new CustomEvent(
                "dalzon:unauthenticated"
            )
        );

    }

}


/* =========================================================
   19. ÉVÉNEMENT : EXPIRATION
   ========================================================= */

function checkSessionExpiration() {

    const session =
        getAuthSession();


    if (!session) {

        return false;

    }


    const remaining =
        getSessionRemainingTime();


    if (remaining <= 0) {

        logout();

        return false;

    }


    return true;

}


/* =========================================================
   20. SURVEILLANCE AUTOMATIQUE
   ========================================================= */

setInterval(
    () => {

        if (
            isAuthenticated()
        ) {

            checkSessionExpiration();

        }

    },
    60 * 1000
);


/* =========================================================
   21. EXPOSITION GLOBALE
   ========================================================= */

window.DALZON_AUTH = {

    login,

    logout,

    isAuthenticated,

    getAuthenticatedUser,

    getAuthSession,

    getAuthInfo,

    hasRole,

    hasAnyRole,

    can,

    requireAuth,

    requireRole,

    requirePermission,

    clearAuthSession,

    refreshSession,

    getSessionRemainingTime,

    checkSessionExpiration,

    initAuth

};


/* =========================================================
   22. COMPATIBILITÉ
   ========================================================= */

window.DALZON_LOGIN = login;

window.DALZON_LOGOUT = logout;


/* =========================================================
   23. INITIALISATION
   ========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initAuth
    );

} else {

    initAuth();

}


/* =========================================================
   FIN AUTH.JS
   ========================================================= */
