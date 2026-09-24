import re

with open('src/engine/bots/HeuristicBot.ts', 'r') as f:
    content = f.read()

# Add thresholds to class
thresholds = """
  thresholds = {
    idealCash: 1500,
    hoardingPenalty: 200,
    insiderTradingBonus: 200,
    acquirerPrepBonus: 150
  };

  constructor(thresholds?: Partial<HeuristicBot['thresholds']>) {
    if (thresholds) this.thresholds = { ...this.thresholds, ...thresholds };
  }
"""
# We don't want to conflict with any existing constructor or we just insert it.
content = re.sub(r'(name = \'HeuristicBot\';)', r'\1\n' + thresholds, content)

# Replace hardcoded values with this.thresholds
content = re.sub(r'let IDEAL_CASH = 1500;', r'let IDEAL_CASH = this.thresholds.idealCash;', content)
content = re.sub(r'const IDEAL_CASH = 1500;', r'const IDEAL_CASH = this.thresholds.idealCash;', content)
content = content.replace("mergerScore -= 200; // Hoard the tile if we don't have majority", "mergerScore -= this.thresholds.hoardingPenalty; // Hoard the tile if we don't have majority")
content = content.replace("score += 200; // Big boost to get stocks in defunct chains", "score += this.thresholds.insiderTradingBonus; // Big boost to get stocks in defunct chains")
content = content.replace("baseScore += 150; // Boost growing this chain", "baseScore += this.thresholds.acquirerPrepBonus; // Boost growing this chain")

with open('src/engine/bots/HeuristicBot.ts', 'w') as f:
    f.write(content)

