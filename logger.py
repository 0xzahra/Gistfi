import logging
import sys

# Configure structured logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.StreamHandler(sys.stdout)
                    ])

logger = logging.getLogger(__name__)

# Example usage
logger.info('This is an info message')
logger.error('This is an error message')
