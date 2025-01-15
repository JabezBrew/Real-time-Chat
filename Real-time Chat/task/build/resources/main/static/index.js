const inputForm = document.getElementById("input-container");
const loginForm = document.getElementById("user-login");

let stompClient = null;
let username = null;
let unreadMessages = {};
let renderedUsers = [];


function connect(event) {
    event.preventDefault();
    username = document.getElementById("input-username").value.trim();
    if (username) {
        document.getElementById("user-login").classList.add("hidden");
        document.getElementById("chat-ui").classList.remove("hidden");
        document.getElementById("chat-with").innerText = "Public chat";

        const socket = new SockJS("/ws");
        stompClient = Stomp.over(socket);

        stompClient.connect( {},
            onConnected,
            (error) => console.log(error) );
    }
}

function onConnected() {
    stompClient.subscribe("/topic/public", onMessageReceived);
    stompClient.send("/app/chat.addUser", {}, JSON.stringify({sender: username, messageType: 'JOIN'}));
    
    stompClient.subscribe("/user/" + username + "/queue/privateMessage", onMessageReceived);
    
    stompClient.subscribe("/user/" + username + "/queue/reply", onMessageReceived);
    stompClient.send("/app/private", {}, JSON.stringify({sender: username, type: 'JOIN'}));
    
}

function sendMessage(event) {
    event.preventDefault();
    const message = document.getElementById("input-msg").value.trim();
    const chatPageHeader = document.getElementById("chat-with").innerHTML;
    
    if (message) {
        let chatMessage = {
            sender: username,
            receiver: chatPageHeader,
            content: message,
            messageType: 'CHAT'
        }
        
        if (chatPageHeader === "Public chat") {
            stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        } else {
            stompClient.send("/app/privateMessage", {}, JSON.stringify(chatMessage));
            renderMessage(chatMessage, chatPageHeader);

            //move chatting user to the top after message sent
            const usersList = document.getElementById("users")
            const userContainerList = Array.from(document.querySelectorAll(".user-container"))
            let userContainer = userContainerList.find(container =>
                container.querySelector(".user").innerHTML === chatPageHeader);
            usersList.insertBefore(userContainer, usersList.firstChild);

        }
        
        document.getElementById("input-msg").value = "";
    }
}


/**
 * Handles the received message payload and updates the UI accordingly.
 *
 * @param {Object} payload - The message payload.
 */
function onMessageReceived(payload) {
    let message = JSON.parse(payload.body);
    const usersContainer = document.getElementById("users");
    let renderLocation;

    if (payload.headers.destination === "/topic/public" || payload.headers.destination ===
        "/user/" + username + "/queue/reply") { // "/user/" + username + "/queue/reply" receives chat history privately,
                                                // but they are not private messages!!
        renderLocation = "Public chat"
    } else {
        renderLocation = message.sender;
    }

    if (message.messageType === 'JOIN') {
        console.log(`${message.sender} joined the chat`);

        //removeAllChildNodes(usersContainer, "user-container");
        message.activeUsers.forEach(user => {
            if (user !== username && !renderedUsers.includes(user)) {
                renderedUsers.push(user);

                const userContainer = document.createElement("div");
                const userElement = document.createElement("div");
                const newMessageCounter = document.createElement("div");

                userContainer.classList.add("user-container");
                userElement.classList.add("user");
                newMessageCounter.classList.add("new-message-counter");

                userElement.innerText = user;

                userContainer.appendChild(userElement);
                userContainer.appendChild(newMessageCounter);
                usersContainer.appendChild(userContainer);

                if(user in unreadMessages) {
                    if (unreadMessages[user].count > 0) {
                        newMessageCounter.innerText = unreadMessages[user].count;
                        newMessageCounter.style.display = "block";
                    }
                }

                userContainer.addEventListener("click", () => {
                    onUserSelect(user, username)
                });

            }
        });

    } else if (message.messageType === 'LEAVE') {
        console.log(`${message.sender} left the chat`);

        const disconnectedUser = message.sender;
        const users = usersContainer.childNodes;
        users.forEach(user => {
            if (user.innerText === disconnectedUser) {
                user.remove();
            }
        });

    } else if (message.messageType === 'CHAT') {
        const chatPageHeader = document.getElementById("chat-with").innerText
        const sender = message.sender;
        const usersList = document.getElementById("users");
        if (payload.headers.destination.split("/")[4] === "privateMessage" && chatPageHeader !== sender) {
            const userContainerList = Array.from(document.querySelectorAll(".user-container"))
            let userContainer = userContainerList.find(container =>
                container.querySelector(".user").innerHTML === sender);
            const newMessageCounter = userContainer.querySelector(".new-message-counter")
            if(!(sender in unreadMessages)) {
                unreadMessages[sender] = {
                    container: userContainer,
                    count: 0
                }
            }

            unreadMessages[sender].count += 1;
            //update counter with number of unread messages.
            newMessageCounter.innerText = unreadMessages[sender].count;
            newMessageCounter.style.display = "block";
            //click event listener on container to clear counter
            userContainer.addEventListener('click', () => {
                unreadMessages[sender].count = 0;
                newMessageCounter.innerText = "";
                newMessageCounter.style.display = "none";
            })
            //move chatting user to the top
            usersList.insertBefore(userContainer, usersList.firstChild);
        }
        renderMessage(message, renderLocation);
    }

    // const buttons = document.querySelectorAll(".user-button");
    // buttons.forEach(button => {
    //     let user = button.innerText;
    //     button.addEventListener("click", () => {
    //         onUserSelect(user, username)
    //     });
    // });
    const publicChatButton = document.getElementById("public-chat-btn");
    publicChatButton.addEventListener("click", onPublicChatSelect);

}



