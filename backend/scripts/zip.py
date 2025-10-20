import os, sys
import zipfile

name = sys.argv[1]

# Directories and files to exclude
exclude_dirs = {
    'node_modules',
    '.git',
    'dist',
    'coverage',
    '.nyc_output',
    'scripts'
}

exclude_files = {
    '.env',
    '.DS_Store',
    '*.log'
}

def should_exclude(file_path):
    # Check if any part of the path contains excluded directories
    path_parts = file_path.split(os.sep)
    for part in path_parts:
        if part in exclude_dirs:
            return True
    
    # Check if file matches excluded patterns
    filename = os.path.basename(file_path)
    for pattern in exclude_files:
        if pattern.startswith('*'):
            if filename.endswith(pattern[1:]):
                return True
        elif filename == pattern:
            return True
    
    return False

filePaths = []
for root, directories, files in os.walk("."):
    # Remove excluded directories from walk
    directories[:] = [d for d in directories if d not in exclude_dirs]
    
    for filename in files:
        filePath = os.path.join(root, filename)
        if not should_exclude(filePath):
            filePaths.append(filePath)
            print(f"Including: {filePath}")

print(f"Total files to include: {len(filePaths)}")

z = zipfile.ZipFile(name + ".zip", 'w')
with z:
    for file in filePaths:
        z.write(file)