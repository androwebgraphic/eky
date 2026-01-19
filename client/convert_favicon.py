# To create a favicon, convert Sharedoghr.png to favicon.ico (32x32 recommended).
# This script requires Pillow: pip install pillow
from PIL import Image
img = Image.open('Sharedoghr.png')
img = img.convert('RGBA')
img = img.resize((32, 32), Image.LANCZOS)
img.save('favicon.ico', format='ICO')
print('favicon.ico created.')
