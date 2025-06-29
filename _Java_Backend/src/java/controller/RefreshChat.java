package controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import entity.Chat;
import entity.Chat_Status;
import entity.User;
import entity.User_Status;
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

@ServerEndpoint("/RefreshChat")
public class RefreshChat {

    private static ConcurrentHashMap<String, Session> onlineSessions = new ConcurrentHashMap<>();

    @OnOpen
    public void open(Session session) throws IOException {

        org.hibernate.Session dbsession = HibernateUtil.getSessionFactory().openSession();

        Map<String, List<String>> params = session.getRequestParameterMap();
        if (params.containsKey("userId")) {
            String userId = params.get("userId").get(0);
            onlineSessions.put(userId, session);

            //get logged user
            User user = (User) dbsession.get(User.class, Integer.parseInt(userId));

            //get user status (online = 1)
            User_Status user_Status = (User_Status) dbsession.get(User_Status.class, 1);

            //set user online
            user.setUser_status(user_Status);

            //update db
            dbsession.update(user);
            dbsession.beginTransaction().commit();
            
            session.getBasicRemote().sendText("Refresh");

            for (Map.Entry<String, Session> entry : onlineSessions.entrySet()) {
                Session otherSession = entry.getValue();

                otherSession.getBasicRemote().sendText("Reacted");
            }

            System.out.println("user: " + userId + "On Open");
        }

        dbsession.close();
    }

    @OnClose
    public void close(Session session) throws IOException {

        org.hibernate.Session dbsession = HibernateUtil.getSessionFactory().openSession();

        Map<String, List<String>> params = session.getRequestParameterMap();
        if (params.containsKey("userId")) {
            String userId = params.get("userId").get(0);
            onlineSessions.remove(userId);

            //get logged user
            User user = (User) dbsession.get(User.class, Integer.parseInt(userId));

            //get user status (offline = 2)
            User_Status user_Status = (User_Status) dbsession.get(User_Status.class, 2);

            //set user offline
            user.setUser_status(user_Status);

            //update db
            dbsession.update(user);
            dbsession.beginTransaction().commit();

            for (Map.Entry<String, Session> entry : onlineSessions.entrySet()) {
                Session otherSession = entry.getValue();

                otherSession.getBasicRemote().sendText("Reacted");
            }

            System.out.println("user: " + userId + "On Close");
        }

        dbsession.close();
    }

    @OnError
    public void onError(Throwable error) {
        error.printStackTrace();
    }

    @OnMessage
    public void handleMessage(String message, Session session) throws IOException {
        System.out.println(message);

        Gson gson = new Gson();

        JsonObject clientMessage = gson.fromJson(message, JsonObject.class);
        org.hibernate.Session dbsession = HibernateUtil.getSessionFactory().openSession();

        if (clientMessage.get("message").getAsString().equals("ReOpen")) {
            //refresh when re open from background

            String logged_user_id = clientMessage.get("user_id").getAsString();
            String text = clientMessage.get("message").getAsString();

            System.out.println(text);
            System.out.println(logged_user_id);

//            //get logged user
//            User logged_user = (User) dbsession.get(User.class, Integer.parseInt(logged_user_id));
//
//            //get chat list to logged users
//            Criteria criteria1 = dbsession.createCriteria(Chat.class);
//            criteria1.add(Restrictions.eq("to_user", logged_user));
//
//            //sort chats
//            criteria1.addOrder(Order.asc("date_time"));
//
//            //get chat list
//            List<Chat> chatList = criteria1.list();
//
//            //get chat status (1 = seen, 2 = unseen)
//            Chat_Status chat_Status1 = (Chat_Status) dbsession.get(Chat_Status.class, 1);
//
//            for (Chat chat : chatList) {
//
//                //get only unseen chats (chat_status_id = 2)
//                if (chat.getChat_status().getId() == 2) {
//                    //update chat status to seen
//                    chat.setChat_status(chat_Status1);
//                    dbsession.update(chat);
//                }
//            }
//
//            //update db
//            dbsession.beginTransaction().commit();

            //notify logged user
            session.getBasicRemote().sendText("Refresh");

            //notify othere users
            for (Map.Entry<String, Session> entry : onlineSessions.entrySet()) {
                Session otherSession = entry.getValue();

                otherSession.getBasicRemote().sendText("Reacted");
            }

        } else if (clientMessage.get("message").getAsString().equals("Sent")) {
            //refresh chat list when new message

            //get chat data from app
            String logged_user_id = clientMessage.get("logged_user_id").getAsString();
            String other_user_id = clientMessage.get("other_user_id").getAsString();
            String chat_text = clientMessage.get("message").getAsString();

            System.out.println(logged_user_id);
            System.out.println(other_user_id);
            System.out.println(chat_text);

            //check if other user online (has other user a webSocket session in onlineSession Map)
            Session otherUserSession = onlineSessions.get(other_user_id);
            if (otherUserSession != null && otherUserSession.isOpen()) {

                //if other user online, update chat status as seen (1)
                //get logged user
                User logged_user = (User) dbsession.get(User.class, Integer.parseInt(logged_user_id));

                //get other user
                User other_user = (User) dbsession.get(User.class, Integer.parseInt(other_user_id));

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

                for (Chat chat : chatList) {

                    //get chats from logged user
                    if (chat.getFrom_user().getId() == logged_user.getId()) {

                        //get only unseen chats (chat_status_id = 2)
                        if (chat.getChat_status().getId() == 2) {
                            //update chat status to seen
                            chat.setChat_status(chat_Status1);
                            dbsession.update(chat);
                        }
                    }
                }

                //update db
                dbsession.beginTransaction().commit();

                //notify other user
                otherUserSession.getBasicRemote().sendText("Refresh");

                //notify logged user
//                session.getBasicRemote().sendText("Refresh");
            }
            //notify logged user
            session.getBasicRemote().sendText("Refresh");

        } else if (clientMessage.get("message").getAsString().equals("Reacted")) {

            String logged_user_id = clientMessage.get("logged_user_id").getAsString();
            String other_user_id = clientMessage.get("other_user_id").getAsString();
            String chat_text = clientMessage.get("message").getAsString();

            //check if other user online (has other user a webSocket session in onlineSession Map)
            Session otherUserSession = onlineSessions.get(other_user_id);
            if (otherUserSession != null && otherUserSession.isOpen()) {

                //notify other user
                otherUserSession.getBasicRemote().sendText("Reacted");

            }
            //notify logged user
            session.getBasicRemote().sendText("Reacted");

        }

        dbsession.close();

    }
}
