const EMIT_INTERVAL = 1000;
// const CONNECTION_URL = "http://172.20.10.2:3001";
const CONNECTION_URL = "https://cornerstone-db.herokuapp.com/";
var socket = io.connect(CONNECTION_URL, {
  // secure: true,
  rejectUnauthorized: false,
  auth: {
    token: "CORNERSTONE",
  },
  // withCredentials: true,
  transport: ["websocket"],
  query: {
    room_id: "company_1",
    location: window.location.href,
  },
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
socket.on("connect", async () => {
  let sessionId = null;
  let recorder = null;
  let previousUrl = "";
  let eventsQueue = [];

  try {
    console.log("_socket: Connection sucesss, listening at " + CONNECTION_URL);
    console.log({ time: Date.now() });

    const ipResponse = await fetch(
      "https://api.ipdata.co?api-key=afd1b48f7dbdc7265a25504c8abf567fffe5662dfc0cecaa5ec78077"
    );
    const ipInfo = await ipResponse.json();

    // Create session through middleare
    socket.emit("create_session", {
      company_id: 1,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      ip_info: ipInfo,
      location: {
        href: window.location.href,
      },
    });

    socket.on("create_session", (session) => {
      sessionId = session.id;
    });
    
    console.log(`_socket: Recording enabled; recording started.`);
    // Initialize rrweb recorder
    recorder = rrwebRecord({
      emit(event) {
        eventsQueue.push(event);
      },
    });


    // socket.on("config", (payload) => {
    //   console.log(`_socket: Config  data received`);
    //   if (payload.recording_enabled && !recorder) {
    //     console.log(`_socket: Recording enabled; recording started.`);
    //     // Initialize rrweb recorder
    //     recorder = rrwebRecord({
    //       emit(event) {
    //         eventsQueue.push(event);
    //       },
    //       // recordCanvas: true,
    //       // sampling: {
    //       //   canvas: 15,
    //       // },
    //       // // optional image format settings
    //       // dataURLOptions: {
    //       //   type: "image/webp",
    //       //   quality: 0.6,
    //       // },
    //     });
    //   } else {
    //     console.log(
    //       `_socket: Recording disabled or recording already in progress.`
    //     );
    //   }
    // });

    const urlObserver = () => {
      if (window.location.href !== previousUrl) {
        const event = {
          type: "navigate",
          date: Date.now(),
          data: {
            url: window.location.href,
          },
        };
        eventsQueue.push(event);
        previousUrl = window.location.href;
      }
    };

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
    const observer = new MutationObserver(urlObserver);
    const config = { subtree: true, childList: true };
    observer.observe(document, config);
  } catch (e) {
    console.error("_socket: Failed to build with error: " + e);
  }
});
