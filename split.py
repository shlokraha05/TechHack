import os
import re

html_file = 'c:/Users/debna/Documents/ps2/frontend/index.html'
with open(html_file, 'r', encoding='utf-8') as f:
    html = f.read()

# Pattern to extract <head>
head_match = re.search(r'(<head>.*?</head>)', html, re.DOTALL)
head = head_match.group(1) if head_match else ''

# Extract common Nav
nav_match = re.search(r'(<nav class="fixed top-0.*?w-full absolute bottom-0"></div>\s*</nav>)', html, re.DOTALL)
nav = nav_match.group(1) if nav_match else ''

# Fix Nav to use normal links
nav = nav.replace('button id="nav-landing"', 'a id="nav-landing" href="index.html"')
nav = nav.replace('</button>', '</a>')
nav = nav.replace('button id="nav-demo"', 'a id="nav-demo" href="index.html#pipelineView"')
nav = nav.replace('button id="nav-docs"', 'a id="nav-docs" href="docs.html"')
nav = nav.replace('onclick="document.getElementById(\'nav-landing\').click()"', 'onclick="window.location.href=\'index.html\'"')
nav = nav.replace('onclick="document.getElementById(\'nav-demo\').click()"', 'onclick="window.location.href=\'index.html#pipelineView\'"')

# Extract parts
landing_match = re.search(r'(<div id="landingView".*?<!-- ==================== SCREEN 2)', html, re.DOTALL)
landing = landing_match.group(1).replace('<!-- ==================== SCREEN 2', '') if landing_match else ''

pipeline_match = re.search(r'(<div id="pipelineView".*?<!-- ==================== SCREEN 3)', html, re.DOTALL)
pipeline = pipeline_match.group(1).replace('<!-- ==================== SCREEN 3', '').replace('<button id="nav-dashboard" class="hidden nav-link" data-view="dashboardView"></button>', '') if pipeline_match else ''

dashboard_match = re.search(r'(<div id="dashboardView".*?<!-- ====================)', html, re.DOTALL)
dashboard = dashboard_match.group(1).replace('<div id="docsView"', '<!-- ====================') if dashboard_match else ''
# Need to specifically trim dashboard up to docsView
dashboard = dashboard.split('<div id="docsView"')[0]

docs_match = re.search(r'(<div id="docsView".*?<div id="dbView")', html, re.DOTALL)
docs = docs_match.group(1).replace('<div id="dbView"', '') if docs_match else ''
docs = docs.lstrip()

scripts = """
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <script src="viewer2d.js"></script>
    <script src="viewer3d.js"></script>
    <script src="app.js"></script>
    <script>lucide.createIcons();</script>
</body>
</html>
"""

def make_page(body_content):
    return f'''<!DOCTYPE html>
<html lang="en" class="dark">
{head}
<body class="bg-background text-on-surface font-body selection:bg-primary/30 selection:text-primary min-h-screen flex flex-col overflow-x-hidden relative w-full">
    {nav}
    <main class="flex-1 w-full relative pt-16 flex flex-col h-[calc(100vh-4rem)]">
{body_content}
    </main>
{scripts}'''

# Write Dashboard
dash_html = make_page(dashboard.replace('absolute inset-0 z-50 ', '').replace('hidden ', ''))
# Fix Cost Analysis link in Dashboard
dash_html = dash_html.replace('data-target="tab-cost"', 'onclick="window.location.href=\'cost.html\'"')

with open('c:/Users/debna/Documents/ps2/frontend/dashboard.html', 'w', encoding='utf-8') as f:
    f.write(dash_html)

# Write Docs
docs_html = make_page(docs.replace('absolute inset-0 z-40 ', '').replace('hidden ', '').replace(' flex hidden', ' flex'))
with open('c:/Users/debna/Documents/ps2/frontend/docs.html', 'w', encoding='utf-8') as f:
    f.write(docs_html)

# Extract Cost Controller from docs and create cost.html natively
cost_match = re.search(r'(<!-- Cost Controller Interactive Panel -->.*?)\s*<!-- AI Explanation Panel -->', docs, re.DOTALL)
cost_section = cost_match.group(1) if cost_match else ''

cost_body = f'''
        <div id="costView" class="page-view relative z-40 bg-background flex flex-col w-full px-8 py-12">
            <h2 class="text-4xl md:text-5xl font-headline font-bold text-on-surface tracking-tighter mb-12">Cost <span class="text-secondary">Controller</span></h2>
            <div class="max-w-7xl mx-auto w-full">
                {cost_section}
            </div>
        </div>
'''
cost_html = make_page(cost_body)
with open('c:/Users/debna/Documents/ps2/frontend/cost.html', 'w', encoding='utf-8') as f:
    f.write(cost_html)

