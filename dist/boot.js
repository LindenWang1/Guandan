// Report failed module loads rather than leaving an apparently playable, inert table.

import("./app.js").catch(() => {
  const message = document.getElementById("startup-error");
  message.hidden = false;
  document.getElementById("reload-app").onclick = () => location.reload();
});
