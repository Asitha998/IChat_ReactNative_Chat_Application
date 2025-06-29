package controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import entity.Chat;
import entity.User;
import entity.User_Status;
import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import model.HibernateUtil;
import model.Validations;
import org.hibernate.Criteria;
import org.hibernate.Session;
import org.hibernate.criterion.MatchMode;
import org.hibernate.criterion.Order;
import org.hibernate.criterion.Restrictions;

@MultipartConfig
@WebServlet(name = "UpdateProfile", urlPatterns = {"/UpdateProfile"})
public class UpdateProfile extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        Gson gson = new Gson();

        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("success", false);
        responseJson.addProperty("message", "Unable to process your request");

        try {

            String userId = req.getParameter("userId");
            String fname = req.getParameter("first_name");
            String lname = req.getParameter("last_name");
            String password = req.getParameter("password");
            Part avaratImage = req.getPart("avatarImage");

            if (fname.isEmpty()) {
                //first name is blank
                responseJson.addProperty("message", "Please fill Your First Name");

            } else if (lname.isEmpty()) {
                //last name is blank
                responseJson.addProperty("message", "Please fill Your Last Name");

            } else if (password.isEmpty()) {
                //password is blank
                responseJson.addProperty("message", "Please fill Your Password");

            } else if (!Validations.isPasswordValid(password)) {
                //password is invalid
                responseJson.addProperty("message", "Invalid Password");

            } else {

                Session session = HibernateUtil.getSessionFactory().openSession();

                String serverPath = req.getServletContext().getRealPath("");

                //update profile
                User user = (User) session.get(User.class, Integer.parseInt(userId));

                user.setFirst_name(fname);
                user.setLast_name(lname);
                user.setPassword(password);

                session.update(user);
                session.beginTransaction().commit();

                //check uploaded Image
                if (avaratImage != null) {

                    String avatarImagePath = serverPath + File.separator + "AvatarImages" + File.separator + user.getMobile() + ".png";
                    File file = new File(avatarImagePath);
                    Files.copy(avaratImage.getInputStream(), file.toPath(), StandardCopyOption.REPLACE_EXISTING);
                }
                
                responseJson.addProperty("success", true);
                
                //reload profile
                JsonObject userAvatar = new JsonObject();

                String userAvatarImagePath = serverPath + File.separator + "AvatarImages" + File.separator + user.getMobile() + ".png";
                File userAvatarImageFile = new File(userAvatarImagePath);

                if (userAvatarImageFile.exists()) {
                    //avatar image found
                    userAvatar.addProperty("avatar_image_found", true);

                } else {
                    //avatar Image not found
                    userAvatar.addProperty("avatar_image_found", false);
                    userAvatar.addProperty("user_avatar_letters", user.getFirst_name().charAt(0) + "" + user.getLast_name().charAt(0));
                }

                responseJson.add("userAvatar", gson.toJsonTree(userAvatar));
                responseJson.add("user", gson.toJsonTree(user));

                //send users
                responseJson.addProperty("message", "Success");

                session.close();
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        resp.setContentType("application/json");
        resp.getWriter().write(gson.toJson(responseJson));

    }
}
