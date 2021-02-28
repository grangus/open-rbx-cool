window.onload = () => {
  let nav = document.querySelector("nav");
  let bg = document.querySelector(".landing-bg");

  if (window.innerWidth <= 992) {
    nav.classList.add("nav-mobile");
  } else if (!bg) {
    nav.classList.add("nav-white");
  } else {
    const setNavClass = () => {
      if (document.documentElement.scrollTop == 0) {
        nav.classList.remove("nav-mobile");
        nav.classList.remove("nav-white");
      } else {
        if (!nav.classList.contains("nav-white")) {
          nav.classList.add("nav-white");
        }
      }
    };

    setNavClass();
    window.onscroll = setNavClass;
  }

  let toggler = document.querySelector(".secondary-toggler");

  toggler.addEventListener("click", () => {
    let secondary = document.querySelector(".secondary-links");
    let menuToggler = document.querySelector("#menuToggler");
    let menuCloseToggler = document.querySelector("#menuCloseToggler");

    menuToggler.classList.toggle("d-none");
    menuCloseToggler.classList.toggle("d-none");
    secondary.classList.toggle("d-none");
  });
};
