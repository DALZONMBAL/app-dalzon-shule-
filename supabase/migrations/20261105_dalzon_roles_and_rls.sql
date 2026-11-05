-- DALZON SHULE — liaison des comptes et sécurité par rôle
-- À exécuter une seule fois dans Supabase > SQL Editor.
-- Cette migration ne crée aucun mot de passe et n'expose aucune clé secrète.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS parent_user_id uuid;

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS teacher_id uuid;

CREATE INDEX IF NOT EXISTS students_user_id_idx ON public.students(user_id);
CREATE INDEX IF NOT EXISTS students_parent_user_id_idx ON public.students(parent_user_id);
CREATE INDEX IF NOT EXISTS teachers_user_id_idx ON public.teachers(user_id);

-- Fonctions SECURITY DEFINER pour lire le rôle et l'école du compte courant
-- sans provoquer de récursion dans les policies de profiles.
CREATE OR REPLACE FUNCTION public.dalzon_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE lower(trim(coalesce(p.role, '')))
    WHEN 'secretary' THEN 'secretariat'
    WHEN 'secretaire' THEN 'secretariat'
    WHEN 'finance' THEN 'gestion'
    WHEN 'comptabilite' THEN 'gestion'
    ELSE lower(trim(coalesce(p.role, '')))
  END
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.dalzon_my_school_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.school_id::text
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.dalzon_my_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dalzon_my_school_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dalzon_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dalzon_my_school_id() TO authenticated;

-- Profils : chacun voit son profil ; l'administrateur voit ceux de son école.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dalzon_profiles_select ON public.profiles;
CREATE POLICY dalzon_profiles_select
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR (
    public.dalzon_my_role() = 'admin'
    AND school_id::text = public.dalzon_my_school_id()
  )
);

-- Élèves : personnel de l'école, élève concerné et parent lié.
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dalzon_students_select ON public.students;
CREATE POLICY dalzon_students_select
ON public.students FOR SELECT TO authenticated
USING (
  (
    public.dalzon_my_role() IN ('admin','direction','secretariat','gestion')
    AND school_id::text = public.dalzon_my_school_id()
  )
  OR user_id = auth.uid()
  OR parent_user_id = auth.uid()
  OR (
    public.dalzon_my_role() = 'teacher'
    AND school_id::text = public.dalzon_my_school_id()
    AND EXISTS (
      SELECT 1
      FROM public.teachers t
      JOIN public.classes c ON c.teacher_id = t.id
      WHERE t.user_id = auth.uid()
        AND c.id = students.class_id
    )
  )
);

DROP POLICY IF EXISTS dalzon_students_insert ON public.students;
CREATE POLICY dalzon_students_insert
ON public.students FOR INSERT TO authenticated
WITH CHECK (
  public.dalzon_my_role() IN ('admin','direction','secretariat')
  AND school_id::text = public.dalzon_my_school_id()
);

DROP POLICY IF EXISTS dalzon_students_update ON public.students;
CREATE POLICY dalzon_students_update
ON public.students FOR UPDATE TO authenticated
USING (
  public.dalzon_my_role() IN ('admin','direction','secretariat')
  AND school_id::text = public.dalzon_my_school_id()
)
WITH CHECK (
  public.dalzon_my_role() IN ('admin','direction','secretariat')
  AND school_id::text = public.dalzon_my_school_id()
);

DROP POLICY IF EXISTS dalzon_students_delete ON public.students;
CREATE POLICY dalzon_students_delete
ON public.students FOR DELETE TO authenticated
USING (
  public.dalzon_my_role() IN ('admin','direction')
  AND school_id::text = public.dalzon_my_school_id()
);

-- Enseignants : administration et fiche personnelle de l'enseignant.
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dalzon_teachers_select ON public.teachers;
CREATE POLICY dalzon_teachers_select
ON public.teachers FOR SELECT TO authenticated
USING (
  (
    public.dalzon_my_role() IN ('admin','direction','secretariat')
    AND school_id::text = public.dalzon_my_school_id()
  )
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS dalzon_teachers_insert ON public.teachers;
CREATE POLICY dalzon_teachers_insert
ON public.teachers FOR INSERT TO authenticated
WITH CHECK (
  public.dalzon_my_role() IN ('admin','direction','secretariat')
  AND school_id::text = public.dalzon_my_school_id()
);

DROP POLICY IF EXISTS dalzon_teachers_update ON public.teachers;
CREATE POLICY dalzon_teachers_update
ON public.teachers FOR UPDATE TO authenticated
USING (
  public.dalzon_my_role() IN ('admin','direction','secretariat')
  AND school_id::text = public.dalzon_my_school_id()
)
WITH CHECK (
  public.dalzon_my_role() IN ('admin','direction','secretariat')
  AND school_id::text = public.dalzon_my_school_id()
);

DROP POLICY IF EXISTS dalzon_teachers_delete ON public.teachers;
CREATE POLICY dalzon_teachers_delete
ON public.teachers FOR DELETE TO authenticated
USING (
  public.dalzon_my_role() IN ('admin','direction')
  AND school_id::text = public.dalzon_my_school_id()
);

-- Notes : consultation limitée à l'école, à la classe affectée ou à l'enfant lié.
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dalzon_grades_select ON public.grades;
CREATE POLICY dalzon_grades_select
ON public.grades FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = grades.student_id
      AND (
        (
          public.dalzon_my_role() IN ('admin','direction','secretariat','gestion')
          AND s.school_id::text = public.dalzon_my_school_id()
        )
        OR s.user_id = auth.uid()
        OR s.parent_user_id = auth.uid()
        OR (
          public.dalzon_my_role() = 'teacher'
          AND EXISTS (
            SELECT 1 FROM public.teachers t
            JOIN public.classes c ON c.teacher_id = t.id
            WHERE t.user_id = auth.uid()
              AND c.id = s.class_id
          )
        )
      )
  )
);

