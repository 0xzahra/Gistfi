import os

class Config:
    """
    Configuration management for environment variables and API keys.
    """

    @staticmethod
    def get(key, default=None):
        return os.getenv(key, default)

    @staticmethod
    def load_env(file_path):
        """
        Loads environment variables from a .env file.
        """
        from dotenv import load_dotenv
        load_dotenv(file_path)

# Example usage:
# api_key = Config.get('API_KEY')
# Config.load_env('.env')
