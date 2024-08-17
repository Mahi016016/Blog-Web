import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogsDirectory = path.join(__dirname, 'blog_data');

let blogcounter = fs.readdirSync(blogsDirectory).length + 1;

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

// Route to display all blogs directly
app.get("/blogs", (req, res) => {
  fs.readdir(blogsDirectory, (err, files) => {
    if (err) {
      return res.status(500).send("Error reading blog files.");
    }
    files.sort((a, b) => {
      const fileAPath = path.join(blogsDirectory, a);
      const fileBPath = path.join(blogsDirectory, b);

      const statA = fs.statSync(fileAPath);
      const statB = fs.statSync(fileBPath);

      return statB.birthtime - statA.birthtime;
    });

    let blogs = [];
    files.forEach((file) => {
      const blogName = file.replace(/\.[^/.]+$/, "");
      const blogPath = path.join(blogsDirectory, file);
      const blogContent = fs.readFileSync(blogPath, "utf8");
      blogs.push({ title: blogName, content: blogContent, filename: file });
    });

    res.render("blog.ejs", { blogs: blogs });
  });
});

// Route to handle blog deletion
app.post("/delete", (req, res) => {
  const blogFile = req.body.blogFile;
  const blogPath = path.join(blogsDirectory, blogFile);

  fs.unlink(blogPath, (err) => {
    if (err) {
      return res.status(500).send("Error deleting the blog.");
    }
    res.send('<script>alert("Blog deleted successfully."); window.location.href = "/blogs";</script>');
  });
});

// Route to handle blog editing
app.get("/edit/:filename", (req, res) => {
  const blogFile = req.params.filename;
  const blogPath = path.join(blogsDirectory, blogFile);

  fs.readFile(blogPath, "utf8", (err, data) => {
    if (err) {
      return res.status(404).send("Blog not found.");
    }

    const lines = data.split('\n');
    const blogHeading = lines[0].replace("Title: ", "").trim();
    const blogContent = lines.slice(2).join('\n').trim();
    const blogAuthor = lines[1].replace("Author: ", "").trim();

    res.render("modify.ejs", { blogh: blogHeading, bloga: blogAuthor, blogc: blogContent, blogFile: blogFile });
  });
});

app.post("/edit", (req, res) => {
  const blogFile = req.body.blogFile;
  const blogHeading = req.body.blogh;
  const blogContent = req.body.blogc;
  const blogAuthor = req.body.bloga;
  const blogData = `Title: ${blogHeading}\n\n${blogContent}\n\n${blogAuthor}`;

  const blogPath = path.join(blogsDirectory, blogFile);
  fs.writeFile(blogPath, blogData, (err) => {
    if (err) throw err;
    console.log("The Blog has been updated!");
    res.redirect("/blogs");
  });
});

app.get("/create", (req, res) => {
  res.render("creation.ejs");
});

app.post("/created", (req, res) => {
  const blogHeading = req.body["blogh"];
  const blogContent = req.body["blogc"];
  const blogAuthor = req.body["bloga"];

  if (blogContent.length >= 100) {
    res.render("creation.ejs", { copy_bd: blogContent });
  }

  const blogData = `${blogHeading}\n\n${blogContent}\n\n${blogAuthor}`;

  fs.writeFile(
    path.join(blogsDirectory, `blog${blogcounter}.txt`),
    blogData,
    (err) => {
      if (err) throw err;
      console.log("The Blog has been saved!");
      blogcounter++;
    }
  );
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
