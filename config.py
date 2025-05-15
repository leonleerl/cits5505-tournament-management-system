import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'default-dev-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f'sqlite:///{os.path.abspath("db/cits5505.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
    USE_RELOADER = True

class DevelopmentConfig(Config):
    DEBUG = True
    USE_RELOADER = True
    FLASK_ENV = 'development'

class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    
class SeleniumTestingConfig(Config):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or f'sqlite:///{os.path.abspath("tests/testapp.db")}'
    WTF_CSRF_ENABLED = False
    SERVER_NAME = 'localhost:5000'
    
class ProductionConfig(Config):
    DEBUG = False
    USE_RELOADER = False
    FLASK_ENV = 'production'
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'selenium_testing': SeleniumTestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig 
}
