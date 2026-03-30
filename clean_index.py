import re

with open('c:/Users/debna/Documents/ps2/frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix landingView nesting
html = html.replace('''        <div id="landingView" class="page-view relative z-40 bg-background flex flex-col w-full">
            <div id="landingView" class="page-view absolute inset-0 z-40 bg-background flex flex-col overflow-y-auto hidden">''',
'''        <div id="landingView" class="page-view relative z-40 bg-background flex flex-col w-full">''')

# Fix pipelineView nesting
html = html.replace('''        <div id="pipelineView" class="page-view relative z-30 bg-struct-bg flex flex-col p-8 md:p-16 w-full mt-12 bg-black/40 border-t border-white/5" style="scroll-margin-top: 80px;">
            <div id="pipelineView" class="page-view absolute inset-0 z-30 bg-struct-bg flex flex-col p-8 md:p-16 overflow-y-auto ">''',
'''        <div id="pipelineView" class="page-view relative z-30 bg-struct-bg flex flex-col p-8 md:p-16 w-full mt-12 bg-black/40 border-t border-white/5" style="scroll-margin-top: 80px;">''')

# Fix missing closing div
html = html.replace('''        </div>
        
        <div id="pipelineView"''', '''        <div id="pipelineView"''')

html = html.replace('''        </div>
        
        </div>
        
        </div>''', '''        </div>''')

# Fix missing hidden classes that were destroyed earlier in the drag and drop box logic due to overzealous .replace('hidden', '')
html = html.replace('''<input type="file" id="fileInput" class="" accept="image/png, image/jpeg, image/jpg">''',
'''<input type="file" id="fileInput" class="hidden" accept="image/png, image/jpeg, image/jpg">''')

html = html.replace('''<div id="pipelineContainer" class=" w-full max-w-4xl mt-12">''',
'''<div id="pipelineContainer" class="hidden w-full max-w-4xl mt-12">''')

html = html.replace('''<button id="viewResultsBtn" onclick="document.getElementById('nav-dashboard').click()" class=" bg-struct-border text-white text-xs px-4 py-2 rounded hover:bg-struct-cyan hover:text-black transition-colors">''',
'''<button id="viewResultsBtn" class="hidden bg-struct-border text-white text-xs px-4 py-2 rounded hover:bg-struct-cyan hover:text-black transition-colors">''')

html = html.replace('''<div id="serverErrorBox" class=" mt-4 bg-struct-danger/10 border border-struct-danger/20 text-struct-danger p-3 rounded text-xs break-all"></div>''',
'''<div id="serverErrorBox" class="hidden mt-4 bg-struct-danger/10 border border-struct-danger/20 text-struct-danger p-3 rounded text-xs break-all"></div>''')

# Fix hero min-h string issue: min-min-h
html = html.replace('min-min-h', 'min-h')

with open('c:/Users/debna/Documents/ps2/frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
