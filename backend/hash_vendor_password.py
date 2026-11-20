from werkzeug.security import generate_password_hash
from database import get_db_connection
from getpass import getpass

connection = None
cursor = None

try:
    stall_name = input("Enter stall name: ").strip()
    email = input("Enter vendor email: ").strip().lower()
    password = getpass("Enter vendor password: ")
    confirm_password = getpass("Confirm vendor password: ")

    if not stall_name or not email or not password:
        print("All fields are required.")

    elif password != confirm_password:
        print("Passwords do not match.")

    elif len(password) < 8:
        print("Password must be at least 8 characters.")

    else:
        hashed_password = generate_password_hash(password)
        username = email.split("@")[0]

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO users (
                username,
                email,
                password,
                role,
                stall_id
            )
            SELECT %s, %s, %s, 'vendor', stall_id
            FROM stalls
            WHERE stall_name = %s
        """, (
            username,
            email,
            hashed_password,
            stall_name
        ))

        if cursor.rowcount == 1:
            connection.commit()
            print("Vendor account successfully created!")
        else:
            connection.rollback()
            print("Stall not found. No account was created.")

except Exception as error:
    if connection and connection.is_connected():
        connection.rollback()

    print("Error:", error)

finally:
    if cursor:
        cursor.close()

    if connection and connection.is_connected():
        connection.close()