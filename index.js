const express = require("express");
const cors = require("cors");
const { connect } = require("mongoose");
require("dotenv").config();
const upload = require("express-fileupload");
// ===================
const userRouters = require("./routes/usersRoutes");
const postRouters = require("./routes/postsRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
// ======= middleware ======
const app = express();
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
// app.use(cors({ credentials: true, origin: "http://localhost:8000" }));
app.use(upload());
app.use("/uploads", express.static(__dirname + "/uploads"));

app.use(cors());
app.get("/", (req, res) => {
  res.send("Hello World !");
});

app.use("/users", userRouters);
app.use("/posts", postRouters);

app.use(notFound);
app.use(errorHandler);
// ================
connect(process.env.MONGO_URI)
  .then(() =>
    app.listen(process.env.PORT || 8000, () =>
      console.log(`app is running in port ${process.env.PORT || 8000}`)
    )
  )
  .catch((error) => {
    console.error(error);
  });
