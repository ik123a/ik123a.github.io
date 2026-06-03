# Modern 3D Interactive Portfolio

A premium, highly interactive, and responsive portfolio website designed with a modern glassmorphic aesthetic. It features dynamic integration with the GitHub API to display real-time statistics and repository listings, custom interactive 3D tilt animations, a sleek dark-themed layout, and a functional contact form.

🔗 **Live Demo:** [https://ik123a.github.io/](https://ik123a.github.io/)

---

## ✨ Features

- **Dynamic GitHub Stats:** Automatically fetches and displays live user stats (total repositories, stars, and languages) using the GitHub REST API.
- **Dynamic Projects Grid:** Pulls public repositories dynamically from GitHub and displays them under the "More Projects" section, filtering out profile-level repositories automatically.
- **Premium Glassmorphic UI:** A dark-themed layout built with fluid CSS gradients, glowing drop-shadows, sleek typography (Outfit & Inter from Google Fonts), and responsive flex/grid setups.
- **Interactive 3D Hover Effects:** Custom JavaScript-powered 3D tilt animations on project and info cards that respond instantly to pointer movements.
- **Download CV Integration:** A prominent, styled button linked directly to a downloadable PDF resume.
- **Fully Responsive Design:** Tailored layouts that adapt seamlessly from wide desktop monitors to tablets and smartphones.
- **Fixed Scroll Header:** A floating navigation bar that handles scroll snapping and tracking correctly across different viewport dimensions.

---

## 🛠️ Tech Stack

- **HTML5:** Semantic structuring for accessibility and clean document outline.
- **CSS3 (Vanilla):** Custom CSS properties (variables), Flexbox, CSS Grid, smooth keyframe animations, and backdrop filters for the glassmorphic styling.
- **JavaScript (ES6+):** Pure vanilla JavaScript utilizing async/await for API calls, dynamic DOM manipulation, and real-time cursor-tracking card tilt math.

---

## 🚀 Setup & Customization

To run this project locally or configure it as your own portfolio, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/ik123a/ik123a.github.io.git
cd ik123a.github.io
```

### 2. Configure Your GitHub Username
In [index.html](file:///C:/Users/SKV/.gemini/antigravity-ide/scratch/ik123a.github.io/index.html), search for the GitHub username variable and update it to your own username to fetch your live repositories:
```javascript
const username = 'ik123a'; // Replace with your GitHub username
```

### 3. Add Your Resume/CV
Place your resume file named `resume.pdf` in the root directory. The "Download CV" button is pre-configured to look for this file:
```bash
# Save your resume file here:
./resume.pdf
```

### 4. Customizing Content
- **Text & Details:** Edit the text, bio, social icons, and skills directly inside [index.html](file:///C:/Users/SKV/.gemini/antigravity-ide/scratch/ik123a.github.io/index.html).
- **Styles & Colors:** Adjust variables like `--primary`, `--bg`, and gradient values at the top of [styles.css](file:///C:/Users/SKV/.gemini/antigravity-ide/scratch/ik123a.github.io/styles.css) to change the color scheme.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE). Feel free to customize and use it for your personal brand!
