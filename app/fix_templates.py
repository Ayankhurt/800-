import re

# Read the file
with open('services/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix template literals - remove spaces inside ${ }
content = re.sub(r'\$\{\s+', '${', content)
content = re.sub(r'\s+\}', '}', content)

# Write back
with open('services/api.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Fixed all template literals!')
