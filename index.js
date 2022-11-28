// TODO
// set maximum socket conection to DB middleware, spin up another middleware when connection count reaches limit
// Handle disconnect
// Send user location data

const CONNECTION_URL = "http://10.0.0.217:3001";
var socket = io.connect(CONNECTION_URL, {
  secure: true,
  rejectUnauthorized: false,
  withCredentials: true,
  transport: ["websocket"],
});

// function debounce(func, timeout = 15) {
//   let timer;
//   return (...args) => {
//     clearTimeout(timer);
//     timer = setTimeout(() => {
//       func.apply(this, args);
//     }, timeout);
//   };
// }

console.log("_socket: intiialized");
console.log("_socket: attempting connection...");

//Listener
socket.on("connect", () => {
  let sessionId = null;
  let previousUrl = "";

  console.log({ socket });

  try {
    console.log("_socket: connection sucesss, listening at " + CONNECTION_URL);

    // Create session through middleare
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

  socket.on("create_session", (session) => {
    sessionId = session.id;
  });

  // Initialize rrweb recorder
  rrwebRecord({
    emit(event) {
      socket.emit("rrweb_event", event);
    },
  });

  // Create mutation observer to listen to url changes
  const observer = new MutationObserver(urlObserver);
  const config = { subtree: true, childList: true };
  observer.observe(document, config);
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
