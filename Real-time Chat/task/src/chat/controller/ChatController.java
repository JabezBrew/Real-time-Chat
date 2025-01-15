package chat.controller;

import chat.model.ChatMessage;
import chat.model.MessageStore;
import chat.model.UserStore;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Controller
public class ChatController {
    //TODO Note that the implementation of sending new users old chats in step 3 is wrong even though it passed the tests

    private final MessageStore messageStore;
    private final UserStore userStore;
    private final SimpMessagingTemplate messagingTemplate;
    private final List<String> users = new ArrayList<>();

    public ChatController(MessageStore messageStore, UserStore userStore, SimpMessagingTemplate messagingTemplate) {
        this.messageStore = messageStore;
        this.userStore = userStore;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        messageStore.addMessage(chatMessage);
        return chatMessage;
    }

    @MessageMapping("/privateMessage")
    public ChatMessage sendPrivateMessage(@Payload ChatMessage chatMessage) {
        messagingTemplate.convertAndSendToUser(chatMessage.getReceiver(), "/queue/privateMessage", chatMessage);
        messageStore.addMessage(chatMessage);
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        if (!users.contains(chatMessage.getSender())){
            users.add(chatMessage.getSender());
        }
        chatMessage.setActiveUsers(new ArrayList<>(users));

        Objects.requireNonNull(headerAccessor.getSessionAttributes()).put("username", chatMessage.getSender());
        return chatMessage;
    }

    @MessageMapping("/private")
    public ChatMessage sendToUser(@Payload ChatMessage chatMessage) {
        for (ChatMessage message : messageStore.getMessages()) {
            if ("Public chat".equals(message.getReceiver())) {
                messagingTemplate.convertAndSendToUser(chatMessage.getSender(), "/queue/reply", message);
            }
        }
        return chatMessage;
    }


}
