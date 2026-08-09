// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-",
    title: "",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "Blog",
          description: "Technical notes on inference engines, on-device AI, systems, and life.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/index.html";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "Curriculum vitae of an AI inference engine expert specializing in on-device LLM deployment and high-performance computing.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },];
