import re

with open('src/engine/bots/HeuristicBot.ts', 'r') as f:
    content = f.read()

# Replace the two constructors with a single one
# We can just match the constructor(thresholds...) and constructor(features...) and replace both
c1 = r"  constructor\(thresholds\?: Partial<HeuristicBot\['thresholds'\]>\) {\n    if \(thresholds\) this\.thresholds = { \.\.\.this\.thresholds, \.\.\.thresholds };\n  }"
c2 = r"  constructor\(features\?: Partial<HeuristicBot\['features'\]>\) {\n    if \(features\) this\.features = { \.\.\.this\.features, \.\.\.features };\n  }"

content = re.sub(c1, "", content)
content = re.sub(c2, "", content)

# Now inject a single constructor below the properties
combined_constructor = """
  constructor(config?: { features?: Partial<HeuristicBot['features']>, thresholds?: Partial<HeuristicBot['thresholds']> }) {
    if (config?.features) this.features = { ...this.features, ...config.features };
    if (config?.thresholds) this.thresholds = { ...this.thresholds, ...config.thresholds };
  }
"""

content = re.sub(r'(features = \{[^}]*\};)', r'\1\n' + combined_constructor, content)

with open('src/engine/bots/HeuristicBot.ts', 'w') as f:
    f.write(content)
