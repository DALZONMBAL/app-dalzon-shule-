# Mise en service des nouveaux modules DALZON SHULE

Les fichiers de l'application sont dans le dépôt GitHub. Les éléments Supabase ci-dessous doivent aussi être activés : un commit GitHub ne déploie pas automatiquement une migration SQL ni une Edge Function.

## 1. Appliquer la migration SQL

1. Ouvrir le projet Supabase de DALZON SHULE.
2. Aller dans **SQL Editor** puis **New query**.
3. Ouvrir le fichier `supabase/migrations/20261105_dalzon_roles_and_rls.sql` dans GitHub.
4. Copier tout son contenu dans SQL Editor et exécuter.
5. Si Supabase affiche une erreur, arrêter et corriger cette erreur avant de continuer. Ne pas désactiver RLS.

Cette migration ajoute les liaisons entre les comptes et les fiches élèves/parents/enseignants, puis installe les règles d'accès par rôle. Elle suppose que les tables déjà utilisées par l'application existent et possèdent les champs `profiles.id/role/school_id`, `students.id/school_id/class_id`, `teachers.id/school_id`, `classes.id`, ainsi que `grades.student_id`, `attendance.student_id` et `payments.student_id`.

## 2. Déployer la création sécurisée des comptes

Fichier source : `supabase/functions/admin-create-user/index.ts`.

1. Dans Supabase, ouvrir **Edge Functions**.
2. Créer une fonction nommée exactement `admin-create-user`.
3. Coller le contenu du fichier ci-dessus dans l'éditeur de la fonction.
4. Déployer la fonction.
5. Vérifier que les variables serveur Supabase `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont disponibles dans l'environnement de la fonction.

**Important :** la clé `service_role` reste uniquement côté serveur dans les secrets Supabase. Ne jamais la copier dans `index.html`, `app.js`, GitHub Pages ou un navigateur.

## 3. Contrôles à effectuer

- Créer un compte de test pour chaque rôle.
- Vérifier qu'un élève ne voit que ses propres notes, présences et paiements.
- Vérifier qu'un parent ne voit que les enfants associés à son compte.
- Attribuer un enseignant à une classe dans le formulaire Classes, puis vérifier que cet enseignant voit cette classe.
- Saisir une note, ouvrir le bulletin, puis utiliser **Imprimer / PDF**.
- Enregistrer une présence et un paiement.
- Tester chaque action avec un compte non administrateur pour vérifier que les permissions sont appliquées par Supabase, pas seulement masquées dans l'interface.

Les bulletins produits par cette première version calculent une moyenne pondérée à partir des notes et coefficients présents dans la base. Le modèle officiel de bulletin EPST, les périodes/trimestres, les maxima par branche, les appréciations, les signatures et le classement doivent être ajustés aux paramètres exacts de l'établissement avant utilisation officielle.
