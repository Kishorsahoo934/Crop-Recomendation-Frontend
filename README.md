## FarmSathi Frontend

A simple multi-page frontend for **FarmSathi** built with **HTML, CSS and vanilla JavaScript (ES modules)**.  
It integrates with a FastAPI backend and uses **Firebase Authentication** (Email/Password + Google Sign-In).

### File structure

- **index.html**: Landing page with hero section and Get Started button.
- **dashboard.html**: Protected dashboard with feature cards.
- **crop-recommend.html**: Form that calls `/crop-recommend`.
- **fertilizer-recommend.html**: Form that calls `/fertilizer-recommend`.
- **disease-detect.html**: Image upload for `/predict-disease`.
- **survey.html**, **feedback.html**, **contact.html**: Simple protected forms with client-side validation.
- **styles.css**: Global styling and responsive layout.
- **firebase-config.js**: Firebase config and `API_BASE_URL` definition.
- **app.js**: Firebase initialization, auth logic, route protection, and API helpers.
- **chatbot-widget.js**: Floating chatbot button + modal calling `/chatbot`.

All pages share:

- Top navigation bar.
- Auth modal for login/signup with email/password and Google.
- Floating chatbot widget.

---

### 1. Prerequisites

- Node.js (for `npx http-server`) or Python 3 (for `python -m http.server`).
- A running **FastAPI backend** with the endpoints:
  - `POST /crop-recommend`
  - `POST /fertilizer-recommend`
  - `POST /predict-disease`
  - `POST /chatbot`

---

### 2. Firebase setup

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (or use an existing one).
3. In **Build → Authentication → Sign-in method**:
   - Enable **Email/Password**.
   - Enable **Google** provider and configure required fields.
4. In **Project settings → General**, under **Your apps**:
   - Add a **Web app**.
   - Copy the Firebase configuration.
5. Open `firebase-config.js` and ensure the config matches your project:

```js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

The repository already contains a working example config which you can keep or replace with your own keys.

---

### 3. Backend URL (`API_BASE_URL`)

In `firebase-config.js`:

```js
export const API_BASE_URL = "http://localhost:8000";
```

- For local development: keep `http://localhost:8000` (or change the port if your FastAPI app uses a different one).
- For production: change this to your deployed backend URL, e.g.:

```js
export const API_BASE_URL = "https://api.your-domain.com";
```

---

### 4. Running the frontend locally

From the project root (`K:\Farmsathi Ui Test` in your case), use **one** of the following:

- With Node:

```bash
npx http-server .
```

- With Python 3:

```bash
python -m http.server 8000
```

Then open `http://localhost:8080` (for `http-server`) or `http://localhost:8000` (for Python) in your browser and navigate to `index.html`.

> Note: Because we use ES modules, opening `index.html` directly with `file://` URLs will not work. Always use a local HTTP server.

---

### 5. Auth behavior & route protection

- **Get Started** button:
  - If **logged out**: opens the login/signup modal.
  - If **logged in**: redirects to `dashboard.html`.
- All feature pages (`dashboard.html`, `crop-recommend.html`, `fertilizer-recommend.html`, `disease-detect.html`, `survey.html`, `feedback.html`, `contact.html`) are **protected**:
  - If accessed while logged out, the auth modal opens.
  - After a successful login/signup, the user is redirected back to the page they wanted.
- Navbar:
  - When logged out: protected links are visually disabled.
  - When logged in: protected links are enabled and the navbar shows the user’s email/name and a **Sign Out** button.

Firebase session persistence is handled automatically by the SDK.

---

### 6. API integrations

All API calls are implemented in `app.js` using `fetch` with `FormData`.

- **Crop Recommendation**
  - Page: `crop-recommend.html`
  - Endpoint: `POST {API_BASE_URL}/crop-recommend`
  - Payload: `FormData` fields
    - `nitrogen`, `phosphorus`, `potassium`, `temperature`, `humidity`, `ph`, `rainfall`
  - Result: Displays `recommended_crop` / `crop` and optional `details`.

- **Fertilizer Recommendation**
  - Page: `fertilizer-recommend.html`
  - Endpoint: `POST {API_BASE_URL}/fertilizer-recommend`
  - Payload: `FormData` fields
    - `temp`, `humidity`, `moisture`, `nitrogen`, `phosphorous`, `potassium`, `ph`, `soil_type`, `crop_type`
  - Result: Displays `recommended_fertilizer` / `fertilizer` and optional `details`.

- **Crop Disease Detection**
  - Page: `disease-detect.html`
  - Endpoint: `POST {API_BASE_URL}/predict-disease`
  - Payload: `FormData` with file:
    - `file`: the uploaded image.
  - Result: Displays `predicted_disease`, `confidence`, and `recommendation` if provided.

- **Chatbot**
  - Used by: `chatbot-widget.js`
  - Endpoint: `POST {API_BASE_URL}/chatbot`
  - Payload: `FormData` with
    - `query`: user question.
  - Result: Shows response text in the chat window.

Errors are shown using small toast notifications and inline messages.

---

### 7. Testing the features

Once the frontend server and FastAPI backend are both running:

- **Auth**
  - Click **Get Started** on the landing page.
  - Use a new email/password to sign up or use **Continue with Google**.
  - After success, you should land on `dashboard.html`.

- **Crop Recommendation**
  - Go to `crop-recommend.html`.
  - Enter numeric values, for example:
    - Nitrogen: `90`, Phosphorus: `42`, Potassium: `43`,
    - Temperature: `22`, Humidity: `80`, pH: `6.5`, Rainfall: `200`.
  - Submit and check the recommended crop.

- **Fertilizer Recommendation**
  - Go to `fertilizer-recommend.html`.
  - Fill in temperature/humidity/moisture + NPK, pH, soil type, and crop type.
  - Submit and verify the fertilizer recommendation.

- **Disease Detection**
  - Go to `disease-detect.html`.
  - Upload a leaf image (JPEG/PNG).
  - Submit and check the predicted disease and recommendation.

- **Chatbot**
  - Click the **chat bubble** button in the bottom-right.
  - Ask a question like “What crop is good for high rainfall?”.
  - Verify the text response from the backend.

- **Survey / Feedback / Contact**
  - Fill out each form and submit.
  - Data is stored in `localStorage` under keys:
    - `farmsathi_survey`, `farmsathi_feedback`, `farmsathi_contact`.

---

### 8. Security notes

- Passwords are **never** stored in `localStorage` or manual cookies; only Firebase manages authentication tokens.
- Only non-sensitive form data is cached locally for demo purposes (survey, feedback, contact).
- When deploying, serve the site over **HTTPS** and configure Firebase auth domains accordingly.


