package controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import entity.Chat;
import entity.Chat_Status;
import entity.Reacts;
import entity.User;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import model.HibernateUtil;
import org.hibernate.Criteria;
import org.hibernate.Session;
import org.hibernate.criterion.Order;
import org.hibernate.criterion.Restrictions;

@WebServlet(name = "LoadChat", urlPatterns = {"/LoadChat"})
public class LoadChat extends HttpServlet {
    
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        
        Gson gson = new Gson();
        JsonObject responseJson = new JsonObject();
        
        Session session = HibernateUtil.getSessionFactory().openSession();
        
        String logged_user_id = req.getParameter("logged_user_id");
        String other_user_id = req.getParameter("other_user_id");

        //get logged user
        User logged_user = (User) session.get(User.class, Integer.parseInt(logged_user_id));

        //get other user
        User other_user = (User) session.get(User.class, Integer.parseInt(other_user_id));
                
        responseJson.addProperty("other_user_status", other_user.getUser_status().getId());
        
        //get reacts list
        Criteria criteria2 = session.createCriteria(Reacts.class);
        criteria2.add(Restrictions.ne("id", 1));
        
        List<Reacts> reactList = criteria2.list();
        responseJson.add("reactList", gson.toJsonTree(reactList));

        //get chats
        Criteria criteria1 = session.createCriteria(Chat.class);
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
        Chat_Status chat_Status = (Chat_Status) session.get(Chat_Status.class, 1);

        //create chat array
        JsonArray chatArray = new JsonArray();

        //create date time format
        SimpleDateFormat dateFormat = new SimpleDateFormat("MMM dd, hh:mm a");
        
        for (Chat chat : chatList) {

            //create chat object
            JsonObject chatObject = new JsonObject();
            chatObject.addProperty("id", chat.getId());
            chatObject.addProperty("message", chat.getMessage());
            chatObject.addProperty("datetime", dateFormat.format(chat.getDate_time()));
            chatObject.addProperty("reaction1", chat.getReacts1().getName());
            chatObject.addProperty("reaction2", chat.getReacts2().getName());

            //get chats only from other user
            if (chat.getFrom_user().getId() == other_user.getId()) {

                //add side to chat object
                chatObject.addProperty("side", "left");

                //get only unseen chats (chat_status_id = 2)
                if (chat.getChat_status().getId() == 2) {
                    //update chat status to seen
                    chat.setChat_status(chat_Status);
                    session.update(chat);
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

        responseJson.add("chatArray", gson.toJsonTree(chatArray));
        
        //update db
        session.beginTransaction().commit();

        //send response
        resp.setContentType("application/json");
        resp.getWriter().write(gson.toJson(responseJson));
    }
}
