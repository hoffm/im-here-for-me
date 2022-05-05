const toggle = (elem) => {
  if (elem.classList.contains("show")) {
    elem.classList.remove("show");
    elem.classList.add("hide");

    return;
  }
  elem.classList.remove("hide");
  elem.classList.add("show");
};

document.addEventListener(
  "click",
  (event) => {
    if (!event.target.classList.contains("tooltip-toggle")) return;

    event.preventDefault();

    const content = document.getElementsByClassName("tooltip-content")[0];

    if (!content) return;

    toggle(content);
  },
  false
);
