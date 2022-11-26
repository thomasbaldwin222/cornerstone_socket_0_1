var socket = io.connect("http://10.0.0.217:3001", {
  secure: true,
  rejectUnauthorized: false,
  withCredentials: true,
  transport: ["websocket"],
});

function debounce(func, timeout = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}
function saveInput() {
  console.log("Saving data");
}
const processChange = debounce(() => saveInput());

//Listener
socket.on("connect", () => {
  let sessionId = null;
  console.log("connecting attempt");
  try {
    console.log("Successfuly conntected to socket @ http://10.0.0.217:3001");

    socket.on("create_session", (session) => {
      sessionId = session.id;
    });

    let previousUrl = "";

    const onMouseMove = debounce((e) => {
      socket.emit("packet", [
        {
          type: "mousemove",
          date: Date.now(),
          pos: [e.clientX, e.clientY],
        },
      ]);
    });

    const urlObserver = () => {
      if (window.location.href !== previousUrl) {
        socket.emit("packet", [
          {
            type: "navigate",
            date: Date.now(),
            data: {
              url: window.location.href,
            },
          },
        ]);
        previousUrl = window.location.href;
      }
    };

    const observer = new MutationObserver(urlObserver);
    const config = { subtree: true, childList: true };
    // start observing change
    observer.observe(document, config);
    window.addEventListener("mousemove", onMouseMove);

    console.log(socket);

    socket.emit("create_session", {
      company_id: 1,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      location: {
        href: window.location.href,
      },
    });
  } catch (e) {
    console.log(e);
  }
});
