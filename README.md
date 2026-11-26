# 🐝 BasketBee – Full-Stack Grocery E-Commerce Platform

> **BasketBee** is a modern, production-grade grocery e-commerce web application inspired by the shopping experience, visual design, and category hierarchy of **BigBasket (bigbasket.com)**. Built for speed, freshness, and convenience, FRESHLY delivers groceries, farm-fresh fruits, vegetables, dairy, and household essentials in Indian currency (**₹ INR**) with rapid fulfillment.

---

## ⚡ Quick Start & Running the Project

You can run both Frontend and Backend concurrently from the root directory with a single command:

```bash
# In D:\Resume\GROCERy
npm run dev
```

This starts:
- 🚀 **Backend API:** `http://localhost:5000` (with automatic in-memory MongoDB fallback and auto-seeding)
- 💻 **Frontend Web App:** `http://localhost:5173` (Vite dev server)

### Individual Commands:
- Run backend only: `npm run backend` or `cd backend && npm run dev`
- Run frontend only: `npm run frontend` or `cd frontend && npm run dev`
- Build frontend: `npm --prefix frontend run build`
- Free occupied ports: `npm run clean` (cleans ports 5000 & 5173)

---

## 🛠️ Troubleshooting: Terminal Errors & Port Conflicts

### 1. `npm error Missing script: "dev"`
If you saw this error in your PowerShell terminal, it was because the command was executed before the root `package.json` was saved or inside a directory without a `dev` script.
**Solution:**
Ensure you are in the project root:
```bash
cd D:\Resume\GROCERy
npm run dev
```

### 2. `[nodemon] app crashed - waiting for file changes before starting...`
This occurs when port 5000 is occupied by an older hanging Node process or during active file writes.
**Solution:**
Free port 5000 and restart:
```bash
npx kill-port 5000 5173
npm run dev
```

---

## 🌟 Highlights & New Features

### 📍 1. Delivery Location & PIN Code Serviceability (BigBasket-Style)
- **Header Delivery Badge:** Displays `📍 Delivering to [ Locality, PIN code ]` in the top navbar. Clicking opens the location selector popup.
- **GPS Location Detection:** Uses browser Geolocation API with user permission and reverse geocodes coordinates into an Indian delivery address (via OpenStreetMap Nominatim), with manual fallback if permission is denied.
- **PIN Code Verification:** Checks 6-digit Indian PIN codes against MongoDB delivery zones.
  - *Example 226016:* `✓ Delivery available at Indira Nagar, Lucknow (226016)! (Estimated 30-45 mins)`
  - *Example 560001:* `Sorry! Delivery is not currently available at this PIN code.`
- **Initial Supported Lucknow Zones (Pre-seeded):**
  - `226016` – Indira Nagar (Est: 30-45 mins, Fee: ₹29, Free above ₹499)
  - `226010` – Gomti Nagar (Est: 30-40 mins, Fee: ₹29, Free above ₹499)
  - `226001` – Hazratganj (Est: 25-35 mins, Fee: ₹29, Free above ₹499)
  - `226006` – Mahanagar (Est: 30-40 mins, Fee: ₹29, Free above ₹499)
  - `226024` – Vikas Nagar (Est: 35-50 mins, Fee: ₹29, Free above ₹499)
  - `226021` – Jankipuram (Est: 40-55 mins, Fee: ₹35, Free above ₹599)
  - `226028` – Alambagh (Est: 45-60 mins, Fee: ₹39, Free above ₹599)
  - `226004` – Chowk (Est: 35-45 mins, Fee: ₹29, Free above ₹499)
- **Saved Addresses Management:**
  - View, select, edit, delete, and set default addresses in Location Modal and Profile page.
  - Fields: Full Name, Phone, House/Flat No, Building/Apartment, Street/Area, Landmark, City, State, PIN code, Address Type (Home/Work/Other).
- **Checkout Enforcement:** Validates PIN code serviceability before order placement; prevents orders to unserviceable PIN codes with helpful guidance.
- **Admin Delivery Hub Console:** Administrators can add new delivery PIN codes, toggle active/disabled status, update fees, and manage delivery times directly in the Admin Dashboard (`/admin`).

---

