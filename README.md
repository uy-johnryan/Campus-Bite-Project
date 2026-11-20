# CampusBite

## Updated Working Application

The updated CampusBite application includes the following functional features:

### Student and Faculty Features

- **Login and Registration:** Users can log in using their registered accounts. Students and faculty can create accounts using an `@my.xu.edu.ph` email address.
- **Input Validation:** Registration only accepts email addresses ending in `@my.xu.edu.ph`.
- **Home Page:** Displays food items retrieved from the MySQL database, including their names, prices, images, and availability.
- **Stall Selection:** Users can browse available cafeteria stalls and view their respective menus.
- **Favorites:** Users can add food items to their favorites and remove them when desired.
- **Profile:** Displays the information of the currently logged-in user.
- **Order Cart:** Users can add food items from both the Home page and Stall Menu page to their cart, adjust quantities, and remove items.
- **Checkout:** Users can review their orders and select an available payment method.
- **Order Tracking:** Users can monitor their orders and view status updates from vendors.

### Vendor Features

- **Vendor Login:** Vendors use specific accounts created directly in the MySQL database.
- **Vendor Dashboard:** Displays orders assigned to the vendor's respective stall.
- **Order Management:** Vendors can accept or reject incoming orders, update accepted orders to preparing, ready for pickup, and mark orders as completed or no-show after 30 minutes following the order being marked as ready for pickup.

### Vendor Login Accounts

The following test accounts are provided to access the CampusBite Vendor Dashboard.

| Stall | Email | Password |
|---|---|---|
| Chicky Fryday | chickyvendor@campusbite.com | `chickyvendor` |
| Gulaman District | gulamandistrictvendor@campusbite.com | `gulamandistrictvendor` |
| Fresh&Up | fresh&upvendor@campusbite.com | `fresh&upvendor` |

**Instructions:**

1. Open the CampusBite application.
2. Navigate to the login page.
3. Enter one of the vendor email addresses and its corresponding password.
4. Log in to access the assigned stall's Vendor Dashboard.

Each vendor account is assigned to its respective stall. Vendors can only manage orders belonging to their assigned stall.

**Important Note Regarding `vendor-dashboard.js`:**

- The `vendor-dashboard.js` file retrieves this information and checks whether the logged-in user's role is `vendor`.
- The vendor's `user_id` is used when retrieving and updating orders through the Flask API and  allows each vendor account to access and manage orders associated with its assigned stall.

---

## Testing Documentation/Results

The application was tested to verify that its main features work correctly and that information is properly retrieved from and stored in the MySQL database through the Flask API.

| Feature Tested | Testing Performed | Expected Result | Status |
|---|---|---|---|
| Student/Faculty Registration | Register using an `@my.xu.edu.ph` email address. | Account is successfully created and stored in the database. | Passed |
| Input Validation | Attempt registration using an email address outside the allowed domain. | Registration is rejected. | Passed |
| Student/Faculty Login | Log in using a registered student or faculty account. | User is redirected to the Home page. | Passed |
| Vendor Login | Log in using an assigned vendor account. | Vendor is redirected to the Vendor Dashboard. | Passed |
| Profile Page | Open the profile page after logging in. | The current user's information is displayed. | Passed |
| Stall Display | Open the Stalls page and retrieve stall information through the Flask API. | Available stalls are displayed correctly. | Passed |
| Food Menu | Select a stall and view its menu. | Food items, prices, images, and availability are displayed. | Passed |
| Favorites | Add and remove food items from favorites. | Changes are saved in the database and reflected on the Favorites page. | Passed |
| Order Cart | Add food items from the Home page or Stall Menu. | Selected items appear in the order cart with the correct quantities. | Passed |
| Vendor Order Management | Accept, reject, update, and complete orders. | Order statuses are successfully updated. | Passed |
| Order Tracking | Track an order using the student/faculty account. | The latest order status is displayed to the customer. | Passed |

---

# FOR INSTALLATION AND SETUP

## Prerequisites

Before running CampusBite, make sure the following are installed:

- Python
- MySQL Server
- MySQL Workbench
- Apache Cordova
- Node.js and npm
- Android Studio and Android SDK (for Android builds)

## Backend Setup

1. Open the project folder in your preferred code editor.
2. Open a terminal and navigate to the backend directory:

   ```bash
   cd backend
   ```

3. Create a Python virtual environment if one does not already exist:

   ```bash
   python -m venv venv
   ```

4. Activate the virtual environment on Windows:

   ```bash
   venv\Scripts\activate
   ```

5. Install the required Python packages:

   ```bash
   pip install -r requirements.txt
   ```

6. Configure the database connection using a `.env` file inside the `backend` directory:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=campusbite
   ```

   Replace `your_mysql_password` with your local MySQL password.

7. Make sure the `campusbite` database and the required tables are created in MySQL.

8. Start the Flask backend:

   ```bash
   python app.py
   ```

The API should be accessible at:

```text
http://127.0.0.1:5000
```

## Frontend Setup

1. Open another terminal in the main CampusBite project directory.
2. Make sure the Cordova project dependencies are installed.
3. Run the application using Cordova:

   ```bash
   cordova run android
   ```

To build the Android application:

```bash
cordova build android
```

**Important:** The frontend API URL must point to the computer running Flask. When testing on a physical Android device, `127.0.0.1` refers to the device itself, not your computer. Update the API base URL to your computer's local network IP address (e.g., `const API_BASE_URL = "http://192.168.1.5:5000";`) and make sure both devices are connected to the same network.