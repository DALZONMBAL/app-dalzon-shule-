import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const allowedRoles = new Set([
  "admin",
  "direction",
  "secretariat",
  "teacher",
  "student",
  "parent",
  "gestion"
]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée." }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = req.headers.get("Authorization");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Configuration serveur Supabase incomplète.");
    }
    if (!authorization) {
      return new Response(JSON.stringify({ error: "Authentification requise." }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Session invalide. Reconnectez-vous." }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const { data: adminProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role, school_id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !adminProfile || String(adminProfile.role).toLowerCase() !== "admin") {
      return new Response(JSON.stringify({ error: "Seul un administrateur peut créer des comptes." }), {
        status: 403,
        headers: corsHeaders
      });
    }

    const body = await req.json();
    const firstName = String(body.first_name || "").trim();
    const lastName = String(body.last_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "").trim().toLowerCase();

    if (!firstName || !lastName || !email || password.length < 8 || !allowedRoles.has(role)) {
      return new Response(JSON.stringify({ error: "Données invalides. Vérifiez le nom, l’email, le rôle et le mot de passe (8 caractères minimum)." }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role,
        school_id: adminProfile.school_id
      }
    });

    if (createError || !created.user) {
      throw createError || new Error("Supabase n’a pas retourné le compte créé.");
    }

    const profilePayload = {
      id: created.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      school_id: adminProfile.school_id
    };

    const { error: saveProfileError } = await adminClient
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (saveProfileError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      throw new Error("Le compte Auth a été annulé car le profil n’a pas pu être enregistré : " + saveProfileError.message);
    }

    const linkedStudentIds = Array.isArray(body.linked_student_ids)
      ? body.linked_student_ids.map((value: unknown) => String(value)).filter(Boolean)
      : [];
    const linkedTeacherId = String(body.linked_teacher_id || "").trim();

    if (
      (role === "student" && linkedStudentIds.length !== 1) ||
      (role === "parent" && linkedStudentIds.length < 1) ||
      (role === "teacher" && !linkedTeacherId)
    ) {
      await adminClient.from("profiles").delete().eq("id", created.user.id);
      await adminClient.auth.admin.deleteUser(created.user.id);
      throw new Error("Associez le compte à sa fiche élève, parent ou enseignant avant de continuer.");
    }

    let linkError: string | null = null;
    if (role === "student") {
      const { data, error } = await adminClient
        .from("students")
        .update({ user_id: created.user.id })
        .eq("id", linkedStudentIds[0])
        .eq("school_id", adminProfile.school_id)
        .select("id");
      if (error) linkError = error.message;
      else if (!data?.length) linkError = "La fiche élève sélectionnée est introuvable dans votre établissement.";
    } else if (role === "parent") {
      const { data, error } = await adminClient
        .from("students")
        .update({ parent_user_id: created.user.id })
        .in("id", linkedStudentIds)
        .eq("school_id", adminProfile.school_id)
        .select("id");
      if (error) linkError = error.message;
      else if (!data || data.length !== linkedStudentIds.length) linkError = "Une ou plusieurs fiches élèves n'ont pas pu être associées.";
    } else if (role === "teacher") {
      const { data, error } = await adminClient
        .from("teachers")
        .update({ user_id: created.user.id })
        .eq("id", linkedTeacherId)
        .eq("school_id", adminProfile.school_id)
        .select("id");
      if (error) linkError = error.message;
      else if (!data?.length) linkError = "La fiche enseignant sélectionnée est introuvable dans votre établissement.";
    }

    if (linkError) {
      await adminClient.from("profiles").delete().eq("id", created.user.id);
      await adminClient.auth.admin.deleteUser(created.user.id);
      throw new Error("Le compte a été annulé car l’association à la fiche scolaire a échoué : " + linkError);
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: created.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role
      }
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error("admin-create-user:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Erreur serveur lors de la création du compte."
    }), {
      status: 400,
      headers: corsHeaders
    });
  }
});
