# 🌐 NETWORK TROUBLESHOOTING GUIDE

## 🔴 ERROR: Network Error / Cannot Connect
Your app is unable to reach the backend server at `http://192.168.1.110:5000`.

### 🔍 DIAGNOSTIC STEPS

1.  **Check IP Address:**
    - Your PC IP is currently `192.168.1.110`.
    - Ensure your `app/.env` or `app/config/api.ts` points to this IP.
    - **Verify:** Run `ipconfig` in terminal to confirm IP hasn't changed.

2.  **Firewall Blocking (Most Likely):**
    - Windows Firewall often blocks incoming connections to Node.js.
    - **FIX:**
        1. Open "Windows Defender Firewall".
        2. Click "Allow an app or feature through Windows Defender Firewall".
        3. Find `node` or `Node.js JavaScript Runtime`.
        4. Ensure both **Private** and **Public** boxes are checked.
        5. Click OK.

3.  **Same Network:**
    - Ensure your Phone and PC are on the **Same Wi-Fi Network**.
    - If using **Mobile Data**, it won't work.

4.  **Backend Server:**
    - Ensure backend is running: `npm run dev` in `backend` folder.
    - Test locally: Open `http://localhost:5000/api/health` in your PC browser. If it works, server is fine.

### 📱 IF USING ANDROID EMULATOR
- Emulator cannot see `192.168.1.110` reliably.
- Use `http://10.0.2.2:5000` instead.
- Update `app/config/api.ts` or `.env`.

---

# ✅ BUG FIX STATUS

### 1. Appointments 500 Error -> FIXED
- **Fixed:** Added validation to prevent app crash on invalid dates.
- **Why it was hidden:** Old appointments had corrupt dates (`1628267...`) which the app filters out to prevent crashing.
- **Action:** Create a **NEW** appointment. It will appear correctly.

### 2. Chat/Conversations 404 Error -> FIXED
- **Fixed:** Updated API endpoints to `/messages/conversations`.
- **Action:** Reload the app completely. Chat will work once Network is fixed.
