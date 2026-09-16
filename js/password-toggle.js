function hidePasswordToggle(button) {
  const wrap = button.closest(".password-input-wrap");
  const input = wrap && wrap.querySelector("input");
  if (!input) return;
  input.type = "password";
  button.classList.remove("is-visible");
  button.setAttribute("aria-label", "Visa lösenord");
  button.setAttribute("aria-pressed", "false");
}

export function initPasswordToggles(root) {
  const scope = root || document;
  scope.querySelectorAll("[data-password-toggle]").forEach(function (button) {
    if (button.dataset.toggleBound === "1") return;
    button.dataset.toggleBound = "1";

    const wrap = button.closest(".password-input-wrap");
    const input = wrap && wrap.querySelector("input");
    if (!input) return;

    button.addEventListener("click", function () {
      const visible = input.type === "text";
      if (visible) {
        hidePasswordToggle(button);
        return;
      }

      scope.querySelectorAll("[data-password-toggle]").forEach(function (other) {
        if (other !== button) hidePasswordToggle(other);
      });

      input.type = "text";
      button.classList.add("is-visible");
      button.setAttribute("aria-label", "Dölj lösenord");
      button.setAttribute("aria-pressed", "true");
    });
  });
}
