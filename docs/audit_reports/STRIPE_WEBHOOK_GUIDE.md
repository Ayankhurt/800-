# How to Get Stripe Webhook Secret (Pakistan/Global)

Since you are developing locally (`localhost`), you cannot simply copy a webhook signing secret from the Stripe Dashboard because Stripe cannot verify "localhost" URLs. You must use the **Stripe CLI**.

## Option 1: The "Local" Way (Recommended for Testing)

1.  **Download Stripe CLI**:
    Download the windows version from here: [https://github.com/stripe/stripe-cli/releases/latest](https://github.com/stripe/stripe-cli/releases/latest)
    (Look for `stripe_X.X.X_windows_x86_64.zip`)

2.  **Login**:
    Unzip it, open your terminal (PowerShell) in that folder and run:
    ```powershell
    .\stripe.exe login
    ```
    (It will open a browser window to pair with your account).

3.  **Start Listening**:
    Run this command to forward events to your local backend:
    ```powershell
    .\stripe.exe listen --forward-to localhost:5000/api/v1/payments/webhook
    ```

4.  **Copy the Secret**:
    The terminal will show a message like:
    > Ready! You are using Stripe API Version...
    > Your webhook signing secret is **whsec_...**

5.  **Update .env**:
    Copy that `whsec_...` code and paste it into your `.env` file:
    ```env
    STRIPE_WEBHOOK_SECRET=whsec_your_code_here
    ```

## Option 2: The "dashboard" Way (Only for Public URLs)

If you have deployed your backend to a public server (like Heroku, Vercel, or a VPS):

1. Go to **Stripe Dashboard** > **Developers** > **Webhooks**.
2. Click **Test in local mode** (or Add Endpoint).
3. If adding a real endpoint, enter your URL (e.g., `https://api.bidroom.com/api/v1/payments/webhook`).
4. Click **Add endpoint**.
5. Under "Signing Secret", click **Reveal**.
6. Copy that `whsec_...` string to your server's environment variables.

### Note on Pakistan
Since Stripe is not officially in Pakistan, ensure your Stripe account is set to "Test Mode" (toggle in top right of dashboard). For production, you usually need a registered business in a supported country (like US via Stripe Atlas or UK Ltd), but for **development and testing**, you can use the test keys freely.
