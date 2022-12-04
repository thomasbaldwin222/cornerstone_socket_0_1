// TODO
// set maximum socket conection to DB middleware, spin up another middleware when connection count reaches limit
// Handle disconnect
// Send user location data
// Create a room for each company, COMPANY_ID:1, COMPANY_ID:2, ...

const CONNECTION_URL = "http://10.0.0.217:3001";
const EMIT_INTERVAL = 1000;
// const CONNECTION_URL = "http://172.20.10.2:3001";
var socket = io.connect(CONNECTION_URL, {
  secure: true,
  rejectUnauthorized: false,
  withCredentials: true,
  transport: ["websocket"],
  query: {
    room_id: "company_1"
  }
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

console.log("_socket: Intiialized");
console.log("_socket: Attempting connection...");

//Listener
socket.on("connect", () => {
  let sessionId = null;
  let previousUrl = "";
  let eventsQueue = [];

  console.log({ socket });

  try {
    console.log("_socket: Connection sucesss, listening at " + CONNECTION_URL);

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

    socket.on("create_session", (session) => {
      sessionId = session.id;
    });

    // Initialize rrweb recorder
    rrwebRecord({
      emit(event) {
        eventsQueue.push(event);
      },
    });

    // const urlObserver = () => {
    //   if (window.location.href !== previousUrl) {
    //     socket.emit("packet", [
    //       {
    //         type: "navigate",
    //         date: Date.now(),
    //         data: {
    //           url: window.location.href,
    //         },
    //       },
    //     ]);
    //     previousUrl = window.location.href;
    //   }
    // };

    const emit = (timeoutId) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (eventsQueue.length > 0) {
        console.log("emit called", eventsQueue);
        socket.emit("rrweb_events", JSON.stringify(eventsQueue));
        eventsQueue = [];
      }

      const id = setTimeout(() => {
        emit(id);
      }, EMIT_INTERVAL);
    };

    emit();

    socket.on("disconnect", (reason) => {
      console.log("_socket: Disconnected: " + reason);
    });

    // Create mutation observer to listen to url changes
    // const observer = new MutationObserver(urlObserver);
    // const config = { subtree: true, childList: true };
    // observer.observe(document, config);
  } catch (e) {
    console.error("_socket: Failed to build with error: " + e);
  }
});
