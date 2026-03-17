-- Run this in your Supabase SQL Editor to create the initial OCS admin account
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    user_email text := 'danielidrissa12files@gmail.com';
    user_password text := '@Dani2233#';
    encrypted_pw text;
BEGIN
    -- Hash the password using pgcrypto
    encrypted_pw := crypt(user_password, gen_salt('bf'));

    -- 1. Create the Auth User
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        is_sso_user
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        user_email,
        encrypted_pw,
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "ocs", "full_name": "Daniel Idrissa", "badge_number": "OCS-001"}',
        FALSE,
        FALSE
    );

    -- 2. Create the Auth Identity (provider_id must be the email for the email provider!)
    INSERT INTO auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at,
        id
    ) VALUES (
        user_email, -- Fix: Supabase GoTrue expects the email string here
        new_user_id,
        format('{"sub": "%s", "email": "%s"}', new_user_id, user_email)::jsonb,
        'email',
        now(),
        now(),
        gen_random_uuid()
    );

    -- 3. Create the Public Profile
    INSERT INTO public.profiles (
        id,
        full_name,
        role,
        badge_number
    ) VALUES (
        new_user_id,
        'Daniel Idrissa',
        'ocs',
        'OCS-001'
    );
END $$;