DROP POLICY IF EXISTS dalzon_grades_insert ON public.grades;
CREATE POLICY dalzon_grades_insert
ON public.grades FOR INSERT TO authenticated
WITH CHECK (
  public.dalzon_my_role() IN ('admin','direction','teacher')
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = grades.student_id
      AND s.school_id::text = public.dalzon_my_school_id()
      AND (
        public.dalzon_my_role() <> 'teacher'
        OR EXISTS (
          SELECT 1 FROM public.teachers t
          JOIN public.classes c ON c.teacher_id = t.id
          WHERE t.user_id = auth.uid()
            AND c.id = s.class_id
        )
      )
  )
);

DROP POLICY IF EXISTS dalzon_grades_update ON public.grades;
CREATE POLICY dalzon_grades_update
ON public.grades FOR UPDATE TO authenticated
USING (
  public.dalzon_my_role() IN ('admin','direction')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = grades.student_id AND s.school_id::text = public.dalzon_my_school_id())
)
WITH CHECK (
  public.dalzon_my_role() IN ('admin','direction')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = grades.student_id AND s.school_id::text = public.dalzon_my_school_id())
);

DROP POLICY IF EXISTS dalzon_grades_delete ON public.grades;
CREATE POLICY dalzon_grades_delete
ON public.grades FOR DELETE TO authenticated
USING (
  public.dalzon_my_role() IN ('admin','direction')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = grades.student_id AND s.school_id::text = public.dalzon_my_school_id())
);

-- Présences : même cloisonnement que les notes.
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dalzon_attendance_select ON public.attendance;
CREATE POLICY dalzon_attendance_select
ON public.attendance FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = attendance.student_id
      AND (
        (
          public.dalzon_my_role() IN ('admin','direction','secretariat','gestion')
          AND s.school_id::text = public.dalzon_my_school_id()
        )
        OR s.user_id = auth.uid()
        OR s.parent_user_id = auth.uid()
        OR (
          public.dalzon_my_role() = 'teacher'
          AND EXISTS (
            SELECT 1 FROM public.teachers t
            JOIN public.classes c ON c.teacher_id = t.id
            WHERE t.user_id = auth.uid()
              AND c.id = s.class_id
          )
        )
      )
  )
);

DROP POLICY IF EXISTS dalzon_attendance_insert ON public.attendance;
CREATE POLICY dalzon_attendance_insert
ON public.attendance FOR INSERT TO authenticated
WITH CHECK (
  public.dalzon_my_role() IN ('admin','direction','secretariat','teacher')
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = attendance.student_id
      AND s.school_id::text = public.dalzon_my_school_id()
      AND (
        public.dalzon_my_role() <> 'teacher'
        OR EXISTS (
          SELECT 1 FROM public.teachers t
          JOIN public.classes c ON c.teacher_id = t.id
          WHERE t.user_id = auth.uid()
            AND c.id = s.class_id
        )
      )
  )
);

DROP POLICY IF EXISTS dalzon_attendance_update ON public.attendance;
CREATE POLICY dalzon_attendance_update
ON public.attendance FOR UPDATE TO authenticated
USING (
  public.dalzon_my_role() IN ('admin','direction','secretariat')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND s.school_id::text = public.dalzon_my_school_id())
)
WITH CHECK (
  public.dalzon_my_role() IN ('admin','direction','secretariat')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND s.school_id::text = public.dalzon_my_school_id())
);

DROP POLICY IF EXISTS dalzon_attendance_delete ON public.attendance;
CREATE POLICY dalzon_attendance_delete
ON public.attendance FOR DELETE TO authenticated
USING (
  public.dalzon_my_role() IN ('admin','direction')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND s.school_id::text = public.dalzon_my_school_id())
);

-- Paiements : comptabilité et administration gèrent ; famille consulte uniquement ses enfants.
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dalzon_payments_select ON public.payments;
CREATE POLICY dalzon_payments_select
ON public.payments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = payments.student_id
      AND (
        (
          public.dalzon_my_role() IN ('admin','direction','secretariat','gestion')
          AND s.school_id::text = public.dalzon_my_school_id()
        )
        OR s.user_id = auth.uid()
        OR s.parent_user_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS dalzon_payments_insert ON public.payments;
CREATE POLICY dalzon_payments_insert
ON public.payments FOR INSERT TO authenticated
WITH CHECK (
  public.dalzon_my_role() IN ('admin','direction','secretariat','gestion')
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = payments.student_id
      AND s.school_id::text = public.dalzon_my_school_id()
  )
);

DROP POLICY IF EXISTS dalzon_payments_update ON public.payments;
CREATE POLICY dalzon_payments_update
ON public.payments FOR UPDATE TO authenticated
USING (
  public.dalzon_my_role() IN ('admin','direction','gestion')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = payments.student_id AND s.school_id::text = public.dalzon_my_school_id())
)
WITH CHECK (
  public.dalzon_my_role() IN ('admin','direction','gestion')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = payments.student_id AND s.school_id::text = public.dalzon_my_school_id())
);

DROP POLICY IF EXISTS dalzon_payments_delete ON public.payments;
CREATE POLICY dalzon_payments_delete
ON public.payments FOR DELETE TO authenticated
USING (
  public.dalzon_my_role() IN ('admin','direction','gestion')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = payments.student_id AND s.school_id::text = public.dalzon_my_school_id())
);

NOTIFY pgrst, 'reload schema';
