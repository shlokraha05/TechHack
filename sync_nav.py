import os
import glob

files = ['c:/Users/debna/Documents/ps2/frontend/dashboard.html',
         'c:/Users/debna/Documents/ps2/frontend/cost.html',
         'c:/Users/debna/Documents/ps2/frontend/app.js']

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # app.js routing fix
    if filepath.endswith('.js'):
        content = content.replace("window.location.href='index.html#pipelineView'", "window.location.href='demo.html'")
        content = content.replace("window.location.href='index.html'", "window.location.href='home.html'")
        content = content.replace("window.location.href = 'index.html#pipelineView'", "window.location.href = 'demo.html'")
    else:
        # html href fixes
        content = content.replace('href="index.html"', 'href="home.html"')
        content = content.replace('href="/"', 'href="home.html"')
        content = content.replace('href="index.html#pipelineView"', 'href="demo.html"')
        content = content.replace('href="docs.html"', 'href="doc.html"')
        content = content.replace("onclick=\"window.location.href='index.html#pipelineView'\"", "onclick=\"window.location.href='demo.html'\"")
        content = content.replace("onclick=\"window.location.href='index.html'\"", "onclick=\"window.location.href='home.html'\"")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Safe delete the old duplicated files
if os.path.exists('c:/Users/debna/Documents/ps2/frontend/docs.html'):
    os.remove('c:/Users/debna/Documents/ps2/frontend/docs.html')
if os.path.exists('c:/Users/debna/Documents/ps2/frontend/index.html'):
    os.remove('c:/Users/debna/Documents/ps2/frontend/index.html')

print("Sync complete.")