# Update Docs to remove the interactive cost layout and restore the static vs graph
static_cost_graph = """
                        <!-- Cost vs Strength Visualization Card -->
                        <div id="section-cost" class="md:col-span-8 glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col min-h-[400px] scroll-mt-24">
                            <div class="flex justify-between items-start mb-12">
                                <div>
                                    <h3 class="text-xl font-headline font-bold text-on-surface mb-1">Cost vs. Strength Spectrum</h3>
                                    <p class="text-on-surface-variant text-sm">Real-time trade-off mapping based on regional supply indices.</p>
                                </div>
                                <span class="material-symbols-outlined text-primary text-3xl">insights</span>
                            </div>
                            <!-- Custom Graph Visualization -->
                            <div class="flex-grow flex items-end justify-between gap-2 relative px-4">
                                <div class="absolute -left-4 top-1/2 -rotate-90 text-[10px] uppercase tracking-widest text-outline">Structural Integrity</div>
                                <div class="w-full h-48 flex items-end justify-between gap-4">
                                    <div class="flex-1 bg-surface-container-highest/40 rounded-t-lg h-[40%] transition-all hover:bg-surface-container-highest group relative">
                                        <div class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-outline">Timber</div>
                                    </div>
                                    <div class="flex-1 bg-surface-container-highest/40 rounded-t-lg h-[60%] transition-all hover:bg-surface-container-highest group relative">
                                        <div class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-outline">Cinder</div>
                                    </div>
                                    <!-- Chosen Material Highlight -->
                                    <div class="flex-1 bg-gradient-to-t from-primary/80 to-primary-container rounded-t-lg h-[75%] relative shadow-[0_0_40px_rgba(208,188,255,0.2)]">
                                        <div class="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                            <span class="bg-primary text-on-primary px-2 py-1 rounded text-[10px] font-bold">OPTIMAL</span>
                                            <div class="w-[1px] h-4 bg-primary/50 mt-1"></div>
                                        </div>
                                        <div class="absolute bottom-[-32px] left-1/2 -translate-x-1/2 text-primary font-bold text-[10px] whitespace-nowrap">RED BRICK</div>
                                    </div>
                                    <div class="flex-1 bg-surface-container-highest/40 rounded-t-lg h-[85%] transition-all hover:bg-surface-container-highest group relative">
                                        <div class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-outline">Steel</div>
                                    </div>
                                    <div class="flex-1 bg-surface-container-highest/40 rounded-t-lg h-[95%] transition-all hover:bg-surface-container-highest group relative">
                                        <div class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-outline">Concrete</div>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-16 flex justify-between border-t border-outline-variant/20 pt-6">
                                <div class="flex gap-8">
                                    <div>
                                        <div class="text-[10px] text-outline uppercase tracking-widest mb-1">Efficiency</div>
                                        <div class="text-xl font-headline font-bold">94.2%</div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-outline uppercase tracking-widest mb-1">Estimated Cost</div>
                                        <div class="text-xl font-headline font-bold text-secondary">Rs1,240<span class="text-sm font-normal text-outline"> / unit</span></div>
                                    </div>
                                </div>
                                <button class="text-secondary text-sm font-bold flex items-center gap-2 hover:opacity-80 transition-opacity" onclick="window.location.href='cost.html'">
                                    Open Full Cost Controller <span class="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
"""
if cost_match:
    docs_html = docs_html.replace(cost_match.group(1), static_cost_graph)
    # Fix Explanation to col-span-4
    docs_html = docs_html.replace('<div id="section-explanation" class="md:col-span-12 flex flex-col md:flex-row gap-6 scroll-mt-24">', '<div id="section-explanation" class="md:col-span-4 flex flex-col gap-6 scroll-mt-24">')
    
    with open('c:/Users/debna/Documents/ps2/frontend/docs.html', 'w', encoding='utf-8') as f:
        f.write(docs_html)


# Write Index (Landing + Pipeline stacked)
landing_clean = landing.replace('absolute inset-0 z-40 hidden', 'relative')
pipeline_clean = pipeline.replace('absolute inset-0 z-30 hidden', 'relative mt-24 pb-24').replace('hidden', '') # unhide pipeline by default for stacking? No keep it relative

index_body = f'''
        <div id="landingView" class="page-view relative z-40 bg-background flex flex-col w-full">
            {landing_clean}
        </div>
        
        <div id="pipelineView" class="page-view relative z-30 bg-struct-bg flex flex-col p-8 md:p-16 w-full mt-12 bg-black/40 border-t border-white/5" style="scroll-margin-top: 80px;">
            {pipeline_clean}
        </div>
'''
index_html = make_page(index_body).replace('h-[calc(100vh-4rem)]', 'min-h-[calc(100vh-4rem)] h-auto overflow-y-auto')
with open('c:/Users/debna/Documents/ps2/frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

print("Split Complete.")
