package controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import entity.Chat;
import entity.Chat_Status;
import entity.User;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import model.HibernateUtil;
import org.hibernate.Criteria;
import org.hibernate.criterion.Order;
import org.hibernate.criterion.Restrictions;

@ServerEndpoint("/LoadChatSocket")
public class LoadChatSocket {

    private static ConcurrentHashMap<String, Session> onlineSessions = new ConcurrentHashMap<>();

    @OnOpen
    public void open(Session session) throws IOException {
        System.out.println("On Open");

        Map<String, List<String>> params = session.getRequestParameterMap();
        if (params.containsKey("userId")) {
            String userId = params.get("userId").get(0);
            onlineSessions.put(userId, session);
        }
    }

    @OnClose
    public void close(Session session) {
        System.out.println("On Close");

        Map<String, List<String>> params = session.getRequestParameterMap();
        if (params.containsKey("userId")) {
            String userId = params.get("userId").get(0);
            onlineSessions.remove(userId);
        }
    }

    @OnError
    public void onError(Throwable error) {
        error.printStackTrace();
    }

    @OnMessage
    public void handleMessage(String message, Session session) throws IOException {
        System.out.println(message);

        Gson gson = new Gson();
//        JsonObject responseJson = new JsonObject();
//        responseJson.addProperty("success", false);

        JsonObject clientMessage = gson.fromJson(message, JsonObject.class);

        org.hibernate.Session dbsession = HibernateUtil.getSessionFactory().openSession();

        //get chat data from app
        String logged_user_id = clientMessage.get("logged_user_id").getAsString();
        String other_user_id = clientMessage.get("other_user_id").getAsString();
        String chat_text = clientMessage.get("message").getAsString();
//        String chat_text = URLDecoder.decode(clientMessage.get("message").getAsString(), StandardCharsets.UTF_8.toString());

        System.out.println(logged_user_id);
        System.out.println(other_user_id);
        System.out.println(chat_text);

        //get logged user
        User logged_user = (User) dbsession.get(User.class, Integer.parseInt(logged_user_id));

        //get other user
        User other_user = (User) dbsession.get(User.class, Integer.parseInt(other_user_id));

        //save chat
        Chat chat1 = new Chat();

        //get chat status 2 = unseen
        Chat_Status chat_Status2 = (Chat_Status) dbsession.get(Chat_Status.class, 2);
        chat1.setChat_status(chat_Status2);

        chat1.setDate_time(new Date());
        chat1.setFrom_user(logged_user);
        chat1.setTo_user(other_user);
        chat1.setMessage(chat_text);

        //save id db
        dbsession.save(chat1);
        try {
            dbsession.beginTransaction().commit();
//            responseJson.addProperty("success", true);
        } catch (Exception e) {
        }

        //load chat list again
        //get chats 
        Criteria criteria1 = dbsession.createCriteria(Chat.class);
        criteria1.add(
                Restrictions.or(
                        Restrictions.and(
                                Restrictions.eq("from_user", logged_user),
                                Restrictions.eq("to_user", other_user)
                        ),
                        Restrictions.and(
                                Restrictions.eq("from_user", other_user),
                                Restrictions.eq("to_user", logged_user)
                        )
                )
        );

        //sort chats
        criteria1.addOrder(Order.asc("date_time"));

        //get chat list
        List<Chat> chatList = criteria1.list();

        //get chat status (1 = seen, 2 = unseen)
        Chat_Status chat_Status1 = (Chat_Status) dbsession.get(Chat_Status.class, 1);

        //create chat array
        JsonArray chatArray = new JsonArray();

        //create date time format
        SimpleDateFormat dateFormat = new SimpleDateFormat("MMM dd, hh:mm a");

        for (Chat chat : chatList) {

            //create chat object
            JsonObject chatObject = new JsonObject();
            chatObject.addProperty("message", chat.getMessage());
            chatObject.addProperty("datetime", dateFormat.format(chat.getDate_time()));

            //get chats only from other user
            if (chat.getFrom_user().getId() == other_user.getId()) {

                //add side to chat object
                chatObject.addProperty("side", "left");

                //get only unseen chats (chat_status_id = 2)
                if (chat.getChat_status().getId() == 2) {
                    //update chat status to seen
                    chat.setChat_status(chat_Status1);
                    dbsession.update(chat);
                }
            } else {
                //get chat from logged user

                //add side to chat object
                chatObject.addProperty("side", "right");
                chatObject.addProperty("status", chat.getChat_status().getId()); // 1 = seen, 2 = unseen
            }

            //add chat object into chat array
            chatArray.add(chatObject);
        }

        //update db
        dbsession.beginTransaction().commit();

        //send chat back to the app
        session.getBasicRemote().sendText(gson.toJson(chatArray));

        //send chat array to other user
        Session otherUserSession = onlineSessions.get(other_user_id);
        if (otherUserSession != null && otherUserSession.isOpen()) {
            otherUserSession.getBasicRemote().sendText(gson.toJson(chatArray));
        }

        dbsession.close();
    }
}
