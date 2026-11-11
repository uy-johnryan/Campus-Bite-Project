from flask import Flask, jsonify, request
from werkzeug.security import generate_password_hash
from flask_cors import CORS
from mysql.connector import Error   
from database import get_db_connection
from werkzeug.security import check_password_hash

app = Flask(__name__)

# Allows the frontend to communicate with the backend during development
CORS(app)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "CampusBite API is running!"
    })
    

@app.route("/api/db-test", methods=["GET"])
def test_database():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT DATABASE()")
        result = cursor.fetchone()

        return jsonify({
            "success": True,
            "message": "Successfully connected to MySQL!",
            "database": result[0]
        })

    except Error:
        app.logger.exception("MySQL connection failed.")

        return jsonify({
            "success": False,
            "message": "Could not connect to MySQL. Check your database settings."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@app.route("/api/stalls", methods=["GET"])
def get_stalls():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT stall_id, stall_name, description, logo, rating, status
            FROM stalls
            ORDER BY stall_name
        """)

        stalls = cursor.fetchall()

        # Convert MySQL DECIMAL values into JSON-compatible numbers
        for stall in stalls:
            if stall["rating"] is not None:
                stall["rating"] = float(stall["rating"])

        return jsonify({
            "success": True,
            "stalls": stalls
        })

    except Error:
        app.logger.exception("Failed to retrieve stalls.")
        return jsonify({
            "success": False,
            "message": "Could not retrieve stalls."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@app.route("/api/stalls/<int:stall_id>/menu", methods=["GET"])
def get_menu_items(stall_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check whether the stall exists
        cursor.execute(
            "SELECT stall_id FROM stalls WHERE stall_id = %s",
            (stall_id,)
        )

        stall = cursor.fetchone()

        if not stall:
            return jsonify({
                "success": False,
                "message": "Stall not found."
            }), 404

        # Retrieve all menu items belonging to that stall
        cursor.execute("""
            SELECT item_id, stall_id, item_name, description,
                   price, image, category, availability
            FROM menu_items
            WHERE stall_id = %s
            ORDER BY item_name
        """, (stall_id,))

        menu_items = cursor.fetchall()

        for item in menu_items:
            item["price"] = float(item["price"])
            item["availability"] = bool(item["availability"])

        return jsonify({
            "success": True,
            "menu_items": menu_items
        })

    except Error:
        app.logger.exception("Failed to retrieve menu items.")
        return jsonify({
            "success": False,
            "message": "Could not retrieve menu items."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@app.route("/api/orders", methods=["POST"])
def create_orders():
    connection = None
    cursor = None

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "Invalid request data."
            }), 400

        customer_id = data.get("customer_id")
        payment_method = data.get("payment_method")
        items = data.get("items")

        # Validate customer ID
        if not isinstance(customer_id, int) or customer_id <= 0:
            return jsonify({
                "success": False,
                "message": "A valid customer ID is required."
            }), 400

        # Validate payment method
        if payment_method not in ["cash", "gcash"]:
            return jsonify({
                "success": False,
                "message": "Invalid payment method."
            }), 400

        # Validate cart
        if not isinstance(items, list) or not items:
            return jsonify({
                "success": False,
                "message": "Your cart is empty."
            }), 400

        connection = get_db_connection()
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        # Check whether the customer exists
        cursor.execute("""
            SELECT user_id
            FROM users
            WHERE user_id = %s
            AND role IN ('student', 'faculty')
        """, (customer_id,))

        customer = cursor.fetchone()

        if not customer:
            connection.rollback()
            return jsonify({
                "success": False,
                "message": "Customer account not found."
            }), 404

        # Combine duplicate cart items and validate quantities
        cart_items = {}

        for item in items:
            item_id = item.get("item_id")
            stall_id = item.get("stall_id")
            quantity = item.get("quantity")

            if (
                not isinstance(item_id, int) or item_id <= 0 or
                not isinstance(stall_id, int) or stall_id <= 0 or
                not isinstance(quantity, int) or quantity <= 0
            ):
                connection.rollback()
                return jsonify({
                    "success": False,
                    "message": "Invalid cart item or quantity."
                }), 400

            key = (item_id, stall_id)
            cart_items[key] = cart_items.get(key, 0) + quantity

        # Group verified items by stall
        orders_by_stall = {}

        for (item_id, stall_id), quantity in cart_items.items():

            # Check whether the stall is open
            cursor.execute("""
                SELECT stall_id, stall_name, status
                FROM stalls
                WHERE stall_id = %s
                FOR UPDATE
            """, (stall_id,))

            stall = cursor.fetchone()

            if not stall or stall["status"] != "open":
                connection.rollback()
                return jsonify({
                    "success": False,
                    "message": "One of the selected stalls is unavailable."
                }), 400

            # Retrieve the actual item price and availability
            cursor.execute("""
                SELECT item_id, item_name, price, availability
                FROM menu_items
                WHERE item_id = %s AND stall_id = %s
                FOR UPDATE
            """, (item_id, stall_id))

            menu_item = cursor.fetchone()

            if not menu_item or not menu_item["availability"]:
                connection.rollback()
                return jsonify({
                    "success": False,
                    "message": "One of your selected items is unavailable."
                }), 400

            if stall_id not in orders_by_stall:
                orders_by_stall[stall_id] = {
                    "items": [],
                    "subtotal": 0
                }

            price = menu_item["price"]

            orders_by_stall[stall_id]["items"].append({
                "item_id": item_id,
                "quantity": quantity,
                "price": price
            })

            orders_by_stall[stall_id]["subtotal"] += price * quantity

        # Create one order for each stall
        created_orders = []

        for stall_id, stall_order in orders_by_stall.items():

            service_fee = 5
            total_amount = stall_order["subtotal"] + service_fee

            cursor.execute("""
                INSERT INTO orders (
                    customer_id,
                    stall_id,
                    total_amount,
                    payment_method,
                    payment_status,
                    order_status
                )
                VALUES (%s, %s, %s, %s, 'pending', 'pending')
            """, (
                customer_id,
                stall_id,
                total_amount,
                payment_method
            ))

            order_id = cursor.lastrowid

            # Save each item belonging to this order
            for item in stall_order["items"]:
                cursor.execute("""
                    INSERT INTO order_items (
                        order_id,
                        item_id,
                        quantity,
                        price
                    )
                    VALUES (%s, %s, %s, %s)
                """, (
                    order_id,
                    item["item_id"],
                    item["quantity"],
                    item["price"]
                ))

            created_orders.append({
                "order_id": order_id,
                "stall_id": stall_id,
                "subtotal": float(stall_order["subtotal"]),
                "service_fee": service_fee,
                "total_amount": float(total_amount)
            })

        # Save all stall orders together
        connection.commit()

        return jsonify({
            "success": True,
            "message": "Orders successfully submitted!",
            "orders": created_orders
        }), 201

    except Error:
        if connection and connection.is_connected():
            connection.rollback()

        app.logger.exception("Failed to submit orders.")

        return jsonify({
            "success": False,
            "message": "Could not submit your orders. Please try again."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Get all orders belonging to a customer
@app.route("/api/orders/customer/<int:customer_id>", methods=["GET"])
def get_customer_orders(customer_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                o.order_id,
                o.customer_id,
                o.stall_id,
                s.stall_name,
                o.total_amount,
                o.payment_method,
                o.payment_status,
                o.order_status,
                o.created_at
            FROM orders o
            JOIN stalls s ON o.stall_id = s.stall_id
            WHERE o.customer_id = %s
            ORDER BY o.created_at DESC
        """, (customer_id,))

        orders = cursor.fetchall()

        for order in orders:
            cursor.execute("""
                SELECT
                    m.item_name,
                    oi.quantity,
                    oi.price
                FROM order_items oi
                JOIN menu_items m ON oi.item_id = m.item_id
                WHERE oi.order_id = %s
            """, (order["order_id"],))

            order["items"] = cursor.fetchall()

            subtotal = sum(
                float(item["price"]) * item["quantity"]
                for item in order["items"]
            )

            order["subtotal"] = round(subtotal, 2)
            order["service_fee"] = round(
                float(order["total_amount"]) - subtotal, 2
            )

            order["total_amount"] = float(order["total_amount"])

            order["created_at"] = (
                order["created_at"].isoformat()
                if order["created_at"] else None
            )

            for item in order["items"]:
                item["price"] = float(item["price"])

        return jsonify({
            "success": True,
            "orders": orders
        }), 200

    except Error:
        app.logger.exception("Failed to retrieve customer orders.")

        return jsonify({
            "success": False,
            "message": "Unable to retrieve orders."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Get details of one specific order
@app.route("/api/orders/<int:order_id>", methods=["GET"])
def get_order_details(order_id):
    connection = None
    cursor = None

    try:
        customer_id = request.args.get("customer_id", type=int)

        if not customer_id:
            return jsonify({
                "success": False,
                "message": "Customer ID is required."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                o.order_id,
                o.customer_id,
                o.stall_id,
                s.stall_name,
                u.username,
                o.total_amount,
                o.payment_method,
                o.payment_status,
                o.order_status,
                o.created_at
            FROM orders o
            JOIN stalls s ON o.stall_id = s.stall_id
            JOIN users u ON o.customer_id = u.user_id
            WHERE o.order_id = %s
            AND o.customer_id = %s
        """, (order_id, customer_id))

        order = cursor.fetchone()

        if not order:
            return jsonify({
                "success": False,
                "message": "Order not found."
            }), 404

        cursor.execute("""
            SELECT
                m.item_name,
                oi.quantity,
                oi.price
            FROM order_items oi
            JOIN menu_items m ON oi.item_id = m.item_id
            WHERE oi.order_id = %s
        """, (order_id,))

        order["items"] = cursor.fetchall()

        subtotal = sum(
            float(item["price"]) * item["quantity"]
            for item in order["items"]
        )

        order["subtotal"] = round(subtotal, 2)
        order["service_fee"] = round(
            float(order["total_amount"]) - subtotal, 2
        )

        order["total_amount"] = float(order["total_amount"])

        order["created_at"] = (
            order["created_at"].isoformat()
            if order["created_at"] else None
        )

        for item in order["items"]:
            item["price"] = float(item["price"])

        return jsonify({
            "success": True,
            "order": order
        }), 200

    except Error:
        app.logger.exception("Failed to retrieve order details.")

        return jsonify({
            "success": False,
            "message": "Unable to retrieve order details."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Get orders assigned to a vendor's stall
@app.route("/api/vendor/<int:vendor_id>/orders", methods=["GET"])
def get_vendor_orders(vendor_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Verify vendor account and retrieve assigned stall
        cursor.execute("""
            SELECT user_id, stall_id
            FROM users
            WHERE user_id = %s
            AND role = 'vendor'
        """, (vendor_id,))

        vendor = cursor.fetchone()

        if not vendor or not vendor["stall_id"]:
            return jsonify({
                "success": False,
                "message": "Vendor account or stall assignment not found."
            }), 404

        # Retrieve orders belonging only to the vendor's stall
        cursor.execute("""
            SELECT
                o.order_id,
                o.customer_id,
                u.username,
                o.stall_id,
                s.stall_name,
                o.total_amount,
                o.payment_method,
                o.payment_status,
                o.order_status,
                o.created_at
            FROM orders o
            JOIN users u ON o.customer_id = u.user_id
            JOIN stalls s ON o.stall_id = s.stall_id
            WHERE o.stall_id = %s
            ORDER BY o.created_at DESC
        """, (vendor["stall_id"],))

        orders = cursor.fetchall()

        for order in orders:
            cursor.execute("""
                SELECT
                    m.item_name,
                    oi.quantity,
                    oi.price
                FROM order_items oi
                JOIN menu_items m ON oi.item_id = m.item_id
                WHERE oi.order_id = %s
            """, (order["order_id"],))

            order["items"] = cursor.fetchall()

            subtotal = sum(
                float(item["price"]) * item["quantity"]
                for item in order["items"]
            )

            order["subtotal"] = round(subtotal, 2)
            order["service_fee"] = round(
                float(order["total_amount"]) - subtotal, 2
            )

            order["total_amount"] = float(order["total_amount"])

            order["created_at"] = (
                order["created_at"].isoformat()
                if order["created_at"] else None
            )

            for item in order["items"]:
                item["price"] = float(item["price"])

        return jsonify({
            "success": True,
            "stall_id": vendor["stall_id"],
            "orders": orders
        }), 200

    except Error:
        app.logger.exception("Failed to retrieve vendor orders.")

        return jsonify({
            "success": False,
            "message": "Unable to retrieve vendor orders."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Update an order's status by its assigned vendor
@app.route(
    "/api/vendor/<int:vendor_id>/orders/<int:order_id>/status",
    methods=["PATCH"]
)
def update_vendor_order_status(vendor_id, order_id):
    connection = None
    cursor = None

    try:
        data = request.get_json(silent=True)

        if not data or not isinstance(data.get("status"), str):
            return jsonify({
                "success": False,
                "message": "A valid order status is required."
            }), 400

        new_status = data["status"].strip().lower()

        allowed_transitions = {
            "pending": ["accepted", "rejected"],
            "accepted": ["preparing"],
            "preparing": ["ready"],
            "ready": ["completed", "no_show"]
        }

        connection = get_db_connection()
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        # Verify vendor account and assigned stall
        cursor.execute("""
            SELECT user_id, stall_id
            FROM users
            WHERE user_id = %s
            AND role = 'vendor'
            FOR UPDATE
        """, (vendor_id,))

        vendor = cursor.fetchone()

        if not vendor or not vendor["stall_id"]:
            connection.rollback()
            return jsonify({
                "success": False,
                "message": "Vendor account or stall assignment not found."
            }), 404

        # Verify that the order belongs to this vendor's stall
        cursor.execute("""
            SELECT order_id, order_status
            FROM orders
            WHERE order_id = %s
            AND stall_id = %s
            FOR UPDATE
        """, (order_id, vendor["stall_id"]))

        order = cursor.fetchone()

        if not order:
            connection.rollback()
            return jsonify({
                "success": False,
                "message": "Order not found or not assigned to your stall."
            }), 404

        current_status = order["order_status"]

        if new_status not in allowed_transitions.get(current_status, []):
            connection.rollback()
            return jsonify({
                "success": False,
                "message": (
                    f"Cannot change order from {current_status} "
                    f"to {new_status}."
                )
            }), 400

        # Update order status
        cursor.execute("""
            UPDATE orders
            SET order_status = %s
            WHERE order_id = %s
            AND stall_id = %s
        """, (new_status, order_id, vendor["stall_id"]))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Order status successfully updated.",
            "order_id": order_id,
            "old_status": current_status,
            "new_status": new_status
        }), 200

    except Error:
        if connection and connection.is_connected():
            connection.rollback()

        app.logger.exception("Failed to update vendor order status.")

        return jsonify({
            "success": False,
            "message": "Unable to update order status."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Vendor Login API
@app.route("/api/vendor/login", methods=["POST"])
def vendor_login():
    connection = None
    cursor = None

    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "Invalid request data."
            }), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and password are required."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                u.user_id,
                u.username,
                u.email,
                u.password,
                u.role,
                u.stall_id,
                s.stall_name
            FROM users u
            LEFT JOIN stalls s ON u.stall_id = s.stall_id
            WHERE u.email = %s
            AND u.role = 'vendor'
        """, (email,))

        vendor = cursor.fetchone()

        # Verify vendor account and password
        if not vendor or not vendor["password"]:
            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        if not check_password_hash(vendor["password"], password):
            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        if not vendor["stall_id"]:
            return jsonify({
                "success": False,
                "message": "Your account has no assigned stall."
            }), 403

        return jsonify({
            "success": True,
            "message": "Vendor login successful!",
            "vendor": {
                "user_id": vendor["user_id"],
                "username": vendor["username"],
                "email": vendor["email"],
                "stall_id": vendor["stall_id"],
                "stall_name": vendor["stall_name"]
            }
        }), 200

    except Error:
        app.logger.exception("Vendor login failed.")

        return jsonify({
            "success": False,
            "message": "Unable to process vendor login."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Student Registration API
@app.route("/api/register", methods=["POST"])
def register_student():
    connection = None
    cursor = None

    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "success": False,
                "message": "Invalid request data."
            }), 400

        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        # Validate input types
        if not all(isinstance(value, str) for value in [username, email, password]):
            return jsonify({
                "success": False,
                "message": "Please provide a valid name, email, and password."
            }), 400

        username = username.strip()
        email = email.strip().lower()

        # Validate required fields
        if not username or not email or not password:
            return jsonify({
                "success": False,
                "message": "All fields are required."
            }), 400

        if len(username) > 50:
            return jsonify({
                "success": False,
                "message": "Name must not exceed 50 characters."
            }), 400

        # Allow only XU student email addresses
        if email.count("@") != 1 or not email.endswith("@my.xu.edu.ph"):
            return jsonify({
                "success": False,
                "message": "Only @my.xu.edu.ph email addresses are allowed."
            }), 403

        # Require a minimum password length
        if len(password) < 8:
            return jsonify({
                "success": False,
                "message": "Password must be at least 8 characters."
            }), 400

        # Hash the password
        hashed_password = generate_password_hash(password)

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check whether the email is already registered
        cursor.execute("""
            SELECT user_id
            FROM users
            WHERE email = %s
        """, (email,))

        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({
                "success": False,
                "message": "This email is already registered."
            }), 409

        # Insert the new student account
        cursor.execute("""
            INSERT INTO users (
                username,
                email,
                password,
                role
            )
            VALUES (%s, %s, %s, 'student')
        """, (username, email, hashed_password))

        user_id = cursor.lastrowid

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Student registration successful!",
            "user": {
                "user_id": user_id,
                "username": username,
                "email": email,
                "role": "student"
            }
        }), 201

    except Error:
        if connection and connection.is_connected():
            connection.rollback()

        app.logger.exception("Student registration failed.")

        return jsonify({
            "success": False,
            "message": "Unable to register. Please try again."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()



# Shared Student and Vendor Login API
@app.route("/api/login", methods=["POST"])
def login():
    connection = None
    cursor = None

    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "success": False,
                "message": "Invalid request data."
            }), 400

        email = data.get("email")
        password = data.get("password")

        if not isinstance(email, str) or not isinstance(password, str):
            return jsonify({
                "success": False,
                "message": "Please provide a valid email and password."
            }), 400

        email = email.strip().lower()

        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and password are required."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                u.user_id,
                u.username,
                u.email,
                u.password,
                u.role,
                u.stall_id,
                s.stall_name
            FROM users u
            LEFT JOIN stalls s ON u.stall_id = s.stall_id
            WHERE u.email = %s
        """, (email,))

        user = cursor.fetchone()

        # Check account and password
        if not user or not user["password"]:
            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        if not check_password_hash(user["password"], password):
            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        # Student account
        if user["role"] == "student":

            if not email.endswith("@my.xu.edu.ph"):
                return jsonify({
                    "success": False,
                    "message": "Only XU student accounts are allowed."
                }), 403

            destination = "home.html"

        # Vendor account
        elif user["role"] == "vendor":

            if not user["stall_id"]:
                return jsonify({
                    "success": False,
                    "message": "Your vendor account has no assigned stall."
                }), 403

            destination = "vendor-dashboard.html"

        else:
            return jsonify({
                "success": False,
                "message": "This account type is not supported."
            }), 403

        return jsonify({
            "success": True,
            "message": "Login successful!",
            "destination": destination,
            "user": {
                "user_id": user["user_id"],
                "username": user["username"],
                "email": user["email"],
                "role": user["role"],
                "stall_id": user["stall_id"],
                "stall_name": user["stall_name"]
            }
        }), 200

    except Error:
        app.logger.exception("Login failed.")

        return jsonify({
            "success": False,
            "message": "Unable to process login. Please try again."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================
# FAVORITES API
# ==========================================

# Get all favorites belonging to a user
@app.route("/api/users/<int:user_id>/favorites", methods=["GET"])
def get_user_favorites(user_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Verify that the user is a student
        cursor.execute("""
            SELECT user_id
            FROM users
            WHERE user_id = %s
            AND role = 'student'
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "Student account not found."
            }), 404

        # Retrieve the user's favorite menu items
        cursor.execute("""
            SELECT
                f.favorite_id,
                m.item_id,
                m.stall_id,
                m.item_name,
                m.description,
                m.price,
                m.image,
                m.category,
                m.availability,
                s.stall_name
            FROM favorites f
            JOIN menu_items m ON f.item_id = m.item_id
            JOIN stalls s ON m.stall_id = s.stall_id
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC
        """, (user_id,))

        favorites = cursor.fetchall()

        for item in favorites:
            item["price"] = float(item["price"])
            item["availability"] = bool(item["availability"])

        return jsonify({
            "success": True,
            "favorites": favorites
        }), 200

    except Error:
        app.logger.exception("Failed to retrieve favorites.")

        return jsonify({
            "success": False,
            "message": "Unable to retrieve favorites."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Add a menu item to favorites
@app.route("/api/users/<int:user_id>/favorites", methods=["POST"])
def add_favorite(user_id):
    connection = None
    cursor = None

    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "success": False,
                "message": "Invalid request data."
            }), 400

        item_id = data.get("item_id")

        if not isinstance(item_id, int) or item_id <= 0:
            return jsonify({
                "success": False,
                "message": "A valid menu item ID is required."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Verify that the user is a student
        cursor.execute("""
            SELECT user_id
            FROM users
            WHERE user_id = %s
            AND role = 'student'
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "Student account not found."
            }), 404

        # Verify that the menu item exists
        cursor.execute("""
            SELECT item_id
            FROM menu_items
            WHERE item_id = %s
        """, (item_id,))

        menu_item = cursor.fetchone()

        if not menu_item:
            return jsonify({
                "success": False,
                "message": "Menu item not found."
            }), 404

        # Check whether the item is already a favorite
        cursor.execute("""
            SELECT favorite_id
            FROM favorites
            WHERE user_id = %s
            AND item_id = %s
        """, (user_id, item_id))

        existing_favorite = cursor.fetchone()

        if existing_favorite:
            return jsonify({
                "success": True,
                "message": "This item is already in your favorites."
            }), 200

        # Save the favorite
        cursor.execute("""
            INSERT INTO favorites (user_id, item_id)
            VALUES (%s, %s)
        """, (user_id, item_id))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Item added to favorites!"
        }), 201

    except Error:
        if connection and connection.is_connected():
            connection.rollback()

        app.logger.exception("Failed to add favorite.")

        return jsonify({
            "success": False,
            "message": "Unable to add favorite."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Remove a menu item from favorites
@app.route(
    "/api/users/<int:user_id>/favorites/<int:item_id>",
    methods=["DELETE"]
)
def remove_favorite(user_id, item_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Verify that the user is a student
        cursor.execute("""
            SELECT user_id
            FROM users
            WHERE user_id = %s
            AND role = 'student'
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "Student account not found."
            }), 404

        # Delete only the selected user's favorite
        cursor.execute("""
            DELETE FROM favorites
            WHERE user_id = %s
            AND item_id = %s
        """, (user_id, item_id))

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "Favorite item not found."
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Item removed from favorites."
        }), 200

    except Error:
        if connection and connection.is_connected():
            connection.rollback()

        app.logger.exception("Failed to remove favorite.")

        return jsonify({
            "success": False,
            "message": "Unable to remove favorite."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)