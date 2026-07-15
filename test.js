const sortedPlayers = [{name: 'Rachel', color: 'red'}];
let counter = 0;
const renderText = (logText) => {
  if (++counter > 100) return 'inf loop';
  for (const p of sortedPlayers) {
    if (p.name && logText.includes(p.name)) {
      const split = logText.split(p.name);
      return `<span key="${logText + p.name}">${renderText(split[0])}<span style="color:${p.color}">${p.name}</span>${renderText(split.slice(1).join(p.name))}</span>`;
    }
  }
  return logText;
};
console.log(renderText("Diana dealt 1 damage to Bob, Rachel, Rachel!"));
