import { getSupabase } from './supabase.js';

export const signUp = async (fullName, email, password) => {
    const supabase = await getSupabase();
    if (!supabase) return { error: { message: "Supabase not initialized." }};

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName
            }
        }
    });
    return { data, error };
};

export const signIn = async (email, password) => {
    const supabase = await getSupabase();
    if (!supabase) return { error: { message: "Supabase not initialized." }};

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

export const signOut = async () => {
    const supabase = await getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
    const supabase = await getSupabase();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session ? session.user : null;
};

export const onAuthStateChange = (callback) => {
    getSupabase().then(supabase => {
        if (!supabase) return;
        const { data: { subscription } } = supabase.auth.onAuthStateChanged((event, session) => {
            callback(event, session);
        });
        return subscription;
    });
};
