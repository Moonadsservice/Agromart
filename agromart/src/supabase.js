// The Supabase client is imported from the Supabase CDN.
// This is an intentional choice for this project because it's a "Vanilla JS"
// application without a bundler (like Webpack or Rollup). In this setup,
// the browser handles the ES Module import directly from the CDN URL.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabase = null;

const initSupabase = async () => {
    if (supabase) {
        return supabase;
    }

    try {
        // Fetch the public config from our Netlify function
        const response = await fetch('/api/util');
        if (!response.ok) {
            throw new Error('Failed to fetch Supabase config.');
        }
        const config = await response.json();

        const SUPABASE_URL = config.SUPABASE_URL;
        const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Supabase URL or Anon Key is missing from config.');
        }

        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        console.log('Supabase client initialized.');
        return supabase;

    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        // Display a user-friendly error message in the app
        const appElement = document.getElementById('app');
        if(appElement) {
            appElement.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Error!</strong>
                <span class="block sm:inline">Could not connect to the backend. Please try again later.</span>
            </div>`;
        }
        return null;
    }
};

// Export a function that returns the initialized client
export const getSupabase = async () => {
    if (!supabase) {
        return await initSupabase();
    }
    return supabase;
};
