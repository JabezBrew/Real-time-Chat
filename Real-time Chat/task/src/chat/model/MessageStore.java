package chat.model;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class MessageStore {

    private final List<ChatMessage> messages = new ArrayList<>();

    public List<ChatMessage> getMessages() {
        return messages;
    }

    public void addMessage(ChatMessage chatMessage) {
        messages.add(chatMessage);
    }
}
