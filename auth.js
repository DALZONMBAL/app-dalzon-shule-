(function () {
  "use strict";

  /*
   * =========================================================
   * DALZON SHULE
   * AUTH.JS — AUTHENTIFICATION SUPABASE
   * =========================================================
   *
   * Fonctionnalités :
   * - Connexion par email
   * - Préparation pour connexion par matricule
   * - Restauration automatique de session
   * - Récupération du profil utilisateur
   * - Déconnexion
   * - Synchronisation avec public.profiles
   *
   * IMPORTANT :
   * La clé service_role ne doit JAMAIS être placée ici.
   */


  const AUTH = {
    appName: "DALZON SHULE",
    version: "2.0.0"
  };


  let cachedUser = null;
  let authListenerStarted = false;


  /* =========================================================
     SUPABASE
  ========================================================= */

  function getSupabase() {

    if (
      window.DALZON_SUPABASE &&
      typeof window.DALZON_SUPABASE.auth !== "undefined"
    ) {
      return window.DALZON_SUPABASE;
    }

    console.error(
      "DALZON SHULE : window.DALZON_SUPABASE est introuvable."
    );

    return null;
  }


  /* =========================================================
     UTILITAIRES
  ========================================================= */

  function normalize(value) {

    return String(value || "")
      .trim()
      .toLowerCase();

  }


  function cleanName(value) {

    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");

  }


  function initials(name) {

    const words =
      cleanName(name)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2);

    if (!words.length) return "DS";

    return words
      .map(word => word.charAt(0).toUpperCase())
      .join("");

  }


  function getRoleLabel(role) {

    const roles = {

      admin: "Administrateur",
      direction: "Direction",
      secretariat: "Secrétariat",
      teacher: "Enseignant",
      student: "Élève",
      parent: "Parent",
      gestion: "Gestion"

    };

    return roles[normalize(role)] || role || "Utilisateur";

  }


  /* =========================================================
     CONSTRUIRE L'UTILISATEUR DALZON
  ========================================================= */

  function buildUser(authUser, profile) {

    if (!authUser) return null;

    const metadata =
      authUser.user_metadata || {};

    const firstName =
      cleanName(
        profile?.first_name ||
        metadata.first_name ||
        metadata.firstname ||
        ""
      );

    const lastName =
      cleanName(
        profile?.last_name ||
        metadata.last_name ||
        metadata.lastname ||
        ""
      );


    let name =
      cleanName(
        `${firstName} ${lastName}`
      );


    if (!name) {

      name =
        cleanName(
          metadata.full_name ||
          metadata.name ||
          authUser.email?.split("@")[0] ||
          "Utilisateur"
        );

    }


    const role =
      normalize(
        profile?.role ||
        metadata.role ||
        "student"
      );


    return {

      id: authUser.id,

      authUserId: authUser.id,

      email:
        profile?.email ||
        authUser.email ||
        "",

      firstName,

      lastName,

      name,

      fullName: name,

      role,

      roleLabel:
        getRoleLabel(role),

      matricule:
        profile?.matricule ||
        metadata.matricule ||
        "",

      schoolId:
        profile?.school_id ||
        metadata.school_id ||
        null,

      classId:
        metadata.class_id ||
        null,

      className:
        metadata.class_name ||
        "",

      avatarUrl:
        profile?.avatar_url ||
        metadata.avatar_url ||
        "",

      initials:
        initials(name),

      profile,

      authUser

    };

  }


  /* =========================================================
     RÉCUPÉRER LE PROFIL
  ========================================================= */

  async function getProfile(authUser) {

    const supabase =
      getSupabase();

    if (!supabase || !authUser) {
      return null;
    }


    try {

      const {
        data,
        error
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();


      if (error) {

        console.warn(
          "DALZON SHULE : impossible de charger le profil.",
          error
        );

        return null;

      }


      return data || null;

    } catch (error) {

      console.error(
        "Erreur getProfile :",
        error
      );

      return null;

    }

  }


  /* =========================================================
     RÉCUPÉRER L'UTILISATEUR AUTHENTIFIÉ
  ========================================================= */

  async function getAuthenticatedUserAsync() {

    const supabase =
      getSupabase();

    if (!supabase) {
      return null;
    }


    try {

      const {
        data,
        error
      } = await supabase.auth.getUser();


      if (error) {

        cachedUser = null;

        return null;

      }


      const authUser =
        data?.user;


      if (!authUser) {

        cachedUser = null;

        return null;

      }


      const profile =
        await getProfile(authUser);


      const user =
        buildUser(
          authUser,
          profile
        );


      cachedUser =
        user;


      return user;


    } catch (error) {

      console.error(
        "Erreur récupération utilisateur :",
        error
      );

      cachedUser = null;

      return null;

    }

  }


  /* =========================================================
     VERSION SYNCHRONE
  ========================================================= */

  function getAuthenticatedUser() {

    return cachedUser;

  }


  /* =========================================================
     RECHERCHE MATRICULE
  =========================================================
   *
   * Avec les policies RLS actuelles, un utilisateur non
   * authentifié ne peut pas rechercher librement un profil
   * par matricule.
   *
   * Cette fonction essaie donc une recherche uniquement
   * lorsqu'une session authentifiée existe déjà.
   *
   * Pour permettre une vraie connexion "matricule + mot
   * de passe" depuis l'écran de connexion, il faudra ensuite
   * mettre en place une RPC/Edge Function sécurisée.
  ========================================================= */

  async function findEmailByMatricule(matricule) {

    const supabase =
      getSupabase();

    if (!supabase) {
      return null;
    }


    const value =
      String(matricule || "").trim();


    if (!value) {
      return null;
    }


    try {

      const {
        data,
        error
      } = await supabase
        .from("profiles")
        .select("email, matricule")
        .eq("matricule", value)
        .maybeSingle();


      if (error) {

        console.warn(
          "Recherche matricule impossible :",
          error
        );

        return null;

      }


      return data?.email || null;


    } catch (error) {

      console.error(
        "Erreur recherche matricule :",
        error
      );

      return null;

    }

  }


  /* =========================================================
     CONNEXION
  ========================================================= */

  async function login(identifier, password) {

    const supabase =
      getSupabase();


    if (!supabase) {

      return {

        user: null,

        error: new Error(
          "Supabase n'est pas correctement initialisé."
        )

      };

    }


    const loginIdentifier =
      String(identifier || "").trim();


    const loginPassword =
      String(password || "");


    if (!loginIdentifier) {

      return {

        user: null,

        error: new Error(
          "Veuillez saisir votre email ou matricule."
        )

      };

    }


    if (!loginPassword) {

      return {

        user: null,

        error: new Error(
          "Veuillez saisir votre mot de passe."
        )

      };

    }


    try {

      /*
       * -----------------------------------------------------
       * CAS 1 : EMAIL
       * -----------------------------------------------------
       */

      let email =
        loginIdentifier;


      /*
       * -----------------------------------------------------
       * CAS 2 : MATRICULE
       * -----------------------------------------------------
       *
       * Si l'identifiant ne ressemble pas à un email,
       * on tente une recherche dans profiles.
       *
       * Avec RLS, cette partie peut nécessiter plus tard
       * une fonction RPC/Edge Function dédiée.
       */

      if (!loginIdentifier.includes("@")) {

        const foundEmail =
          await findEmailByMatricule(
            loginIdentifier
          );


        if (!foundEmail) {

          return {

            user: null,

            error: new Error(
              "Matricule introuvable. Utilisez votre email ou vérifiez votre matricule."
            )

          };

        }


        email =
          foundEmail;

      }


      /*
       * -----------------------------------------------------
       * AUTH SUPABASE
       * -----------------------------------------------------
       */

      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({

        email,

        password: loginPassword

      });


      if (error) {

        console.error(
          "Supabase login error :",
          error
        );


        return {

          user: null,

          error

        };

      }


      if (!data?.user) {

        return {

          user: null,

          error: new Error(
            "Connexion impossible : utilisateur introuvable."
          )

        };

      }


      /*
       * -----------------------------------------------------
       * PROFIL DALZON
       * -----------------------------------------------------
       */

      const profile =
        await getProfile(
          data.user
        );


      const user =
        buildUser(
          data.user,
          profile
        );


      cachedUser =
        user;


      return {

        user,

        data,

        error: null

      };


    } catch (error) {

      console.error(
        "DALZON SHULE login error :",
        error
      );


      return {

        user: null,

        error

      };

    }

  }


  /* =========================================================
     DÉCONNEXION
  ========================================================= */

  async function logout() {

    const supabase =
      getSupabase();


    cachedUser =
      null;


    if (!supabase) {
      return {
        error: null
      };
    }


    try {

      const {
        error
      } =
        await supabase.auth.signOut();


      if (error) {

        console.error(
          "Erreur déconnexion :",
          error
        );

        return {
          error
        };

      }


      /*
       * Notification destinée à index.html
       */

      document.dispatchEvent(
        new CustomEvent(
          "dalzon:logout"
        )
      );


      return {
        error: null
      };


    } catch (error) {

      console.error(
        "Erreur logout :",
        error
      );


      return {
        error
      };

    }

  }


  /* =========================================================
     RAFRAÎCHIR LE PROFIL
  ========================================================= */

  async function refreshUser() {

    cachedUser =
      await getAuthenticatedUserAsync();

    return cachedUser;

  }


  /* =========================================================
     ÉCOUTEUR DE SESSION SUPABASE
  ========================================================= */

  function startAuthListener() {

    if (authListenerStarted) {
      return;
    }


    const supabase =
      getSupabase();


    if (!supabase) {
      return;
    }


    authListenerStarted =
      true;


    supabase.auth.onAuthStateChange(
      async function (
        event,
        session
      ) {

        console.log(
          "DALZON SHULE Auth:",
          event
        );


        /*
         * SIGNED_OUT
         */

        if (event === "SIGNED_OUT") {

          cachedUser =
            null;


          document.dispatchEvent(
            new CustomEvent(
              "dalzon:logout"
            )
          );


          return;

        }


        /*
         * SESSION DISPONIBLE
         */

        if (
          session?.user &&
          (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED"
          )
        ) {

          /*
           * Éviter de lancer immédiatement plusieurs
           * requêtes pendant le changement de token.
           */

          setTimeout(
            async function () {

              try {

                const profile =
                  await getProfile(
                    session.user
                  );


                cachedUser =
                  buildUser(
                    session.user,
                    profile
                  );


              } catch (error) {

                console.warn(
                  "Actualisation du profil impossible :",
                  error
                );

              }

            },
            0
          );

        }

      }
    );

  }


  /* =========================================================
     INITIALISATION
  ========================================================= */

  function initAuth() {

    if (!getSupabase()) {

      console.error(
        "DALZON SHULE Auth : Supabase indisponible."
      );

      return;

    }


    startAuthListener();


    console.log(
      `${AUTH.appName} Auth ${AUTH.version} chargé.`
    );

  }


  /* =========================================================
     API PUBLIQUE
  ========================================================= */

  window.DALZON_AUTH = {

    login,

    logout,

    getAuthenticatedUserAsync,

    getAuthenticatedUser,

    refreshUser,

    getProfile,

    findEmailByMatricule,

    getRoleLabel

  };


  /* =========================================================
     DÉMARRAGE
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


})();
