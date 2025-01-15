package chat.controller;

import chat.model.ChatMessage;
import chat.model.MessageStore;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
public class MessageController {

    private final MessageStore messageStore;

    public MessageController(MessageStore messageStore) {
        this.messageStore = messageStore;
    }

    @RequestMapping("/getAllPublicMessages")
    public List<ChatMessage> getAllPublicMessages() {
        return messageStore.getMessages().stream()
                .filter(message -> "Public chat".equals(message.getReceiver()))
                .collect(Collectors.toList());
    }

    @GetMapping("/getPrivateMessages")
    public List<ChatMessage> getMessagesForUser(@RequestParam String user, @RequestParam String sender) {
        return messageStore.getMessages().stream()
                .filter( message -> ( user.equals(message.getReceiver()) && sender.equals(message.getSender()) ) ||
                        ( user.equals(message.getSender()) && sender.equals(message.getReceiver()) )
                )
                .collect(Collectors.toList());
    }

}
