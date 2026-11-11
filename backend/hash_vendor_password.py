from werkzeug.security import generate_password_hash
from database import get_db_connection
from getpass import getpass

connection = None
cursor = None

try:
    email = input("Enter vendor email: ").strip().lower()
    password = getpass("Enter new vendor password: ")
    confirm_password = getpass("Confirm new password: ")

    if not email or not password:
        print("Email and password are required.")

    elif password != confirm_password:
        print("Passwords do not match.")

    elif len(password) < 8:
        print("Password must be at least 8 characters.")

    else:
        hashed_password = generate_password_hash(password)

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE users
            SET password = %s
            WHERE email = %s
            AND role = 'vendor'
        """, (hashed_password, email))

        if cursor.rowcount == 1:
            connection.commit()
            print("Vendor password successfully updated!")
        else:
            connection.rollback()
            print("Vendor account not found or not updated.")

except Exception as error:
    if connection and connection.is_connected():
        connection.rollback()

    print("Error:", error)

finally:
    if cursor:
        cursor.close()

    if connection and connection.is_connected():
        connection.close()