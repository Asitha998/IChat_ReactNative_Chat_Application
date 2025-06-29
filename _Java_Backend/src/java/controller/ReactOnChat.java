package controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import entity.Chat;
import entity.Chat_Status;
import entity.Reacts;
import entity.User;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import model.HibernateUtil;
import org.hibernate.Session;

@WebServlet(name = "ReactOnChat", urlPatterns = {"/ReactOnChat"})
public class ReactOnChat extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        //SendChat?logged_user_id=1&other_user_id=2&message=Hello
        Gson gson = new Gson();
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("success", false);

        Session session = HibernateUtil.getSessionFactory().openSession();

        //get parameters
        String userId = req.getParameter("userId");
        String chatId = req.getParameter("chatId");
        String reactId = req.getParameter("reactId");
        System.out.println(chatId);
        System.out.println(reactId);

        //get chat
        Chat chat = (Chat) session.get(Chat.class, Integer.parseInt(chatId));
        
        //get react object
        Reacts reacts = (Reacts) session.get(Reacts.class, Integer.parseInt(reactId));

        //update chat object 
        if (chat.getFrom_user().getId() == Integer.parseInt(userId)) {
            //save react1
            chat.setReacts1(reacts);
        } else {
            //save react2
           chat.setReacts2(reacts); 
        }        

        session.update(chat);
        
        try {
            session.beginTransaction().commit();
            responseJson.addProperty("success", true);
        } catch (Exception e) {
        }

        //send response
        resp.setContentType("application/json");
        resp.getWriter().write(gson.toJson(responseJson));
    }
}
