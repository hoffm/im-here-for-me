const poll = async (callback, ms) => {
  let result = await callback();
  while (true) {
    await wait(ms);
    await callback();
  }
};

const wait = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const tweetUrl = (status, queueLength, queuePosition) => {
  const link = "https://imherefor.me/";
  let text = [];
  const waiting = queueLength - 1;

  if (status === "inside") {
    text.push("i am the only person who can see this website.");
    text.push(link);
    if (waiting > 1) {
      text.push(`${queueLength - 1} people are waiting to get in.`);
    }
    text.push("want to see it? get in line, sucker.");
  } else {
    text.push("only one person at a time gets to see this website.");
    text.push(link);
    text.push("get in line behind me.");
    if (waiting > 1) {
      text.push(`currently, ${waiting} people are waiting.`);
    }
  }

  text.push("i'm here for me.");

  return encodeURI(
    `https://twitter.com/intent/tweet?text=${text.join("\n\n").trim()}`
  );
};

const questionSvgPath = (status) => (
  status == "outside" ? "img/question-dark.svg" : "img/question.svg"
)

const suckersText = (queueLength) => {
  if (queueLength === 1) {
    return "Everyone else just has to wait.";
  } else if (queueLength === 2) {
    return `1 person is waiting in line behind you.`;
  } else {
    return `${queueLength - 1} people are waiting in line behind you. Suckers!`;
  }
};

const syncWithServer = () => {
  const clientIdName = "im-here-for-me-id";
  const status = document.getElementById("content").classList.item(0);
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/poll?status=${status}`, false);

  let lsClientId = localStorage.getItem(clientIdName);

  if (lsClientId) {
    xhr.setRequestHeader(clientIdName, lsClientId);
  }

  const result = xhr.send(null);
  let { clientId, queueLength, queuePosition, template, newStatus } =
    JSON.parse(xhr.response);

  if (lsClientId === null) {
    localStorage.setItem(clientIdName, clientId);
  }

  if (template) {
    const mainDiv = document.getElementById("main");
    mainDiv.innerHTML = template;
    document.body.className = newStatus;
  }

  const waitingCountEl = document.getElementById("waitingCount");
  const inFrontCountEl = document.getElementById("inFrontCount");
  const tweetEl = document.getElementById("tweet");
  const suckersEl = document.getElementById("suckers");
  const questionEl = document.getElementById("question-icon");
  const whatsInsideEls = document.getElementsByClassName("whats-inside");
  const faviconEl = document.getElementById("favicon");

  if (waitingCountEl) {
    waitingCountEl.innerHTML = queueLength;
  }
  
  if (inFrontCountEl) {
    inFrontCountEl.innerHTML = queuePosition;
  }
  
  if (tweetEl) {
    tweetEl.href = tweetUrl(newStatus, queueLength, queuePosition);
  }

  if (suckersEl) {
    suckersEl.innerHTML = suckersText(queueLength);
  }
  
  if (questionEl) {
    questionEl.src = questionSvgPath(newStatus)
  }
  
  if (whatsInsideEls) {
    Array.from(whatsInsideEls).forEach((el) => 
      el.style.display = (newStatus === "inside") ? "none" : "block"
    );
  }
  
  if (faviconEl) {
    faviconEl.href = (newStatus === "inside") ? "https://cdn.glitch.global/1543e9b8-e528-46e7-9375-25300add0f54/favicon.ico?v=1647303566725" : "https://cdn.glitch.global/1543e9b8-e528-46e7-9375-25300add0f54/outside-favicon.ico?v=1647303775036"
  }
};

const setupPage = () => poll(syncWithServer, 5000);

document.addEventListener("DOMContentLoaded", setupPage);
