from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello, World!"

if __name__ == '__main__':
    print("Starting test server...")
    app.run(debug=True, port=5001, use_reloader=False)
    print("Test server stopped.")