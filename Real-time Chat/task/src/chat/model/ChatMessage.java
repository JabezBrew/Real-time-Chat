package chat.model;


import lombok.*;

import java.util.List;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    private String sender;
    private String receiver;
    private String  content;
    private MessageType messageType;
    private List<String> activeUsers;
}