### 📱 2. BigBasket-Style Authentication (Mobile OTP & Email)
- **Modal + Dedicated Pages:** Seamless popup accessible from Navbar and Cart, plus full `/login` and `/register` routes.
- **Option A: Mobile & OTP (Fast Sign In / Sign Up):**
  - Indian `+91` prefix with 10-digit validation.
  - 6 individual digit input boxes `[ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]`.
  - Auto-focus next digit, backspace navigation, and full 6-digit paste support.
  - 60-second countdown timer for Resend OTP.
  - Automatic user creation for new mobile numbers with name prompt.
  - **SMS Provider & Mock Dev Mode:**
    - Integrated with Twilio and MSG91 abstraction (`backend/utils/smsService.js`).
    - In development mode (`NODE_ENV !== 'production'`), an interactive **Dev Mode OTP Banner** displays the generated code and provides a 1-click **Auto-Fill & Verify** button for fast testing without consuming SMS credits!
- **Option B: Email & Password:**
  - Standard email login, password toggle visibility (eye icon), remember me, and forgot password flow.
  - 1-click evaluator demo credentials (Customer & Admin).

---

### 🛒 3. Product Catalog & Realistic BigBasket Pricing (₹ INR)
- **93 Verified Products:** Accurately categorized across 8 supermarket aisles with realistic Indian grocery pricing and verified product imagery:
  - Fruits: Apple Shimla (₹149/kg), Banana Robusta (₹55/kg), Mango (₹129/kg), Pomegranate (₹189/kg), Watermelon (₹35/kg)...
  - Vegetables: Potato (₹30/kg), Onion (₹35/kg), Tomato (₹40/kg), Cauliflower (₹35/pc), Green Peas (₹65/500g)...
  - Dairy & Bakery: Amul Butter (₹58), Amul Cheese (₹135), Paneer (₹90), Amul Ghee (₹320), Brown Bread (₹48)...
  - Staples: Basmati Rice (₹125/kg), Aashirvaad Atta (₹275/5kg), Toor Dal (₹155/kg), Moong Dal (₹120/kg)...
  - Oil & Spices: Fortune Sunflower Oil (₹145/L), Mustard Oil (₹160/L), Tata Salt (₹28/kg), Haldi, Lal Mirch, Jeera...
  - Snacks & Beverages: Maggi 4-pack (₹56), Parle-G (₹28), Tata Tea Gold (₹140), Coca-Cola (₹40), Nescafe (₹185)...
  - Personal Care & Household: Dettol (₹99), Surf Excel (₹145), Vim Bar (₹22), Harpic (₹99), Lizol (₹115)...
  - Meat & Seafood: Fresh Chicken Curry Cut (₹220/kg), Rohu Fish Steaks (₹280/kg), Mutton Curry Cut (₹680/kg)...
- **Transforming Quantity Stepper:** BigBasket `[ ADD ]` button transforms into `[ - ] [ qty ] [ + ]` on click.
- **Savings & Coupons:**
  - `FRESH50`: Flat ₹50 off on orders ₹399+
  - `FRESH100`: Flat ₹100 off on orders ₹799+
  - `SAVE10`: 10% off up to ₹150 on orders ₹499+
  - `FREESHIP`: 100% Free delivery on any order

---

## 🔑 Demo Credentials

| Role | Email / Mobile | Password / OTP | Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@freshly.com` | `Admin@123` | Full Admin Console, Delivery PIN Codes, Catalog & Order Management |
| **Customer** | `customer@freshly.com` | `Customer@123` | Shopping basket, Lucknow saved address, Order Tracking |
| **Mobile OTP User** | Any 10-digit number (e.g. `9876543210`) | Auto-filled dev OTP | Fast Mobile Sign-In & Checkout |

---

## ⚙️ Environment Variables (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/freshly
JWT_SECRET=freshly_supermarket_jwt_secret_key_2026_secure
CLIENT_URL=http://localhost:5173

# Optional: Real SMS Provider Credentials (Twilio or MSG91)
# Leave blank to use built-in Development Mock Mode with auto-fill
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
MSG91_AUTH_KEY=
MSG91_SENDER_ID=
MSG91_TEMPLATE_ID=

# Optional: Stripe Checkout Test Credentials
STRIPE_SECRET_KEY=sk_test_...
```

---

## 📜 License
Developed for FRESHLY Supermarket. BigBasket-inspired e-commerce platform.
