# AgroMart - PWA E-commerce Store

AgroMart is a simple, installable Progressive Web App (PWA) e-commerce site for agricultural products. It's built with Vanilla JS, Tailwind CSS, Supabase, and Netlify.

## Features

-   Public product listings
-   User authentication (Sign Up/Login)
-   Admin role for product management
-   Persistent shopping cart using `localStorage`
-   Two checkout options: Pay on Delivery (WhatsApp) and Pay Now (Bank Transfer)
-   "Become a Supplier" contact form
-   Installable as a PWA on mobile and desktop

## Project Structure

The project is organized as follows:

-   `netlify.toml`: Netlify deployment and build settings.
-   `netlify/functions/`: Serverless functions for backend logic.
-   `public/`: Static assets like the PWA manifest and icons.
-   `src/`: The main frontend application source code (HTML, JS).
-   `dist/`: The build output directory (created by Netlify).

## Setup and Deployment

Follow these steps to get your own instance of AgroMart running.

### 1. Supabase Setup

1.  **Create a Supabase Project:** Go to [supabase.com](https://supabase.com), create a new project.
2.  **Get API Keys:** In your Supabase project dashboard, go to **Project Settings > API**. You will need:
    *   `Project URL` (this is your `SUPABASE_URL`)
    *   `Project API keys` > `anon` `public` key (this is your `SUPABASE_ANON_KEY`)
    *   `Project API keys` > `service_role` `secret` key (this is your `SUPABASE_SERVICE_KEY`)
3.  **Run SQL Script:** Go to the **SQL Editor** in your Supabase dashboard. Copy the entire content of the provided `Supabase SQL` section from the project brief and run it. This will create the necessary tables (`profiles`, `products`, `orders`, `order_items`) and Row Level Security (RLS) policies.

### 2. Netlify Deployment

1.  **Fork/Clone this Repository:** Get a copy of this repository on your GitHub/GitLab account.
2.  **Create a New Netlify Site:** Go to your Netlify dashboard and create a new site linked to your repository.
3.  **Configure Build Settings:** Netlify should automatically detect the settings from `netlify.toml`. If you need to set them manually:
    *   **Base directory:** `agromart`
    *   **Build command:** `mkdir -p dist && cp -r src/. dist/ && cp -r public/. dist/`
    *   **Publish directory:** `dist`
4.  **Set Environment Variables:** In your Netlify site's settings, go to **Site settings > Build & deploy > Environment**. Add the following environment variables:

| Key | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_ANON_KEY` | Your Supabase `anon` public key |
| `SUPABASE_SERVICE_KEY` | Your Supabase `service_role` secret key |
| `SITE_WHATSAPP_MSISDN` | `2348063924891` (or your number) |
| `BANK_NAME` | "Your Bank Plc" |
| `BANK_ACCOUNT_NAME` | "Your Registered Name" |
| `BANK_ACCOUNT_NUMBER` | "0000000000" |

5.  **Deploy:** Trigger a deploy from the Netlify UI.

### 3. Become an Admin

To add products, you need to have an `admin` role.

1.  **Sign Up:** Go to your newly deployed AgroMart site and create a new user account.
2.  **Get Your User ID:** In your Supabase dashboard, go to **Authentication** and find the user you just created. Copy the `UID`.
3.  **Promote to Admin:** Go to the **SQL Editor** and run the following command, replacing `<YOUR_USER_ID>` with the ID you copied:
    ```sql
    update profiles set role='admin' where id = '<YOUR_USER_ID>';
    ```
4.  **Seed Products (Optional):** To add some initial products, run the `seed products` SQL from the brief in the SQL Editor. Make sure you are logged in on the site when you do this so `auth.uid()` resolves correctly.
    ```sql
    -- Make sure you are logged into your site before running this
    insert into products (title, subtitle, price_min, price_max, unit, image_url, created_by)
    values
    ('Palm Oil', 'Pure, unrefined palm oil.', 5000, 23500, '1L–25L', 'https://placehold.co/400x400?text=Palm+Oil', auth.uid()),
    ('Garri', 'High-quality cassava flakes', 1500, 7000, '1kg–5kg', 'https://placehold.co/400x400?text=Garri', auth.uid());
    ```

## Testing Checklist

-   [ ] **PWA:** Can you install the app on your mobile browser?
-   [ ] **Products:** Does the product list load for anonymous users?
-   [ ] **Auth:** Can you sign up and log in?
-   [ ] **Admin:** After promoting your user, can you add/edit/delete products? (Note: The UI for this is not part of the initial MVP, but the RLS policies should enforce it).
-   [ ] **Cart:** Does adding a product to the order update the cart? Does the cart persist after a page refresh?
-   [ ] **Checkout (POD):** Does the "Pay on Delivery" option create an order and open WhatsApp with the correct pre-filled message?
-   [ ] **Checkout (Pay Now):** Does the "Pay Now" option create an order, show the correct bank details, and provide a WhatsApp link for sending proof?
-   [ ] **Supplier Form:** Does submitting the "Become a Supplier" form trigger a Netlify Form submission notification to `reach.samueloke@gmail.com`?

## Important Notes

-   **Icons:** The PWA icons in `public/icons/` are placeholders. You should replace them with your own 192x192 and 512x512 pixel PNG images.
-   **Admin UI:** The current MVP does not include a user interface for admins to manage products. This must be done directly in the Supabase database for now. The security policies are in place to only allow users with the `admin` role to perform these actions via an API if one were to be built.
