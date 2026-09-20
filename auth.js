/* =========================================================
   DALZON SHULE — auth.js
   Authentification Supabase
   ========================================================= */

(function () {
  "use strict";

  const AUTH = {
    currentUser: null
  };

  function getSupabase() {
    return window.DALZON_SUPABASE || null;
  }

  function normalizeProfile(profile, authUser) {
    if (!profile) return null;

    const firstName = profile.first_name || "";
    const lastName = profile.last_name || "";

    const name =
      `${firstName} ${lastName}`.trim() ||
      authUser?.email ||
      "Utilisateur";

    const role = profile.role || "student";

    const roleLabels = {
      admin: "Administrateur",
      direction: "Direction",
      secretariat: "Secrétariat",
      teacher: "Enseignant",
      student: "Élève",
      parent: "Parent",
      gestion: "Gestion"
    };

    return {
      id: profile.id,
      authUserId: authUser?.id || profile.id,

      schoolId: profile.school_id || null,

      firstName,
      lastName,
      name,
      fullName: name,

      email:
        profile.email ||
        authUser?.email ||
        "",

      phone: profile.phone || "",

      role,
      roleLabel: roleLabels[role] || role,

      matricule: profile.matricule || "",

      avatarUrl: profile.avatar_url || "",

      className: "",
      class: "",
      classe: "",

      createdAt: profile.created_at || null,
      updatedAt: profile.updated_at || null
    };
  }

  async function getAuthenticatedUserAsync() {
    const supabase = getSupabase();

    if (!supabase) {
      throw new Error(
        "Supabase n'est pas correctement initialisé."
      );
    }

    try {
      const {
        data: sessionData,
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "Erreur récupération session :",
          sessionError
        );

        return null;
      }

      const session = sessionData?.session;

      if (!session?.user) {
        AUTH.currentUser = null;
        return null;
      }

      const authUser = session.user;

      const {
        data: profile,
        error: profileError
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Erreur récupération profil :",
          profileError
        );

        throw new Error(
          "Impossible de récupérer votre profil."
        );
      }

      if (!profile) {
        console.error(
          "Aucun profil trouvé pour :",
          authUser.id
        );

        throw new Error(
          "Votre compte existe, mais votre profil DALZON SHULE n'est pas configuré."
        );
      }

      const user = normalizeProfile(
        profile,
        authUser
      );

      AUTH.currentUser = user;

      return user;

    } catch (error) {

      console.error(
        "getAuthenticatedUserAsync :",
        error
      );

      throw error;
    }
  }

  async function login(identifier, password) {

    const supabase = getSupabase();

    if (!supabase) {
      return {
        success: false,
        message:
          "Supabase n'est pas correctement initialisé."
      };
    }

    if (!identifier || !password) {
      return {
        success: false,
        message:
          "Veuillez remplir tous les champs."
      };
    }

    /*
     * Pour cette première version,
     * la connexion utilise l'adresse e-mail.
     *
     * La connexion par matricule sera ajoutée
     * ensuite avec une méthode sécurisée.
     */

    const email = identifier.trim();

    if (!email.includes("@")) {
      return {
        success: false,
        message:
          "Pour le moment, utilisez votre adresse e-mail."
      };
    }

    try {

      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {

        console.error(
          "Supabase signInWithPassword :",
          error
        );

        return {
          success: false,
          message:
            "Adresse e-mail ou code d'accès incorrect."
        };
      }

      if (!data?.user) {
        return {
          success: false,
          message:
            "Impossible de récupérer votre compte."
        };
      }

      const user =
        await getAuthenticatedUserAsync();

      if (!user) {

        return {
          success: false,
          message:
            "Votre profil DALZON SHULE est introuvable."
        };
      }

      window.dispatchEvent(
        new CustomEvent(
          "dalzon:authenticated",
          {
            detail: {
              user
            }
          }
        )
      );

      return {
        success: true,
        user
      };

    } catch (error) {

      console.error(
        "DALZON SHULE Login :",
        error
      );

      return {
        success: false,
        message:
          error?.message ||
          "Une erreur est survenue pendant la connexion."
      };
    }
  }

  async function logout() {

    const supabase = getSupabase();

    try {

      if (supabase) {
        const {
          error
        } = await supabase.auth.signOut();

        if (error) {
          console.error(
            "Erreur déconnexion :",
            error
          );
        }
      }

    } finally {

      AUTH.currentUser = null;

      window.dispatchEvent(
        new CustomEvent(
          "dalzon:logout"
        )
      );
    }

    return true;
  }

  function getAuthenticatedUser() {
    return AUTH.currentUser;
  }

  function isAuthenticated() {
    return !!AUTH.currentUser;
  }

  function getAuthSession() {
    return null;
  }

  function hasRole(role) {

    const user =
      AUTH.currentUser;

    if (!user) return false;

    return String(user.role)
      .toLowerCase() ===
      String(role)
        .toLowerCase();
  }

  function hasAnyRole(roles) {

    if (!Array.isArray(roles)) {
      return false;
    }

    const user =
      AUTH.currentUser;

    if (!user) return false;

    return roles.some(
      role =>
        String(role)
          .toLowerCase() ===
        String(user.role)
          .toLowerCase()
    );
  }

  function can() {
    return true;
  }

  async function initAuth() {

    const supabase =
      getSupabase();

    if (!supabase) {
      console.error(
        "DALZON_SUPABASE est introuvable."
      );
      return null;
    }

    /*
     * Surveillance automatique de la session.
     */

    supabase.auth.onAuthStateChange(
      async (event, session) => {

        console.log(
          "DALZON Auth event :",
          event
        );

        if (
          event === "SIGNED_OUT"
        ) {

          AUTH.currentUser = null;

          window.dispatchEvent(
            new CustomEvent(
              "dalzon:logout"
            )
          );

          return;
        }

        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED"
        ) {

          try {

            const user =
              await getAuthenticatedUserAsync();

            if (user) {

              window.dispatchEvent(
                new CustomEvent(
                  "dalzon:authenticated",
                  {
                    detail: {
                      user
                    }
                  }
                )
              );
            }

          } catch (error) {

            console.error(
              "Erreur après événement Auth :",
              error
            );
          }
        }
      }
    );

    try {

      return await getAuthenticatedUserAsync();

    } catch (error) {

      console.error(
        "Initialisation Auth :",
        error
      );

      return null;
    }
  }

  /*
   * API publique
   */

  window.DALZON_AUTH = {

    login,

    logout,

    getAuthenticatedUser,

    getAuthenticatedUserAsync,

    isAuthenticated,

    getAuthSession,

    hasRole,

    hasAnyRole,

    can,

    initAuth

  };

  /*
   * Compatibilité avec l'ancien système
   */

  window.DALZON_LOGIN = login;
  window.DALZON_LOGOUT = logout;

  /*
   * Initialisation après chargement
   */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      function () {
        initAuth();
      }
    );

  } else {

    initAuth();

  }

})();
