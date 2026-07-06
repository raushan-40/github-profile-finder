# GitHub Profile Finder

A responsive web application that fetches and displays GitHub user information using the GitHub REST API. Users can search for any public GitHub profile and view profile details along with the latest repositories.

## 🚀 Live Demo

> Add your deployed project link here

```
https://githubbprofilefind.netlify.app/
```

---

## 📸 Preview
<img width="1919" height="930" alt="image" src="https://github.com/user-attachments/assets/96ae5c71-42ba-4a33-86c3-ecbda33f3d0a" />




---

## ✨ Features

- 🔍 Search any public GitHub user
- 👤 Display profile information
  - Avatar
  - Name
  - Username
  - Bio
  - Join Date
  - Portfolio/Website
  - Followers
  - Following
  - Public Repositories
- 📂 View the latest 5 repositories
- 🔗 Clickable repository links
- ⏳ Loading indicator during API requests
- ❌ User-friendly 404 error handling
- 📱 Fully responsive design
- 🌙 Modern dark theme UI

---

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Fetch API
- Async/Await
- GitHub REST API

---

## 📁 Project Structure

```
github-profile-finder/
│
├── index.html
├── style.css
├── script.js
├── README.md
└── prompts.md
```

---

## ⚙️ How It Works

1. Enter a GitHub username.
2. Click the **Search** button.
3. The application sends a request to the GitHub API.
4. User profile information is displayed.
5. The latest repositories are fetched and shown.
6. Clicking a repository opens it on GitHub.

---

## 🔗 GitHub API Endpoint

User Profile

```
https://api.github.com/users/{username}
```

Repositories

```
https://api.github.com/users/{username}/repos
```

---

## 💻 Installation

Clone the repository

```bash
git clone https://github.com/your-username/github-profile-finder.git
```

Go to the project folder

```bash
cd github-profile-finder
```

Open `index.html` in your browser.

No additional dependencies are required.

---

## 📌 Example

Search for

```
octocat
```

The application will display:

- Profile picture
- Name
- Bio
- Join date
- Followers
- Following
- Public repositories
- Latest repositories

---

## 🎯 Learning Objectives

This project helped me practice:

- DOM Manipulation
- JavaScript ES6+
- Async/Await
- Fetch API
- Working with REST APIs
- JSON Parsing
- Error Handling
- Responsive Web Design
- UI/UX Improvements

---

## 🔮 Future Improvements

- Compare two GitHub users
- Repository search
- GitHub contribution graph
- User organizations
- Repository language statistics
- Dark/Light mode toggle
- Search history
- Pagination for repositories

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Raushan Kumar**

- GitHub: https://github.com/raushan-40
- LinkedIn: https://www.linkedin.com/in/raushankumariitp/

---

⭐ If you found this project helpful, consider giving it a star!