/**
 * This function updates the chat page header and displays the private messages
 * between the receiver and the sender.
 *
 * @param {string} receiver - The name of the user being selected.
 * @param {string} sender - The name of the sender user.
 *
 * @return {void} - No direct return value.
 */
function onUserSelect(receiver, sender) {

    const chatPageHeader = document.getElementById("chat-with");
    chatPageHeader.innerText = receiver;
    const messages = document.getElementById("messages");
    removeAllChildNodes(messages, "message-container");

    fetchPrivateMessages(receiver, sender).then(messages => {
        messages.forEach(message => {

            renderMessage(message, receiver);
        });

    });

}

function onPublicChatSelect() {
    const chatPageHeader = document.getElementById("chat-with");
    if (chatPageHeader.innerText === "Public chat") {
        return;
    }
    chatPageHeader.innerText = "Public chat";
    const messages = document.getElementById("messages");
    removeAllChildNodes(messages, "message-container");

    fetchPublicMessages().then(messages => {
        messages.forEach(message => {
            renderMessage(message, "Public chat");
        });
    });

}

function renderMessage(message, renderLocation) {
    const chatPageHeader = document.getElementById("chat-with").innerHTML;

    if (renderLocation === chatPageHeader) {
        const messages = document.getElementById("messages");

        const messageContainer = document.createElement("div");
        messageContainer.classList.add("message-container");
        messages.appendChild(messageContainer);

        const metadata = document.createElement("div");
        metadata.classList.add("metadata");
        messageContainer.appendChild(metadata);

        const newMessage = document.createElement("div");
        newMessage.classList.add("message");
        newMessage.innerText = message.content;
        messageContainer.appendChild(newMessage);
        newMessage.scrollIntoView({behavior: "smooth"});

        const lineBreak = document.createElement("div");
        lineBreak.classList.add("line-break");
        messageContainer.appendChild(lineBreak);

        const sender = document.createElement("div");
        sender.classList.add("sender");
        sender.innerText = message.sender;
        metadata.appendChild(sender)

        const time = document.createElement("div");
        time.classList.add("date");
        time.innerText = dateFormat();
        metadata.appendChild(time);

    }

}

async function fetchPublicMessages() {
    const response = await fetch('http://localhost:28852/getAllPublicMessages');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    } else {
        return await response.json();
    }
}

async function fetchPrivateMessages(receiver, sender) {
    const response = await fetch(`http://localhost:28852/getPrivateMessages?user=${receiver}&sender=${sender}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    } else {
        return await response.json();
    }
}



function dateFormat() {
    let date = new Date();

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;

    let monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let month = monthNames[date.getMonth() + 1];
    let day = date.getDate();

    return `${hours}:${minutes} ${ampm} | ${month} ${day}`;
}

function removeAllChildNodes(parent, className) {
    // Collect elements to be removed (those that have the specified class)
    let toBeRemoved = [];
    for (let i = 0; i < parent.childNodes.length; i++) {
        let child = parent.childNodes[i];
        if (child.nodeType === 1 && child.classList.contains(className)) { // 1 is the type for Node.ELEMENT_NODE
            toBeRemoved.push(child);
        }
    }
    // Remove collected elements
    for(let i = 0; i < toBeRemoved.length; i++){
        parent.removeChild(toBeRemoved[i]);
    }
}

// function removeAllChildNodes(parent) {
//     while (parent.firstChild) {
//         parent.removeChild(parent.firstChild);
//     }
// }

loginForm.addEventListener("submit", connect);
inputForm.addEventListener("submit", sendMessage);


